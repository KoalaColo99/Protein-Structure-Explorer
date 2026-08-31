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

test('normal initialization separates core UI, viewer startup, and structure loading', () => {
  const init = bodyOf('init');
  assert(init.indexOf('initializeCoreInterface()') < init.indexOf('initializeViewerSubsystem()'));
  assert(init.includes('await loadInitialStructure()'));
  assert(html.includes('APP_STATES.VIEWER_READY'));
});

test('failed WebGL initialization is caught and converted to degraded mode', () => {
  const init = bodyOf('init');
  const viewer = bodyOf('initializeViewerSubsystem');
  assert(init.includes('markViewerUnavailable(error)'));
  assert(viewer.includes('3Dmol.js did not load'));
  assert(html.includes('APP_STATES.COORDINATES_WITHOUT_3D'));
});

test('failed remote PDB retrieval can use the bundled myoglobin fallback', () => {
  const fetcher = bodyOf('fetchStructureCoordinates');
  assert(fetcher.includes('https://files.rcsb.org/download/${code}.pdb'));
  assert(fetcher.includes("code === '1MBN'"));
  assert(fetcher.includes("fetch('./1MBN.pdb')"));
  assert(fetcher.includes("source: 'local fallback'"));
});

test('total structure failure has an explicit recovery state and retry path', () => {
  const loader = bodyOf('loadStructureById');
  assert(loader.includes('APP_STATES.RETRIEVAL_FAILED'));
  assert(loader.includes('Retry Structure'));
  assert(html.includes('id="retryStructure"'));
  assert(html.includes("addEventListener('click', retryStructure)"));
});

test('navigation remains active after viewer failure', () => {
  const applyMode = bodyOf('applyMode');
  assert(!applyMode.includes('if (!state.viewer) return;'));
  assert(html.includes("document.querySelectorAll('.mode-panel')"));
  assert(html.includes("button.setAttribute('aria-selected'"));
  assert(html.includes("button.setAttribute('aria-current', 'page')"));
  assert(html.includes('focusActivePanel()'));
});

test('retry viewer behavior is available without a page reload', () => {
  const retry = bodyOf('retryViewer');
  assert(retry.includes('initializeViewerSubsystem()'));
  assert(retry.includes('renderCurrentModel()'));
  assert(html.includes('id="retryViewer"'));
  assert(html.includes("addEventListener('click', retryViewer)"));
});

test('displayed structure statistics update from parsed data without placeholder dashes', () => {
  const parsed = bodyOf('applyParsedStructure');
  assert(parsed.includes("document.getElementById('structureSubtitle').textContent = `${state.residues.length} amino-acid residues detected"));
  assert(parsed.includes('populateControls()'));
  const populate = bodyOf('populateControls');
  assert(populate.includes("document.getElementById('residueCount').textContent = state.residues.length"));
  assert(populate.includes("document.getElementById('hbondCount').textContent = state.hbonds.length"));
  assert(populate.includes("document.getElementById('i4Count').textContent = state.hbonds.filter"));
});

console.log('Graceful degradation stability checks passed.');
