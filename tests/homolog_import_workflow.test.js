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
  assert(start >= 0, `${functionName} missing`);
  const next = html.indexOf('\n    function ', start + 1);
  return html.slice(start, next >= 0 ? next : start + 6000);
}

test('homolog import workflow exposes required stages and conservative presets', () => {
  [
    'Reference',
    'Search criteria',
    'Review candidates',
    'Review alignment',
    'Map and color',
    'Recommended teaching set',
    'Close relatives',
    'Broad protein family',
    'Custom',
    'Find homologs automatically'
  ].forEach(token => assert(html.includes(token), `${token} missing`));
  assert(html.includes('HOMOLOG_SEARCH_PRESETS'));
  assert(html.includes('minIdentity'));
  assert(html.includes('minCoverage'));
  assert(html.includes('onePerSpecies'));
  assert(html.includes('requireDomainArchitecture'));
});

test('reference-chain detection avoids silent concatenation and reports missing coordinates', () => {
  const chains = bodyOf('homologChainSummaries');
  const reference = bodyOf('homologReferenceMarkup');
  const builder = bodyOf('buildHomologReference');
  assert(chains.includes('const chains = new Map()'));
  assert(chains.includes('sequenceFromResidues(residues)'));
  assert(chains.includes('numbering gap'));
  assert(chains.includes('normalizeProteinChainId'));
  assert(builder.includes('availableChains'));
  assert(builder.includes('coordinateSequence'));
  assert(builder.includes('coordinateResidueCount'));
  assert(builder.includes('validationStatus'));
  assert(builder.includes('The selected chain does not contain a usable amino-acid sequence.'));
  assert(reference.includes('Chains are never silently concatenated'));
  assert(reference.includes('homologReferenceChain'));
  assert(reference.includes('coordinate-derived chain sequence'));
  assert(reference.includes('UniProt canonical sequence'));
  assert(reference.includes('Retry Reference Detection'));
});

test('ordinary loaded structures refresh active chain and homolog reference without special cases', () => {
  const apply = bodyOf('applyParsedStructure');
  const builder = bodyOf('buildHomologReference');
  assert(apply.includes('parsedProteinChains'));
  assert(apply.includes('state.activeChain = parsedProteinChains[0]'));
  assert(!builder.includes('1CA2'));
  assert(!html.includes("if (state.structureId === '1CA2')"));
});

test('reference stage status is based on reference validity, not stale workflow warnings', () => {
  const status = bodyOf('homologStageStatus');
  const complete = bodyOf('homologReferenceComplete');
  assert(status.includes("stageId === 'reference' && !homologReferenceComplete()"));
  assert(!status.includes("state.homologWorkflow.warnings?.length ? 'error' : 'current'"));
  assert(complete.includes("buildHomologReference().validationStatus === 'valid'"));
});

test('candidate review distinguishes search hits from conservation and supports fallback imports', () => {
  const review = bodyOf('homologCandidateReviewMarkup');
  const fasta = bodyOf('homologManualImportMarkup');
  assert(review.includes('Search hits are candidates, not conserved residues'));
  assert(review.includes('Select recommended set'));
  assert(review.includes('Select all visible'));
  assert(review.includes('Restore recommended selection'));
  assert(fasta.includes('Paste UniProt accessions'));
  assert(fasta.includes('Paste FASTA or prealigned FASTA'));
  assert(fasta.includes('Raw FASTA still requires a genuine multiple-sequence alignment'));
});

test('stage gates prevent empty candidate review and explain locked stages', () => {
  const requirement = bodyOf('homologStageRequirement');
  const setStage = bodyOf('setHomologWorkflowStage');
  const sanitize = bodyOf('sanitizeHomologWorkflowState');
  assert(requirement.includes("stageId === 'criteria' && !homologReferenceComplete()"));
  assert(requirement.includes("stageId === 'candidates' && homologCandidateCount() === 0"));
  assert(requirement.includes('No candidate homologs are available yet'));
  assert(requirement.includes("stageId === 'alignment' && homologSelectedCount() < 3"));
  assert(requirement.includes("stageId === 'map' && !homologAlignmentValid()"));
  assert(setStage.includes('state.homologWorkflow.status = requirement'));
  assert(setStage.includes('return false'));
  assert(sanitize.includes("state.homologWorkflow.stage = 'criteria'"));
});

test('UniProt literature identifiers are collapsed without being discarded', () => {
  const collapse = bodyOf('functionTextWithCollapsedReferences');
  const render = bodyOf('renderCurrentProteinEvolution');
  assert(collapse.includes('PubMed'));
  assert(collapse.includes('references'));
  assert(render.includes('Supporting references'));
  assert(render.includes('functionText.references.length'));
});

test('zero-candidate state has no misleading selection controls or success status', () => {
  const review = bodyOf('homologCandidateReviewMarkup');
  const zeroStart = review.indexOf('No candidate homologs are available yet.');
  assert(zeroStart >= 0, 'zero-candidate message missing');
  const zeroBlock = review.slice(zeroStart, review.indexOf('const selectedCount', zeroStart));
  assert(zeroBlock.includes('Run an automatic search or import sequences before reviewing candidates.'));
  assert(zeroBlock.includes('Return to Search Criteria'));
  assert(zeroBlock.includes('Paste UniProt Accessions'));
  assert(zeroBlock.includes('Paste or Upload FASTA'));
  assert(!zeroBlock.includes('Select recommended set'));
  assert(!zeroBlock.includes('Recommended set selected'));
});

test('real accession examples are not prepopulated in import fields', () => {
  const fasta = bodyOf('homologManualImportMarkup');
  assert(fasta.includes('placeholder="Enter one UniProt accession per line"'));
  assert(!fasta.includes('P02185, P02144, P68082'));
});

test('candidate filtering and recommended set use quality thresholds before diversity', () => {
  const quality = bodyOf('candidateQualityReason');
  const recommend = bodyOf('selectRecommendedHomologSet');
  assert(quality.includes('below minimum identity guidance'));
  assert(quality.includes('low query coverage'));
  assert(quality.includes('domain architecture differs'));
  assert(quality.includes('synthetic construct'));
  assert(quality.includes('excessive ambiguous residues'));
  assert(quality.includes('excessive gaps'));
  assert(recommend.includes('onePerSpecies'));
  assert(recommend.includes('onePerGenus'));
  assert(recommend.includes('preferReviewed'));
  assert(recommend.includes("!reason.includes('warning:')"));
});

test('live service limitations are explicit and do not substitute unrelated sequences', () => {
  const search = bodyOf('runAutomaticHomologSearch');
  const align = bodyOf('alignSelectedHomologs');
  assert(search.includes('Automatic search not connected. No sequences have been retrieved.'));
  assert(search.includes("state.homologWorkflow.stage = 'criteria'"));
  assert(search.includes('EMBL-EBI BLASTp/FASTA candidate homolog search'));
  assert(search.includes('No unrelated bundled sequences were substituted'));
  assert(search.includes('serverless proxy'));
  assert(align.includes('does not pad sequences or fake an MSA'));
  assert(align.includes('Select at least three total sequences'));
});

test('prealigned FASTA, mapping, and conservation activation are separate stages', () => {
  const load = bodyOf('loadHomologFasta');
  const map = bodyOf('mapHomologAlignmentToStructure');
  const ready = bodyOf('importedHomologWorkflowReady');
  assert(load.includes('user-supplied prealigned FASTA loaded'));
  assert(load.includes('candidates.length >= 3'));
  assert(map.includes('reference alignment row to selected coordinate-derived chain sequence'));
  assert(map.includes('confidence'));
  assert(map.includes('state.conservation = metrics.filter'));
  assert(ready.includes("state.homologWorkflow.mapping?.confidence === 'adequate'"));
});

test('mapped alignment positions select shared structure residues', () => {
  const select = bodyOf('selectHomologAlignmentColumn');
  const preview = bodyOf('renderHomologMappedAlignmentPreview');
  assert(preview.includes('data-homolog-alignment-column'));
  assert(select.includes('state.selectedResidueIndex = residueIndex'));
  assert(select.includes('renderMolecularEvidenceCard()'));
  assert(html.includes("button[data-homolog-alignment-column]"));
});

test('provenance and session-local save include reproducibility details and privacy boundary', () => {
  const provenance = bodyOf('homologProvenanceRecord');
  const save = bodyOf('saveHomologWorkflowSession');
  [
    'queryStructure',
    'querySequenceSource',
    'querySequenceHash',
    'candidateAccessionsReturned',
    'candidateAccessionsSelected',
    'alignmentMethod',
    'mappingCoverage',
    'conservationMethod'
  ].forEach(token => assert(provenance.includes(token), `${token} missing`));
  assert(save.includes('sessionStorage.setItem'));
  assert(save.includes('Session storage is not permanent'));
  assert(!provenance.includes('studentObservations'));
  assert(!provenance.includes('studentName'));
});

console.log('Homolog import workflow checks passed.');
