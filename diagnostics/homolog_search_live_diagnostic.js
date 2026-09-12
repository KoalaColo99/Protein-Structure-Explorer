#!/usr/bin/env node
/*
 * Live diagnostic for the Conservation Analysis automatic homolog search.
 *
 * This file is intentionally outside tests/*.js so it is not part of the
 * deterministic regression suite. It contacts EMBL-EBI Job Dispatcher NCBI
 * BLAST, which may fail because of network policy, service limits, service
 * downtime, or missing/invalid fair-use contact details.
 */

const assert = require('assert');

const EBI_BLAST = 'https://www.ebi.ac.uk/Tools/services/rest/ncbiblast';
const CONTACT_EMAIL = process.env.BVA_EBI_CONTACT_EMAIL || 'biochemistry.visual.atlas@example.org';
const QUERY_1CA2_CHAIN_A = [
  '>1CA2_A carbonic anhydrase 2 coordinate-derived query',
  'SHHWGYGKHNGPEHWHKDFPIAKGERQSPVDIDTHTAKYDPSLKPLSVSYDQATSLRILNNGHAFNVEFDDSQDKAVLKGGPLDGTYRLIQFHFHWGSSDDQGSEHTVDKKSFPSEHTADRIQYVQELGHHYSPDVVLPAGPLDGGLTYHVQGTVHGQEVVLSN'
].join('\n');

async function fetchText(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function parseTsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
  const header = lines.shift().split('\t');
  const get = label => header.findIndex(item => item.toLowerCase() === label.toLowerCase());
  const accession = get('Accession');
  const description = get('Description');
  const organism = get('Organism');
  const identity = get('Identities(%)');
  const evalue = get('E()');
  return lines.map(line => {
    const cells = line.split('\t');
    return {
      accession: cells[accession],
      description: cells[description],
      organism: cells[organism],
      identity: Number(cells[identity]),
      evalue: cells[evalue]
    };
  }).filter(row => row.accession);
}

async function main() {
  assert(typeof fetch === 'function', 'Node 18+ fetch is required.');
  const body = new URLSearchParams({
    email: CONTACT_EMAIL,
    title: 'BVA_1CA2_diagnostic',
    sequence: QUERY_1CA2_CHAIN_A,
    program: 'blastp',
    database: 'uniprotkb_swissprot',
    stype: 'protein',
    matrix: 'BLOSUM62',
    exp: '1e-5',
    scores: '50',
    alignments: '50',
    filter: 'F'
  });
  console.log('Submitting EMBL-EBI NCBI BLAST diagnostic for 1CA2 chain A...');
  const jobId = (await fetchText(`${EBI_BLAST}/run`, {
    method: 'POST',
    headers: { Accept: 'text/plain', 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })).trim();
  assert(jobId.startsWith('ncbiblast-'), `Unexpected job id: ${jobId}`);
  console.log(`Job id: ${jobId}`);

  let ready = false;
  for (let poll = 1; poll <= 30; poll++) {
    const status = (await fetchText(`${EBI_BLAST}/status/${encodeURIComponent(jobId)}`, {
      headers: { Accept: 'text/plain' }
    }, 20000)).trim();
    console.log(`Poll ${poll}: ${status}`);
    if (/FINISHED/i.test(status)) {
      ready = true;
      break;
    }
    if (/ERROR|FAIL|FAILED|NOT_FOUND|EXPIRED/i.test(status)) throw new Error(`Job failed: ${status}`);
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  assert(ready, 'EMBL-EBI BLAST job did not finish within the diagnostic polling window.');

  const tsv = await fetchText(`${EBI_BLAST}/result/${encodeURIComponent(jobId)}/tsv`, {
    headers: { Accept: 'text/tab-separated-values, text/plain' }
  }, 30000);
  const hits = parseTsv(tsv);
  console.log(`Top hits: ${hits.slice(0, 10).map(hit => `${hit.accession} ${hit.identity}%`).join(', ')}`);
  assert(hits.length > 0, 'No candidate hits were parsed from the BLAST TSV result.');
  assert.strictEqual(hits[0].accession, 'P00918', 'Expected 1CA2 chain A to resolve first to UniProt P00918.');
  console.log('Live diagnostic completed. Direct EMBL-EBI BLAST returned parseable 1CA2/P00918 candidate results.');
}

main().catch(error => {
  console.error(`Live diagnostic failed: ${error.message}`);
  process.exitCode = 1;
});
