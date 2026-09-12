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
  let start = html.indexOf(`function ${functionName}(`);
  if (start === -1) start = html.indexOf(`async function ${functionName}(`);
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

test('Workspace Hub is a top-level route separate from Atlas Home and focused tools', () => {
  assert(html.includes('id="workspaceHub"'));
  assert(html.includes('Atlas Workspace'));
  assert(html.includes('What would you like to examine?'));
  assert(html.includes("params.get('workspace') === 'hub'"));
  assert(html.includes('body.workspace-hub-active .app'));
  assert(html.includes('writeWorkspaceHubRoute'));
});

test('opening the Atlas Workspace shows the hub without starting the viewer', () => {
  const start = html.indexOf('async function openWorkspaceFromHome');
  const end = html.indexOf('function renderStudentModeControls', start);
  const open = html.slice(start, end);
  assert(open.includes('showWorkspaceHub({ restoreFocus: true, push: true })'));
  const firstBranch = open.slice(0, open.indexOf('state.studentMode = options.resume'));
  assert(!firstBranch.includes('ensureAtlasStarted'));
  assert(!firstBranch.includes('startAtlasWorkspace'));
});

test('hub groups expose the requested tool families and actions', () => {
  [
    'Examine Structure',
    'Investigate Chemistry',
    'Connect Structure and Function',
    'Analyze and Communicate',
    'Structure / Orientation',
    'Structure Sequence',
    'Ramachandran / Backbone Rotation',
    'Backbone H-bonds',
    'Helix Patterns',
    'Beta / Topology',
    'Side-chain Interactions',
    'Hydrophobic Core',
    'Solvent Access',
    'pH &amp; Charge',
    'Chemistry Lens',
    'Charge Surface',
    'Ligand Explorer',
    'Active-Site Explorer',
    'Conservation Analysis',
    'Mutation Sandbox',
    'Structure Comparison',
    'Rubisco Visual Evolution Explorer',
    'Molecular Evidence Card',
    'Custom PDB Loading / Structure Gallery',
    'Data Sources and Dataset Registry'
  ].forEach(text => assert(html.includes(text), `${text} missing from hub`));
  assert(html.includes('data-start-guide="conservation"'));
  assert(html.includes('Explore freely'));
});

test('focused workspace hides overloaded navigation and keeps compact escape routes', () => {
  assert(html.includes('body.focused-tool-active #modeTabs'));
  assert(html.includes('body.focused-tool-active .about-atlas'));
  assert(html.includes('body.focused-tool-active #allAtlasToolsIndex'));
  assert(html.includes('id="backToWorkspaceHub"'));
  assert(html.includes('id="focusedMoreTools"'));
});

test('legacy direct links bypass the hub and open focused tools', () => {
  const init = bodyOf('init');
  assert(init.includes('shouldShowWorkspaceHubFromUrl()'));
  assert(init.includes('await startAtlasWorkspace({ readRoute: true })'));
  const read = bodyOf('readStudentRouteFromUrl');
  assert(read.includes('params.get(\'tool\')'));
  assert(read.includes('document.getElementById(`${mode}Panel`)'));
});

test('Conservation guide uses reusable steps and focuses existing controls only', () => {
  [
    'WORKSPACE_GUIDES',
    'conservation',
    'Question',
    'Prepare',
    'Do',
    'Notice',
    'Interpret',
    'Capture',
    'currentProteinEvolutionContext',
    'evolutionCandidatePanel',
    'currentProteinAlignmentPanel',
    'currentProteinResidueInfo',
    'molecularEvidenceCard'
  ].forEach(text => assert(html.includes(text), `${text} missing from guide`));
  assert(html.includes('localStorage.setItem(guide.storageKey'));
  assert(html.includes('highlightWorkspaceTarget'));
  assert(!html.includes('function computeConservationGuide'));
});

test('targeted evidence and registry sections reveal only when intentionally opened', () => {
  assert(html.includes('focused-evidence-active'));
  assert(html.includes('focused-registry-active'));
  assert(html.includes('data-focused-global="evidence"'));
  assert(html.includes('data-focused-global="registry"'));
  assert(html.includes("isRegistryTarget(targetId = '')"));
});

console.log('Workspace shell navigation checks passed.');
