const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

function bodyOf(functionName) {
  const start = html.indexOf(`function ${functionName}(`);
  assert(start >= 0, `${functionName} missing`);
  const next = html.indexOf('\n    function ', start + 1);
  return html.slice(start, next >= 0 ? next : start + 6000);
}

test('homolog import workflow exposes required stages and conservative presets', () => {
  [
    'Reference',
    'Search criteria',
    'Review candidates',
    'Review alignment',
    'Map and color',
    'Recommended teaching set',
    'Close relatives',
    'Broad protein family',
    'Custom',
    'Find homologs automatically'
  ].forEach(token => assert(html.includes(token), `${token} missing`));
  assert(html.includes('HOMOLOG_SEARCH_PRESETS'));
  assert(html.includes('minIdentity'));
  assert(html.includes('minCoverage'));
  assert(html.includes('onePerSpecies'));
  assert(html.includes('requireDomainArchitecture'));
});

test('reference-chain detection avoids silent concatenation and reports missing coordinates', () => {
  const chains = bodyOf('homologChainSummaries');
  const reference = bodyOf('homologReferenceMarkup');
  assert(chains.includes('const chains = new Map()'));
  assert(chains.includes('sequenceFromResidues(residues)'));
  assert(chains.includes('numbering gap'));
  assert(reference.includes('Chains are never silently concatenated'));
  assert(reference.includes('homologReferenceChain'));
  assert(reference.includes('coordinate-derived chain sequence'));
  assert(reference.includes('UniProt canonical sequence'));
});

test('candidate review distinguishes search hits from conservation and supports fallback imports', () => {
  const review = bodyOf('homologCandidateReviewMarkup');
  const fasta = bodyOf('homologManualImportMarkup');
  assert(review.includes('Search hits are candidates, not conserved residues'));
  assert(review.includes('Select recommended set'));
  assert(review.includes('Select all visible'));
  assert(review.includes('Restore recommended selection'));
  assert(fasta.includes('Paste UniProt accessions'));
  assert(fasta.includes('Paste FASTA or prealigned FASTA'));
  assert(fasta.includes('Raw FASTA still requires a genuine multiple-sequence alignment'));
});

test('candidate filtering and recommended set use quality thresholds before diversity', () => {
  const quality = bodyOf('candidateQualityReason');
  const recommend = bodyOf('selectRecommendedHomologSet');
  assert(quality.includes('below minimum identity guidance'));
  assert(quality.includes('low query coverage'));
  assert(quality.includes('domain architecture differs'));
  assert(quality.includes('synthetic construct'));
  assert(recommend.includes('onePerSpecies'));
  assert(recommend.includes('onePerGenus'));
  assert(recommend.includes('preferReviewed'));
});

test('live service limitations are explicit and do not substitute unrelated sequences', () => {
  const search = bodyOf('runAutomaticHomologSearch');
  const align = bodyOf('alignSelectedHomologs');
  assert(search.includes('EMBL-EBI BLASTp/FASTA candidate homolog search'));
  assert(search.includes('No unrelated bundled sequences were substituted'));
  assert(search.includes('serverless proxy'));
  assert(align.includes('does not pad sequences or fake an MSA'));
  assert(align.includes('Select at least three total sequences'));
});

test('prealigned FASTA, mapping, and conservation activation are separate stages', () => {
  const load = bodyOf('loadHomologFasta');
  const map = bodyOf('mapHomologAlignmentToStructure');
  const ready = bodyOf('importedHomologWorkflowReady');
  assert(load.includes('user-supplied prealigned FASTA loaded'));
  assert(map.includes('reference alignment row to selected coordinate-derived chain sequence'));
  assert(map.includes('confidence'));
  assert(map.includes('state.conservation = metrics.filter'));
  assert(ready.includes("state.homologWorkflow.mapping?.confidence === 'adequate'"));
});

test('mapped alignment positions select shared structure residues', () => {
  const select = bodyOf('selectHomologAlignmentColumn');
  const preview = bodyOf('renderHomologMappedAlignmentPreview');
  assert(preview.includes('data-homolog-alignment-column'));
  assert(select.includes('state.selectedResidueIndex = residueIndex'));
  assert(select.includes('renderMolecularEvidenceCard()'));
  assert(html.includes("button[data-homolog-alignment-column]"));
});

test('provenance and session-local save include reproducibility details and privacy boundary', () => {
  const provenance = bodyOf('homologProvenanceRecord');
  const save = bodyOf('saveHomologWorkflowSession');
  [
    'queryStructure',
    'querySequenceSource',
    'querySequenceHash',
    'candidateAccessionsReturned',
    'candidateAccessionsSelected',
    'alignmentMethod',
    'mappingCoverage',
    'conservationMethod'
  ].forEach(token => assert(provenance.includes(token), `${token} missing`));
  assert(save.includes('sessionStorage.setItem'));
  assert(save.includes('Session storage is not permanent'));
  assert(!provenance.includes('studentObservations'));
  assert(!provenance.includes('studentName'));
});

console.log('Homolog import workflow checks passed.');
