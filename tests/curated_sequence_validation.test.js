const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  normalizeSequence,
  validateCuratedSequenceSets
} = require('../curated_sequence_validation.js');
const {
  normalizeAlignedSequence,
  validateCuratedSequenceAlignments
} = require('../curated_alignment_validation.js');
const {
  validateAtlasDatasetRegistry,
  getCapabilityAvailability,
  isCapabilityRenderable,
  CAPABILITY_REASON_CODES
} = require('../atlas_dataset_registry_validation.js');
const {
  sequenceLengthStats,
  sequencePreview,
  sequencePositionRows,
  sortedCuratedRecords,
  alignmentColumnRows,
  alignmentMarkerLine,
  referencePositionForAlignmentColumn,
  residuePropertyCategory,
  alignmentColumnStatistics,
  alignmentColumnStatisticsForRecords,
  alignmentColumnConservationSummary,
  alignmentColumnConservationSummaryForRecords,
  fullAlignmentConservationScores,
  conservationScoreBand,
  BIOCHEMICAL_PROPERTY_CATEGORIES,
  ALIGNMENT_CONSERVATION_SCORE_CONFIG
} = require('../sequence_display_helpers.js');

function productionDataset() {
  const dataPath = path.join(__dirname, '..', 'data', 'curated_sequence_sets.js');
  delete require.cache[require.resolve(dataPath)];
  globalThis.BVA_CURATED_SEQUENCE_SETS = undefined;
  require(dataPath);
  const result = validateCuratedSequenceSets(globalThis.BVA_CURATED_SEQUENCE_SETS);
  assert.strictEqual(result.ok, true);
  return result.datasets.find(item => item.datasetId === 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs');
}

function productionCuratedValidation() {
  const dataPath = path.join(__dirname, '..', 'data', 'curated_sequence_sets.js');
  delete require.cache[require.resolve(dataPath)];
  globalThis.BVA_CURATED_SEQUENCE_SETS = undefined;
  require(dataPath);
  return validateCuratedSequenceSets(globalThis.BVA_CURATED_SEQUENCE_SETS);
}

function productionAlignmentValidation() {
  const alignmentPath = path.join(__dirname, '..', 'data', 'curated_sequence_alignments.js');
  delete require.cache[require.resolve(alignmentPath)];
  globalThis.BVA_CURATED_SEQUENCE_ALIGNMENTS = undefined;
  require(alignmentPath);
  return validateCuratedSequenceAlignments(globalThis.BVA_CURATED_SEQUENCE_ALIGNMENTS, productionCuratedValidation());
}

function validAlignmentPayload(overrides = {}) {
  const alignmentPath = path.join(__dirname, '..', 'data', 'curated_sequence_alignments.js');
  delete require.cache[require.resolve(alignmentPath)];
  globalThis.BVA_CURATED_SEQUENCE_ALIGNMENTS = undefined;
  require(alignmentPath);
  return {
    ...JSON.parse(JSON.stringify(globalThis.BVA_CURATED_SEQUENCE_ALIGNMENTS)),
    ...overrides
  };
}

function productionRegistryPayload(overrides = {}) {
  const registryPath = path.join(__dirname, '..', 'data', 'atlas_dataset_registry.js');
  delete require.cache[require.resolve(registryPath)];
  globalThis.BVA_ATLAS_DATASET_REGISTRY = undefined;
  require(registryPath);
  return {
    ...JSON.parse(JSON.stringify(globalThis.BVA_ATLAS_DATASET_REGISTRY)),
    ...overrides
  };
}

function productionRegistryValidation(payload = productionRegistryPayload()) {
  return validateAtlasDatasetRegistry(payload, productionCuratedValidation(), productionAlignmentValidation());
}

function availabilityContext(overrides = {}) {
  return {
    curatedValidation: productionCuratedValidation(),
    alignmentValidation: productionAlignmentValidation(),
    localStructureFiles: new Set(['1MBN.pdb']),
    systemModels: new Set(['photosynthesis']),
    functionAnnotations: new Set(['myoglobin_structural_features_builtin']),
    structureMappings: new Map(),
    helpers: {
      alignmentColumnStatisticsForRecords,
      fullAlignmentConservationScores,
      conservationScoreConfig: ALIGNMENT_CONSERVATION_SCORE_CONFIG
    },
    ...overrides
  };
}

function registryDataset(datasetId, payload = productionRegistryPayload()) {
  const result = validateAtlasDatasetRegistry(payload, productionCuratedValidation(), productionAlignmentValidation());
  assert.strictEqual(result.ok, true);
  const dataset = result.datasets.find(item => item.stableDatasetId === datasetId);
  assert(dataset, `Expected registry dataset ${datasetId}`);
  return dataset;
}

function validPayload(overrides = {}) {
  return {
    formatVersion: 1,
    acceptedResidueSymbols: 'ACDEFGHIKLMNPQRSTVWYBXZ',
    datasets: [
      {
        datasetId: 'synthetic_set',
        title: 'Synthetic teaching fixture',
        description: 'Small synthetic dataset for parser tests.',
        records: [
          {
            stableSequenceId: 'seq_alpha',
            proteinName: 'Synthetic protein alpha',
            geneName: 'rbcL',
            organism: 'Synthetic cyanobacterium',
            broadTaxonomicGroup: 'Cyanobacteria',
            photosyntheticCategory: 'oxygenic phototroph',
            aminoAcidSequence: 'maGvkx',
            sourceDatabase: 'SyntheticDB',
            sourceAccession: 'SYN001'
          }
        ]
      }
    ],
    ...overrides
  };
}

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run('valid dataset loading normalizes sequence case and whitespace', () => {
  const result = validateCuratedSequenceSets(validPayload());
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.datasets[0].records[0].aminoAcidSequence, 'MAGVKX');
});

run('required record fields are validated', () => {
  const payload = validPayload();
  delete payload.datasets[0].records[0].organism;
  const result = validateCuratedSequenceSets(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('organism')));
});

run('invalid amino-acid symbols are rejected', () => {
  const payload = validPayload();
  payload.datasets[0].records[0].aminoAcidSequence = 'MAGV*';
  const result = validateCuratedSequenceSets(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('*')));
});

run('duplicate stable sequence IDs are detected', () => {
  const payload = validPayload();
  payload.datasets[0].records.push({
    ...payload.datasets[0].records[0],
    sourceAccession: 'SYN002'
  });
  const result = validateCuratedSequenceSets(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('Duplicate stable sequence identifier')));
});

run('duplicate source database/accession pairs are detected', () => {
  const payload = validPayload();
  payload.datasets[0].records.push({
    ...payload.datasets[0].records[0],
    stableSequenceId: 'seq_beta'
  });
  const result = validateCuratedSequenceSets(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('Duplicate source database/accession pair')));
});

run('missing optional fields are allowed', () => {
  const payload = validPayload();
  delete payload.datasets[0].records[0].photosyntheticCategory;
  delete payload.datasets[0].records[0].structureIdentifier;
  delete payload.datasets[0].records[0].sourceCitation;
  delete payload.datasets[0].records[0].notes;
  const result = validateCuratedSequenceSets(payload);
  assert.strictEqual(result.ok, true);
});

run('whitespace and case normalization preserves residue symbols', () => {
  assert.strictEqual(normalizeSequence(' acd\nefg  xbz '), 'ACDEFGXBZ');
});

run('empty datasets are allowed with a warning', () => {
  const result = validateCuratedSequenceSets(validPayload({
    datasets: [{ datasetId: 'empty', title: 'Empty set', records: [] }]
  }));
  assert.strictEqual(result.ok, true);
  assert(result.warnings.some(warning => warning.includes('no reference sequence records')));
});

run('dataset-version handling rejects unsupported versions', () => {
  const result = validateCuratedSequenceSets(validPayload({ formatVersion: 99 }));
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('format version')));
});

run('Atlas dataset registry validates Rubisco and Myoglobin entries', () => {
  const result = productionRegistryValidation();
  assert.strictEqual(result.ok, true);
  const rubisco = result.datasets.find(dataset => dataset.stableDatasetId === 'rubisco');
  const myoglobin = result.datasets.find(dataset => dataset.stableDatasetId === 'myoglobin');
  assert(rubisco);
  assert(myoglobin);
  assert.strictEqual(rubisco.defaultLens, 'evolution');
  assert.strictEqual(rubisco.capabilities.structure.status, 'unavailable');
  assert.strictEqual(rubisco.capabilities.atlasConservationScore.status, 'available');
  assert.strictEqual(rubisco.resources.curatedSequenceDatasetId, 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs');
  assert.strictEqual(rubisco.resources.curatedAlignmentId, 'rubisco_rbcl_oxygenic_phototrophs_msa');
  assert.strictEqual(myoglobin.defaultLens, 'structure');
  assert.strictEqual(myoglobin.capabilities.structure.status, 'available');
  assert.strictEqual(myoglobin.capabilities.alignment.status, 'unavailable');
  assert.strictEqual(myoglobin.resources.representativePdbId, '1MBN');
});

run('Atlas dataset registry rejects duplicate dataset IDs and unsupported schema versions', () => {
  const duplicate = productionRegistryPayload();
  duplicate.datasets.push({ ...duplicate.datasets[0] });
  let result = productionRegistryValidation(duplicate);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('Duplicate Atlas dataset ID')));
  result = productionRegistryValidation(productionRegistryPayload({ schemaVersion: 99 }));
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('schema version')));
});

run('Atlas dataset registry rejects invalid capability status and default lens issues', () => {
  const payload = productionRegistryPayload();
  payload.datasets[0].capabilities.alignment.status = 'ready-ish';
  let result = productionRegistryValidation(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('unsupported status')));

  const badDefault = productionRegistryPayload();
  badDefault.datasets[0].defaultLens = 'mystery';
  result = productionRegistryValidation(badDefault);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('invalid default lens')));

  const unavailableDefault = productionRegistryPayload();
  unavailableDefault.datasets[0].defaultLens = 'structure';
  unavailableDefault.datasets[0].availableLenses.push('structure');
  result = productionRegistryValidation(unavailableDefault);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('default lens structure is not available')));
});

run('Atlas dataset registry enforces resource requirements and unavailable-resource boundaries', () => {
  const unavailableWithResource = productionRegistryPayload();
  unavailableWithResource.datasets[0].capabilities.structure.status = 'unavailable';
  unavailableWithResource.datasets[0].resources.representativePdbId = '9ABC';
  let result = productionRegistryValidation(unavailableWithResource);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('structure is unavailable but claims active resource')));

  const alignmentWithoutResource = productionRegistryPayload();
  delete alignmentWithoutResource.datasets[0].resources.curatedAlignmentId;
  result = productionRegistryValidation(alignmentWithoutResource);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('alignment is available but lacks required resource reference')));

  const structureWithoutResource = productionRegistryPayload();
  delete structureWithoutResource.datasets[1].resources.representativePdbId;
  delete structureWithoutResource.datasets[1].resources.localStructureFilePath;
  result = productionRegistryValidation(structureWithoutResource);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('structure is available but lacks required resource reference')));
});

run('Atlas dataset registry validates referenced datasets, alignments, PDB IDs, concepts, and strict fields', () => {
  let payload = productionRegistryPayload();
  payload.datasets[0].resources.curatedSequenceDatasetId = 'missing_sequence_dataset';
  let result = productionRegistryValidation(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('unknown curated sequence dataset')));

  payload = productionRegistryPayload();
  payload.datasets[0].resources.curatedAlignmentId = 'missing_alignment';
  result = productionRegistryValidation(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('unknown curated alignment')));

  payload = productionRegistryPayload();
  payload.datasets[1].resources.representativePdbId = '1MBNN';
  result = productionRegistryValidation(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('four alphanumeric')));

  payload = productionRegistryPayload();
  payload.datasets[0].conceptIds.push('photosynthesis');
  result = productionRegistryValidation(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('duplicate concept')));

  payload = productionRegistryPayload({ unexpected: true });
  result = productionRegistryValidation(payload);
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('unknown top-level field')));
});

run('Atlas capability availability distinguishes declared status from renderability', () => {
  const rubisco = registryDataset('rubisco');
  const myoglobin = registryDataset('myoglobin');
  const context = availabilityContext();

  let result = getCapabilityAvailability(rubisco, 'referenceSequences', context);
  assert.strictEqual(result.renderable, true);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.RENDERABLE);
  assert.strictEqual(result.resolvedResources.curatedSequenceDataset, 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs');

  result = getCapabilityAvailability(rubisco, 'structure', context);
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.STATUS_UNAVAILABLE);

  result = getCapabilityAvailability(myoglobin, 'structure', context);
  assert.strictEqual(result.renderable, true);
  assert.strictEqual(isCapabilityRenderable(myoglobin, 'structure', context), true);

  result = getCapabilityAvailability(myoglobin, 'alignment', context);
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.STATUS_UNAVAILABLE);
});

run('Atlas capability availability validates comparative sequence dependencies and missing resources', () => {
  const payload = productionRegistryPayload();
  payload.datasets[0].capabilities.referenceSequences.status = 'unavailable';
  payload.datasets[0].capabilities.comparativeSequenceOverview.status = 'available';
  payload.datasets[0].resources.curatedSequenceDatasetId = 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs';
  const dataset = payload.datasets[0];
  const result = getCapabilityAvailability(dataset, 'comparativeSequenceOverview', availabilityContext());
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.DEPENDENCY_UNAVAILABLE);
  assert.strictEqual(result.dependencyFailures[0].capabilityId, 'referenceSequences');

  const missing = productionRegistryPayload();
  missing.datasets[0].capabilities.referenceSequences.status = 'available';
  delete missing.datasets[0].resources.curatedSequenceDatasetId;
  const missingResult = getCapabilityAvailability(missing.datasets[0], 'referenceSequences', availabilityContext());
  assert.strictEqual(missingResult.renderable, false);
  assert.strictEqual(missingResult.reasonCode, CAPABILITY_REASON_CODES.REQUIRED_RESOURCE_MISSING);
});

run('Atlas capability availability validates alignment resources and dataset consistency', () => {
  const rubisco = registryDataset('rubisco');
  const context = availabilityContext();
  let result = getCapabilityAvailability(rubisco, 'alignment', context);
  assert.strictEqual(result.renderable, true);
  assert.strictEqual(result.resolvedResources.curatedAlignment, 'rubisco_rbcl_oxygenic_phototrophs_msa');

  const badAlignmentValidation = JSON.parse(JSON.stringify(context.alignmentValidation));
  badAlignmentValidation.alignments[0].datasetId = 'different_dataset';
  result = getCapabilityAvailability(rubisco, 'alignment', availabilityContext({ alignmentValidation: badAlignmentValidation }));
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.DATASET_MISMATCH);

  const emptyAlignmentValidation = JSON.parse(JSON.stringify(context.alignmentValidation));
  emptyAlignmentValidation.alignments[0].records = [];
  result = getCapabilityAvailability(rubisco, 'alignment', availabilityContext({ alignmentValidation: emptyAlignmentValidation }));
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED);
});

run('Atlas capability availability validates descriptive statistics and Atlas score helpers', () => {
  const rubisco = registryDataset('rubisco');
  let result = getCapabilityAvailability(rubisco, 'atlasConservationScore', availabilityContext());
  assert.strictEqual(result.renderable, true);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.RENDERABLE);

  result = getCapabilityAvailability(rubisco, 'descriptiveColumnStatistics', availabilityContext({
    helpers: {
      fullAlignmentConservationScores,
      conservationScoreConfig: ALIGNMENT_CONSERVATION_SCORE_CONFIG
    }
  }));
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED);
  assert(result.invalidResources.includes('descriptiveColumnStatisticsHelper'));

  result = getCapabilityAvailability(rubisco, 'atlasConservationScore', availabilityContext({
    helpers: {
      alignmentColumnStatisticsForRecords,
      fullAlignmentConservationScores: () => [],
      conservationScoreConfig: ALIGNMENT_CONSERVATION_SCORE_CONFIG
    }
  }));
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.RESOURCE_VALIDATION_FAILED);
});

run('Atlas capability availability keeps sequence-to-structure mapping nonrenderable without explicit mapping resources', () => {
  const rubisco = registryDataset('rubisco');
  let result = getCapabilityAvailability(rubisco, 'sequenceToStructureMapping', availabilityContext());
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.STATUS_UNAVAILABLE);

  const payload = productionRegistryPayload();
  payload.datasets[0].capabilities.structure.status = 'available';
  payload.datasets[0].resources.representativePdbId = '1ABC';
  payload.datasets[0].capabilities.sequenceToStructureMapping.status = 'available';
  payload.datasets[0].resources.structureMappingId = 'missing_mapping';
  result = getCapabilityAvailability(payload.datasets[0], 'sequenceToStructureMapping', availabilityContext());
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.RESOURCE_REFERENCE_UNKNOWN);
});

run('Atlas capability availability detects circular capability dependencies', () => {
  const rubisco = registryDataset('rubisco');
  const result = getCapabilityAvailability(rubisco, 'alignment', availabilityContext({
    capabilityDependencies: {
      alignment: ['atlasConservationScore'],
      atlasConservationScore: ['alignment']
    }
  }));
  assert.strictEqual(result.renderable, false);
  assert.strictEqual(result.reasonCode, CAPABILITY_REASON_CODES.CIRCULAR_DEPENDENCY);
});

run('existing Structure Sequence behavior is still wired to shared residue selection', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('const sequence = sequenceFromResidues(state.residues);'));
  assert(indexHtml.includes('button.dataset.sequenceIndex = index;'));
  assert(indexHtml.includes('selectTorsionIndex(Number(item.dataset.sequenceIndex));'));
});

run('Structure mode owns the structure-derived sequence panel', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = indexHtml.indexOf('id="overviewPanel"');
  const end = indexHtml.indexOf('id="sequencePanel"');
  const overviewPanel = indexHtml.slice(start, end);
  assert(overviewPanel.includes('id="structureSequencePanel"'));
  assert(overviewPanel.includes('Structure Sequence'));
  assert(overviewPanel.includes('Residues represented in the currently loaded molecular structure'));
  assert(overviewPanel.includes('id="sequenceViewer"'));
  assert(indexHtml.includes('function drawStructureSequence()'));
  assert(indexHtml.includes('if (state.mode === \'overview\')'));
  assert(indexHtml.includes('drawStructureSequence();'));
});

run('Sequence mode is limited to curated Visual Evolution Explorer content', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = indexHtml.indexOf('id="sequencePanel"');
  const end = indexHtml.indexOf('id="hbondsPanel"');
  const sequencePanel = indexHtml.slice(start, end);
  assert(sequencePanel.includes('Visual Evolution Explorer'));
  assert(sequencePanel.includes('Comparative Sequence Set'));
  assert(sequencePanel.includes('curatedSequenceDataset'));
  assert(sequencePanel.includes('curatedReferenceSequences'));
  assert(sequencePanel.includes('curatedAlignmentView'));
  assert(!sequencePanel.includes('id="sequenceViewer"'));
  assert(!sequencePanel.includes('Structure Sequence:'));
  assert(!sequencePanel.includes('1MBN sequence'));
});

run('Sequence mode renders curated content without drawing the structure sequence', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('function drawVisualEvolutionExplorer()'));
  assert(indexHtml.includes('if (state.mode === \'sequence\') drawVisualEvolutionExplorer();'));
  assert(!indexHtml.includes('if (state.mode === \'sequence\') drawStructureSequence();'));
});

run('mode switching preserves structure and curated sequence state', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = indexHtml.indexOf("document.getElementById('modeTabs').addEventListener('click'");
  const end = indexHtml.indexOf("document.getElementById('fitWholeStructure')");
  const modeHandler = indexHtml.slice(start, end);
  assert(modeHandler.includes('state.mode = button.dataset.mode;'));
  assert(!modeHandler.includes('state.selectedResidueIndex = 0'));
  assert(!modeHandler.includes('state.selectedCuratedSequenceId = null'));
  assert(!modeHandler.includes('state.selectedAlignmentColumnIndex = null'));
});

run('hidden inactive mode panels are removed from keyboard navigation by display none', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('.hidden { display: none; }'));
  assert(indexHtml.includes("document.querySelectorAll('.mode-panel').forEach(el => el.classList.add('hidden'));"));
  assert(indexHtml.includes("document.getElementById(`${state.mode}Panel`).classList.remove('hidden');"));
});

run('Reference Sequence Details panel includes required metadata labels', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  [
    'Reference Sequence Details',
    'Organism',
    'Protein name',
    'Gene name',
    'Broad taxonomic group',
    'Photosynthetic category',
    'Sequence length',
    'Source database',
    'Source accession',
    'Source note or citation',
    'Optional structure identifier',
    'Stable internal sequence identifier'
  ].forEach(label => assert(indexHtml.includes(label), `Missing label: ${label}`));
});

run('Reference Sequence Details handles missing optional metadata', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes("record.sourceCitation || record.notes"));
  assert(indexHtml.includes("record.structureIdentifier"));
  assert(indexHtml.includes(".filter(row => row.value !== null && row.value !== undefined && String(row.value).trim() !== '')"));
});

run('curated reference sequence selection updates a separate details state', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes("selectedCuratedSequenceId: null"));
  assert(indexHtml.includes("data-reference-sequence-id"));
  assert(indexHtml.includes("state.selectedCuratedSequenceId = item.dataset.referenceSequenceId;"));
  assert(indexHtml.includes("renderReferenceSequenceDetails();"));
});

run('Reference Sequence Details has useful empty selection state', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('No reference sequence selected'));
  assert(indexHtml.includes('Select a Reference Sequence card above'));
});

run('Reference Sequence UI explicitly avoids sequence-to-structure mapping assumptions', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('No sequence-to-structure mapping is performed here'));
  assert(indexHtml.includes('Reference-sequence positions should not be treated as structure residue numbers'));
  assert(indexHtml.includes('This does not select a structure residue or map sequence positions to the loaded 3D model'));
});

run('Reference sequence controls include accessible button state for keyboard use', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('button type="button" data-reference-sequence-id='));
  assert(indexHtml.includes('aria-pressed='));
  assert(indexHtml.includes("document.getElementById('curatedReferenceSequences').addEventListener('click'"));
});

run('Sequence mode uses a left-stage Visual Evolution Explorer overlay', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('id="sequenceStageOverview"'));
  assert(indexHtml.includes('Visual Evolution Explorer'));
  assert(indexHtml.includes("const isSequenceMode = state.mode === 'sequence';"));
  assert(indexHtml.includes("stage.classList.toggle('sequence-stage-active', isSequenceMode);"));
  assert(indexHtml.includes("panel.classList.toggle('hidden', !isSequenceMode);"));
  assert(indexHtml.includes('.stage.sequence-stage-active #viewer'));
  assert(indexHtml.includes('visibility: hidden;'));
});

run('App loads and summarizes the Atlas dataset registry without replacing current behavior', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('./atlas_dataset_registry_validation.js'));
  assert(indexHtml.includes('./data/atlas_dataset_registry.js'));
  assert(indexHtml.includes('id="atlasDatasetRegistrySummary"'));
  assert(indexHtml.includes('function atlasRegistryValidation()'));
  assert(indexHtml.includes('function renderAtlasDatasetRegistrySummary()'));
  assert(indexHtml.includes('Capabilities marked unavailable are not inferred or simulated.'));
  assert(indexHtml.includes("activeEvolutionDatasetId: 'rubisco'"));
  assert(indexHtml.includes('function activeEvolutionRegistryDataset()'));
  assert(indexHtml.includes('function activeEvolutionCapability(capabilityId)'));
  assert(indexHtml.includes("curatedSequenceDatasetId: 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs'"));
  assert(indexHtml.includes("structureId: '1MBN'"));
});

run('Visual Evolution Explorer uses registry resources instead of silent curated-data fallbacks', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const currentDatasetFunction = indexHtml.slice(
    indexHtml.indexOf('function currentCuratedSequenceDataset()'),
    indexHtml.indexOf('function currentCuratedAlignment()')
  );
  const currentAlignmentFunction = indexHtml.slice(
    indexHtml.indexOf('function currentCuratedAlignment()'),
    indexHtml.indexOf('const CAPABILITY_LABELS')
  );
  assert(currentDatasetFunction.includes('activeEvolutionRegistryDataset()'));
  assert(currentDatasetFunction.includes('registryDataset?.resources?.curatedSequenceDatasetId'));
  assert(!currentDatasetFunction.includes('validation.datasets[0]'));
  assert(currentAlignmentFunction.includes('registryDataset?.resources?.curatedAlignmentId'));
  assert(!currentAlignmentFunction.includes('validation.alignments[0]'));
});

run('Visual Evolution Explorer renders availability through the validated capability resolver', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  [
    'Available Atlas Lenses',
    'getCapabilityAvailability',
    'isCapabilityRenderable',
    'Feature availability is checked with the registry',
    'Reference Sequence Details unavailable',
    'Comparative sequence overview unavailable',
    'Alignment unavailable',
    'Alignment-column exploration unavailable',
    'Descriptive column statistics unavailable',
    'Atlas score track unavailable',
    'Sequence-to-structure mapping'
  ].forEach(text => assert(indexHtml.includes(text), `Missing registry availability text: ${text}`));
});

run('Visual Evolution Explorer summarizes dataset title and sequence count', () => {
  const dataset = productionDataset();
  assert.strictEqual(dataset.title, 'Photosynthesis: Rubisco large subunit across oxygenic phototrophs');
  assert.strictEqual(dataset.records.length, 3);
  assert.strictEqual(Math.min(...dataset.records.map(record => record.aminoAcidSequence.length)), 475);
  assert.strictEqual(Math.max(...dataset.records.map(record => record.aminoAcidSequence.length)), 479);
});

run('Visual Evolution Explorer includes organism, group, category, and length summaries', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  [
    'Represented Organisms',
    'Broad taxonomic groups',
    'Organism-level photosynthetic categories',
    'Sequence length range',
    'curatedDatasetSummary',
    'sequenceLengthRange',
    'scientificNameList'
  ].forEach(label => assert(indexHtml.includes(label), `Missing sequence overview text: ${label}`));
});

run('Visual Evolution Explorer has empty dataset states', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('No active Atlas dataset'));
  assert(indexHtml.includes('Reference sequences unavailable'));
  assert(indexHtml.includes('No registry-resolved sequence dataset available'));
});

run('Visual Evolution Explorer avoids implying myoglobin is related to RbcL', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = indexHtml.indexOf('function updateSequenceStageOverview');
  const end = indexHtml.indexOf('function selectedCuratedSequenceRecord');
  const overviewFunction = indexHtml.slice(start, end);
  assert(!/myoglobin|1MBN/i.test(overviewFunction));
  assert(overviewFunction.includes('This sequence dataset is not currently mapped to the molecular structure shown in Structure mode.'));
});

run('mode controls remain keyboard-accessible buttons', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('id="modeTabs" aria-label="Biochemistry Visual Atlas navigation"'));
  assert(indexHtml.includes('<button class="active" data-mode="overview">Structure</button>'));
  assert(indexHtml.includes('<button data-mode="sequence">Sequence</button>'));
});

run('Comparative Sequence Overview renders all current reference records', () => {
  const dataset = productionDataset();
  const accessions = dataset.records.map(record => record.sourceAccession);
  assert.deepStrictEqual(accessions, ['NP_051067.1', 'NP_043033.1', 'NP_958405.1']);
  assert.deepStrictEqual(dataset.records.map(record => record.organism), ['Arabidopsis thaliana', 'Zea mays', 'Chlamydomonas reinhardtii']);
  assert.deepStrictEqual(dataset.records.map(record => record.photosyntheticCategory), ['C3', 'C4', 'oxygenic green alga']);
  assert.deepStrictEqual(dataset.records.map(record => record.aminoAcidSequence.length), [479, 476, 475]);
});

run('sequence preview generation uses the exact N-terminal substring without alignment gaps', () => {
  const dataset = productionDataset();
  const arabidopsis = dataset.records[0];
  assert.strictEqual(sequencePreview(arabidopsis.aminoAcidSequence), 'MSPQTETKASVGFKAGVKEYKLTYYTPEYE'.slice(0, 30));
  dataset.records.forEach(record => {
    const preview = sequencePreview(record.aminoAcidSequence);
    assert.strictEqual(preview.length, 30);
    assert(!preview.includes('-'));
    assert.strictEqual(preview, record.aminoAcidSequence.slice(0, 30));
  });
});

run('expanded full-sequence rendering can produce reference position markers', () => {
  const dataset = productionDataset();
  const rows = sequencePositionRows(dataset.records[0].aminoAcidSequence, 10);
  assert.deepStrictEqual(rows.slice(0, 3), [
    { start: 1, sequence: 'MSPQTETKAS' },
    { start: 11, sequence: 'VGFKAGVKEY' },
    { start: 21, sequence: 'KLTYYTPEYE' }
  ]);
  assert.strictEqual(rows[rows.length - 1].start, 471);
  assert.strictEqual(rows.map(row => row.sequence).join(''), dataset.records[0].aminoAcidSequence);
});

run('sequence length summary reports min, max, and difference', () => {
  const dataset = productionDataset();
  assert.deepStrictEqual(sequenceLengthStats(dataset.records), { min: 475, max: 479, difference: 4 });
});

run('sorting works by each supported comparative sequence field', () => {
  const dataset = productionDataset();
  assert.deepStrictEqual(sortedCuratedRecords(dataset.records, 'dataset').map(record => record.sourceAccession), ['NP_051067.1', 'NP_043033.1', 'NP_958405.1']);
  assert.deepStrictEqual(sortedCuratedRecords(dataset.records, 'organism').map(record => record.organism), ['Arabidopsis thaliana', 'Chlamydomonas reinhardtii', 'Zea mays']);
  assert.deepStrictEqual(sortedCuratedRecords(dataset.records, 'group').map(record => record.broadTaxonomicGroup), ['flowering plant (eudicot)', 'flowering plant (monocot)', 'green alga']);
  assert.deepStrictEqual(sortedCuratedRecords(dataset.records, 'category').map(record => record.photosyntheticCategory), ['C3', 'C4', 'oxygenic green alga']);
  assert.deepStrictEqual(sortedCuratedRecords(dataset.records, 'length').map(record => record.sourceAccession), ['NP_958405.1', 'NP_043033.1', 'NP_051067.1']);
});

run('Comparative Sequence Overview selection and expansion controls use existing state without residue mapping', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('state.selectedCuratedSequenceId = item.dataset.referenceSequenceId;'));
  assert(indexHtml.includes('expandedReferenceSequenceIds'));
  assert(indexHtml.includes('data-reference-sequence-toggle'));
  assert(indexHtml.includes('This is not structure residue numbering and no alignment gaps are inserted.'));
  assert(!indexHtml.includes('data-sequence-index="${escapeHtml(record.stableSequenceId)}"'));
});

run('Comparative Sequence Overview sort and expand controls are keyboard-accessible form controls', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('<label for="sequenceComparisonSort">Sort reference sequences</label>'));
  assert(indexHtml.includes('<select id="sequenceComparisonSort">'));
  assert(indexHtml.includes('aria-expanded='));
  assert(indexHtml.includes('Expand complete sequence'));
  assert(indexHtml.includes('Collapse complete sequence'));
});

run('valid alignment loading and exact ungapped matching pass', () => {
  const result = productionAlignmentValidation();
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.alignments[0].records.length, 3);
  result.alignments[0].records.forEach(record => {
    const curated = productionDataset().records.find(item => item.sourceAccession === record.sourceAccession);
    assert.strictEqual(record.alignedSequence.replace(/-/g, ''), curated.aminoAcidSequence);
  });
});

run('alignment length is calculated from validated aligned rows', () => {
  const result = productionAlignmentValidation();
  assert.strictEqual(result.alignments[0].alignmentLength, 480);
  assert.deepStrictEqual(result.alignments[0].records.map(record => record.alignedSequence.length), [480, 480, 480]);
});

run('duplicate aligned accessions are rejected', () => {
  const payload = validAlignmentPayload();
  payload.alignments[0].records[1].sourceAccession = payload.alignments[0].records[0].sourceAccession;
  const result = validateCuratedSequenceAlignments(payload, productionCuratedValidation());
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('Duplicate aligned source accession')));
});

run('unequal alignment lengths are rejected', () => {
  const payload = validAlignmentPayload();
  payload.alignments[0].records[0].alignedSequence += 'A';
  const result = validateCuratedSequenceAlignments(payload, productionCuratedValidation());
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('unequal aligned sequence lengths')));
});

run('invalid alignment symbols are rejected', () => {
  const payload = validAlignmentPayload();
  payload.alignments[0].records[0].alignedSequence = payload.alignments[0].records[0].alignedSequence.replace('M', '*');
  const result = validateCuratedSequenceAlignments(payload, productionCuratedValidation());
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('invalid alignment symbol')));
});

run('unknown aligned records and missing curated records are reported', () => {
  const payload = validAlignmentPayload();
  payload.alignments[0].records.pop();
  payload.alignments[0].records.push({ sourceAccession: 'UNKNOWN.1', alignedSequence: 'AAAA-' });
  const result = validateCuratedSequenceAlignments(payload, productionCuratedValidation());
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('UNKNOWN.1 is not present')));
  assert(result.errors.some(error => error.includes('missing curated source accession')));
});

run('ungapped alignment mismatch is rejected', () => {
  const payload = validAlignmentPayload();
  payload.alignments[0].records[0].alignedSequence = payload.alignments[0].records[0].alignedSequence.replace('M', 'A');
  const result = validateCuratedSequenceAlignments(payload, productionCuratedValidation());
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('ungapped aligned sequence does not match')));
});

run('empty alignment and unsupported alignment format version are rejected', () => {
  let result = validateCuratedSequenceAlignments({ formatVersion: 1, alignments: [] }, productionCuratedValidation());
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('does not contain any alignments')));
  result = validateCuratedSequenceAlignments(validAlignmentPayload({ formatVersion: 99 }), productionCuratedValidation());
  assert.strictEqual(result.ok, false);
  assert(result.errors.some(error => error.includes('format version')));
});

run('alignment block helpers preserve gap characters and marker positions', () => {
  const result = productionAlignmentValidation();
  const aligned = result.alignments[0].records[0].alignedSequence;
  const rows = alignmentColumnRows(aligned, 60);
  assert.strictEqual(rows.length, 8);
  assert.strictEqual(rows[0].start, 1);
  assert.strictEqual(rows[0].end, 60);
  assert(rows[7].sequence.includes('-'));
  assert(alignmentMarkerLine(1, 'ABCDEFGHIJ').endsWith('|'));
});

run('alignment column helper reports ungapped reference positions without structure numbering assumptions', () => {
  const synthetic = 'A-C--DE';
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 0), 1);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 1), null);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 2), 2);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 3), null);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 5), 3);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 6), 4);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, -1), null);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 99), null);
});

run('alignment column helper handles leading and repeated gaps', () => {
  const synthetic = '--AB-C-D';
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 0), null);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 2), 1);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 3), 2);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 4), null);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 5), 3);
  assert.strictEqual(referencePositionForAlignmentColumn(synthetic, 7), 4);
});

run('alignment column statistics classify invariant non-gap columns', () => {
  const stats = alignmentColumnStatistics(['A', 'A', 'A']);
  assert.strictEqual(stats.totalSequences, 3);
  assert.strictEqual(stats.residueCount, 3);
  assert.strictEqual(stats.gapCount, 0);
  assert.strictEqual(stats.gapFrequency, 0);
  assert.strictEqual(stats.distinctResidueCount, 1);
  assert.strictEqual(stats.state, 'invariant among non-gap residues');
  assert.strictEqual(stats.frequencies[0].residue, 'A');
  assert.strictEqual(stats.frequencies[0].frequencyAmongAll, 1);
  assert.strictEqual(stats.frequencies[0].frequencyAmongResidues, 1);
});

run('alignment column statistics classify variable non-gap columns', () => {
  const stats = alignmentColumnStatistics(['A', 'V', 'L']);
  assert.strictEqual(stats.residueCount, 3);
  assert.strictEqual(stats.gapCount, 0);
  assert.strictEqual(stats.distinctResidueCount, 3);
  assert.strictEqual(stats.state, 'variable among non-gap residues');
  assert.deepStrictEqual(stats.frequencies.map(entry => entry.residue), ['A', 'L', 'V']);
});

run('alignment column statistics classify invariant-plus-gap columns and one residue plus gaps', () => {
  const stats = alignmentColumnStatistics(['A', '-', '-']);
  assert.strictEqual(stats.residueCount, 1);
  assert.strictEqual(stats.gapCount, 2);
  assert.strictEqual(stats.gapFrequency, 2 / 3);
  assert.strictEqual(stats.distinctResidueCount, 1);
  assert.strictEqual(stats.state, 'invariant residues plus one or more gaps');
  assert.strictEqual(stats.frequencies[0].frequencyAmongAll, 1 / 3);
  assert.strictEqual(stats.frequencies[0].frequencyAmongResidues, 1);
});

run('alignment column statistics classify variable-plus-gap columns', () => {
  const stats = alignmentColumnStatistics(['A', 'V', '-']);
  assert.strictEqual(stats.residueCount, 2);
  assert.strictEqual(stats.gapCount, 1);
  assert.strictEqual(stats.distinctResidueCount, 2);
  assert.strictEqual(stats.state, 'variable residues plus one or more gaps');
  assert.strictEqual(stats.frequencies.find(entry => entry.residue === 'A').frequencyAmongAll, 1 / 3);
  assert.strictEqual(stats.frequencies.find(entry => entry.residue === 'A').frequencyAmongResidues, 1 / 2);
});

run('alignment column statistics classify all-gap columns', () => {
  const stats = alignmentColumnStatistics(['-', '-', '-']);
  assert.strictEqual(stats.totalSequences, 3);
  assert.strictEqual(stats.residueCount, 0);
  assert.strictEqual(stats.gapCount, 3);
  assert.strictEqual(stats.gapFrequency, 1);
  assert.strictEqual(stats.distinctResidueCount, 0);
  assert.strictEqual(stats.state, 'all gaps');
  assert.deepStrictEqual(stats.frequencies, []);
  assert.deepStrictEqual(stats.propertyGroups, []);
});

run('alignment column statistics group biochemical properties and ambiguous symbols', () => {
  const stats = alignmentColumnStatistics(['A', 'F', 'S', 'K', 'D', 'G', 'X', '-']);
  assert.strictEqual(stats.totalSequences, 8);
  assert.strictEqual(stats.residueCount, 7);
  assert.strictEqual(stats.gapCount, 1);
  assert.deepStrictEqual(stats.propertyGroups.map(group => group.label), [
    'nonpolar aliphatic',
    'aromatic',
    'polar uncharged',
    'positively charged',
    'negatively charged',
    'special structural cases'
  ]);
  assert.deepStrictEqual(stats.unsupportedResidues, [{ residue: 'X', count: 1 }]);
  assert.strictEqual(residuePropertyCategory('A').label, 'nonpolar aliphatic');
  assert.strictEqual(residuePropertyCategory('X'), null);
});

run('biochemical property category memberships match documented teaching groups', () => {
  const memberships = Object.fromEntries(BIOCHEMICAL_PROPERTY_CATEGORIES.map(group => [group.label, group.residues.join('')]));
  assert.deepStrictEqual(memberships, {
    'nonpolar aliphatic': 'AVLIM',
    aromatic: 'FYW',
    'polar uncharged': 'STNQ',
    'positively charged': 'KRH',
    'negatively charged': 'DE',
    'special structural cases': 'GPC'
  });
});

run('alignment column statistics can be calculated directly from aligned records', () => {
  const records = [
    { alignedSequence: 'A-C' },
    { alignedSequence: 'AVC' },
    { alignedSequence: 'A-C' }
  ];
  assert.strictEqual(alignmentColumnStatisticsForRecords(records, 0).state, 'invariant among non-gap residues');
  assert.strictEqual(alignmentColumnStatisticsForRecords(records, 1).state, 'invariant residues plus one or more gaps');
  assert.strictEqual(alignmentColumnStatisticsForRecords(records, 2).state, 'invariant among non-gap residues');
});

run('Atlas conservation scoring uses documented weights', () => {
  assert.deepStrictEqual(ALIGNMENT_CONSERVATION_SCORE_CONFIG, {
    identityWeight: 0.7,
    propertySimilarityWeight: 0.3
  });
});

run('Atlas conservation scoring handles fully identical non-gap columns', () => {
  const summary = alignmentColumnConservationSummary(['A', 'A', 'A']);
  assert.strictEqual(summary.identityScore, 1);
  assert.strictEqual(summary.propertySimilarityScore, 1);
  assert.strictEqual(summary.gapCoverage, 1);
  assert.strictEqual(summary.finalScore, 1);
  assert.strictEqual(summary.scoreBand, 'very high similarity in this dataset');
  assert.strictEqual(summary.mostCommonResidue.residue, 'A');
  assert.strictEqual(summary.mostCommonProperty.label, 'nonpolar aliphatic');
});

run('Atlas conservation scoring handles chemically similar nonidentical residues', () => {
  const summary = alignmentColumnConservationSummary(['A', 'V', 'L']);
  assert.strictEqual(summary.identityScore, 1 / 3);
  assert.strictEqual(summary.propertySimilarityScore, 1);
  assert.strictEqual(summary.gapCoverage, 1);
  assert(Math.abs(summary.finalScore - ((0.7 * (1 / 3)) + 0.3)) < 1e-12);
  assert.strictEqual(summary.scoreBand, 'moderate similarity in this dataset');
});

run('Atlas conservation scoring handles chemically dissimilar residues', () => {
  const summary = alignmentColumnConservationSummary(['A', 'D', 'K']);
  assert.strictEqual(summary.identityScore, 1 / 3);
  assert.strictEqual(summary.propertySimilarityScore, 1 / 3);
  assert.strictEqual(summary.gapCoverage, 1);
  assert(Math.abs(summary.finalScore - (1 / 3)) < 1e-12);
  assert.strictEqual(summary.scoreBand, 'low similarity in this dataset');
});

run('Atlas conservation scoring applies gap coverage to invariant columns with gaps', () => {
  const summary = alignmentColumnConservationSummary(['A', 'A', '-']);
  assert.strictEqual(summary.identityScore, 1);
  assert.strictEqual(summary.propertySimilarityScore, 1);
  assert.strictEqual(summary.gapCoverage, 2 / 3);
  assert(Math.abs(summary.finalScore - (2 / 3)) < 1e-12);
});

run('Atlas conservation scoring handles variable columns with gaps', () => {
  const summary = alignmentColumnConservationSummary(['A', 'V', '-']);
  assert.strictEqual(summary.identityScore, 1 / 2);
  assert.strictEqual(summary.propertySimilarityScore, 1);
  assert.strictEqual(summary.gapCoverage, 2 / 3);
  assert(Math.abs(summary.finalScore - ((2 / 3) * ((0.7 * 0.5) + 0.3))) < 1e-12);
});

run('Atlas conservation scoring handles one residue plus gaps and all-gap columns', () => {
  const oneResidue = alignmentColumnConservationSummary(['A', '-', '-']);
  assert.strictEqual(oneResidue.identityScore, 1);
  assert.strictEqual(oneResidue.propertySimilarityScore, 1);
  assert.strictEqual(oneResidue.gapCoverage, 1 / 3);
  assert(Math.abs(oneResidue.finalScore - (1 / 3)) < 1e-12);
  const allGap = alignmentColumnConservationSummary(['-', '-', '-']);
  assert.strictEqual(allGap.identityScore, null);
  assert.strictEqual(allGap.propertySimilarityScore, null);
  assert.strictEqual(allGap.gapCoverage, 0);
  assert.strictEqual(allGap.finalScore, null);
  assert.strictEqual(allGap.scoreBand, 'unavailable: no amino-acid residues');
});

run('Atlas conservation scoring keeps ambiguous symbols outside property categories', () => {
  const summary = alignmentColumnConservationSummary(['X', 'A', '-']);
  assert.strictEqual(summary.identityScore, 1 / 2);
  assert.strictEqual(summary.propertySimilarityScore, 1 / 2);
  assert.strictEqual(summary.gapCoverage, 2 / 3);
  assert(Math.abs(summary.finalScore - ((2 / 3) * ((0.7 * 0.5) + (0.3 * 0.5)))) < 1e-12);
  assert.deepStrictEqual(summary.stats.unsupportedResidues, [{ residue: 'X', count: 1 }]);
});

run('Atlas conservation score bands use documented boundaries', () => {
  assert.strictEqual(conservationScoreBand(1), 'very high similarity in this dataset');
  assert.strictEqual(conservationScoreBand(0.9), 'very high similarity in this dataset');
  assert.strictEqual(conservationScoreBand(0.89), 'high similarity in this dataset');
  assert.strictEqual(conservationScoreBand(0.7), 'high similarity in this dataset');
  assert.strictEqual(conservationScoreBand(0.69), 'moderate similarity in this dataset');
  assert.strictEqual(conservationScoreBand(0.4), 'moderate similarity in this dataset');
  assert.strictEqual(conservationScoreBand(0.39), 'low similarity in this dataset');
  assert.strictEqual(conservationScoreBand(null), 'unavailable: no amino-acid residues');
});

run('full-alignment conservation score array matches validated alignment length', () => {
  const result = productionAlignmentValidation();
  const alignment = result.alignments[0];
  const scores = fullAlignmentConservationScores(alignment.records);
  assert.strictEqual(scores.length, alignment.alignmentLength);
  assert.strictEqual(scores[0].columnIndex, 0);
  assert(scores.every(score => score.stats.totalSequences === alignment.records.length));
});

run('Atlas conservation scoring can be calculated directly from aligned records', () => {
  const records = [
    { alignedSequence: 'AVL-' },
    { alignedSequence: 'A-L-' },
    { alignedSequence: 'V-D-' }
  ];
  assert.strictEqual(alignmentColumnConservationSummaryForRecords(records, 0).scoreBand, 'high similarity in this dataset');
  assert.strictEqual(alignmentColumnConservationSummaryForRecords(records, 1).scoreBand, 'low similarity in this dataset');
  assert.strictEqual(alignmentColumnConservationSummaryForRecords(records, 2).scoreBand, 'moderate similarity in this dataset');
  assert.strictEqual(alignmentColumnConservationSummaryForRecords(records, 3).scoreBand, 'unavailable: no amino-acid residues');
});

run('Alignment View UI preserves structure behavior and avoids clickable mapping', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('Alignment View'));
  assert(indexHtml.includes('Alignment position, reference-sequence position, and structure residue number are different numbering systems.'));
  assert(indexHtml.includes('No structure residue mapping is active in this view.'));
  assert(indexHtml.includes('data-mode="overview">Structure</button>'));
  assert(indexHtml.includes('data-mode="sequence">Sequence</button>'));
  assert(!indexHtml.includes('data-alignment-residue-index'));
  assert(!indexHtml.includes('selectTorsionIndex(Number(cell.dataset.alignmentColumn))'));
});

run('Alignment View controls are accessible radio controls', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('role="radiogroup" aria-label="Sequence explorer view"'));
  assert(indexHtml.includes('name="sequenceView"'));
  assert(indexHtml.includes('Sequence Overview'));
  assert(indexHtml.includes('Alignment View'));
});

run('Alignment View supports hover and persistent alignment column selection', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('selectedAlignmentColumnIndex: null'));
  assert(indexHtml.includes('data-alignment-column='));
  assert(indexHtml.includes('applyAlignmentColumnHover'));
  assert(indexHtml.includes("addEventListener('mouseover'"));
  assert(indexHtml.includes("addEventListener('mouseout'"));
  assert(indexHtml.includes('aria-pressed='));
  assert(indexHtml.includes('Alignment Column Details'));
});

run('Alignment View column controls include previous next clear and jump behavior', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('data-alignment-column-nav="previous"'));
  assert(indexHtml.includes('data-alignment-column-nav="next"'));
  assert(indexHtml.includes('data-alignment-column-nav="clear"'));
  assert(indexHtml.includes('id="alignmentColumnJump"'));
  assert(indexHtml.includes('data-alignment-column-jump'));
  assert(indexHtml.includes('alignment.alignmentLength - 1'));
});

run('Alignment View includes an accessible selectable conservation track', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  [
    'Atlas score track',
    'alignment-track-cell',
    'fullAlignmentConservationScores',
    'data-gap=',
    'G = gap present',
    'Atlas conservation score',
    'data-alignment-column="${summary.columnIndex}"'
  ].forEach(text => assert(indexHtml.includes(text), `Missing conservation track text: ${text}`));
});

run('Alignment View clears selected column when dataset changes', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('state.selectedAlignmentColumnIndex = null;'));
  assert(indexHtml.includes("document.getElementById('curatedSequenceDataset').addEventListener('change'"));
});

run('Alignment Column Details displays accession, aligned character, gaps, and reference positions', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  [
    'Source accession',
    'Aligned character',
    'Character type',
    'Corresponding ungapped reference-sequence position',
    'Gap; no amino acid at this alignment column',
    'No ungapped reference-sequence position',
    'referencePositionForAlignmentColumn'
  ].forEach(text => assert(indexHtml.includes(text), `Missing alignment detail text: ${text}`));
});

run('Alignment Column Details displays descriptive statistics and educational cautions', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  [
    'Column Summary',
    'Residue Frequencies',
    'Biochemical Property Summary',
    'Frequency among all aligned sequences',
    'Frequency among non-gap residues only',
    'The current dataset contains only',
    'These values summarize only the sequences included in this curated dataset; they are not estimates of all possible',
    'An invariant column in a small dataset is not by itself evidence that the position is functionally essential.',
    'Residues with similar biochemical properties can still differ in structure, reactivity, and biological role.',
    'Ambiguous or unsupported symbols'
  ].forEach(text => assert(indexHtml.includes(text), `Missing alignment statistic text: ${text}`));
});

run('Alignment Column Details displays transparent Atlas conservation scoring', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  [
    'Conservation Summary',
    'Most common residue',
    'Identity score',
    'Most common property category',
    'Property similarity score',
    'Gap coverage',
    'Final conservation score',
    'Worked calculation',
    'Final conservation score = gap coverage x',
    'This is an educational scoring model used by this Atlas, not a universal standard for sequence conservation.',
    'How to read this column',
    'Treat the score as evidence from this dataset, not proof of function.',
    'High similarity can suggest evolutionary constraint, but it does not by itself establish catalytic, structural, or regulatory importance.',
    'Low similarity does not necessarily mean that a position is unimportant.',
    'With only ${stats.totalSequences} sequences'
  ].forEach(text => assert(indexHtml.includes(text), `Missing conservation summary text: ${text}`));
});

run('Alignment Column Details avoids structure mapping and functional claims', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = indexHtml.indexOf('function renderAlignmentColumnDetails');
  const end = indexHtml.indexOf('function renderAlignmentView');
  const detailsRenderer = indexHtml.slice(start, end);
  assert(!/functionally important|evolutionarily essential|active-site|adaptation|BLOSUM|PAM|consensus|entropy/i.test(detailsRenderer));
  assert(!/structure residue number|sequence-to-structure mapping/i.test(detailsRenderer));
  assert(detailsRenderer.includes('alignmentColumnStatisticsForRecords'));
  assert(detailsRenderer.includes('alignmentColumnConservationSummaryForRecords'));
});
