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
