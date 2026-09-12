const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const BASE = path.join(ROOT, 'data', 'conservation', 'curated');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function parseFasta(text) {
  const records = [];
  let current = null;
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('>')) {
      if (current) records.push(current);
      const header = trimmed.slice(1).trim();
      const accession = header.split(/\s+/)[0].replace(/^sp\|([^|]+)\|.*/, '$1').replace(/^tr\|([^|]+)\|.*/, '$1');
      current = { accession, header, sequence: '' };
    } else if (current) {
      current.sequence += trimmed.replace(/[^A-Za-z-]/g, '').toUpperCase();
    }
  });
  if (current) records.push(current);
  return records;
}

function validateDataset(registryItem, seenDatasetIds, errors, warnings) {
  const folder = path.join(BASE, registryItem.folder || '');
  const required = ['manifest.json', 'candidates.json', 'unaligned.fasta', 'aligned.fasta', 'mapping.json', 'curation_report.md'];
  required.forEach(file => {
    if (!fs.existsSync(path.join(folder, file))) errors.push(`${registryItem.datasetId}: missing ${file}.`);
  });
  if (required.some(file => !fs.existsSync(path.join(folder, file)))) return;

  const manifest = readJson(path.join(folder, 'manifest.json'));
  const candidates = readJson(path.join(folder, 'candidates.json'));
  const mapping = readJson(path.join(folder, 'mapping.json'));
  const unaligned = parseFasta(readText(path.join(folder, 'unaligned.fasta')));
  const aligned = parseFasta(readText(path.join(folder, 'aligned.fasta')));
  const report = readText(path.join(folder, 'curation_report.md'));

  if (manifest.datasetId !== registryItem.datasetId) errors.push(`${registryItem.datasetId}: registry and manifest dataset IDs disagree.`);
  if (seenDatasetIds.has(manifest.datasetId)) errors.push(`${manifest.datasetId}: duplicate curated dataset ID.`);
  seenDatasetIds.add(manifest.datasetId);
  if (!manifest.reference?.pdbId || !manifest.reference?.chain || !manifest.reference?.accession) errors.push(`${manifest.datasetId}: reference PDB, chain, or accession is missing.`);
  if (manifest.reference?.pdbId !== registryItem.pdbId || manifest.reference?.chain !== registryItem.chain) errors.push(`${manifest.datasetId}: registry PDB/chain does not match manifest reference.`);
  if (!manifest.studentContext?.whatIsCompared || !manifest.studentContext?.whySelected || !manifest.studentContext?.whatConservationMeans) errors.push(`${manifest.datasetId}: student-facing comparison context is incomplete.`);
  if (!manifest.alignment?.method || !manifest.alignment?.alignmentLength) errors.push(`${manifest.datasetId}: alignment method or length is missing.`);
  if (!Array.isArray(candidates) || candidates.length < 7 || candidates.length > 12) errors.push(`${manifest.datasetId}: expected 7-12 total curated sequences; found ${candidates.length}.`);
  if (!report.includes('Reference:')) errors.push(`${manifest.datasetId}: curation report must identify the reference.`);

  const accessions = candidates.map(record => record.accession);
  if (new Set(accessions).size !== accessions.length) errors.push(`${manifest.datasetId}: duplicate accession in candidates.`);
  const sequenceHashes = candidates.map(record => sha256(record.sequence || ''));
  if (new Set(sequenceHashes).size !== sequenceHashes.length) warnings.push(`${manifest.datasetId}: duplicate amino-acid sequences present; verify this is intentional.`);
  candidates.forEach(record => {
    ['accession', 'entryName', 'proteinName', 'organism', 'taxonomy', 'reviewed', 'sequenceLength', 'sequence', 'identityToReference', 'referenceCoverage', 'domainCompatibility', 'fragment', 'inclusionRationale', 'sourceUrl', 'retrievalDate'].forEach(field => {
      if (record[field] === undefined || record[field] === null || record[field] === '') errors.push(`${manifest.datasetId}/${record.accession || 'unknown'}: missing ${field}.`);
    });
    if (record.fragment) errors.push(`${manifest.datasetId}/${record.accession}: fragments are not allowed in prototype curated sets.`);
    if ((record.sequence || '').length !== record.sequenceLength) errors.push(`${manifest.datasetId}/${record.accession}: sequence length field disagrees with sequence.`);
  });

  const candidateByAccession = new Map(candidates.map(record => [record.accession, record]));
  unaligned.forEach(record => {
    const candidate = candidateByAccession.get(record.accession);
    if (!candidate) errors.push(`${manifest.datasetId}: unaligned FASTA contains unknown accession ${record.accession}.`);
    else if (record.sequence !== candidate.sequence) errors.push(`${manifest.datasetId}/${record.accession}: unaligned FASTA does not match candidate sequence.`);
  });
  accessions.forEach(accession => {
    if (!unaligned.some(record => record.accession === accession)) errors.push(`${manifest.datasetId}: unaligned FASTA missing ${accession}.`);
    if (!aligned.some(record => record.accession === accession)) errors.push(`${manifest.datasetId}: aligned FASTA missing ${accession}.`);
  });

  const lengths = new Set(aligned.map(record => record.sequence.length));
  if (lengths.size !== 1) errors.push(`${manifest.datasetId}: aligned FASTA rows have unequal lengths.`);
  const alignmentLength = aligned[0]?.sequence.length || 0;
  if (manifest.alignment?.alignmentLength !== alignmentLength) errors.push(`${manifest.datasetId}: manifest alignment length disagrees with aligned FASTA.`);
  aligned.forEach(record => {
    const candidate = candidateByAccession.get(record.accession);
    if (!candidate) errors.push(`${manifest.datasetId}: aligned FASTA contains unknown accession ${record.accession}.`);
    else if (record.sequence.replace(/-/g, '') !== candidate.sequence) errors.push(`${manifest.datasetId}/${record.accession}: ungapped aligned row does not reproduce candidate sequence.`);
  });
  const referenceCandidate = candidateByAccession.get(manifest.reference?.accession);
  if (!referenceCandidate) errors.push(`${manifest.datasetId}: reference accession is missing from candidates.`);
  else if (sha256(referenceCandidate.sequence) !== manifest.reference.sequenceHash) errors.push(`${manifest.datasetId}: reference sequence hash disagrees with manifest.`);

  if (mapping.pdbId !== manifest.reference?.pdbId || mapping.chain !== manifest.reference?.chain) errors.push(`${manifest.datasetId}: mapping PDB/chain disagrees with manifest.`);
  if (mapping.referenceAccession !== manifest.reference?.accession) errors.push(`${manifest.datasetId}: mapping reference accession disagrees with manifest.`);
  if (!mapping.method || !mapping.confidence) errors.push(`${manifest.datasetId}: mapping method/confidence is missing.`);
  if (!Array.isArray(mapping.coordinateToCanonical) || mapping.coordinateToCanonical.length !== mapping.mappedResidueCount) errors.push(`${manifest.datasetId}: coordinate-to-canonical mapping count is inconsistent.`);
  if (mapping.mappedResidueCount > mapping.coordinateResidueCount) errors.push(`${manifest.datasetId}: mapped residue count exceeds coordinate residue count.`);
  const mappedCanonicalPositions = new Set();
  const mappedCoordinateKeys = new Set();
  mapping.coordinateToCanonical.forEach(item => {
    if (item.chain !== mapping.chain) errors.push(`${manifest.datasetId}: mapped residue uses chain ${item.chain}, expected ${mapping.chain}.`);
    if (item.canonicalPosition < 1 || item.canonicalPosition > mapping.canonicalLength) errors.push(`${manifest.datasetId}: canonical position ${item.canonicalPosition} is outside canonical length.`);
    const coordinateKey = `${item.chain}:${item.resi}${item.icode || ''}`;
    if (mappedCanonicalPositions.has(item.canonicalPosition)) errors.push(`${manifest.datasetId}: duplicate canonical mapping for position ${item.canonicalPosition}.`);
    if (mappedCoordinateKeys.has(coordinateKey)) errors.push(`${manifest.datasetId}: duplicate coordinate mapping for ${coordinateKey}.`);
    mappedCanonicalPositions.add(item.canonicalPosition);
    mappedCoordinateKeys.add(coordinateKey);
  });
  (mapping.canonicalResiduesAbsentFromCoordinates || []).forEach(absent => {
    for (let position = absent.start; position <= absent.end; position++) {
      if (mappedCanonicalPositions.has(position)) errors.push(`${manifest.datasetId}: canonical position ${position} is both mapped and marked absent.`);
    }
  });
}

function validateCuratedConservationDatasets() {
  const errors = [];
  const warnings = [];
  const registryPath = path.join(BASE, 'registry.json');
  if (!fs.existsSync(registryPath)) {
    return { ok: false, errors: ['Missing curated conservation registry.'], warnings };
  }
  const registry = readJson(registryPath);
  if (registry.schemaVersion !== 1) errors.push('Unsupported or missing curated conservation registry schemaVersion.');
  if (!Array.isArray(registry.datasets)) errors.push('Curated conservation registry requires a datasets array.');
  const seen = new Set();
  (registry.datasets || []).forEach(item => validateDataset(item, seen, errors, warnings));
  (registry.notApplicable || []).forEach(item => {
    if (item.pdbId === '1BNA' && !/not applicable/i.test(item.reason || '')) errors.push('1BNA must be explicitly marked protein conservation not applicable.');
  });
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    datasetCount: registry.datasets?.length || 0
  };
}

if (require.main === module) {
  const result = validateCuratedConservationDatasets();
  if (!result.ok) {
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  result.warnings.forEach(warning => console.warn(`warning: ${warning}`));
  console.log(`Curated conservation datasets validated (${result.datasetCount} dataset${result.datasetCount === 1 ? '' : 's'}).`);
}

module.exports = {
  validateCuratedConservationDatasets,
  parseFasta
};
