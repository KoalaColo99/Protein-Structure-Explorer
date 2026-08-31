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
  const end = nextFunctionName ? html.indexOf(`function ${nextFunctionName}(`, start) : start + 3000;
  return html.slice(start, end === -1 ? start + 3000 : end);
}

function protonatedFraction(group, pH) {
  return 1 / (1 + Math.pow(10, pH - group.pKa));
}

function charge(group, pH) {
  const protonated = protonatedFraction(group, pH);
  return group.type === 'acid' ? -1 * (1 - protonated) : protonated;
}

function net(groups, pH) {
  return groups.reduce((sum, group) => sum + charge(group, pH), 0);
}

function estimatePi(groups) {
  let best = { pH: 0, magnitude: Infinity };
  for (let pH = 0; pH <= 14.0001; pH += 0.02) {
    const magnitude = Math.abs(net(groups, pH));
    if (magnitude < best.magnitude) best = { pH, magnitude };
  }
  return best.pH;
}

test('pH and Charge pathway uses the Predict Manipulate Observe Explain Feedback cycle', () => {
  assert(html.includes('id="phGuidedCycle"'));
  assert(html.includes('CHEM214 10-minute pathway: Predict -> Manipulate -> Observe -> Explain -> Feedback'));
  ['1. Predict', '2. Manipulate', '3. Observe', '4. Explain', '5. Feedback'].forEach(label => {
    assert(html.includes(label), `${label} missing`);
  });
  assert(html.includes('id="phPrediction"'));
  assert(html.includes('id="phExplanation"'));
  assert(html.includes('id="phCycleFeedback"'));
});

test('guided pH tool exposes amino-acid peptide and loaded-protein modes', () => {
  assert(html.includes('name="phReasoningMode" value="aminoAcid"'));
  assert(html.includes('name="phReasoningMode" value="peptide"'));
  assert(html.includes('name="phReasoningMode" value="protein"'));
  assert(html.includes('id="peptideSequenceInput"'));
  assert(html.includes('id="ionResidue"'));
});

test('pH slider precise number comparison pH and HH display are synchronized', () => {
  assert(html.includes('id="phSlider"'));
  assert(html.includes('id="phNumber"'));
  assert(html.includes('id="phCompareInput"'));
  assert(html.includes('id="showHhCalculation"'));
  const setter = bodySlice('setPhValue', 'setPhCycleStage');
  assert(setter.includes('state.pH = clampPh(value)'));
  assert(setter.includes('applyMode()'));
  assert(html.includes("document.getElementById('phNumber').addEventListener('input'"));
  assert(html.includes("document.getElementById('phCompareInput').addEventListener('input'"));
  const render = bodySlice('renderPhGuidedPathway', 'evaluatePhExplanation');
  assert(render.includes('phNumber.value = state.pH.toFixed(1)'));
  assert(render.includes('compareInput.value = state.phCompare.toFixed(1)'));
  assert(render.includes('showHh.checked = state.showHhCalculation'));
});

test('accounting table and titration curve preserve fractional charge', () => {
  assert(html.includes('id="phTitrationCanvas"'));
  assert(html.includes('id="phAccountingTable"'));
  const groupCharge = bodySlice('chargeForIonizableGroup', 'hhExpectedCharge');
  assert(groupCharge.includes('protonated'));
  assert(groupCharge.includes('deprotonated: 1 - protonated'));
  assert(groupCharge.includes('charge'));
  const table = bodySlice('renderPhGuidedPathway', 'evaluatePhExplanation');
  assert(html.includes('Fraction protonated'));
  assert(table.includes('row.current.charge.toFixed(2)'));
  assert(table.includes('row.compare.charge.toFixed(2)'));
});

test('method disclosure distinguishes intrinsic pKa values from structure-shifted pKa', () => {
  assert(html.includes('id="phMethodDisclosure"'));
  assert(html.includes('intrinsic/model-compound pKa values'));
  assert(html.includes('assume independent ionizable groups'));
  assert(html.includes('do not compute structure-shifted pKa values'));
  assert(html.includes('preserve fractional charge internally'));
});

test('limiting pH behavior follows acid and base expectations', () => {
  const asp = { pKa: 3.9, type: 'acid' };
  const lys = { pKa: 10.5, type: 'base' };
  assert(charge(asp, 0) > -0.01, 'acid should be mostly neutral at very low pH');
  assert(charge(asp, 14) < -0.999, 'acid should be mostly negative at very high pH');
  assert(charge(lys, 0) > 0.999, 'base should be mostly positive at very low pH');
  assert(charge(lys, 14) < 0.001, 'base should be mostly neutral at very high pH');
});

test('pH equal to pKa gives half protonated population without all-or-none switching', () => {
  const his = { pKa: 6.0, type: 'base' };
  assert(Math.abs(protonatedFraction(his, 6.0) - 0.5) < 0.0001);
  const interpretation = bodySlice('hhInterpretationText', 'populateHhGroups');
  assert(interpretation.includes('50% protonated and 50% deprotonated'));
  const feedback = bodySlice('evaluatePhExplanation');
  assert(feedback.includes('mixture of protonated and deprotonated'));
  assert(feedback.includes('instantaneous switch'));
});

test('histidine remains a near-physiological special case', () => {
  const his = { pKa: 6.0, type: 'base' };
  assert(charge(his, 6.0) > 0.49 && charge(his, 6.0) < 0.51);
  assert(charge(his, 7.4) > 0.03 && charge(his, 7.4) < 0.05);
  assert(html.includes('Histidine sits near physiological pH'));
  assert(html.includes('changes protonation significantly near physiological pH'));
});

test('amino acids and peptides visibly account for termini', () => {
  const aa = bodySlice('aaIonizableGroups', 'groupChargeContribution');
  assert(aa.includes('alpha carboxyl group'));
  assert(aa.includes('alpha amino group'));
  const peptide = bodySlice('peptideReasoningGroups', 'proteinReasoningGroups');
  assert(peptide.includes('N-terminus'));
  assert(peptide.includes('C-terminus'));
  assert(peptide.includes('peptide terminus'));
});

test('polyprotic peptide net charge includes termini and ionizable side chains', () => {
  const groups = [
    { pKa: 8.5, type: 'base' },
    { pKa: 2.5, type: 'acid' },
    { pKa: 6.0, type: 'base' },
    { pKa: 3.9, type: 'acid' },
    { pKa: 4.2, type: 'acid' },
    { pKa: 10.5, type: 'base' }
  ];
  const nearNeutral = net(groups, 7.0);
  assert(nearNeutral < -0.85 && nearNeutral > -1.15, `unexpected net charge ${nearNeutral}`);
});

test('protein mode computes loaded side-chain and chain-terminus groups', () => {
  const protein = bodySlice('proteinReasoningGroups', 'currentPhReasoningGroups');
  assert(protein.includes('loaded protein side chain'));
  assert(protein.includes('loaded protein terminus'));
  assert(protein.includes('chains.forEach'));
});

test('pI estimation is explicitly approximate and available from current groups', () => {
  const glycine = [
    { pKa: 2.2, type: 'acid' },
    { pKa: 9.5, type: 'base' }
  ];
  const pi = estimatePi(glycine);
  assert(pi > 5.7 && pi < 6.1, `expected glycine-like pI around 5.85, got ${pi}`);
  const estimate = bodySlice('estimatePiForGroups', 'modeLabelForPhReasoning');
  assert(estimate.includes('for (let pH = 0'));
  assert(html.includes('Estimated pI from this simplified independent-group model'));
});

test('feedback branches target pKa fractions net charge termini and microenvironment misconceptions', () => {
  const feedback = bodySlice('evaluatePhExplanation');
  assert(feedback.includes('Add a prediction before changing pH'));
  assert(feedback.includes('pH relative to pKa'));
  assert(feedback.includes('fractional protonation state'));
  assert(feedback.includes('whole-protein net charge'));
  assert(feedback.includes('termini contribute'));
  assert(feedback.includes('microenvironment caveat'));
});

console.log('pH and Charge guided learning checks passed.');
