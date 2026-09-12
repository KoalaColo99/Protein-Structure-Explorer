const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

function extractFunction(functionName) {
  const start = html.indexOf(`function ${functionName}`);
  assert.notStrictEqual(start, -1, `${functionName} should exist`);
  const next = html.indexOf('\n    function ', start + 1);
  return html.slice(start, next === -1 ? html.length : next);
}

test('build identifier is visible and machine-readable', () => {
  assert(html.includes('<meta name="atlas-build" content="2026-09-12-homolog-1">'));
  assert(html.includes("const ATLAS_BUILD_ID = '2026-09-12-homolog-1'"));
  assert(html.includes('window.BIOCHEMISTRY_VISUAL_ATLAS_BUILD = ATLAS_BUILD_ID'));
  assert(html.includes('Build: 2026-09-12-homolog-1'));
});

test('student route reads and writes pdb and chain parameters', () => {
  const read = extractFunction('readStudentRouteFromUrl');
  const write = extractFunction('writeStudentRoute');
  assert(read.includes('routeProteinFromParams(params)'));
  assert(read.includes('state.pendingRouteProtein = routeProtein'));
  assert(read.includes('restoreSessionState(decodedActivity.state)'));
  assert(read.includes('state.structureId = routeProtein.pdbId'));
  assert(read.includes('state.activeChain = routeProtein.chain'));
  assert(write.includes("params.set('pdb'"));
  assert(write.includes("params.set('chain'"));
});

test('direct Conservation route enters viewer-aware workspace while 2D workflow can survive viewer failure', () => {
  const modeNeedsViewer = extractFunction('modeNeedsViewer');
  const ensureReady = extractFunction('ensureWorkspaceToolReady');
  const map = extractFunction('mapHomologAlignmentToStructure');
  assert(!modeNeedsViewer.includes("'conservation'"));
  assert(ensureReady.includes('modeNeedsViewer(mode)'));
  assert(ensureReady.includes('ensureAtlasStarted(options)'));
  assert(html.includes('function ensureConservationViewerForMapping'));
  assert(map.includes('ensureConservationViewerForMapping()'));
  assert(html.includes('3D viewer unavailable'));
});

test('initial structure loader prefers explicit route protein over stale activity state', () => {
  const load = extractFunction('loadInitialStructure');
  assert(load.includes('const routeProtein = state.pendingRouteProtein'));
  assert(load.includes('routeProtein?.pdbId || activity?.pdbId'));
  assert(load.includes('routeProtein?.chain || activity?.chain'));
  assert(load.includes('modeAfterLoad: state.mode'));
});

test('Conservation Analysis exposes a local protein changer from the gallery registry', () => {
  assert(html.includes('id="conservationProteinWorkspace"'));
  assert(html.includes('id="openConservationProteinChooser"'));
  assert(html.includes('id="conservationProteinPreset"'));
  assert(html.includes('data-conservation-protein-action="load"'));
  const change = extractFunction('changeConservationProtein');
  assert(change.includes("state.mode = 'conservation'"));
  assert(change.includes('loadStructureById(code, selectedPresetLabel(code)'));
  assert(change.includes("stage = 'reference'"));
  assert(change.includes('writeStudentRoute(true)'));
});

test('stale structure and identity responses are token guarded', () => {
  assert(html.includes('structureLoadToken'));
  assert(html.includes('evolutionIdentityToken'));
  assert(html.includes('function beginStructureLoad'));
  assert(html.includes('function structureLoadStillCurrent'));
  const loadStructure = extractFunction('loadStructureById');
  assert(loadStructure.includes('const token = beginStructureLoad'));
  assert(loadStructure.includes('if (!structureLoadStillCurrent(token)) return false'));
  const identity = extractFunction('resolveCurrentProteinEvolutionIdentity');
  assert(identity.includes('const identityToken = ++state.evolutionIdentityToken'));
  assert(identity.includes('const identityStillCurrent = () =>'));
  assert(identity.includes('if (!identityStillCurrent()) return'));
});

test('homolog reference blocks inconsistent structure or chain state', () => {
  const build = extractFunction('buildHomologReference');
  assert(build.includes('Internal state mismatch: Conservation Analysis route requests'));
  assert(build.includes('but the current structure is'));
  assert(build.includes('but the homolog reference is chain'));
  assert(build.includes("validationStatus: error ? 'invalid' : 'valid'"));
});
