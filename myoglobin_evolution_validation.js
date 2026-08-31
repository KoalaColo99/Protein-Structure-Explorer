(function (global) {
  const AMINO_ACIDS = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
  const EXCLUDED_PARALOGS = /hemoglobin|cytoglobin|neuroglobin|leghemoglobin|truncated|synthetic|fragment/i;

  function validateMyoglobinEvolutionDataset(dataset) {
    const errors = [];
    const warnings = [];
    if (!dataset || typeof dataset !== 'object') {
      return { valid: false, errors: ['Dataset is missing.'], warnings, records: [] };
    }
    if (dataset.schemaVersion !== 1) errors.push('Unsupported myoglobin evolution dataset schema version.');
    if (dataset.reference?.pdbId !== '1MBN') errors.push('Reference PDB must be 1MBN for the validated teaching dataset.');
    if (dataset.reference?.chain !== 'A') errors.push('Reference chain must be A for the validated teaching dataset.');
    if (dataset.reference?.accession !== 'P02185') errors.push('Reference accession must be P02185.');
    if (dataset.reference?.canonicalLength !== 154 || dataset.reference?.modeledResidues !== 153) {
      errors.push('Reference mapping must preserve the 154 canonical residues to 153 modeled residues distinction.');
    }
    const records = Array.isArray(dataset.records) ? dataset.records : [];
    if (records.length !== 8) errors.push('The checkpoint dataset must contain exactly eight verified myoglobin sequences.');
    const accessions = new Set();
    const organisms = new Set();
    records.forEach((record, index) => {
      const label = record?.accession || `record ${index + 1}`;
      if (!record?.accession) errors.push(`${label}: accession is missing.`);
      if (accessions.has(record.accession)) errors.push(`${label}: duplicate accession.`);
      accessions.add(record.accession);
      if (!record?.organism) errors.push(`${label}: organism is missing.`);
      if (organisms.has(record.organism)) errors.push(`${label}: duplicate organism.`);
      organisms.add(record.organism);
      if (!record?.proteinName || !/myoglobin/i.test(record.proteinName)) errors.push(`${label}: protein name must identify myoglobin.`);
      if (EXCLUDED_PARALOGS.test(`${record.proteinName} ${record.inclusionRationale || ''}`) && !/myoglobin/i.test(record.proteinName)) {
        errors.push(`${label}: excluded globin paralog or fragment wording detected.`);
      }
      if (record.reviewed !== true) errors.push(`${label}: record must be reviewed UniProtKB/Swiss-Prot.`);
      if (record.fragment) errors.push(`${label}: fragment records are excluded.`);
      if (!AMINO_ACIDS.test(record.sequence || '')) errors.push(`${label}: sequence must use standard amino-acid symbols only and contain no gaps.`);
      if ((record.sequence || '').length < 140 || (record.sequence || '').length > 170) errors.push(`${label}: sequence length is outside the 140-170 aa checkpoint range.`);
      ['retrievalDate', 'sourceUrl', 'inclusionRationale', 'familyEvidence', 'broadTaxonomicGroup'].forEach(field => {
        if (!record[field] || (Array.isArray(record[field]) && !record[field].length)) errors.push(`${label}: ${field} metadata is missing.`);
      });
    });
    if (!accessions.has('P02185')) errors.push('P02185 reference record is missing.');
    const alignment = dataset.alignment;
    if (!alignment) errors.push('Validated precomputed alignment is missing.');
    if (alignment) {
      if (alignment.alignmentLength !== 154) errors.push('Alignment length must be 154 columns for the checkpoint dataset.');
      if (!/precomputed/i.test(alignment.method || '')) errors.push('Alignment method must disclose that this is a precomputed alignment.');
      const alignedRecords = Array.isArray(alignment.records) ? alignment.records : [];
      if (alignedRecords.length !== records.length) errors.push('Alignment record count must match raw record count.');
      alignedRecords.forEach(aligned => {
        const raw = records.find(record => record.accession === aligned.accession);
        if (!raw) errors.push(`${aligned.accession}: alignment record has no raw sequence record.`);
        if (raw && aligned.alignedSequence.replace(/-/g, '') !== raw.sequence) errors.push(`${aligned.accession}: alignment does not preserve the raw sequence.`);
        if ((aligned.alignedSequence || '').length !== alignment.alignmentLength) errors.push(`${aligned.accession}: aligned sequence length does not match alignment length.`);
      });
    }
    return { valid: errors.length === 0, errors, warnings, records };
  }

  const api = { validateMyoglobinEvolutionDataset };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.BVAMyoglobinEvolutionValidation = api;
})(typeof window !== 'undefined' ? window : globalThis);
