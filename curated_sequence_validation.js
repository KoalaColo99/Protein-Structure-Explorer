(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BVASequenceValidation = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const SUPPORTED_FORMAT_VERSION = 1;
  const DEFAULT_ACCEPTED_RESIDUE_SYMBOLS = 'ACDEFGHIKLMNPQRSTVWYBXZ';
  const REQUIRED_DATASET_FIELDS = ['datasetId', 'title', 'records'];
  const REQUIRED_RECORD_FIELDS = [
    'stableSequenceId',
    'proteinName',
    'geneName',
    'organism',
    'broadTaxonomicGroup',
    'aminoAcidSequence',
    'sourceDatabase',
    'sourceAccession'
  ];

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function normalizeSequence(value) {
    return String(value || '').replace(/\s+/g, '').toUpperCase();
  }

  function missingRequiredFields(record, fields) {
    return fields.filter(field => {
      if (field === 'records') return !Array.isArray(record?.records);
      return normalizeText(record?.[field]) === '';
    });
  }

  function invalidResidueSymbols(sequence, acceptedResidueSymbols) {
    const accepted = new Set([...acceptedResidueSymbols]);
    return [...new Set([...sequence].filter(symbol => !accepted.has(symbol)))];
  }

  function validateCuratedSequenceSets(payload) {
    const errors = [];
    const warnings = [];
    const acceptedResidueSymbols = normalizeText(payload?.acceptedResidueSymbols) || DEFAULT_ACCEPTED_RESIDUE_SYMBOLS;
    const normalized = {
      formatVersion: payload?.formatVersion,
      acceptedResidueSymbols,
      datasets: []
    };

    if (payload?.formatVersion !== SUPPORTED_FORMAT_VERSION) {
      errors.push(`Unsupported or missing curated sequence format version. Expected ${SUPPORTED_FORMAT_VERSION}.`);
    }
    if (!Array.isArray(payload?.datasets)) {
      errors.push('Curated sequence payload must include a datasets array.');
      return { ok: false, errors, warnings, ...normalized };
    }

    const stableIds = new Map();
    const sourceAccessions = new Map();

    payload.datasets.forEach((dataset, datasetIndex) => {
      const datasetLabel = normalizeText(dataset?.datasetId) || `dataset ${datasetIndex + 1}`;
      const datasetMissing = missingRequiredFields(dataset, REQUIRED_DATASET_FIELDS);
      if (datasetMissing.length) {
        errors.push(`${datasetLabel} is missing required field(s): ${datasetMissing.join(', ')}.`);
        return;
      }

      if (!dataset.records.length) {
        warnings.push(`${dataset.title} has no reference sequence records yet.`);
      }

      const records = [];
      dataset.records.forEach((record, recordIndex) => {
        const recordLabel = normalizeText(record?.stableSequenceId) || `${datasetLabel} record ${recordIndex + 1}`;
        const recordMissing = missingRequiredFields(record, REQUIRED_RECORD_FIELDS);
        if (recordMissing.length) {
          errors.push(`${recordLabel} is missing required field(s): ${recordMissing.join(', ')}.`);
          return;
        }

        const stableSequenceId = normalizeText(record.stableSequenceId);
        if (stableIds.has(stableSequenceId)) {
          errors.push(`Duplicate stable sequence identifier: ${stableSequenceId}.`);
        } else {
          stableIds.set(stableSequenceId, true);
        }

        const sourceDatabase = normalizeText(record.sourceDatabase);
        const sourceAccession = normalizeText(record.sourceAccession);
        const sourceKey = `${sourceDatabase.toUpperCase()}::${sourceAccession.toUpperCase()}`;
        if (sourceAccessions.has(sourceKey)) {
          errors.push(`Duplicate source database/accession pair: ${sourceDatabase} ${sourceAccession}.`);
        } else {
          sourceAccessions.set(sourceKey, true);
        }

        const aminoAcidSequence = normalizeSequence(record.aminoAcidSequence);
        const invalidSymbols = invalidResidueSymbols(aminoAcidSequence, acceptedResidueSymbols);
        if (invalidSymbols.length) {
          errors.push(`${recordLabel} contains invalid amino-acid symbol(s): ${invalidSymbols.join(', ')}.`);
        }

        records.push({
          stableSequenceId,
          proteinName: normalizeText(record.proteinName),
          geneName: normalizeText(record.geneName),
          organism: normalizeText(record.organism),
          broadTaxonomicGroup: normalizeText(record.broadTaxonomicGroup),
          photosyntheticCategory: normalizeText(record.photosyntheticCategory),
          aminoAcidSequence,
          structureIdentifier: normalizeText(record.structureIdentifier),
          sourceDatabase,
          sourceAccession,
          sourceCitation: normalizeText(record.sourceCitation),
          notes: normalizeText(record.notes)
        });
      });

      normalized.datasets.push({
        datasetId: normalizeText(dataset.datasetId),
        title: normalizeText(dataset.title),
        description: normalizeText(dataset.description),
        status: normalizeText(dataset.status),
        notes: normalizeText(dataset.notes),
        records
      });
    });

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      ...normalized
    };
  }

  return {
    SUPPORTED_FORMAT_VERSION,
    DEFAULT_ACCEPTED_RESIDUE_SYMBOLS,
    normalizeSequence,
    validateCuratedSequenceSets
  };
});
