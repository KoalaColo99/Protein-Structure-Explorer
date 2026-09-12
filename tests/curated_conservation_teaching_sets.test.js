const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const {
  validateCuratedConservationDatasets
} = require('../curated_conservation_validation.js');

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

function bodyOf(functionName) {
  let start = html.indexOf(`function ${functionName}(`);
  if (start < 0) start = html.indexOf(`async function ${functionName}(`);
  assert(start >= 0, `${functionName} missing`);
  const braceStart = html.indexOf('{', start);
  let depth = 0;
  for (let index = braceStart; index < html.length; index++) {
    if (html[index] === '{') depth++;
    if (html[index] === '}') depth--;
    if (depth === 0) return html.slice(braceStart + 1, index);
  }
  throw new Error(`Could not parse ${functionName}`);
}

function readJson(...parts) {
  return JSON.parse(fs.readFileSync(path.join(root, ...parts), 'utf8'));
}

test('curated conservation prototype datasets validate', () => {
  const result = validateCuratedConservationDatasets();
  assert.strictEqual(result.ok, true, result.errors.join('\n'));
  assert.strictEqual(result.datasetCount, 2);
});

test('registry exposes only completed 1MBN and 1CA2 curated prototypes', () => {
  const registry = readJson('data', 'conservation', 'curated', 'registry.json');
  const ids = registry.datasets.map(item => item.datasetId).sort();
  assert.deepStrictEqual(ids, [
    'current_protein_1ca2_carbonic_anhydrase_ii_curated_v1',
    'current_protein_1mbn_myoglobin_curated_v1'
  ]);
  assert(registry.notApplicable.some(item => item.pdbId === '1BNA' && /not applicable/i.test(item.reason)));
});

test('prototype manifests document scientific scope and mapping limitations', () => {
  const myoglobin = readJson('data', 'conservation', 'curated', '1mbn_myoglobin', 'manifest.json');
  const ca2 = readJson('data', 'conservation', 'curated', '1ca2_carbonic_anhydrase_ii', 'manifest.json');
  assert(myoglobin.studentContext.whatIsCompared.includes('not hemoglobin alpha or beta'));
  assert(ca2.studentContext.whatIsCompared.includes('not mixed beta/gamma carbonic anhydrases'));
  assert.strictEqual(myoglobin.alignment.method, 'EMBL-EBI Job Dispatcher Clustal Omega');
  assert.strictEqual(ca2.alignment.method, 'EMBL-EBI Job Dispatcher Clustal Omega');
});

test('curated mappings preserve absent canonical residues rather than shifting scores', () => {
  const myoglobin = readJson('data', 'conservation', 'curated', '1mbn_myoglobin', 'mapping.json');
  const ca2 = readJson('data', 'conservation', 'curated', '1ca2_carbonic_anhydrase_ii', 'mapping.json');
  assert.strictEqual(myoglobin.mappedResidueCount, 153);
  assert.strictEqual(myoglobin.coordinateToCanonical[0].canonicalPosition, 2);
  assert.strictEqual(ca2.mappedResidueCount, 256);
  assert.strictEqual(ca2.coordinateToCanonical[0].resi, 4);
  assert.strictEqual(ca2.coordinateToCanonical[0].canonicalPosition, 4);
  assert.strictEqual(ca2.coordinateToCanonical.at(-1).resi, 260);
  assert.strictEqual(ca2.coordinateToCanonical.at(-1).canonicalPosition, 260);
  assert(ca2.canonicalResiduesAbsentFromCoordinates.some(item => item.start === 1 && item.end === 3));
  assert(ca2.canonicalResiduesAbsentFromCoordinates.some(item => item.start === 126 && item.end === 126));
  assert(!ca2.coordinateToCanonical.some(item => item.canonicalPosition === 126 || item.resi === 126));
});

test('Conservation Analysis offers curated route separately from live homolog search', () => {
  assert(html.includes('Use curated teaching set'));
  assert(html.includes('Find homologs automatically'));
  assert(html.includes('Live homolog discovery remains available as the advanced route'));
  assert(html.includes('data-homolog-action="load-curated"'));
  const render = bodyOf('renderCuratedTeachingSetChoice');
  assert(render.includes('curatedConservationEntryForCurrentStructure'));
  assert(render.includes('curatedConservationNotApplicableForCurrentStructure'));
  assert(render.includes('The atlas will not substitute another protein'));
});

test('curated loader uses the same downstream alignment and mapping contract', () => {
  const load = bodyOf('loadCuratedTeachingSetForCurrentProtein');
  assert(load.includes('manifest.json'));
  assert(load.includes('candidates.json'));
  assert(load.includes('aligned.fasta'));
  assert(load.includes('mapping.json'));
  assert(load.includes("state.homologWorkflow.querySequenceSource = 'canonical'"));
  assert(load.includes('mappingJsonToLocalMapping'));
  assert(load.includes('mapHomologAlignmentToStructure()'));
  assert(load.includes('curated teaching set; no live search used'));
});

test('Phase A inventory includes every current gallery structure', () => {
  const inventory = readJson('data', 'conservation', 'curated', 'inventory.json');
  assert.strictEqual(inventory.items.length, 24);
  ['1MBN', '1HHO', '2HHB', '1CA2', '1AFQ', '1BNA', '1TUB', '6LU7'].forEach(pdb => {
    assert(inventory.items.some(item => item.pdbId === pdb), `${pdb} missing`);
  });
});
