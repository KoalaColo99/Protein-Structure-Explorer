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
  if (start < 0) start = html.indexOf(`async function ${functionName}(`);
  assert(start >= 0, `${functionName} missing`);
  const nextFunction = html.indexOf('\n    function ', start + 1);
  const nextAsyncFunction = html.indexOf('\n    async function ', start + 1);
  const next = [nextFunction, nextAsyncFunction].filter(index => index >= 0).sort((a, b) => a - b)[0];
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
  assert(html.includes('homologServiceEmail'));
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
  const display = bodyOf('homologWorkflowStatusText');
  const ready = bodyOf('homologReferenceReadyText');
  assert(status.includes("stageId === 'reference' && !homologReferenceComplete()"));
  assert(!status.includes("state.homologWorkflow.warnings?.length ? 'error' : 'current'"));
  assert(complete.includes("buildHomologReference().validationStatus === 'valid'"));
  assert(display.includes('homologReferenceReadyText'));
  assert(ready.includes('Reference ready:'));
  assert(ready.includes('UniProt'));
});

test('candidate review distinguishes search hits from conservation and supports fallback imports', () => {
  const review = bodyOf('homologCandidateReviewMarkup');
  const fasta = bodyOf('homologManualImportMarkup');
  assert(review.includes('Search hits are candidates, not conserved residues'));
  assert(review.includes('Select recommended set'));
  assert(review.includes('Select all visible'));
  assert(review.includes('Restore recommended selection'));
  assert(fasta.includes('Cannot use automatic search?'));
  assert(fasta.includes('Paste UniProt accessions'));
  assert(fasta.includes('Paste FASTA or prealigned FASTA'));
  assert(fasta.includes('Raw FASTA still requires a genuine multiple-sequence alignment'));
  assert(!fasta.includes('<details class="chem-note" open>'));
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

test('automatic homolog search submits an official EMBL-EBI BLAST job and never substitutes unrelated sequences', () => {
  const search = bodyOf('runAutomaticHomologSearch');
  const searchAsync = bodyOf('runAutomaticHomologSearchAsync');
  const params = bodyOf('homologSearchParameters');
  const submit = bodyOf('submitEbiBlastSearch');
  const poll = bodyOf('pollEbiBlastJob');
  const results = bodyOf('fetchEbiBlastResults');
  const normalize = bodyOf('normalizeEbiBlastResults');
  const validate = bodyOf('validateAutomaticHomologCandidates');
  const align = bodyOf('alignSelectedHomologs');
  assert(search.includes('runAutomaticHomologSearchAsync'));
  assert(params.includes('URLSearchParams'));
  assert(params.includes('serviceContactEmail'));
  assert(html.includes('homologServiceEmail'));
  assert(params.includes('uniprotkb_swissprot'));
  assert(submit.includes(`${'${EVOLUTION_ENDPOINTS.ebiBlast}/run'}`));
  assert(poll.includes(`${'${EVOLUTION_ENDPOINTS.ebiBlast}/status/'}`));
  assert(results.includes(`${'${EVOLUTION_ENDPOINTS.ebiBlast}/result/'}`));
  assert(poll.includes('timed out'));
  assert(searchAsync.includes('EMBL-EBI Job Dispatcher NCBI BLAST'));
  assert(searchAsync.includes("state.homologWorkflow.stage = 'candidates'"));
  assert(searchAsync.includes('No unrelated bundled sequences were substituted'));
  assert(searchAsync.includes('serverless proxy'));
  assert(normalize.includes('parseEbiBlastTsv'));
  assert(normalize.includes('fetchUniprotCandidate'));
  assert(validate.includes('searchReferenceKey'));
  assert(validate.includes('identity == null'));
  assert(validate.includes('queryCoverage == null'));
  assert(align.includes('does not pad sequences or fake an MSA'));
  assert(align.includes('Select at least three total sequences'));
});

test('invalid email and invalid query prevent submission with specific visible messages', () => {
  const validEmail = bodyOf('validServiceContactEmail');
  const validQuery = bodyOf('validProteinQuerySequence');
  const criteria = bodyOf('homologCriteriaMarkup');
  const searchAsync = bodyOf('runAutomaticHomologSearchAsync');
  assert(validEmail.includes('[^@\\s]+@[^@\\s]+\\.[^@\\s]+'));
  assert(validEmail.includes('/[<>\\s]/'));
  assert(validQuery.includes('ACDEFGHIKLMNPQRSTVWY'));
  assert(criteria.includes('Enter a valid contact email required by the search service.'));
  assert(criteria.includes('!emailValid'));
  assert(searchAsync.includes('Search was not submitted: the contact email is invalid.'));
  assert(searchAsync.includes('Search was not submitted: the reference query sequence is empty or contains unsupported amino-acid symbols.'));
});

test('search status reports phases and service errors without hiding response bodies', () => {
  const fetcher = bodyOf('fetchJsonWithExternalSignal');
  const failure = bodyOf('searchFailureMessage');
  const sanitizer = bodyOf('sanitizedServiceMessage');
  const submit = bodyOf('submitEbiBlastSearch');
  const poll = bodyOf('pollEbiBlastJob');
  const results = bodyOf('fetchEbiBlastResults');
  const searchAsync = bodyOf('runAutomaticHomologSearchAsync');
  assert(fetcher.includes('error.status = response.status'));
  assert(fetcher.includes('error.body = text'));
  assert(sanitizer.includes('[redacted email]'));
  assert(failure.includes('HTTP ${error.status}'));
  assert(failure.includes('CORS'));
  ['Validating query.', 'Submitting search.', 'Search queued:', 'Search running.', 'Retrieving results', 'Validating candidates.', 'Search complete:'].forEach(token => {
    assert(html.includes(token), `${token} missing`);
  });
  assert(submit.includes('Search queued:'));
  assert(poll.includes('Search running.'));
  assert(results.includes('Retrieving results'));
  assert(searchAsync.includes('The search completed but returned zero validated candidates under these criteria.'));
});

test('automatic homolog search has cancel, timeout, retry, and stale-reference boundaries', () => {
  const cancel = bodyOf('cancelHomologSearch');
  const criteria = bodyOf('homologCriteriaMarkup');
  const hasJob = bodyOf('homologSearchHasJob');
  const events = html.slice(html.indexOf("document.getElementById('evolutionCandidatePanel').addEventListener('click'"));
  const chainChange = html.slice(html.indexOf("const chain = event.target.closest('input[name=\"homologReferenceChain\"]')"), html.indexOf("const checkbox = event.target.closest('input[data-myoglobin-candidate]')"));
  assert(cancel.includes('abort'));
  assert(hasJob.includes('serviceStatus.jobId'));
  assert(hasJob.includes('queued'));
  assert(criteria.includes('Cancel Search'));
  assert(criteria.includes('Search for Homologs'));
  assert(criteria.includes('showCancel'));
  assert(events.includes("action === 'cancel-search'"));
  assert(events.includes('runAutomaticHomologSearch().finally'));
  assert(chainChange.includes('homologSearchIsRunning()'));
  assert(chainChange.includes('candidates = []'));
  assert(chainChange.includes('searchReferenceKey ='));
  assert(bodyOf('pollEbiBlastJob').includes('Search result ignored because the reference sequence changed.'));
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
  assert(save.includes('serviceContactEmail'));
  assert(save.includes('safeHomologWorkflow'));
  assert(save.includes('Session storage is not permanent'));
  assert(!provenance.includes('serviceContactEmail'));
  assert(!provenance.includes('studentObservations'));
  assert(!provenance.includes('studentName'));
});

console.log('Homolog import workflow checks passed.');
