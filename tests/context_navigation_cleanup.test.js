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

test('Rubisco is separated into a curated case-study group with the requested label', () => {
  const currentProteinGroup = sliceBetween('<h2>Explore Current Protein</h2>', '<h2>Explore Chemical Properties</h2>');
  assert(!currentProteinGroup.includes('Rubisco'));
  assert(html.includes('<h2>Curated Case Studies</h2>'));
  assert(html.includes('data-mode="sequence">Open Rubisco Evolution Case Study</button>'));
});

test('Explore navigation groups contain the requested tools only', () => {
  const currentProtein = sliceBetween('<h2>Explore Current Protein</h2>', '<h2>Explore Chemical Properties</h2>');
  ['Structure', 'Ramachandran', 'Backbone H-bonds', 'Side-chain Interactions', 'Helix Patterns', 'Beta / Topology', 'Solvent Access', 'Hydrophobic Core'].forEach(label => assert(currentProtein.includes(label), `${label} missing from current protein group`));
  assert(!currentProtein.includes('pH & Charge'));
  const chemistry = sliceBetween('<h2>Explore Chemical Properties</h2>', '<h2>Explore Structure–Function</h2>');
  ['pH & Charge', 'Chemistry Lens', 'Charge Surface'].forEach(label => assert(chemistry.includes(label), `${label} missing from chemistry group`));
  assert(!chemistry.includes('Mutation Sandbox'));
  assert(!chemistry.includes('Guided Lesson'));
  const structureFunction = sliceBetween('<h2>Explore Structure–Function</h2>', '<h2>Curated Case Studies</h2>');
  assert(structureFunction.includes('Mutation Sandbox'));
});

test('Rubisco case study has its own context and return-to-workspace behavior', () => {
  assert(html.includes('Case study:</strong> Rubisco RbcL Evolution'));
  assert(html.includes('Reference sequence:</strong>'));
  assert(html.includes('Structure workspace preserved:</strong>'));
  assert(html.includes('id="returnToProteinWorkspace"'));
  assert(html.includes('Return to ${state.structureLabel} workspace'));
  assert(html.includes('function preserveProteinWorkspace'));
  assert(html.includes('function returnToProteinWorkspace'));
  const context = bodyOf('updateLearningContext');
  assert(context.includes("state.mode === 'sequence'"));
  assert(context.includes("contextPrimaryLabel')"));
  assert(context.includes('Rubisco RbcL Evolution'));
  assert(context.includes('rubiscoReferenceSequenceLabel()'));
});

test('initial selected residue is visibly None and measurements ask for selection', () => {
  assert(html.includes('selectedResidueIndex: null'));
  assert(html.includes('Selected residue</span><strong id="contextResidue">None</strong>'));
  const currentResidue = bodyOf('currentResidue');
  assert(currentResidue.includes('if (!hasLearnerSelectedResidue()) return null'));
  const observations = bodyOf('quantitativeObservations');
  assert(observations.includes('Select a residue to calculate'));
  const card = bodyOf('renderMolecularEvidenceCard');
  assert(card.includes('None selected'));
  const torsion = bodyOf('drawTorsion');
  assert(torsion.includes('No residue selected'));
});

test('Learn front door hides empty pathway controls until selected', () => {
  assert(html.includes('<section class="pathway-panel hidden" id="pathwayPanel"'));
  const render = bodyOf('renderStudentModeControls');
  assert(render.includes("state.studentMode === 'learn' && state.activePathway"));
  const context = bodyOf('updateLearningContext');
  assert(context.includes('None selected'));
});

test('evolution pathway wording identifies Rubisco as the curated example', () => {
  assert(html.includes('How can protein sequences reveal evolution?'));
  assert(html.includes('Curated example: Rubisco RbcL evolution'));
  assert(html.includes('Explore the Rubisco evolution case study'));
  assert(html.includes('Investigate conservation in the current protein'));
  assert(!html.includes('How has this protein evolved?'));
});

test('viewer recovery controls are consolidated and use specific labels', () => {
  assert(html.includes('Retry 3D Viewer'));
  assert(html.includes('Reload Structure Coordinates'));
  assert(html.includes('3D viewer unavailable. ${state.structureLabel} (${state.structureId}) coordinates loaded successfully. Two-dimensional analyses remain available.'));
  const update = bodyOf('updateSystemStatus');
  assert(update.includes("recovery?.classList.add('hidden')"));
  const fallback = bodyOf('showViewerFallback');
  assert(fallback.includes('data-retry-viewer'));
  assert(fallback.includes('data-retry-structure'));
});

test('context labels update across Learn Explore Analyze and Rubisco', () => {
  const context = bodyOf('updateLearningContext');
  assert(context.includes("modeLabel.textContent = state.studentMode === 'learn' ? 'Pathway' : 'Workspace'"));
  assert(context.includes("'Advanced analysis'"));
  assert(context.includes("'Open exploration'"));
  assert(context.includes("'Case study'"));
});

test('browser URL restoration preserves Rubisco and return routes', () => {
  const read = bodyOf('readStudentRouteFromUrl');
  assert(read.includes("if (mode === 'sequence') preserveProteinWorkspace()"));
  const enter = bodyOf('enterPathway');
  assert(enter.includes("mode === 'sequence') preserveProteinWorkspace()"));
  assert(html.includes("document.getElementById('returnToProteinWorkspace').addEventListener('click'"));
  assert(html.includes('writeStudentRoute(options.push !== false)'));
});

console.log('Context, labeling, and navigation cleanup checks passed.');
