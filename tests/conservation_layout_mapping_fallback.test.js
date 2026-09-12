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

test('homolog workflow appears before collapsed protein identity details', () => {
  const workspaceIndex = html.indexOf('id="conservationProteinWorkspace"');
  const workflowIndex = html.indexOf('id="evolutionCandidatePanel"');
  const detailsIndex = html.indexOf('id="proteinIdentitySourceDetails"');
  assert(workspaceIndex >= 0, 'workspace context missing');
  assert(workflowIndex > workspaceIndex, 'homolog workflow should follow workspace context');
  assert(detailsIndex > workflowIndex, 'source details should follow homolog workflow');
  assert(html.includes('<details class="mini-card" id="proteinIdentitySourceDetails">'));
  assert(!html.includes('<details class="mini-card" id="proteinIdentitySourceDetails" open>'));
  assert(html.includes('Automatic Homolog Discovery and Sequence Import'));
});

test('RCSB mapping fallback status distinguishes service and local mapping outcomes', () => {
  const identity = bodyOf('resolveCurrentProteinEvolutionIdentity');
  const readiness = bodyOf('renderCurrentProteinEvolution');
  assert(identity.includes('RCSB mapping service unavailable; trying local sequence mapping...'));
  assert(identity.includes('buildLocalSequenceMappingFallback(currentEvolutionChain())'));
  assert(identity.includes('Local mapping could not be validated'));
  assert(readiness.includes('localSequenceMappingSummary(mapping)'));
  assert(readiness.includes('both authoritative and validated fallback residue mapping'));
});

test('local sequence fallback preserves canonical positions and coordinate residue identity', () => {
  const fallback = bodyOf('buildLocalSequenceMappingFallback');
  const align = bodyOf('alignSequenceToReferenceWithIndices');
  const referenceMapping = bodyOf('homologReferenceResidueMapping');
  assert(align.includes('canonicalPosition'));
  assert(align.includes('queryIndex'));
  assert(fallback.includes('coordinateCoverage < 0.95'));
  assert(fallback.includes('identityAcrossMapped < 0.9'));
  assert(fallback.includes('extraCoordinateResidues'));
  assert(fallback.includes('residueKey: residue?.key'));
  assert(fallback.includes('icode: residue?.icode'));
  assert(fallback.includes('Local mapping succeeded:'));
  assert(referenceMapping.includes('referencePosition: item.canonicalPosition'));
  assert(referenceMapping.includes('mappingMethod: localMapping.provenance'));
});

test('mapping uses explicit canonical-to-coordinate map and does not shift missing residues', () => {
  const residueMap = bodyOf('residueMapForHomologReference');
  const map = bodyOf('mapHomologAlignmentToStructure');
  assert(residueMap.includes('reference.source === \'canonical\''));
  assert(residueMap.includes('reference.localMapping?.valid'));
  assert(residueMap.includes('item.canonicalPosition'));
  assert(!map.includes('const residueByPosition = new Map(residues.map((residue, index) => [index + 1, residue]));'));
  assert(map.includes('residueMapForHomologReference(reference, residues)'));
  assert(map.includes('reference residue absent from coordinates') || html.includes('reference residue absent from coordinates'));
  assert(map.includes('mappingProvenance'));
});

test('viewer failure is separate from mapping failure', () => {
  const ensureViewer = bodyOf('ensureConservationViewerForMapping');
  const map = bodyOf('mapHomologAlignmentToStructure');
  assert(ensureViewer.includes('markViewerUnavailable(error)'));
  assert(ensureViewer.includes('The alignment and 2D mapping remain available'));
  assert(ensureViewer.includes('3D viewer unavailable'));
  assert(map.includes('ensureConservationViewerForMapping()'));
  assert(map.includes("state.homologWorkflow.status = confidence === 'adequate' ? 'Alignment mapped to structure. Conservation coloring is available.'"));
});

test('PDB parsing preserves insertion codes in residue keys and labels', () => {
  const parse = bodyOf('parsePdb');
  assert(parse.includes('icode: line.slice(26, 27).trim()'));
  assert(parse.includes('`${atom.chain}:${atom.resi}${atom.icode || \'\'}'));
  assert(parse.includes('label: `${residueNames[atom.resn]} ${atom.resi}${atom.icode || \'\'}'));
});
