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
  const end = nextFunctionName ? html.indexOf(`function ${nextFunctionName}(`, start) : start + 4000;
  return html.slice(start, end === -1 ? start + 4000 : end);
}

test('integrated stabilization pathway is present and frames folding as ensemble free energy', () => {
  assert(html.includes('id="stabilityGuidedCycle"'));
  assert(html.includes('Integrated Protein Stabilization Pathway'));
  assert(html.includes('ensemble free-energy difference'));
  assert(html.includes('not a checklist of independent bonds'));
  ['1. Select', '2. Predict', '3. Reveal', '4. Explain', '5. Feedback'].forEach(label => {
    assert(html.includes(label), `${label} missing`);
  });
});

test('pathway supports residue selection prediction reveal explanation and feedback', () => {
  assert(html.includes('id="stabilityResidueSelect"'));
  assert(html.includes('id="stabilityPrediction"'));
  assert(html.includes('id="revealStabilityEvidence"'));
  assert(html.includes('id="stabilityExplanation"'));
  assert(html.includes('id="checkStabilityExplanation"'));
  assert(html.includes('id="stabilityCycleFeedback"'));
});

test('interaction category toggles cover backbone side-chain solvent hydrophobic and salt evidence', () => {
  ['showStabilityBackbone', 'showStabilitySidechain', 'showStabilitySalt', 'showStabilityHydrophobic', 'showStabilitySolvent'].forEach(id => {
    assert(html.includes(`id="${id}"`), `${id} missing`);
  });
  const render = bodySlice('renderStabilityEvidenceCards', 'renderStabilityEvidenceTable');
  assert(render.includes('Backbone hydrogen bonds'));
  assert(render.includes('Side-chain polar contacts'));
  assert(render.includes('Salt bridges'));
  assert(render.includes('Hydrophobic core evidence'));
  assert(render.includes('Solvent access'));
});

test('whole-structure and focused atomic views are available and synchronized to selected residue', () => {
  assert(html.includes('name="stabilityView" value="whole"'));
  assert(html.includes('name="stabilityView" value="focus"'));
  const viewer = bodySlice('applyStabilityViewer', 'renderStabilityPathway');
  assert(viewer.includes("state.stabilityView === 'whole'"));
  assert(viewer.includes("state.stabilityView === 'focus'"));
  assert(viewer.includes('zoomViewerSafely(residueSpec(residue))'));
  const listener = html.slice(html.indexOf("document.getElementById('stabilityResidueSelect')"), html.indexOf("document.getElementById('paletteMode')"));
  assert(listener.includes('state.selectedResidueIndex = state.selectedStabilityResidueIndex'));
});

test('evidence cards and table distinguish detected contacts from measured energetic contributions', () => {
  assert(html.includes('Detected contacts are geometric evidence, not measured energetic contributions'));
  const table = bodySlice('renderStabilityEvidenceTable', 'applyStabilityViewer');
  assert(table.includes('not additive energetic contributions'));
  assert(table.includes('not a direct free energy'));
  assert(table.includes('Mutation effects depend on local context'));
});

test('threshold disclosures match the current contact and solvent algorithms', () => {
  const contacts = bodySlice('computeContacts', 'spherePoints');
  assert(contacts.includes('closestPair(polarAtoms(a), polarAtoms(b), 4.0)'));
  assert(contacts.includes('closestPair(polarAtoms(a), polarAtoms(b), 3.45)'));
  assert(contacts.includes('closestPair(carbonAtoms(a), carbonAtoms(b), 4.25)'));
  const thresholds = bodySlice('contactThresholds', 'residueSpec');
  assert(thresholds.includes("contact.type === 'hydrophobic' ? 4.25"));
  assert(thresholds.includes("contact.type === 'salt' ? 4.0"));
  assert(html.includes('rolling-water probe of 1.4 Å'));
  assert(html.includes('below 55 Å²'));
});

test('water ligand metal alternate conformer and missing atom handling are explicit', () => {
  ['watersNearResidue', 'ligandCountNearResidue', 'metalCountNearResidue', 'alternateConformerCount', 'missingBackboneAtoms'].forEach(name => {
    assert(html.includes(`function ${name}(`), `${name} missing`);
  });
  const cards = bodySlice('renderStabilityEvidenceCards', 'renderStabilityEvidenceTable');
  assert(cards.includes('Nearby waters'));
  assert(cards.includes('Nearby ligands/cofactors'));
  assert(cards.includes('Nearby metals'));
  assert(cards.includes('Alternate conformer atoms'));
  assert(cards.includes('Missing backbone atoms'));
  assert(html.includes('missing atoms are not invented'));
});

test('curated representative examples choose real residue evidence from the loaded structure', () => {
  assert(html.includes('data-stability-example="buriedHydrophobic"'));
  assert(html.includes('data-stability-example="saltBridge"'));
  assert(html.includes('data-stability-example="helixHbond"'));
  const choose = bodySlice('chooseStabilityExample', 'evaluateStabilityExplanation');
  assert(choose.includes("kind === 'buriedHydrophobic'"));
  assert(choose.includes("kind === 'saltBridge'"));
  assert(choose.includes("kind === 'helixHbond'"));
  assert(choose.includes('stabilityEvidenceForResidue(residue)'));
});

test('feedback branches target common stabilization misconceptions', () => {
  const feedback = bodySlice('evaluateStabilityExplanation');
  assert(feedback.includes('separated backbone secondary-structure evidence from side-chain tertiary contacts'));
  assert(feedback.includes('not making a special hydrophobic bond'));
  assert(feedback.includes('folded-vs-unfolded ensemble free-energy difference'));
  assert(feedback.includes('geometric evidence, not experimentally measured energetic contributions'));
  assert(feedback.includes('functional constraint may matter'));
});

test('tertiary contact panel degrades without requiring WebGL', () => {
  const draw = bodySlice('drawContacts', 'drawSelectedContact');
  assert(draw.includes('if (hasViewer())'));
  assert(draw.includes('renderStabilityPathway()'));
  assert(draw.includes("document.getElementById('contactCount').textContent"));
});

console.log('Protein stabilization guided learning checks passed.');
