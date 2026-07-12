(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BVAAlignmentValidation = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const SUPPORTED_ALIGNMENT_FORMAT_VERSION = 1;
  const DEFAULT_ALIGNMENT_SYMBOLS = 'ACDEFGHIKLMNPQRSTVWYBXZ-';
  const REQUIRED_ALIGNMENT_FIELDS = ['alignmentId', 'datasetId', 'name', 'sourceAlignedFastaPath', 'records'];
  const REQUIRED_ALIGNED_RECORD_FIELDS = ['sourceAccession', 'alignedSequence'];

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function normalizeAlignedSequence(value) {
    return String(value || '').replace(/\s+/g, '').toUpperCase();
  }

  function missingRequiredFields(record, fields) {
    return fields.filter(field => {
      if (field === 'records') return !Array.isArray(record?.records);
      return normalizeText(record?.[field]) === '';
    });
  }

  function invalidSymbols(sequence, allowedSymbols = DEFAULT_ALIGNMENT_SYMBOLS) {
    const allowed = new Set([...allowedSymbols]);
    return [...new Set([...sequence].filter(symbol => !allowed.has(symbol)))];
  }

  function curatedDatasetById(curatedValidation, datasetId) {
    return curatedValidation?.datasets?.find(dataset => dataset.datasetId === datasetId) || null;
  }

  function validateCuratedSequenceAlignments(payload, curatedValidation) {
    const errors = [];
    const warnings = [];
    const normalized = {
      formatVersion: payload?.formatVersion,
      alignments: []
    };

    if (payload?.formatVersion !== SUPPORTED_ALIGNMENT_FORMAT_VERSION) {
      errors.push(`Unsupported or missing curated alignment format version. Expected ${SUPPORTED_ALIGNMENT_FORMAT_VERSION}.`);
    }
    if (!Array.isArray(payload?.alignments)) {
      errors.push('Curated alignment payload must include an alignments array.');
      return { ok: false, errors, warnings, ...normalized };
    }
    if (!payload.alignments.length) {
      errors.push('Curated alignment payload does not contain any alignments.');
    }

    payload.alignments.forEach((alignment, alignmentIndex) => {
      const alignmentLabel = normalizeText(alignment?.alignmentId) || `alignment ${alignmentIndex + 1}`;
      const missingAlignmentFields = missingRequiredFields(alignment, REQUIRED_ALIGNMENT_FIELDS);
      if (missingAlignmentFields.length) {
        errors.push(`${alignmentLabel} is missing required field(s): ${missingAlignmentFields.join(', ')}.`);
        return;
      }

      const dataset = curatedDatasetById(curatedValidation, alignment.datasetId);
      if (!dataset) errors.push(`${alignmentLabel} references unknown curated dataset: ${alignment.datasetId}.`);

      if (!alignment.records.length) errors.push(`${alignmentLabel} does not contain aligned sequence records.`);

      const curatedByAccession = new Map((dataset?.records || []).map(record => [record.sourceAccession, record]));
      const seenAccessions = new Map();
      const records = [];
      const lengths = [];

      alignment.records.forEach((record, recordIndex) => {
        const recordLabel = normalizeText(record?.sourceAccession) || `${alignmentLabel} record ${recordIndex + 1}`;
        const missingRecordFields = missingRequiredFields(record, REQUIRED_ALIGNED_RECORD_FIELDS);
        if (missingRecordFields.length) {
          errors.push(`${recordLabel} is missing required field(s): ${missingRecordFields.join(', ')}.`);
          return;
        }

        const sourceAccession = normalizeText(record.sourceAccession);
        if (seenAccessions.has(sourceAccession)) {
          errors.push(`Duplicate aligned source accession: ${sourceAccession}.`);
        } else {
          seenAccessions.set(sourceAccession, true);
        }

        const alignedSequence = normalizeAlignedSequence(record.alignedSequence);
        const badSymbols = invalidSymbols(alignedSequence);
        if (badSymbols.length) {
          errors.push(`${sourceAccession} contains invalid alignment symbol(s): ${badSymbols.join(', ')}.`);
        }

        const curatedRecord = curatedByAccession.get(sourceAccession);
        if (!curatedRecord) {
          errors.push(`${sourceAccession} is not present in curated dataset ${alignment.datasetId}.`);
        } else {
          const ungapped = alignedSequence.replace(/-/g, '');
          if (ungapped !== curatedRecord.aminoAcidSequence) {
            errors.push(`${sourceAccession} ungapped aligned sequence does not match curated reference sequence exactly.`);
          }
        }

        lengths.push(alignedSequence.length);
        records.push({ sourceAccession, alignedSequence });
      });

      const missingCuratedAccessions = [...curatedByAccession.keys()].filter(accession => !seenAccessions.has(accession));
      missingCuratedAccessions.forEach(accession => {
        errors.push(`${alignmentLabel} is missing curated source accession: ${accession}.`);
      });

      const uniqueLengths = [...new Set(lengths)];
      if (uniqueLengths.length > 1) {
        errors.push(`${alignmentLabel} has unequal aligned sequence lengths: ${uniqueLengths.join(', ')}.`);
      }
      const alignmentLength = uniqueLengths[0] || 0;
      if (Number(alignment.alignmentLength) && Number(alignment.alignmentLength) !== alignmentLength) {
        errors.push(`${alignmentLabel} metadata alignment length ${alignment.alignmentLength} does not match validated length ${alignmentLength}.`);
      }

      normalized.alignments.push({
        alignmentId: normalizeText(alignment.alignmentId),
        datasetId: normalizeText(alignment.datasetId),
        name: normalizeText(alignment.name),
        alignmentMethod: normalizeText(alignment.alignmentMethod),
        alignmentSoftwareOrService: normalizeText(alignment.alignmentSoftwareOrService),
        softwareVersion: normalizeText(alignment.softwareVersion),
        alignmentDate: normalizeText(alignment.alignmentDate),
        sourceAlignedFastaPath: normalizeText(alignment.sourceAlignedFastaPath),
        alignmentLength,
        notes: normalizeText(alignment.notes),
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
    SUPPORTED_ALIGNMENT_FORMAT_VERSION,
    DEFAULT_ALIGNMENT_SYMBOLS,
    normalizeAlignedSequence,
    validateCuratedSequenceAlignments
  };
});
