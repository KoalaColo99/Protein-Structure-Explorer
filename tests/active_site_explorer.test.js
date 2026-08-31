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

test('Active-Site Explorer is an active Analyze module, not a roadmap placeholder', () => {
  assert(html.includes('data-mode="activeSite">Active-Site Explorer</button>'));
  assert(html.includes('id="activeSitePanel"'));
  const roadmapStart = html.indexOf('<h2>Development Roadmap</h2>');
  const roadmap = html.slice(roadmapStart, roadmapStart + 500);
  assert(!roadmap.includes('Active Sites<span class="coming-soon"'));
});

test('curated active-site annotations include role categories and evidence sources', () => {
  assert(html.includes('const activeSiteAnnotations'));
  assert(html.includes("'1MBN'"));
  assert(html.includes("'1YPH'"));
  assert(html.includes("'1CA2'"));
  assert(html.includes("'1LYZ'"));
  ['catalytic', 'binding', 'structural', 'uncertain'].forEach(role => {
    assert(html.includes(`role: '${role}'`) || html.includes(`${role}: { label:`), `${role} role should be represented`);
  });
  assert(html.includes('citation'));
  assert(html.includes('source'));
});

test('Active-Site Explorer does not infer active sites solely from geometry', () => {
  const draw = bodySlice('drawActiveSiteExplorer', 'residueSasaEntry');
  assert(draw.includes('No curated active-site annotation'));
  assert(draw.includes('will not label an active site from geometric proximity alone'));
  assert(html.includes('Nearby ligand or residue distances are reported as coordinate context, not as proof of catalytic function.'));
});

test('coordinate context is secondary to curated annotation', () => {
  const context = bodySlice('activeSiteGeometryContext', 'populateActiveSiteList');
  assert(context.includes('nearest heterogen'));
  assert(context.includes('near curated residue'));
  assert(context.includes('Mapped to coordinates'));
  const draw = bodySlice('drawActiveSiteExplorer', 'residueSasaEntry');
  assert(draw.includes('Source:'));
  assert(draw.includes('Citation:'));
});

test('Active-Site Explorer integrates with shared selection and evidence cards', () => {
  assert(html.includes('activeSiteFilter'));
  assert(html.includes('selectedActiveSiteIndex'));
  const list = bodySlice('populateActiveSiteList', 'renderActiveSiteEvidenceTable');
  assert(list.includes('state.selectedResidueIndex = state.residues.indexOf(residue)'));
  const observations = bodySlice('quantitativeObservations', 'currentViewImageDataUrl');
  assert(observations.includes('selectedActiveSiteResidue'));
  assert(observations.includes('selectedActiveSiteRole'));
  assert(observations.includes('selectedActiveSiteEvidence'));
  const draw = bodySlice('drawActiveSiteExplorer', 'residueSasaEntry');
  assert(draw.includes('renderMolecularEvidenceCard()'));
});

test('Active-Site Explorer degrades without WebGL and uses no remote fetch', () => {
  const draw = bodySlice('drawActiveSiteExplorer', 'residueSasaEntry');
  assert(draw.includes('if (hasViewer())'));
  assert(!draw.includes('fetch('));
  const apply = bodySlice('applyMode', 'escapeHtml');
  assert(apply.includes("if (state.mode === 'activeSite') drawActiveSiteExplorer()"));
});

test('Active-Site Explorer supports keyboard through standard controls', () => {
  assert(html.includes('id="activeSiteFilter"'));
  assert(html.includes("document.getElementById('activeSiteFilter').addEventListener('change'"));
  assert(html.includes('role="tab"'));
  assert(html.includes('activateButtonFromKeyboard'));
});

console.log('Active-Site Explorer checks passed.');
