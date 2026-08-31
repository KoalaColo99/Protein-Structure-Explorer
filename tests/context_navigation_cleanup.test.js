const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

function sliceBetween(startText, endText) {
  const start = html.indexOf(startText);
  assert(start >= 0, `${startText} missing`);
  const end = html.indexOf(endText, start);
  assert(end >= 0, `${endText} missing after ${startText}`);
  return html.slice(start, end);
}

function bodyOf(functionName) {
  const start = html.indexOf(`function ${functionName}(`);
  assert(start >= 0, `${functionName} missing`);
  const next = html.indexOf('\n    function ', start + 1);
  return html.slice(start, next >= 0 ? next : start + 5000);
}

test('Rubisco has no active navigation route or tool button', () => {
  assert(!html.includes('data-mode="sequence">Open Rubisco Evolution Case Study</button>'));
  assert(!html.includes('data-mode="sequence">Sequence Data</button>'));
  const currentProteinGroup = sliceBetween('<h2>Explore Current Protein</h2>', '<h2>Explore Chemical Properties</h2>');
  assert(!currentProteinGroup.includes('Rubisco'));
  const analyze = sliceBetween('<h2>Analyze &amp; Advanced Tools</h2>', '<h2>Data &amp; Export Readiness</h2>');
  assert(!analyze.includes('Rubisco'));
});

test('Rubisco appears only as a disabled future case study in the roadmap', () => {
  const roadmap = html.slice(html.indexOf('<h2>Development Roadmap</h2>'), html.indexOf('</div>', html.indexOf('<h2>Development Roadmap</h2>') + 350));
  assert(roadmap.includes('<button disabled>Rubisco Evolution Case Study<span class="coming-soon">Future development</span></button>'));
  assert(!roadmap.includes('data-mode="sequence"'));
});

test('evolution pathway is current-protein centered', () => {
  assert(html.includes('How has this protein evolved?'));
  assert(html.includes('Identify related proteins, compare their sequences, and map conserved positions onto the structure you are currently exploring.'));
  assert(html.includes('Resolve current protein identity'));
  assert(html.includes('Check homolog-set readiness'));
  assert(!html.includes('Explore the Rubisco evolution case study'));
  const pathwayBlock = html.slice(html.indexOf('protein_evolution:'), html.indexOf('const state'));
  assert(!pathwayBlock.includes("mode: 'sequence'"));
});

test('sequence route is rejected by URL and activity-state validation', () => {
  const safeMode = bodyOf('safeMode');
  assert(safeMode.includes("if (mode === 'sequence') return null"));
  const read = bodyOf('readStudentRouteFromUrl');
  assert(read.includes("mode !== 'sequence'"));
  const apply = bodyOf('applyMode');
  assert(apply.includes("state.mode === 'sequence'"));
  assert(apply.includes("state.mode = 'overview'"));
});

test('current-protein evolution identity model clears stale conservation state', () => {
  assert(html.includes('evolutionIdentity: {'));
  assert(html.includes('function resetCurrentProteinEvolution'));
  const reset = bodyOf('resetCurrentProteinEvolution');
  assert(reset.includes('state.conservation = []'));
  assert(reset.includes("reference: state.structureId"));
  const structureReset = bodyOf('resetStructureState');
  assert(structureReset.includes('resetCurrentProteinEvolution'));
});

test('Evolutionary Analysis exposes source-labeled readiness stages', () => {
  assert(html.includes('<h2>Evolutionary Analysis</h2>'));
  assert(html.includes('id="currentProteinEvolutionContext"'));
  assert(html.includes('id="evolutionStageList"'));
  assert(html.includes('RCSB PDB Data API'));
  assert(html.includes('RCSB Sequence Coordinates API'));
  assert(html.includes('UniProt REST API'));
  assert(html.includes('InterPro API'));
  assert(html.includes('NCBI CDD/CD-Search'));
});

test('conservation mapping is active only for validated current-protein prerequisites', () => {
  const render = bodyOf('renderCurrentProteinEvolution');
  assert(render.includes("computeButton.disabled = !teachingDataset"));
  assert(render.includes('Refresh Conservation Colors'));
  assert(render.includes('Conservation Mapping Disabled'));
  assert(render.includes('validated homolog set, MSA, and residue mapping'));
  const draw = bodyOf('drawConservation');
  assert(draw.includes('It will not substitute any unrelated curated dataset'));
  assert(draw.includes('applyCurrentProteinStructureColoring(teachingDataset)'));
});

test('initial selected residue remains visibly None', () => {
  assert(html.includes('selectedResidueIndex: null'));
  assert(html.includes('Selected residue</span><strong id="contextResidue">None</strong>'));
  const currentResidue = bodyOf('currentResidue');
  assert(currentResidue.includes('if (!hasLearnerSelectedResidue()) return null'));
});

test('Explore navigation groups keep the requested tool groupings', () => {
  const currentProtein = sliceBetween('<h2>Explore Current Protein</h2>', '<h2>Explore Chemical Properties</h2>');
  ['Structure', 'Ramachandran', 'Backbone H-bonds', 'Side-chain Interactions', 'Helix Patterns', 'Beta / Topology', 'Solvent Access', 'Hydrophobic Core'].forEach(label => assert(currentProtein.includes(label), `${label} missing from current protein group`));
  const chemistry = sliceBetween('<h2>Explore Chemical Properties</h2>', '<h2>Explore Structure–Function</h2>');
  ['pH & Charge', 'Chemistry Lens', 'Charge Surface'].forEach(label => assert(chemistry.includes(label), `${label} missing from chemistry group`));
  const structureFunction = sliceBetween('<h2>Explore Structure–Function</h2>', '<h2>Analyze &amp; Advanced Tools</h2>');
  assert(structureFunction.includes('Mutation Sandbox'));
});

console.log('Current-protein evolution and navigation cleanup checks passed.');
