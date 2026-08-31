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

function bodyOf(functionName) {
  const start = html.indexOf(`function ${functionName}(`);
  assert.notStrictEqual(start, -1, `${functionName} should exist`);
  const braceStart = html.indexOf('{', start);
  let depth = 0;
  for (let index = braceStart; index < html.length; index++) {
    if (html[index] === '{') depth++;
    if (html[index] === '}') depth--;
    if (depth === 0) return html.slice(braceStart + 1, index);
  }
  throw new Error(`Could not parse ${functionName}`);
}

test('guided Ramachandran pathway uses the Predict Manipulate Observe Explain Feedback cycle', () => {
  assert(html.includes('CHEM214 10-minute pathway: Predict -> Manipulate -> Observe -> Explain -> Feedback'));
  ['1. Predict', '2. Manipulate', '3. Observe', '4. Explain', '5. Feedback'].forEach(label => {
    assert(html.includes(label), `${label} missing from cycle`);
  });
  assert(html.includes('id="dihedralPrediction"'));
  assert(html.includes('id="dihedralExplanation"'));
  assert(html.includes('id="dihedralCycleFeedback"'));
});

test('phi psi and omega are defined by their atoms and bond axes', () => {
  assert(html.includes('C′(i-1)-N(i)-Cα(i)-C′(i)'));
  assert(html.includes('N(i)-Cα(i)-C′(i)-N(i+1)'));
  assert(html.includes('Cα(i)-C′(i)-N(i+1)-Cα(i+1)'));
  assert(html.includes('N-Cα bond'));
  assert(html.includes('Cα-C′ bond'));
  assert(html.includes('peptide C′-N bond'));
});

test('guided manipulation offers small and large phi and psi rotations', () => {
  ['phi:-10', 'phi:10', 'phi:60', 'psi:-10', 'psi:10', 'psi:60'].forEach(rotation => {
    assert(html.includes(`data-guided-dihedral="${rotation}"`), `${rotation} guided rotation missing`);
  });
  const apply = bodyOf('applyGuidedDihedralRotation');
  assert(apply.includes('adjustBackboneAngle(jointName, Number(delta)'));
  assert(apply.includes('queueRamaAnimation(before, state.backboneManipulator.currentAngles)'));
  assert(apply.includes('updateDihedralCycleFeedback()'));
});

test('3D structure angles plot position and data table are synchronized after changes', () => {
  const setAngleStart = html.indexOf('function setBackboneAngle(');
  const setAngleEnd = html.indexOf('function adjustBackboneAngle(', setAngleStart);
  const setAngle = html.slice(setAngleStart, setAngleEnd);
  assert(setAngle.includes('rebuildManipulatorCoordinates();'));
  assert(setAngle.includes('drawTorsion({ preserveView: options.preserveView !== false })'));
  assert(setAngle.includes('renderViewerSafely();'));
  const render = bodyOf('renderManipulatorUi');
  assert(render.includes('updateRamaDataTable(entry)'));
  assert(render.includes('updateStericConflictList(entry)'));
  const table = bodyOf('updateRamaDataTable');
  assert(table.includes('Native structure'));
  assert(table.includes('Hypothetical manipulated geometry'));
  assert(table.includes('formatAngle(row[1])'));
});

test('2D Ramachandran tools remain available when the 3D viewer is unavailable', () => {
  const drawStart = html.indexOf('function drawTorsion(');
  const drawEnd = html.indexOf('function residueHelixAssignment(', drawStart);
  const draw = html.slice(drawStart, drawEnd);
  assert(draw.includes('if (hasViewer())'));
  assert(draw.includes("document.getElementById('phiValue').textContent"));
  assert(!draw.includes('if (!hasViewer()) return'));
  assert(draw.includes('drawRamaPlot()'));
  const overlayStart = html.indexOf('function drawManipulatorOverlay(');
  const overlayEnd = html.indexOf('function drawTorsion(', overlayStart);
  const overlay = html.slice(overlayStart, overlayEnd);
  assert(overlay.includes('if (!hasViewer()) return'));
});

test('Ramachandran plot animates manipulated positions and distinguishes native from hypothetical geometry', () => {
  const draw = bodyOf('drawRamaPlot');
  assert(draw.includes('ramaAnimation'));
  assert(draw.includes('interpolateAngle(animation.from.phi'));
  assert(draw.includes('ctx.arc(nativeX, nativeY'));
  assert(draw.includes('ctx.lineTo(tempX + 8, tempY + 7)'));
  assert(draw.includes("ctx.fillText('native'"));
  assert(draw.includes("ctx.fillText('current'"));
  assert(html.includes('experimental coordinates are unchanged'));
});

test('terminal residues and missing atoms are handled explicitly', () => {
  const torsions = bodyOf('computeTorsions');
  assert(torsions.includes("const prev = residues[i - 1]"));
  assert(torsions.includes("const next = residues[i + 1]"));
  assert(torsions.includes("prev && prev.byName.get('C') && n && ca && c"));
  assert(torsions.includes("next && n && ca && c && next.byName.get('N')"));
  assert(torsions.includes(': null'));
  const availability = bodyOf('angleAvailabilityMessage');
  assert(availability.includes('N-terminus or chain break'));
  assert(availability.includes('C-terminus or chain break'));
  assert(availability.includes('ω unavailable'));
});

test('glycine and proline receive explicit interpretation', () => {
  const special = bodyOf('ramaSpecialResidueNote');
  assert(special.includes("residue.resn === 'GLY'"));
  assert(special.includes("residue.resn === 'PRO'"));
  const category = bodyOf('ramaRegionCategory');
  assert(category.includes('Glycine-accessible left-handed region'));
  assert(html.includes('Glycine is less sterically restricted'));
  assert(html.includes('proline is more restricted'));
});

test('empirical plot regions are labeled as favored allowed or teaching approximations', () => {
  const category = bodyOf('ramaRegionCategory');
  assert(category.includes('Favored alpha-helical region'));
  assert(category.includes('Favored beta-strand / extended region'));
  assert(category.includes('Allowed 3-10 helix-like region'));
  assert(category.includes('Outside common teaching regions'));
  assert(html.includes('empirical teaching regions, not universal energetic laws'));
  assert(html.includes('classroom approximations based on common empirical distributions'));
});

test('steric conflict observations identify approaching atoms without claiming global stability', () => {
  const conflict = bodyOf('updateStericConflictList');
  assert(conflict.includes('localStericClashes'));
  assert(conflict.includes('Atoms approaching conflict'));
  assert(conflict.includes('teaching threshold'));
  assert(conflict.includes('does not prove the conformation is globally stable'));
});

test('reset and undo are available from the guided pathway', () => {
  assert(html.includes('id="resetGuidedDihedral"'));
  assert(html.includes('id="undoGuidedDihedral"'));
  assert(html.includes("document.getElementById('resetGuidedDihedral').addEventListener('click', resetAllBackboneAnglesToNative)"));
  assert(html.includes("document.getElementById('undoGuidedDihedral').addEventListener('click', undoManipulatorRotation)"));
});

test('keyboard and screen-reader affordances are present for guided controls', () => {
  assert(html.includes("document.getElementById('dihedralGuidedCycle').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes('aria-label="Guided rotation: decrease phi by 10 degrees"'));
  assert(html.includes('aria-label="Select phi rotation around N to alpha carbon"'));
  assert(html.includes('aria-live="polite"'));
  const cycle = bodyOf('setDihedralCycleStage');
  assert(cycle.includes("step.setAttribute('aria-current'"));
  assert(cycle.includes('showBackboneStatus(announcement)'));
});

test('feedback branches address prediction sterics peptide rigidity and nuance', () => {
  const feedback = bodyOf('evaluateDihedralExplanation');
  assert(feedback.includes('Add a prediction before interpreting'));
  assert(feedback.includes('A steric conflict is visible'));
  assert(feedback.includes('peptide-bond planarity and partial double-bond character'));
  assert(feedback.includes('not chemically impossible in every context'));
  assert(feedback.includes('Good nuance'));
});

test('unrestricted Explore mode remains available after the guided pathway', () => {
  assert(html.includes('id="enableUnrestrictedDihedral"'));
  assert(html.includes("state.backboneManipulator.guidedMode = 'explore'"));
  assert(html.includes('Use the full manipulator controls below'));
});

console.log('Ramachandran guided learning checks passed.');
