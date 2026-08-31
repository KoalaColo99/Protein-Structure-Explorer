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

test('Ligand Explorer is an active Analyze module, not a roadmap placeholder', () => {
  assert(html.includes('data-mode="ligands">Ligand Explorer</button>'));
  assert(html.includes('id="ligandsPanel"'));
  const roadmapStart = html.indexOf('<h2>Development Roadmap</h2>');
  const roadmap = html.slice(roadmapStart, roadmapStart + 500);
  assert(!roadmap.includes('Ligands<span class="coming-soon"'));
});

test('ligands cofactors ions additives and waters are classified separately', () => {
  const classify = bodySlice('classifyLigandGroup', 'filteredLigandGroups');
  assert(classify.includes("category: 'water'"));
  assert(classify.includes("category: 'cofactor'"));
  assert(classify.includes("category: 'ion'"));
  assert(classify.includes("category: 'additive'"));
  assert(classify.includes("category: 'ligand'"));
  assert(html.includes('knownCofactors'));
  assert(html.includes('likelyAdditives'));
  assert(html.includes('simpleIons'));
});

test('Ligand Explorer displays identity chemical context nearby residues and measured distances', () => {
  assert(html.includes('id="ligandList"'));
  assert(html.includes('id="ligandContactTable"'));
  assert(html.includes('id="ligandNote"'));
  assert(html.includes('<th>Closest atoms</th>'));
  const table = bodySlice('renderLigandContactTable', 'drawLigandExplorer');
  assert(table.includes('item.distance.toFixed(2)'));
  assert(table.includes('item.contactLabel'));
});

test('contact labels are cautious and avoid inferred binding significance', () => {
  const label = bodySlice('ligandContactLabel', 'populateLigandList');
  assert(label.includes('coordination / ionic contact candidate'));
  assert(label.includes('polar contact / H-bond candidate'));
  assert(label.includes('hydrophobic proximity'));
  assert(html.includes('not binding-affinity measurements'));
  assert(html.includes('do not prove biological significance'));
  assert(html.includes('observed contacts rather than assuming a complete mechanism'));
});

test('nearby residue detection uses parsed coordinates and heavy-atom distances', () => {
  const nearby = bodySlice('nearbyResiduesForLigand', 'ligandContactLabel');
  assert(nearby.includes('closestPair'));
  assert(nearby.includes("atom.elem !== 'H'"));
  assert(nearby.includes('cutoff = 4.5'));
});

test('Ligand Explorer integrates with shared state and evidence cards', () => {
  assert(html.includes('ligandFilter'));
  assert(html.includes('selectedLigandIndex'));
  const observations = bodySlice('quantitativeObservations', 'currentViewImageDataUrl');
  assert(observations.includes('selectedLigand'));
  assert(observations.includes('selectedLigandCategory'));
  assert(observations.includes('selectedLigandNearbyResidues'));
  const draw = bodySlice('drawLigandExplorer', 'residueSasaEntry');
  assert(draw.includes('renderMolecularEvidenceCard()'));
});

test('Ligand Explorer degrades without remote data and without WebGL', () => {
  const draw = bodySlice('drawLigandExplorer', 'residueSasaEntry');
  assert(!draw.includes('fetch('));
  assert(draw.includes('if (hasViewer())'));
  const apply = bodySlice('applyMode', 'escapeHtml');
  assert(apply.includes("if (state.mode === 'ligands') drawLigandExplorer()"));
});

test('Ligand Explorer supports keyboard navigation through standard controls', () => {
  assert(html.includes('id="ligandFilter"'));
  assert(html.includes("document.getElementById('ligandFilter').addEventListener('change'"));
  assert(html.includes('role="tab"'));
  assert(html.includes('activateButtonFromKeyboard'));
});

console.log('Ligand Explorer checks passed.');
