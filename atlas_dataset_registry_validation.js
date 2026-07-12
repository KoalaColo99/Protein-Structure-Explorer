(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BVAAtlasRegistryValidation = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const SUPPORTED_REGISTRY_SCHEMA_VERSION = 1;
  const SUPPORTED_DATASET_STATUSES = ['active', 'partial', 'planned', 'archived'];
  const SUPPORTED_CAPABILITY_STATUSES = ['available', 'partial', 'planned', 'unavailable', 'archived'];
  const SUPPORTED_LENSES = ['system', 'structure', 'evolution', 'function'];
  const REQUIRED_DATASET_FIELDS = [
    'stableDatasetId',
    'title',
    'canonicalBiologicalName',
    'shortDescription',
    'datasetType',
    'status',
    'conceptIds',
    'moduleIds',
    'tags',
    'defaultLens',
    'availableLenses',
    'displayOrder',
    'capabilities',
    'resources',
    'educational'
  ];
  const ALLOWED_REGISTRY_FIELDS = ['schemaVersion', 'datasets'];
  const ALLOWED_DATASET_FIELDS = [
    ...REQUIRED_DATASET_FIELDS,
    'proteinClass',
    'proteinFamily',
    'thumbnailId'
  ];
  const REQUIRED_CAPABILITIES = [
    'system',
    'structure',
    'evolution',
    'function',
    'referenceSequences',
    'comparativeSequenceOverview',
    'alignment',
    'alignmentColumnExploration',
    'descriptiveColumnStatistics',
    'atlasConservationScore',
    'phylogeny',
    'sequenceToStructureMapping'
  ];
  const ALLOWED_RESOURCE_FIELDS = [
    'systemModelId',
    'curatedSequenceDatasetId',
    'curatedAlignmentId',
    'representativePdbId',
    'localStructureFilePath',
    'structureMappingId',
    'functionAnnotationDatasetId',
    'provenanceReferences',
    'documentationReferences'
  ];
  const RESOURCE_REQUIREMENTS = {
    system: ['systemModelId'],
    structure: ['representativePdbId', 'localStructureFilePath'],
    function: ['functionAnnotationDatasetId'],
    referenceSequences: ['curatedSequenceDatasetId'],
    comparativeSequenceOverview: ['curatedSequenceDatasetId'],
    alignment: ['curatedAlignmentId'],
    alignmentColumnExploration: ['curatedAlignmentId'],
    descriptiveColumnStatistics: ['curatedAlignmentId'],
    atlasConservationScore: ['curatedAlignmentId'],
    sequenceToStructureMapping: ['structureMappingId']
  };

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function capabilityStatus(capability) {
    if (typeof capability === 'string') return capability;
    return normalizeText(capability?.status);
  }

  function unknownFields(record, allowed) {
    return Object.keys(record || {}).filter(field => !allowed.includes(field));
  }

  function missingRequiredFields(record, fields) {
    return fields.filter(field => {
      const value = record?.[field];
      if (Array.isArray(value)) return false;
      if (typeof value === 'object' && value !== null) return false;
      return normalizeText(value) === '';
    });
  }

  function hasResource(resources, field) {
    const value = resources?.[field];
    if (Array.isArray(value)) return value.length > 0;
    return normalizeText(value) !== '';
  }

  function curatedDatasetExists(curatedValidation, datasetId) {
    return (curatedValidation?.datasets || []).some(dataset => dataset.datasetId === datasetId);
  }

  function curatedAlignmentExists(alignmentValidation, alignmentId) {
    return (alignmentValidation?.alignments || []).some(alignment => alignment.alignmentId === alignmentId);
  }

  function validateAtlasDatasetRegistry(payload, curatedValidation = { datasets: [] }, alignmentValidation = { alignments: [] }) {
    const errors = [];
    const warnings = [];
    const normalized = {
      schemaVersion: payload?.schemaVersion,
      datasets: []
    };

    unknownFields(payload || {}, ALLOWED_REGISTRY_FIELDS).forEach(field => {
      errors.push(`Atlas dataset registry contains unknown top-level field: ${field}.`);
    });
    if (payload?.schemaVersion !== SUPPORTED_REGISTRY_SCHEMA_VERSION) {
      errors.push(`Unsupported or missing Atlas dataset registry schema version. Expected ${SUPPORTED_REGISTRY_SCHEMA_VERSION}.`);
    }
    if (!Array.isArray(payload?.datasets)) {
      errors.push('Atlas dataset registry must include a datasets array.');
      return { ok: false, errors, warnings, ...normalized };
    }

    const seenIds = new Set();
    payload.datasets.forEach((dataset, datasetIndex) => {
      const label = normalizeText(dataset?.stableDatasetId) || `dataset ${datasetIndex + 1}`;
      unknownFields(dataset || {}, ALLOWED_DATASET_FIELDS).forEach(field => {
        errors.push(`${label} contains unknown field: ${field}.`);
      });
      const missing = missingRequiredFields(dataset, REQUIRED_DATASET_FIELDS);
      if (missing.length) {
        errors.push(`${label} is missing required field(s): ${missing.join(', ')}.`);
        return;
      }

      const stableDatasetId = normalizeText(dataset.stableDatasetId);
      if (seenIds.has(stableDatasetId)) errors.push(`Duplicate Atlas dataset ID: ${stableDatasetId}.`);
      seenIds.add(stableDatasetId);

      if (!SUPPORTED_DATASET_STATUSES.includes(dataset.status)) {
        errors.push(`${stableDatasetId} has unsupported dataset status: ${dataset.status}.`);
      }

      const duplicateConcepts = dataset.conceptIds.filter((concept, index) => dataset.conceptIds.indexOf(concept) !== index);
      if (duplicateConcepts.length) {
        errors.push(`${stableDatasetId} contains duplicate concept ID(s): ${[...new Set(duplicateConcepts)].join(', ')}.`);
      }

      if (!SUPPORTED_LENSES.includes(dataset.defaultLens)) {
        errors.push(`${stableDatasetId} has invalid default lens: ${dataset.defaultLens}.`);
      }
      dataset.availableLenses.forEach(lens => {
        if (!SUPPORTED_LENSES.includes(lens)) errors.push(`${stableDatasetId} lists invalid available lens: ${lens}.`);
      });
      if (!dataset.availableLenses.includes(dataset.defaultLens)) {
        errors.push(`${stableDatasetId} default lens ${dataset.defaultLens} is not listed in available lenses.`);
      }

      REQUIRED_CAPABILITIES.forEach(capabilityName => {
        const status = capabilityStatus(dataset.capabilities?.[capabilityName]);
        if (!SUPPORTED_CAPABILITY_STATUSES.includes(status)) {
          errors.push(`${stableDatasetId} capability ${capabilityName} has unsupported status: ${status || 'missing'}.`);
        }
      });

      const defaultCapabilityStatus = capabilityStatus(dataset.capabilities?.[dataset.defaultLens]);
      if (dataset.defaultLens && defaultCapabilityStatus !== 'available' && defaultCapabilityStatus !== 'partial') {
        errors.push(`${stableDatasetId} default lens ${dataset.defaultLens} is not available.`);
      }

      unknownFields(dataset.resources || {}, ALLOWED_RESOURCE_FIELDS).forEach(field => {
        errors.push(`${stableDatasetId} resources contain unknown field: ${field}.`);
      });

      Object.entries(RESOURCE_REQUIREMENTS).forEach(([capabilityName, resourceFields]) => {
        const status = capabilityStatus(dataset.capabilities?.[capabilityName]);
        const resourcePresent = resourceFields.some(field => hasResource(dataset.resources, field));
        if (status === 'available' && !resourcePresent) {
          errors.push(`${stableDatasetId} capability ${capabilityName} is available but lacks required resource reference: ${resourceFields.join(' or ')}.`);
        }
        if (status === 'unavailable' && resourcePresent) {
          errors.push(`${stableDatasetId} capability ${capabilityName} is unavailable but claims active resource reference: ${resourceFields.join(' or ')}.`);
        }
      });

      if (hasResource(dataset.resources, 'curatedSequenceDatasetId') && !curatedDatasetExists(curatedValidation, dataset.resources.curatedSequenceDatasetId)) {
        errors.push(`${stableDatasetId} references unknown curated sequence dataset: ${dataset.resources.curatedSequenceDatasetId}.`);
      }
      if (hasResource(dataset.resources, 'curatedAlignmentId') && !curatedAlignmentExists(alignmentValidation, dataset.resources.curatedAlignmentId)) {
        errors.push(`${stableDatasetId} references unknown curated alignment: ${dataset.resources.curatedAlignmentId}.`);
      }
      if (hasResource(dataset.resources, 'representativePdbId') && !/^[A-Za-z0-9]{4}$/.test(dataset.resources.representativePdbId)) {
        errors.push(`${stableDatasetId} representative PDB ID must be four alphanumeric characters.`);
      }

      normalized.datasets.push({
        ...dataset,
        stableDatasetId,
        title: normalizeText(dataset.title),
        canonicalBiologicalName: normalizeText(dataset.canonicalBiologicalName),
        shortDescription: normalizeText(dataset.shortDescription),
        proteinClass: normalizeText(dataset.proteinClass),
        proteinFamily: normalizeText(dataset.proteinFamily),
        thumbnailId: normalizeText(dataset.thumbnailId)
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
    SUPPORTED_REGISTRY_SCHEMA_VERSION,
    SUPPORTED_DATASET_STATUSES,
    SUPPORTED_CAPABILITY_STATUSES,
    SUPPORTED_LENSES,
    REQUIRED_CAPABILITIES,
    validateAtlasDatasetRegistry
  };
});
