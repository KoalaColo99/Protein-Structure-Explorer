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

test('front door asks the student-centered investigation question', () => {
  assert(html.includes('id="atlasHome"'));
  assert(html.includes('See how protein structure emerges—and how it makes biology possible.'));
  assert(html.includes('Open the Atlas Workspace'));
  assert(html.includes('What would you like to investigate?'));
  assert(html.includes('id="frontDoor"'));
  assert(html.includes('id="pathwayGrid"'));
});

test('outer Atlas Home offers four quiet primary pathways and workspace entry', () => {
  [
    'Building Protein Structure',
    'Stabilizing the Fold',
    'Protein Charge and pH',
    'Structure, Function, and Evolution'
  ].forEach(label => assert(html.includes(label), `${label} missing from Atlas Home`));
  assert(html.includes('data-home-pathway="sequence_structure"'));
  assert(html.includes('data-home-pathway="folded_stability"'));
  assert(html.includes('data-home-pathway="ph_effects"'));
  assert(html.includes('data-home-pathway="structure_function"'));
  assert(html.includes('id="enterAtlasWorkspace"'));
});

test('Learn Explore Analyze modes are primary navigation tabs', () => {
  assert(html.includes('data-student-mode="learn"'));
  assert(html.includes('data-student-mode="explore"'));
  assert(html.includes('data-student-mode="analyze"'));
  assert(html.includes('role="tablist"'));
});

test('each required pathway is represented with objectives and steps', () => {
  [
    'sequence_structure',
    'folded_stability',
    'ph_effects',
    'structure_function',
    'protein_evolution'
  ].forEach(id => assert(html.includes(`${id}:`), `${id} pathway missing`));
  [
    'How does sequence produce structure?',
    'What stabilizes a folded protein?',
    'How does pH affect a protein?',
    'How does structure support function?',
    'How has this protein evolved?'
  ].forEach(title => assert(html.includes(title), `${title} missing`));
  const pathwayBlock = html.slice(html.indexOf('const LEARNING_PATHWAYS'), html.indexOf('const state'));
  assert((pathwayBlock.match(/objectives: \[/g) || []).length >= 5);
  assert((pathwayBlock.match(/steps: \[/g) || []).length >= 5);
});

test('students can enter each pathway through generated pathway cards', () => {
  const render = bodyOf('renderFrontDoor');
  assert(render.includes('Object.entries(LEARNING_PATHWAYS)'));
  assert(render.includes('button.dataset.pathway = id'));
  assert(html.includes('state.activePathway = pathwayId'));
  assert(html.includes('state.mode = pathway.steps[state.activePathwayStep].mode'));
});

test('outer homepage gates scientific workspace initialization', () => {
  const init = bodyOf('init');
  const startupStart = html.indexOf('async function startAtlasWorkspace');
  const startupEnd = html.indexOf('async function retryViewer', startupStart);
  const startup = html.slice(startupStart, startupEnd);
  assert(init.includes('shouldShowAtlasHomeFromUrl()'));
  assert(init.includes('shouldShowGuidedPathwayFromUrl()'));
  assert(init.includes('writeAtlasHomeRoute(false)'));
  assert(startup.includes('initializeViewerSubsystem()'));
  assert(startup.includes('await loadInitialStructure()'));
  assert(html.includes('body.atlas-home-active .app'));
});

test('guided pathway is a top-level state separate from the full workspace', () => {
  assert(html.includes('id="guidedPathway"'));
  assert(html.includes('body.guided-pathway-active .app'));
  assert(html.includes('function setGuidedPathwayActive('));
  assert(html.includes('function enterGuidedPathway('));
  assert(html.includes('function renderGuidedPathway('));
  const homeEntry = bodyOf('openPathwayFromHome');
  assert(homeEntry.includes('enterGuidedPathway(pathwayId, 0'));
  assert(!homeEntry.includes('ensureAtlasStarted({ readRoute: false })'));
});

test('Building Protein Structure uses eight focused guided steps', () => {
  [
    'Read the Sequence',
    'Compare Side-Chain Chemistry',
    'Find the Repeating Backbone',
    'Explain Peptide-Bond Rigidity',
    'Rotate φ and ψ',
    'Discover Steric Constraints',
    'Recognize Secondary Structure',
    'Build the Explanation'
  ].forEach(label => assert(html.includes(`label: '${label}'`), `${label} guided step missing`));
  const sequenceBlock = html.slice(html.indexOf('sequence_structure:'), html.indexOf('folded_stability:', html.indexOf('sequence_structure:')));
  assert((sequenceBlock.match(/requiresViewer: true/g) || []).length === 2);
  assert((sequenceBlock.match(/requiresViewer: false/g) || []).length === 6);
  assert(!sequenceBlock.includes("label: 'Amino acids', mode: 'ph'"));
});

test('non-viewer guided steps render focused activities without booting the workspace', () => {
  const render = bodyOf('renderGuidedPathway');
  const visual = bodyOf('guidedVisualizationMarkup');
  const viewerReady = bodyOf('ensureGuidedViewerStepReady');
  assert(render.includes('if (guidedStepNeedsViewer(step)) ensureGuidedViewerStepReady()'));
  assert(visual.includes('renderGuidedSequenceView()'));
  assert(visual.includes('renderGuidedPropertyView()'));
  assert(visual.includes('renderGuidedPeptideRigidityView()'));
  assert(visual.includes('renderGuidedPhiPsiView()'));
  assert(visual.includes('renderGuidedStericView()'));
  assert(visual.includes('renderGuidedSecondaryStructureView()'));
  assert(visual.includes('renderGuidedSynthesisView()'));
  assert(viewerReady.includes("state.viewerTargetId = 'guidedViewer'"));
  assert(viewerReady.includes('startAtlasWorkspace({ readRoute: false })'));
});

test('Step 4 peptide-bond rigidity uses chemically correct prediction and diagram labels', () => {
  const visual = bodyOf('renderGuidedPeptideRigidityView');
  const prediction = bodyOf('submitGuidedPeptideBondPrediction');
  const feedback = bodyOf('feedbackForGuidedResponse');
  const render = bodyOf('renderGuidedPathway');
  assert(render.includes("state.activePathway === 'sequence_structure' && state.activePathwayStep === 3"));
  assert(render.includes('Why is the peptide bond rigid?'));
  assert(render.includes("document.getElementById('guidedPromptBox'), responseBox, document.getElementById('guidedDetailsBox')"));
  assert(render.includes("element.style.display = isPeptideRigidityStep ? 'none' : ''"));
  assert(render.includes("element.setAttribute('aria-hidden', isPeptideRigidityStep ? 'true' : 'false')"));
  assert(visual.indexOf('Predict first.') < visual.indexOf('Peptide unit showing C alpha'));
  assert(visual.includes('Which backbone bonds can rotate substantially under ordinary protein conditions? Select all that apply.'));
  assert(visual.indexOf('Which backbone bonds can rotate substantially') < visual.indexOf('guidedPeptidePredictionSubmit'));
  assert(visual.indexOf('guidedPeptidePredictionSubmit') < visual.indexOf('guidedPeptidePredictionFeedback'));
  assert(visual.indexOf('guidedPeptidePredictionFeedback') < visual.indexOf('Reasoning prompt:'));
  assert(visual.indexOf('Reasoning prompt:') < visual.indexOf('Explain your reasoning'));
  assert(visual.indexOf('Explain your reasoning') < visual.indexOf('Save as Evidence'));
  assert(visual.indexOf('Save as Evidence') < visual.indexOf('Why this matters'));
  assert(visual.includes('Explain why the peptide C′-N bond rotates much less freely than the N-Cα and Cα-C′ bonds.'));
  assert(visual.includes('id="guidedBondNCa"'));
  assert(visual.includes('id="guidedBondCaC"'));
  assert(visual.includes('id="guidedBondPeptide"'));
  assert(visual.includes('Cα(i)'));
  assert(visual.includes('C′(i)'));
  assert(visual.includes('N(i+1)'));
  assert(visual.includes('Cα(i+1)'));
  assert(visual.includes('O(i)'));
  assert(visual.includes('H(i+1)'));
  assert(visual.includes('ψ(i): Cα(i)-C′(i)'));
  assert(visual.includes('ω(i): peptide C′(i)-N(i+1)'));
  assert(visual.includes('φ(i+1): N(i+1)-Cα(i+1)'));
  assert(visual.includes('shaded approximate peptide-unit plane, not a bond'));
  assert(!visual.includes('>C=O<'));
  assert(prediction.includes('prediction.nCa && prediction.caC && !prediction.peptide'));
  assert(prediction.includes('Correct prediction.'));
  assert(prediction.includes('The N-Cα and Cα-C′ bonds can rotate substantially.'));
  assert(prediction.includes('The peptide C′-N bond does not rotate freely.'));
  assert(feedback.includes('delocal'));
  assert(feedback.includes('lone.?pair'));
  assert(html.includes("event.target.closest('#guidedStep4SaveEvidence')"));
  assert(html.includes("document.getElementById('guidedPeptideReasoningResponse')"));
});

test('Steps 5 and 6 use synchronized moving phi psi model and recognizable Ramachandran plot', () => {
  const phiPsi = bodyOf('renderGuidedPhiPsiView');
  const steric = bodyOf('renderGuidedStericView');
  const controls = bodyOf('renderGuidedAngleControls');
  const movingSvg = bodyOf('renderGuidedMovingPeptideSvg');
  const ramaSvg = bodyOf('renderGuidedRamaPlotSvg');
  const setAngle = bodyOf('setGuidedBackboneAngle');
  assert(phiPsi.includes('Move φ or ψ and watch the peptide geometry change'));
  assert(phiPsi.includes('renderGuidedMovingPeptideSvg()'));
  assert(controls.includes('id="guidedPhiSlider"'));
  assert(controls.includes('id="guidedPsiSlider"'));
  assert(controls.includes('guidedPhiReadout'));
  assert(controls.includes('guidedPsiReadout'));
  assert(controls.includes('data-guided-angle-step="phi:-10"'));
  assert(controls.includes('id="guidedAngleReset"'));
  assert(movingSvg.includes("activeAxis === 'phi'"));
  assert(movingSvg.includes('N-terminal portion moves when φ changes'));
  assert(movingSvg.includes('C-terminal portion moves when ψ changes'));
  assert(movingSvg.includes('ω around peptide C′(i)-N(i+1) remains fixed'));
  assert(setAngle.includes('state.guidedBackboneModel[angle] = numeric'));
  assert(steric.includes('A Ramachandran plot maps combinations of the two principal backbone torsion angles'));
  assert(steric.includes('simplified teaching schematic'));
  assert(steric.includes('renderGuidedAngleControls()'));
  assert(ramaSvg.includes('φ angle (degrees)'));
  assert(ramaSvg.includes('ψ angle (degrees)'));
  assert(ramaSvg.includes('right-handed α'));
  assert(ramaSvg.includes('β / extended'));
  assert(ramaSvg.includes('left-handed α'));
  assert(ramaSvg.includes('guidedRamaPoint(phi, psi)'));
  assert(steric.includes('favored'));
  assert(steric.includes('allowed'));
  assert(steric.includes('disfavored'));
  assert(html.includes("event.target.matches('#guidedPhiSlider')"));
  assert(html.includes("event.target.matches('#guidedPsiSlider')"));
});

test('Step 7 secondary-structure feedback uses progressive hints and specific comparison targets', () => {
  const secondary = bodyOf('renderGuidedSecondaryStructureView');
  const feedback = bodyOf('guidedSecondaryFeedback');
  assert(secondary.includes("id=\"guidedSecondaryUnsure\""));
  assert(secondary.includes('Hint 1: Look at where the C=O and N-H groups'));
  assert(secondary.includes('Hint 2: In an α-helix'));
  assert(secondary.includes('Hint 3: In an α-helix'));
  assert(secondary.includes('C=O(i) to H-N(i+4)'));
  assert(secondary.includes('between neighboring extended strands'));
  assert(secondary.includes('antiparallel beta sheet'));
  assert(feedback.includes('within one continuous segment'));
  assert(feedback.includes('neighboring extended strands'));
  assert(feedback.includes('You are noticing the angle or direction'));
  assert(feedback.includes('I may not be reading your explanation as you intended'));
  assert(html.includes("event.target.closest('#guidedSecondaryUnsure')"));
  assert(html.includes('function showNextGuidedSecondaryHint()'));
});

test('guided pathway evidence persists through session refresh', () => {
  assert(html.includes("const GUIDED_SESSION_KEY = 'bva.guidedPathway.sessionState'"));
  assert(html.includes('function saveGuidedSessionState()'));
  assert(html.includes('function restoreGuidedSessionState()'));
  const saveResponse = bodyOf('saveGuidedStepResponse');
  const setAngle = bodyOf('setGuidedBackboneAngle');
  const init = bodyOf('init');
  assert(html.includes('state.initializedCore = true;'));
  assert(html.includes('restoreGuidedSessionState();'));
  assert(init.includes('restoreGuidedSessionState();'));
  assert(init.indexOf('restoreGuidedSessionState();') < init.indexOf('readStudentRouteFromUrl();'));
  assert(saveResponse.includes('saveGuidedSessionState()'));
  assert(setAngle.includes('saveGuidedSessionState()'));
});

test('active pathway shell hides the internal pathway chooser', () => {
  assert(html.includes('.student-mode-learn .front-door.hidden'));
  assert(html.includes('.student-mode-learn .pathway-panel.hidden'));
  assert(html.includes("document.getElementById('pathwayStepFocus')") || html.includes('id="pathwayStepFocus"'));
});

test('returning to the front door keeps structure and residue state untouched', () => {
  const start = html.indexOf('function returnToFrontDoor(');
  const ret = html.slice(start, start + 700);
  assert(ret.includes("state.studentMode = 'learn'"));
  assert(ret.includes('state.activePathway = null'));
  assert(!ret.includes('state.structureId ='));
  assert(!ret.includes('state.selectedResidueIndex ='));
});

test('context shows structure, chain, selected residue, and pathway', () => {
  assert(html.includes('id="contextStructure"'));
  assert(html.includes('id="contextChain"'));
  assert(html.includes('id="contextResidue"'));
  assert(html.includes('id="contextPathway"'));
  const context = bodyOf('updateLearningContext');
  assert(context.includes('currentResidue()'));
  assert(context.includes('state.structureLabel'));
  assert(context.includes('pathway.title'));
  assert(context.includes('None selected'));
});

test('browser back and forward behavior is wired through URL state', () => {
  assert(html.includes("window.addEventListener('popstate'"));
  const read = bodyOf('readStudentRouteFromUrl');
  const write = bodyOf('writeStudentRoute');
  assert(read.includes("params.get('student')"));
  assert(read.includes("params.get('pathway')"));
  assert(read.includes("params.get('step')"));
  assert(write.includes("params.set('student', state.studentMode)"));
  assert(write.includes("params.set('pathway', state.activePathway)"));
  assert(write.includes("window.history[method]"));
});

test('direct links into pathways are parsed without needing server routing', () => {
  const read = bodyOf('readStudentRouteFromUrl');
  assert(read.includes('LEARNING_PATHWAYS[pathway]'));
  assert(read.includes("state.studentMode = 'learn'"));
  assert(read.includes('state.activePathwayStep'));
  assert(read.includes('state.mode = pathwaySteps[state.activePathwayStep].mode'));
});

test('student navigation supports Enter and Space keyboard activation', () => {
  assert(html.includes('function activateButtonFromKeyboard('));
  assert(html.includes("document.getElementById('atlasHome').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('studentModeSwitch').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('pathwayGrid').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('pathwayProgress').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('guidedStepTabs').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('modeTabs').addEventListener('keydown', activateButtonFromKeyboard)"));
});

test('direct access to individual expert tools remains available in Explore or Analyze', () => {
  assert(html.includes('data-student-area="explore"'));
  assert(html.includes('data-student-area="analyze"'));
  ['overview', 'torsions', 'hbonds', 'tertiary', 'ph', 'conservation', 'gallery'].forEach(mode => {
    assert(html.includes(`data-mode="${mode}"`), `${mode} direct tool missing`);
  });
  assert(!html.includes('data-mode="sequence">Open Rubisco Evolution Case Study</button>'));
});

test('unfinished modules are moved out of primary Learn and Explore navigation', () => {
  const roadmapStart = html.indexOf('<h2>Development Roadmap</h2>');
  assert(roadmapStart > 0, 'Development Roadmap is missing');
  const roadmap = html.slice(roadmapStart, html.indexOf('</div>', roadmapStart + 300));
  ['AlphaFold', 'Rubisco Evolution Case Study'].forEach(label => {
    assert(roadmap.includes(label), `${label} should be in the roadmap area`);
  });
});

test('Analyze includes data and image export affordances', () => {
  assert(html.includes('id="exportStructureSummary"'));
  assert(html.includes('id="downloadViewerImage"'));
  assert(html.includes('id="copyLearningSummary"'));
  assert(html.includes('function structureSummaryPayload('));
});

console.log('Student front-door navigation checks passed.');
