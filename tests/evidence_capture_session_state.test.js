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

test('shared session-state model preserves reproducible non-personal activity state', () => {
  const serialize = bodySlice('serializeSessionState', 'restoreSessionState');
  [
    'pdbId',
    'structureSource',
    'model',
    'chain',
    'selectedResidueIndex',
    'selectedResidues',
    'studentMode',
    'pathway',
    'tool',
    'pH',
    'representation',
    'palette',
    'visibleCategories'
  ].forEach(field => assert(serialize.includes(field), `${field} missing from session serialization`));
  assert(serialize.includes('if (options.includeResponses)'));
});

test('shareable activity links encode safe state without automatic student responses', () => {
  const create = bodySlice('createActivityLink', 'structureSummaryPayload');
  assert(create.includes("serializeSessionState({ includeInstructor: true, includeResponses: false })"));
  assert(create.includes("params.set('activity'"));
  assert(create.includes('Student responses were not encoded'));
  assert(html.includes('id="activityLinkOutput"'));
  assert(html.includes('Activity links encode safe setup state only'));
});

test('activity restoration validates malformed and unsupported URL parameters', () => {
  const decode = bodySlice('decodeActivityState', 'validateActivityState');
  const validate = bodySlice('validateActivityState', 'selectedResidueSnapshot');
  const route = bodySlice('readStudentRouteFromUrl', 'setStudentMode');
  assert(decode.includes('Malformed activity link state was ignored'));
  assert(validate.includes('Invalid PDB ID was ignored'));
  assert(validate.includes('Unsupported tool was ignored'));
  assert(validate.includes('Unsupported pathway was ignored'));
  assert(route.includes("params.get('activity')"));
  assert(route.includes('state.pendingActivityState'));
});

test('restoration applies structure pathway tool pH palette representation and visible categories', () => {
  const restore = bodySlice('restoreSessionState', 'calculationDisclosure');
  [
    'state.structureId = activity.pdbId',
    'state.selectedResidueIndex',
    'state.selectedStabilityResidueIndex',
    'state.studentMode',
    'state.activePathway',
    'state.pH',
    'state.phCompare',
    'state.proteinView',
    'state.paletteMode',
    'state.contactType',
    'state.stabilityToggles'
  ].forEach(snippet => assert(restore.includes(snippet), `${snippet} missing from restore`));
  const load = bodySlice('loadInitialStructure', 'loadStructureById');
  assert(load.includes('state.pendingActivityState'));
  assert(load.includes('await loadStructureById(requestedId'));
});

test('Molecular Evidence Card includes provenance view quantitative CER assumptions timestamp and version', () => {
  const payload = bodySlice('molecularEvidencePayload', 'viewTextEquivalent');
  [
    'atlasVersion',
    'timestamp',
    'structure',
    'source',
    'capturedMolecularView',
    'textEquivalent',
    'quantitativeObservations',
    'studentClaim',
    'supportingEvidence',
    'reasoning',
    'assumptionsAndThresholds'
  ].forEach(field => assert(payload.includes(field), `${field} missing from evidence payload`));
  assert(html.includes('id="molecularEvidenceCard"'));
});

test('exports include PNG SVG CSV Markdown JSON and printable CER affordances', () => {
  [
    'downloadViewerImage',
    'downloadCurrentPlotSvg',
    'downloadMeasurementsCsv',
    'downloadMarkdownSummary',
    'downloadStructureSummary',
    'downloadCerReport'
  ].forEach(name => assert(html.includes(`function ${name}(`), `${name} export missing`));
  assert(html.includes('id="downloadPlotSvg"'));
  assert(html.includes('id="downloadMeasurementsCsv"'));
  assert(html.includes('id="downloadMarkdownSummary"'));
  assert(html.includes('id="downloadCerReport"'));
});

test('CSV and Markdown exports include textual equivalents instead of relying only on screenshots', () => {
  const csv = bodySlice('selectedMeasurementsCsv', 'markdownEvidenceSummary');
  const markdown = bodySlice('markdownEvidenceSummary', 'printableCerHtml');
  assert(csv.includes('structure_id'));
  assert(csv.includes('phi'));
  assert(csv.includes('sasa'));
  assert(markdown.includes('Text Equivalent For Visual Evidence'));
  assert(markdown.includes('Assumptions And Thresholds'));
});

test('printable CER report is answer-neutral and locally generated', () => {
  const report = bodySlice('printableCerHtml', 'currentPlotSvg');
  assert(report.includes('Printable CER Report'));
  assert(report.includes('Claim'));
  assert(report.includes('Evidence'));
  assert(report.includes('Reasoning'));
  assert(report.includes('Instructor Prompt And Checklist'));
  assert(report.includes('No screenshot was captured'));
});

test('privacy boundary avoids accounts external transmission and automatic student-response URLs', () => {
  assert(html.includes('No student account or external submission is used'));
  assert(html.includes('Student responses were not encoded'));
  assert(!html.includes('fetch(`https://') || html.includes('files.rcsb.org/download'));
  const create = bodySlice('createActivityLink', 'structureSummaryPayload');
  assert(!create.includes('studentObservations'));
});

test('loss of WebGL during a session still renders non-3D evidence tools', () => {
  const apply = bodySlice('applyMode', 'escapeHtml');
  assert(apply.includes("if (state.mode === 'torsions') drawTorsion()"));
  assert(apply.includes("if (state.mode === 'tertiary') drawContacts()"));
  assert(apply.includes("if (state.mode === 'ph') drawPhMode()"));
  assert(apply.includes('renderMolecularEvidenceCard()'));
});

console.log('Evidence capture and session-state checks passed.');
