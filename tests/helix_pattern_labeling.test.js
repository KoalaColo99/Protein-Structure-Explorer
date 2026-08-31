const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function bodyOf(functionName) {
  const start = html.indexOf(`function ${functionName}(`);
  assert(start >= 0, `${functionName} missing`);
  const next = html.indexOf('\n    function ', start + 1);
  return html.slice(start, next >= 0 ? next : start + 5000);
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('Helix Pattern Explorer uses qualified candidate labels', () => {
  assert(html.includes('Compare all candidate patterns'));
  assert(html.includes('α-like candidates, i to i+4'));
  assert(html.includes('3₁₀-like candidates, i to i+3'));
  assert(html.includes('π-like candidates, i to i+5'));
  assert(html.includes('Alpha-like candidate'));
  assert(html.includes('3₁₀-like candidate'));
  assert(html.includes('π-like candidate'));
  assert(html.includes('alpha-like candidate'));
  assert(html.includes('three-ten-like candidate'));
  assert(html.includes('pi-like candidate'));
});

test('Helix Pattern Explorer offers the requested view labels and method statement', () => {
  assert(html.includes('Candidate segments on whole structure'));
  assert(html.includes('Individual measured contacts'));
  assert(html.includes('These are geometry-based candidate assignments derived from hydrogen-bond spacing, local backbone geometry, minimum segment length, and the loaded coordinates. A single contact does not establish an entire helix type.'));
});

test('Helix Pattern Explorer summarizes contiguous segments before individual contacts', () => {
  const populate = bodyOf('populateHelixPatternList');
  assert(populate.includes("state.helixType === 'all'"));
  assert(populate.includes('segments.map'));
  assert(populate.includes('No contiguous candidate segments'));
  const draw = bodyOf('drawHelixPatterns');
  assert(draw.includes("state.helixType === 'all'"));
  assert(draw.includes('drawWholeHelixOverlay'));
});

console.log('Helix pattern labeling checks passed.');
