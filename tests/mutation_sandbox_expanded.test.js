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

function bodySlice(functionName, nextFunctionName) {
  const start = html.indexOf(`function ${functionName}(`);
  assert.notStrictEqual(start, -1, `${functionName} should exist`);
  const end = nextFunctionName ? html.indexOf(`function ${nextFunctionName}(`, start) : start + 5000;
  return html.slice(start, end === -1 ? start + 5000 : end);
}

test('Mutation Sandbox exposes qualitative substitution controls and prediction prompts', () => {
  assert(html.includes('id="mutationResidueSelect"'));
  assert(html.includes('id="mutationSubstitutionSelect"'));
  assert(html.includes('id="mutationPredictionInput"'));
  assert(html.includes('id="mutationRevisionInput"'));
  assert(html.includes('formulate and revise a prediction') || html.includes('formulate and revise'));
});

test('Mutation Sandbox compares biochemical properties without quantitative overclaiming', () => {
  assert(html.includes('const mutationPropertyData'));
  ['sizeScore', 'polarity', 'charge', 'hbond', 'hydrophobicity'].forEach(term => assert(html.includes(term)));
  assert(html.includes('not a quantitative stability prediction'));
  assert(html.includes('does not calculate ΔΔG') || html.includes('does not calculate'));
  const comparison = bodySlice('mutationPropertyComparison', 'renderMutationPropertyTable');
  assert(comparison.includes('Approximate size'));
  assert(comparison.includes('Charge near pH 7'));
  assert(comparison.includes('Hydrogen bonding'));
});

test('Mutation Sandbox detects nearby contacts and possible steric conflicts cautiously', () => {
  const contacts = bodySlice('mutationNearbyContacts', 'mutationPotentialClashes');
  assert(contacts.includes('residueContactList'));
  assert(contacts.includes('allHeterogenGroups'));
  assert(contacts.includes('4.5'));
  const clashes = bodySlice('mutationPotentialClashes', 'mutationReasoningSummary');
  assert(clashes.includes('sizeScore'));
  assert(clashes.includes('3.4'));
  assert(html.includes('possible clashes are simple size-and-distance flags'));
});

test('Mutation Sandbox syncs curated presets with shared residue selection', () => {
  const sync = bodySlice('syncMutationPresetToControls', 'populateMutationControls');
  assert(sync.includes('mutationPresetSpec'));
  assert(sync.includes('state.mutationResidueKey'));
  assert(sync.includes('state.mutationSubstitution'));
  const listeners = html.slice(html.indexOf("document.getElementById('mutationSelect')"));
  assert(listeners.includes('syncMutationPresetToControls(true)'));
  assert(listeners.includes('state.selectedResidueIndex = state.residues.indexOf(residue)'));
});

test('Mutation Sandbox integrates with shared evidence cards', () => {
  const observations = bodySlice('quantitativeObservations', 'currentViewImageDataUrl');
  assert(observations.includes('mutationModel'));
  assert(observations.includes('mutationNearbyContacts'));
  assert(observations.includes('mutationPotentialClashes'));
  assert(observations.includes('mutationPrediction'));
  assert(observations.includes('mutationRevision'));
});

test('Mutation Sandbox works without WebGL for non-3D reasoning', () => {
  const draw = bodySlice('drawMutation', 'drawGenericMutationScan');
  assert(draw.includes('if (!hasViewer())'));
  assert(draw.includes('renderMutationEvidence()'));
  assert(draw.includes('3D highlighting unavailable'));
  const apply = bodySlice('applyMode', 'escapeHtml');
  assert(apply.includes("if (state.mode === 'mutation') drawMutation()"));
});

test('Mutation Sandbox has keyboard-operable native controls', () => {
  assert(html.includes("document.getElementById('mutationResidueSelect').addEventListener('change'"));
  assert(html.includes("document.getElementById('mutationSubstitutionSelect').addEventListener('change'"));
  assert(html.includes("document.getElementById('mutationPredictionInput').addEventListener('input'"));
  assert(html.includes('role="tab"'));
  assert(html.includes('activateButtonFromKeyboard'));
});

console.log('Expanded Mutation Sandbox checks passed.');
