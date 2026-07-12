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
  BIOCHEMICAL_PROPERTY_CATEGORIES
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
    'These values summarize only the sequences included in this curated dataset; they are not estimates of all RbcL proteins.',
    'An invariant column in a small dataset is not by itself evidence that the position is functionally essential.',
    'Residues with similar biochemical properties can still differ in structure, reactivity, and biological role.',
    'Ambiguous or unsupported symbols'
  ].forEach(text => assert(indexHtml.includes(text), `Missing alignment statistic text: ${text}`));
});

run('Alignment Column Details avoids formal conservation classification and structure mapping', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = indexHtml.indexOf('function renderAlignmentColumnDetails');
  const end = indexHtml.indexOf('function renderAlignmentView');
  const detailsRenderer = indexHtml.slice(start, end);
  assert(!/conserved|conservation score|entropy|BLOSUM|PAM|consensus/i.test(detailsRenderer));
  assert(!/structure residue number|sequence-to-structure mapping/i.test(detailsRenderer));
  assert(detailsRenderer.includes('alignmentColumnStatisticsForRecords'));
});
