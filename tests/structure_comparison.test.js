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

test('Structure Comparison is an active Analyze module', () => {
  assert(html.includes('data-mode="comparison">Structure Comparison</button>'));
  assert(html.includes('id="comparisonPanel"'));
  const roadmapStart = html.indexOf('<h2>Development Roadmap</h2>');
  const roadmap = html.slice(roadmapStart, roadmapStart + 500);
  assert(!roadmap.includes('Comparative Structures<span class="coming-soon"'));
});

test('comparison cases include experimental and predicted models', () => {
  assert(html.includes('const structureComparisonCases'));
  assert(html.includes('related experimental structure'));
  assert(html.includes('predicted model'));
  assert(html.includes('AlphaFold-style model summary'));
  assert(html.includes("'1MBN'"));
  assert(html.includes("'1LYZ'"));
  assert(html.includes("'1CA2'"));
});

test('comparison reports coverage RMSD confidence and mapping uncertainty', () => {
  assert(html.includes('id="comparisonCoverage"'));
  assert(html.includes('id="comparisonRmsd"'));
  assert(html.includes('id="comparisonConfidence"'));
  const draw = bodySlice('drawStructureComparison', 'residueSasaEntry');
  assert(draw.includes('coverage'));
  assert(draw.includes('RMSD'));
  assert(draw.includes('confidence'));
  assert(draw.includes('residueMapping'));
  assert(draw.includes('chainMap'));
});

test('comparison distinguishes missing coordinates from predicted disorder or low confidence', () => {
  assert(html.includes('Missing experimental coordinates are not the same as predicted disorder or low confidence.'));
  assert(html.includes('Missing metal/water coordinates differ from low-confidence protein coordinates.'));
  assert(html.includes('unresolved experimental loops'));
  assert(html.includes('prediction confidence'));
});

test('comparison degrades gracefully without remote data or a server', () => {
  const draw = bodySlice('drawStructureComparison', 'residueSasaEntry');
  assert(draw.includes('No curated structure-comparison case is available'));
  assert(draw.includes('Remote comparison data were not requested'));
  assert(draw.includes('if (hasViewer())'));
  assert(!draw.includes('fetch('));
});

test('comparison integrates with shared residue selection and evidence cards', () => {
  const mapping = bodySlice('comparisonResidueMappingSummary', 'drawStructureComparison');
  assert(mapping.includes('currentResidue()'));
  const observations = bodySlice('quantitativeObservations', 'currentViewImageDataUrl');
  assert(observations.includes('comparisonTarget'));
  assert(observations.includes('comparisonCoverage'));
  assert(observations.includes('comparisonRmsd'));
  assert(observations.includes('comparisonMappingUncertainty'));
  const draw = bodySlice('drawStructureComparison', 'residueSasaEntry');
  assert(draw.includes('renderMolecularEvidenceCard()'));
});

test('comparison supports keyboard through native controls', () => {
  assert(html.includes('id="comparisonCaseSelect"'));
  assert(html.includes("document.getElementById('comparisonCaseSelect').addEventListener('change'"));
  assert(html.includes('role="tab"'));
  assert(html.includes('activateButtonFromKeyboard'));
});

console.log('Structure Comparison checks passed.');
