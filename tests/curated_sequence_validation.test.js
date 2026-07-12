const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  normalizeSequence,
  validateCuratedSequenceSets
} = require('../curated_sequence_validation.js');

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

run('existing Structure Sequence behavior is still wired to shared residue selection', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexHtml.includes('const sequence = sequenceFromResidues(state.residues);'));
  assert(indexHtml.includes('button.dataset.sequenceIndex = index;'));
  assert(indexHtml.includes('selectTorsionIndex(Number(item.dataset.sequenceIndex));'));
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

run('Visual Evolution Explorer summarizes dataset title and sequence count', () => {
  globalThis.BVA_CURATED_SEQUENCE_SETS = undefined;
  require('../data/curated_sequence_sets.js');
  const result = validateCuratedSequenceSets(globalThis.BVA_CURATED_SEQUENCE_SETS);
  const dataset = result.datasets.find(item => item.datasetId === 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs');
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
  assert(indexHtml.includes('No curated dataset selected'));
  assert(indexHtml.includes('No reference sequences yet'));
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
