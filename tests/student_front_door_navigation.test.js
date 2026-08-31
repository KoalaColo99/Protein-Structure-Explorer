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
  assert(html.includes('What would you like to investigate?'));
  assert(html.includes('id="frontDoor"'));
  assert(html.includes('id="pathwayGrid"'));
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
  assert(html.includes("document.getElementById('studentModeSwitch').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('pathwayGrid').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('pathwayProgress').addEventListener('keydown', activateButtonFromKeyboard)"));
  assert(html.includes("document.getElementById('modeTabs').addEventListener('keydown', activateButtonFromKeyboard)"));
});

test('direct access to individual expert tools remains available in Explore or Analyze', () => {
  assert(html.includes('data-student-area="explore"'));
  assert(html.includes('data-student-area="analyze"'));
  ['overview', 'torsions', 'hbonds', 'tertiary', 'ph', 'conservation', 'gallery'].forEach(mode => {
    assert(html.includes(`data-mode="${mode}"`), `${mode} direct tool missing`);
  });
});

test('unfinished modules are moved out of primary Learn and Explore navigation', () => {
  const roadmapStart = html.indexOf('<h2>Development Roadmap</h2>');
  assert(roadmapStart > 0, 'Development Roadmap is missing');
  const roadmap = html.slice(roadmapStart, html.indexOf('</div>', roadmapStart + 300));
  ['AlphaFold'].forEach(label => {
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
