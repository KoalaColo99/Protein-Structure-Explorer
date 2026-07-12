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
  const CAPABILITY_DEPENDENCIES = {
    comparativeSequenceOverview: ['referenceSequences'],
    alignmentColumnExploration: ['alignment'],
    descriptiveColumnStatistics: ['alignment', 'alignmentColumnExploration'],
    atlasConservationScore: ['alignment', 'descriptiveColumnStatistics'],
    sequenceToStructureMapping: ['structure', 'referenceSequences']
  };
  const CAPABILITY_REASON_CODES = {
    STATUS_UNAVAILABLE: 'CAPABILITY_STATUS_UNAVAILABLE',
    STATUS_PLANNED: 'CAPABILITY_STATUS_PLANNED',
    STATUS_PARTIAL: 'CAPABILITY_STATUS_PARTIAL',
    STATUS_ARCHIVED: 'CAPABILITY_STATUS_ARCHIVED',
    STATUS_MISSING: 'CAPABILITY_STATUS_MISSING',
    REQUIRED_RESOURCE_MISSING: 'REQUIRED_RESOURCE_MISSING',
    RESOURCE_REFERENCE_UNKNOWN: 'RESOURCE_REFERENCE_UNKNOWN',
    RESOURCE_VALIDATION_FAILED: 'RESOURCE_VALIDATION_FAILED',
    DEPENDENCY_UNAVAILABLE: 'CAPABILITY_DEPENDENCY_UNAVAILABLE',
    DATASET_MISMATCH: 'RESOURCE_DATASET_MISMATCH',
    RENDERABLE: 'CAPABILITY_RENDERABLE',
    CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
    INVALID_RESOURCE_REFERENCE: 'INVALID_RESOURCE_REFERENCE'
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

  function getCapabilityDeclaredStatus(dataset, capabilityId) {
    return capabilityStatus(dataset?.capabilities?.[capabilityId]) || '';
  }

  function getCapabilityRequirements(capabilityId, context = {}) {
    const dependencies = context.capabilityDependencies?.[capabilityId] || CAPABILITY_DEPENDENCIES[capabilityId] || [];
    return {
      capabilityId,
      requiredResources: RESOURCE_REQUIREMENTS[capabilityId] || [],
      dependencies
    };
  }

  function emptyAvailability(dataset, capabilityId, declaredStatus, reasonCode, studentMessage, developerMessage, extras = {}) {
    return {
      datasetId: normalizeText(dataset?.stableDatasetId),
      capabilityId,
      declaredStatus,
      renderable: false,
      requiredResources: extras.requiredResources || [],
      resolvedResources: extras.resolvedResources || {},
      missingResources: extras.missingResources || [],
      invalidResources: extras.invalidResources || [],
      dependencyFailures: extras.dependencyFailures || [],
      reasonCode,
      studentMessage,
      developerMessage
    };
  }

  function availableResult(dataset, capabilityId, declaredStatus, resolvedResources, warnings = []) {
    return {
      datasetId: normalizeText(dataset?.stableDatasetId),
      capabilityId,
      declaredStatus,
      renderable: true,
      requiredResources: getCapabilityRequirements(capabilityId).requiredResources,
      resolvedResources,
      missingResources: [],
      invalidResources: [],
      dependencyFailures: [],
      reasonCode: CAPABILITY_REASON_CODES.RENDERABLE,
      studentMessage: 'This capability is available for this curated dataset.',
      developerMessage: warnings.length ? warnings.join(' ') : 'Capability status, resources, validation, and dependencies passed.',
      warnings
    };
  }

  function findCuratedDataset(context, datasetId) {
    return (context.curatedValidation?.datasets || []).find(dataset => dataset.datasetId === datasetId) || null;
  }

  function findCuratedAlignment(context, alignmentId) {
    return (context.alignmentValidation?.alignments || []).find(alignment => alignment.alignmentId === alignmentId) || null;
  }

  function resourceSetHas(setLike, id) {
    if (!id) return false;
    if (!setLike) return false;
    if (typeof setLike.has === 'function') return setLike.has(id);
    if (Array.isArray(setLike)) return setLike.includes(id);
    if (typeof setLike === 'object') return Boolean(setLike[id]);
    return false;
  }

  function isValidPdbId(value) {
    return /^[A-Za-z0-9]{4}$/.test(normalizeText(value));
  }

  function resolveCapabilityResources(dataset, capabilityId, context = {}) {
    const resources = dataset?.resources || {};
    const requiredResources = getCapabilityRequirements(capabilityId, context).requiredResources;
    const resolvedResources = {};
    const missingResources = [];
    const invalidResources = [];

    if (capabilityId === 'structure') {
      const hasPdb = hasResource(resources, 'representativePdbId');
      const hasLocalPath = hasResource(resources, 'localStructureFilePath');
      if (!hasPdb && !hasLocalPath) {
        missingResources.push('representativePdbId or localStructureFilePath');
      }
      if (hasPdb) resolvedResources.representativePdbId = resources.representativePdbId;
      if (hasLocalPath) resolvedResources.localStructureFilePath = resources.localStructureFilePath;
      return { requiredResources, resolvedResources, missingResources, invalidResources };
    }

    requiredResources.forEach(field => {
      const value = resources[field];
      if (!hasResource(resources, field)) {
        missingResources.push(field);
        return;
      }
      resolvedResources[field] = value;
    });

    return { requiredResources, resolvedResources, missingResources, invalidResources };
  }

  function validateAlignmentScores(alignment, context) {
    const scorer = context.helpers?.fullAlignmentConservationScores;
    const config = context.helpers?.conservationScoreConfig || context.helpers?.ALIGNMENT_CONSERVATION_SCORE_CONFIG;
    if (typeof scorer !== 'function') {
      return 'Atlas score helper is unavailable.';
    }
    if (!config || typeof config.identityWeight !== 'number' || typeof config.propertySimilarityWeight !== 'number') {
      return 'Atlas score configuration is unavailable or invalid.';
    }
    const scores = scorer(alignment.records, config);
    if (!Array.isArray(scores) || scores.length !== alignment.alignmentLength) {
      return 'Atlas score calculation did not return one result per alignment column.';
    }
    return '';
  }

  function validateResolvedCapabilityResources(dataset, capabilityId, resolution, context = {}) {
    const invalidResources = [...resolution.invalidResources];
    const warnings = [];
    const resolvedResources = { ...resolution.resolvedResources };
    const resources = dataset?.resources || {};
    const sequenceDatasetId = normalizeText(resources.curatedSequenceDatasetId);
    const alignmentId = normalizeText(resources.curatedAlignmentId);

    if (resolution.missingResources.length) {
      return { ok: false, reasonCode: CAPABILITY_REASON_CODES.REQUIRED_RESOURCE_MISSING, invalidResources, resolvedResources, warnings };
    }

    if (capabilityId === 'structure') {
      const pdbId = normalizeText(resources.representativePdbId);
      const localPath = normalizeText(resources.localStructureFilePath);
      if (pdbId && !isValidPdbId(pdbId)) {
        invalidResources.push('representativePdbId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.INVALID_RESOURCE_REFERENCE, invalidResources, resolvedResources, warnings };
      }
      if (localPath && context.localStructureFiles && !resourceSetHas(context.localStructureFiles, localPath)) {
        invalidResources.push('localStructureFilePath');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_REFERENCE_UNKNOWN, invalidResources, resolvedResources, warnings };
      }
      if (!pdbId && !localPath) {
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.REQUIRED_RESOURCE_MISSING, invalidResources, resolvedResources, warnings };
      }
    }

    if (capabilityId === 'referenceSequences' || capabilityId === 'comparativeSequenceOverview') {
      const curatedDataset = findCuratedDataset(context, sequenceDatasetId);
      if (!curatedDataset) {
        invalidResources.push('curatedSequenceDatasetId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_REFERENCE_UNKNOWN, invalidResources, resolvedResources, warnings };
      }
      if (context.curatedValidation && context.curatedValidation.ok === false) {
        invalidResources.push('curatedSequenceDatasetId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED, invalidResources, resolvedResources, warnings };
      }
      if (!Array.isArray(curatedDataset.records) || curatedDataset.records.length === 0) {
        invalidResources.push('curatedSequenceDatasetId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED, invalidResources, resolvedResources, warnings };
      }
      resolvedResources.curatedSequenceDataset = curatedDataset.datasetId;
    }

    if (['alignment', 'alignmentColumnExploration', 'descriptiveColumnStatistics', 'atlasConservationScore'].includes(capabilityId)) {
      const alignment = findCuratedAlignment(context, alignmentId);
      if (!alignment) {
        invalidResources.push('curatedAlignmentId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_REFERENCE_UNKNOWN, invalidResources, resolvedResources, warnings };
      }
      if (context.alignmentValidation && context.alignmentValidation.ok === false) {
        invalidResources.push('curatedAlignmentId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED, invalidResources, resolvedResources, warnings };
      }
      if (sequenceDatasetId && alignment.datasetId !== sequenceDatasetId) {
        invalidResources.push('curatedAlignmentId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.DATASET_MISMATCH, invalidResources, resolvedResources, warnings };
      }
      if (!Array.isArray(alignment.records) || alignment.records.length === 0 || Number(alignment.alignmentLength || 0) < 1) {
        invalidResources.push('curatedAlignmentId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED, invalidResources, resolvedResources, warnings };
      }
      resolvedResources.curatedAlignment = alignment.alignmentId;

      if (capabilityId === 'descriptiveColumnStatistics' && typeof context.helpers?.alignmentColumnStatisticsForRecords !== 'function') {
        invalidResources.push('descriptiveColumnStatisticsHelper');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED, invalidResources, resolvedResources, warnings };
      }
      if (capabilityId === 'atlasConservationScore') {
        const scoreIssue = validateAlignmentScores(alignment, context);
        if (scoreIssue) {
          invalidResources.push('atlasConservationScoreHelper');
          return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED, invalidResources, resolvedResources, warnings };
        }
      }
    }

    if (capabilityId === 'sequenceToStructureMapping') {
      const mappingId = normalizeText(resources.structureMappingId);
      const mapping = context.structureMappings?.get?.(mappingId) || context.structureMappings?.[mappingId] || null;
      if (!mapping) {
        invalidResources.push('structureMappingId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_REFERENCE_UNKNOWN, invalidResources, resolvedResources, warnings };
      }
      if (mapping.datasetId && mapping.datasetId !== normalizeText(dataset.stableDatasetId)) {
        invalidResources.push('structureMappingId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.DATASET_MISMATCH, invalidResources, resolvedResources, warnings };
      }
      resolvedResources.structureMapping = mappingId;
    }

    if (capabilityId === 'system') {
      const systemModelId = normalizeText(resources.systemModelId);
      if (context.systemModels && !resourceSetHas(context.systemModels, systemModelId)) {
        invalidResources.push('systemModelId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_REFERENCE_UNKNOWN, invalidResources, resolvedResources, warnings };
      }
      warnings.push('System model validation is currently identifier-based; no separate system-model schema is represented yet.');
    }

    if (capabilityId === 'function') {
      const annotationId = normalizeText(resources.functionAnnotationDatasetId);
      if (context.functionAnnotations && !resourceSetHas(context.functionAnnotations, annotationId)) {
        invalidResources.push('functionAnnotationDatasetId');
        return { ok: false, reasonCode: CAPABILITY_REASON_CODES.RESOURCE_REFERENCE_UNKNOWN, invalidResources, resolvedResources, warnings };
      }
      warnings.push('Function annotation validation is currently limited to the registered built-in teaching resource.');
    }

    return { ok: true, reasonCode: CAPABILITY_REASON_CODES.RENDERABLE, invalidResources, resolvedResources, warnings };
  }

  function evaluateCapabilityDependencies(dataset, capabilityId, context = {}, memo = {}, stack = []) {
    const dependencies = getCapabilityRequirements(capabilityId, context).dependencies;
    const failures = [];
    dependencies.forEach(dependencyId => {
      if (stack.includes(dependencyId)) {
        failures.push({
          capabilityId: dependencyId,
          reasonCode: CAPABILITY_REASON_CODES.CIRCULAR_DEPENDENCY,
          developerMessage: `Circular capability dependency detected: ${[...stack, dependencyId].join(' -> ')}.`
        });
        return;
      }
      const result = getCapabilityAvailability(dataset, dependencyId, context, memo, [...stack, capabilityId]);
      if (!result.renderable) failures.push(result);
    });
    return failures;
  }

  function statusReason(status) {
    if (status === 'unavailable') return CAPABILITY_REASON_CODES.STATUS_UNAVAILABLE;
    if (status === 'planned') return CAPABILITY_REASON_CODES.STATUS_PLANNED;
    if (status === 'partial') return CAPABILITY_REASON_CODES.STATUS_PARTIAL;
    if (status === 'archived') return CAPABILITY_REASON_CODES.STATUS_ARCHIVED;
    return CAPABILITY_REASON_CODES.STATUS_MISSING;
  }

  function getCapabilityAvailability(dataset, capabilityId, context = {}, memo = {}, stack = []) {
    const memoKey = `${normalizeText(dataset?.stableDatasetId)}:${capabilityId}`;
    if (memo[memoKey]) return memo[memoKey];
    if (stack.includes(capabilityId)) {
      return emptyAvailability(
        dataset,
        capabilityId,
        getCapabilityDeclaredStatus(dataset, capabilityId),
        CAPABILITY_REASON_CODES.CIRCULAR_DEPENDENCY,
        'This capability is unavailable because its registry dependencies are circular.',
        `Circular capability dependency detected: ${[...stack, capabilityId].join(' -> ')}.`
      );
    }

    const declaredStatus = getCapabilityDeclaredStatus(dataset, capabilityId);
    const requirements = getCapabilityRequirements(capabilityId, context);
    if (declaredStatus !== 'available') {
      const reasonCode = statusReason(declaredStatus);
      const result = emptyAvailability(
        dataset,
        capabilityId,
        declaredStatus || 'missing',
        reasonCode,
        'This capability is not available for the selected dataset yet.',
        `Capability ${capabilityId} has declared status ${declaredStatus || 'missing'}, so it cannot be rendered as available.`,
        { requiredResources: requirements.requiredResources }
      );
      memo[memoKey] = result;
      return result;
    }

    const dependencyFailures = evaluateCapabilityDependencies(dataset, capabilityId, context, memo, stack);
    if (dependencyFailures.length) {
      const result = emptyAvailability(
        dataset,
        capabilityId,
        declaredStatus,
        dependencyFailures.some(failure => failure.reasonCode === CAPABILITY_REASON_CODES.CIRCULAR_DEPENDENCY)
          ? CAPABILITY_REASON_CODES.CIRCULAR_DEPENDENCY
          : CAPABILITY_REASON_CODES.DEPENDENCY_UNAVAILABLE,
        'This capability is unavailable because a required supporting capability is not ready.',
        `Capability ${capabilityId} depends on unavailable capability/capabilities: ${dependencyFailures.map(failure => `${failure.capabilityId} (${failure.reasonCode})`).join(', ')}.`,
        { requiredResources: requirements.requiredResources, dependencyFailures }
      );
      memo[memoKey] = result;
      return result;
    }

    const resolution = resolveCapabilityResources(dataset, capabilityId, context);
    const validation = validateResolvedCapabilityResources(dataset, capabilityId, resolution, context);
    if (!validation.ok) {
      const result = emptyAvailability(
        dataset,
        capabilityId,
        declaredStatus,
        validation.reasonCode,
        'This capability is listed in the registry but cannot be shown because a required scientific resource is missing or invalid.',
        `Capability ${capabilityId} failed resource validation with reason ${validation.reasonCode}.`,
        {
          requiredResources: resolution.requiredResources,
          resolvedResources: validation.resolvedResources,
          missingResources: resolution.missingResources,
          invalidResources: validation.invalidResources
        }
      );
      memo[memoKey] = result;
      return result;
    }

    const result = availableResult(dataset, capabilityId, declaredStatus, validation.resolvedResources, validation.warnings);
    memo[memoKey] = result;
    return result;
  }

  function isCapabilityRenderable(dataset, capabilityId, context = {}) {
    return getCapabilityAvailability(dataset, capabilityId, context).renderable;
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

      Object.entries(CAPABILITY_DEPENDENCIES).forEach(([capabilityName, dependencyNames]) => {
        const status = capabilityStatus(dataset.capabilities?.[capabilityName]);
        if (status !== 'available') return;
        dependencyNames.forEach(dependencyName => {
          const dependencyStatus = capabilityStatus(dataset.capabilities?.[dependencyName]);
          if (dependencyStatus !== 'available') {
            errors.push(`${stableDatasetId} capability ${capabilityName} is available but depends on ${dependencyName}, which is ${dependencyStatus || 'missing'}.`);
          }
        });
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
    RESOURCE_REQUIREMENTS,
    CAPABILITY_DEPENDENCIES,
    CAPABILITY_REASON_CODES,
    getCapabilityDeclaredStatus,
    getCapabilityRequirements,
    resolveCapabilityResources,
    validateResolvedCapabilityResources,
    evaluateCapabilityDependencies,
    getCapabilityAvailability,
    isCapabilityRenderable,
    validateAtlasDatasetRegistry
  };
});
