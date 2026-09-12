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

test('All Atlas Tools index is present without changing the quiet homepage cards', () => {
  assert(html.includes('id="allAtlasToolsIndex"'));
  assert(html.includes('All Atlas Tools'));
  assert(html.includes('data-home-pathway="sequence_structure"'));
  assert(html.includes('data-home-pathway="folded_stability"'));
  assert(html.includes('data-home-pathway="ph_effects"'));
  assert(html.includes('data-home-pathway="structure_function"'));
  assert(!html.includes('data-home-pathway="protein_evolution"'));
});

test('active route-capable tools are reachable through navigation or All Atlas Tools', () => {
  [
    'overview',
    'sequence',
    'torsions',
    'hbonds',
    'tertiary',
    'helixPatterns',
    'betaTopology',
    'solvent',
    'hydrophobic',
    'ph',
    'chemistry',
    'chargeSurface',
    'ligands',
    'activeSite',
    'conservation',
    'mutation',
    'comparison',
    'gallery'
  ].forEach(mode => {
    assert(html.includes(`id="${mode}Panel"`), `${mode}Panel should exist`);
    assert(
      html.includes(`data-mode="${mode}"`) || html.includes(`data-atlas-tool="${mode}"`) || html.includes(`toolMode: '${mode}'`),
      `${mode} should be visible, indexed, or pathway-linked`
    );
  });
});

test('legacy and unavailable panels have explicit classifications', () => {
  assert(html.includes('id="lessonPanel"'));
  assert(html.includes('<strong>Legacy Guided Lesson</strong>'));
  assert(html.includes('intentionally hidden from student navigation'));
  assert(html.includes('<strong>AlphaFold roadmap</strong>'));
  assert(!html.includes('data-mode="lesson"'));
});

test('Rubisco case study route is active and separate from current-protein conservation', () => {
  assert(html.includes('data-mode="sequence">Rubisco Visual Evolution Explorer</button>'));
  assert(html.includes('Case study:</strong> Rubisco RbcL Evolution'));
  assert(html.includes('Structure workspace preserved'));
  assert(html.includes('This sequence dataset is not currently mapped to the molecular structure shown in Structure mode.'));
  assert(html.includes("if (state.mode === 'sequence')"));
  assert(html.includes('renderCuratedSequencePanel()'));
  const conservation = bodyOf('drawConservation');
  assert(conservation.includes('It will not substitute any unrelated curated dataset'));
});

test('pathway Explore Further links cover preserved workspace tools and pH subtools', () => {
  [
    'PATHWAY_EXPLORE_FURTHER_TOOLS',
    "toolMode: 'torsions'",
    "toolMode: 'hbonds'",
    "toolMode: 'helixPatterns'",
    "toolMode: 'betaTopology'",
    "toolMode: 'hydrophobic'",
    "toolMode: 'solvent'",
    "toolMode: 'ph'",
    "targetId: 'aminoAcidSelect'",
    "targetId: 'peptideSequenceInput'",
    "targetId: 'bufferPkaSlider'",
    "toolMode: 'conservation'",
    "toolMode: 'sequence'",
    "targetId: 'molecularEvidenceCard'"
  ].forEach(snippet => assert(html.includes(snippet), `${snippet} missing`));
  const render = bodyOf('renderExploreFurtherToolLinks');
  assert(render.includes('data-open-guided-tool'));
  assert(render.includes('data-open-guided-target'));
});

test('All Atlas Tools buttons open existing tools and highlight embedded subsections', () => {
  const open = bodyOf('openWorkspaceTool');
  assert(open.includes("if (mode === 'sequence') preserveProteinWorkspace()"));
  assert(open.includes('ensureAtlasStarted({ readRoute: false, viewerTargetId:'));
  assert(open.includes('highlightWorkspaceTarget(targetId)'));
  const highlight = bodyOf('highlightWorkspaceTarget');
  assert(highlight.includes('scrollIntoView'));
  assert(highlight.includes('atlas-target-highlight'));
  assert(html.includes("document.getElementById('allAtlasToolsIndex')?.addEventListener('click'"));
});

console.log('Tool reachability navigation checks passed.');
