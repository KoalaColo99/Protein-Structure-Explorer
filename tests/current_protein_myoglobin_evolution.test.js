const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function loadBrowserScript(relativePath, sandbox) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  vm.runInNewContext(source, sandbox, { filename: relativePath });
}

function bodyOf(functionName) {
  const start = html.indexOf(`function ${functionName}(`);
  assert(start >= 0, `${functionName} missing`);
  const next = html.indexOf('\n    function ', start + 1);
  return html.slice(start, next >= 0 ? next : start + 5000);
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const sandbox = { window: {} };
loadBrowserScript('data/myoglobin_current_protein_evolution.js', sandbox);
const validation = require(path.join(root, 'myoglobin_evolution_validation.js'));
const dataset = sandbox.window.BVA_CURRENT_MYOGLOBIN_EVOLUTION;

test('1MBN checkpoint dataset resolves to P02185 with explicit 154-to-153 mapping', () => {
  assert.strictEqual(dataset.reference.pdbId, '1MBN');
  assert.strictEqual(dataset.reference.chain, 'A');
  assert.strictEqual(dataset.reference.entityId, '1');
  assert.strictEqual(dataset.reference.accession, 'P02185');
  assert.strictEqual(dataset.reference.canonicalLength, 154);
  assert.strictEqual(dataset.reference.modeledResidues, 153);
  assert(dataset.reference.mappingNote.includes('positions 2-154 to PDB residues 1-153'));
});

test('eight verified myoglobin sequences are present and validate', () => {
  const result = validation.validateMyoglobinEvolutionDataset(dataset);
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(dataset.records.length, 8);
  assert(dataset.records.every(record => record.reviewed === true));
  assert(dataset.records.every(record => /myoglobin/i.test(record.proteinName)));
  assert.strictEqual(new Set(dataset.records.map(record => record.organism)).size, 8);
});

test('candidate table includes required inspection columns and fallback label', () => {
  assert(html.includes('id="evolutionCandidatePanel"'));
  const render = bodyOf('renderCurrentProteinCandidateTable');
  [
    'UniProt accession',
    'Protein name',
    'Organism and group',
    'Identity to P02185',
    'Reference coverage',
    'Family evidence',
    'PDB structure',
    'Inclusion reason'
  ].forEach(label => assert(render.includes(label), `${label} missing`));
  assert(render.includes('Using the validated teaching dataset because live homolog retrieval is unavailable.'));
  assert(render.includes('data-myoglobin-candidate'));
});

test('live learn conservation route enters the protein evolution pathway', () => {
  const read = bodyOf('readStudentRouteFromUrl');
  assert(read.includes("state.studentMode === 'learn' && mode === 'conservation'"));
  assert(read.includes("state.activePathway = 'protein_evolution'"));
  assert(read.includes("state.mode = 'conservation'"));
});

test('validated precomputed alignment renders eight 154-column records', () => {
  assert.strictEqual(dataset.alignment.records.length, 8);
  assert.strictEqual(dataset.alignment.alignmentLength, 154);
  assert(dataset.alignment.method.includes('Validated precomputed'));
  dataset.alignment.records.forEach(record => {
    const raw = dataset.records.find(item => item.accession === record.accession);
    assert(raw, `${record.accession} raw record missing`);
    assert.strictEqual(record.alignedSequence.replace(/-/g, ''), raw.sequence);
    assert.strictEqual(record.alignedSequence.length, 154);
  });
  const render = bodyOf('renderCurrentProteinAlignment');
  assert(render.includes('P02185 canonical position'));
  assert(render.includes('1MBN PDB residue'));
  assert(render.includes('Consensus'));
});

test('clicking an aligned P02185 residue maps to shared 1MBN residue selection', () => {
  const mapping = bodyOf('pdbResidueForP02185CanonicalPosition');
  assert(mapping.includes('canonicalPosition < 2'));
  assert(mapping.includes('return canonicalPosition - 1'));
  const select = bodyOf('selectCurrentProteinAlignmentColumn');
  assert(select.includes("record.accession === dataset.reference.accession") || html.includes("record.accession === dataset.reference.accession"));
  assert(select.includes('state.selectedResidueIndex = residueIndex'));
  assert(select.includes("residue.chain === 'A' && residue.resi === pdbResidue"));
  assert(select.includes('Present in the canonical sequence but absent from this experimental structure.'));
  assert(html.includes("document.getElementById('currentProteinAlignmentPanel').addEventListener('click'"));
});

test('shared Viridis-style color model has the required bins and labels', () => {
  const model = bodyOf('conservationVisualModel');
  [
    '#B8B8B8',
    '#FDE725',
    '#90D743',
    '#35B779',
    '#21918C',
    '#3B528B',
    '#440154',
    'Highly variable',
    'Variable',
    'Moderately conserved',
    'Conserved',
    'Highly conserved',
    'Invariant in this alignment',
    'Insufficient evidence'
  ].forEach(token => assert(model.includes(token), `${token} missing from shared color model`));
  assert(model.includes('score < 0.2'));
  assert(model.includes('score < 0.4'));
  assert(model.includes('score < 0.6'));
  assert(model.includes('score < 0.8'));
  assert(model.includes('score === 1'));
});

test('alignment and structure use the same conservation visual model', () => {
  const alignment = bodyOf('renderCurrentProteinAlignment');
  const structure = bodyOf('applyCurrentProteinStructureColoring');
  const legacy = bodyOf('conservationColor');
  assert(alignment.includes('conservationVisualModel'));
  assert(structure.includes('conservationVisualModel'));
  assert(legacy.includes('conservationVisualModel'));
  assert(alignment.includes('style="background:${background};color:${foreground};border:${border}'));
  assert(alignment.includes('open-circle') || alignment.includes('○'));
});

test('exact identity excludes gaps and insufficient evidence requires three contributors', () => {
  const metric = bodyOf('currentProteinColumnMetric');
  assert(metric.includes("residues.filter(char => /^[ACDEFGHIKLMNPQRSTVWY]$/.test(char))"));
  assert(metric.includes('exactMatches / contributing'));
  assert(metric.includes('contributing >= 3'));
  const shannon = bodyOf('shannonConservationScore');
  assert(shannon.includes('contributingCount < 3'));
  assert(shannon.includes('1 - entropy / Math.log(20)'));
});

test('current-protein controls switch metrics and do not change the alignment set', () => {
  assert(html.includes('id="currentProteinColorBy"'));
  assert(html.includes('Conservation score'));
  assert(html.includes('Exact identity'));
  assert(html.includes('Amino-acid properties'));
  assert(html.includes('Secondary structure'));
  assert(html.includes('Uniform structure color'));
  assert(html.includes("document.getElementById('currentProteinColorBy').addEventListener('change'"));
  const handler = html.slice(html.indexOf("document.getElementById('currentProteinColorBy').addEventListener('change'"), html.indexOf("document.getElementById('showCurrentConservationMap')"));
  assert(handler.includes('state.currentProteinColorBy = event.target.value'));
  assert(!handler.includes('selectedMyoglobinEvolutionAccessions ='));
});

test('conservation coloring maps P02185 positions to 1MBN residues and preserves heme', () => {
  const mapping = bodyOf('pdbResidueForP02185CanonicalPosition');
  assert(mapping.includes('canonicalPosition < 2'));
  assert(mapping.includes('return canonicalPosition - 1'));
  const structure = bodyOf('applyCurrentProteinStructureColoring');
  assert(structure.includes('metricsByResidue.get(residue.resi)'));
  assert(structure.includes("state.viewer.setStyle({ resn: 'HEM' }"));
  assert(structure.includes('addResidueLabel(selectedResidue,'));
});

test('selected residue interpretation and exports include active metric details', () => {
  const info = bodyOf('renderCurrentProteinResidueInfo');
  ['alignment column', 'UniProt position', 'PDB residue number', 'Exact identity', 'Conservation score', 'Gap fraction', 'Residue-frequency distribution', 'This score describes the selected homolog set and alignment'].forEach(token => assert(info.includes(token), `${token} missing from residue info`));
  const csv = bodyOf('currentProteinConservationCsv');
  ['alignment column', 'reference residue', 'UniProt position', 'PDB residue number', 'contributing sequence count', 'exact identity', 'conservation score', 'gap fraction', 'classification', 'hex color', 'mapping status'].forEach(token => assert(csv.includes(token), `${token} missing from CSV export`));
  const provenance = bodyOf('currentProteinConservationProvenance');
  assert(provenance.includes('selectedMetric'));
  assert(provenance.includes('palette'));
  assert(provenance.includes('Normalized Shannon conservation'));
});

test('current-protein conservation colors are now active for validated 1MBN data', () => {
  const render = bodyOf('renderCurrentProteinEvolution');
  assert(render.includes('Refresh Conservation Colors'));
  assert(render.includes('Checkpoint reached'));
  const draw = bodyOf('drawConservation');
  assert(draw.includes('applyCurrentProteinStructureColoring(teachingDataset)'));
});

console.log('Current-protein myoglobin evolution checkpoint checks passed.');
