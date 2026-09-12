#!/usr/bin/env node
/*
 * Live diagnostic for the Conservation Analysis automatic homolog search.
 *
 * This file is intentionally outside tests/*.js so it is not part of the
 * deterministic regression suite. It contacts RCSB, UniProt, and EMBL-EBI Job
 * Dispatcher NCBI BLAST, which may fail because of network policy, service
 * limits, service downtime, or missing/invalid fair-use contact details.
 */

const assert = require('assert');

const EBI_BLAST = 'https://www.ebi.ac.uk/Tools/services/rest/ncbiblast';
const RCSB_FILES = 'https://files.rcsb.org/download';
const RCSB_DATA = 'https://data.rcsb.org/rest/v1/core';
const UNIPROT = 'https://rest.uniprot.org/uniprotkb';
const CONTACT_EMAIL = process.env.BVA_EBI_CONTACT_EMAIL || 'biochemistry.visual.atlas@example.org';

const THREE_TO_ONE = {
  ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C', GLN: 'Q', GLU: 'E',
  GLY: 'G', HIS: 'H', ILE: 'I', LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F',
  PRO: 'P', SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V', MSE: 'M'
};

function sequenceHash(sequence = '') {
  let hash = 2166136261;
  for (let index = 0; index < sequence.length; index++) {
    hash ^= sequence.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

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

async function fetchJson(url, timeoutMs = 20000) {
  return JSON.parse(await fetchText(url, { headers: { Accept: 'application/json' } }, timeoutMs));
}

function coordinateSequenceFromPdb(pdbText, chain) {
  const residues = new Map();
  for (const line of pdbText.split(/\r?\n/)) {
    if (line.slice(0, 6).trim() !== 'ATOM') continue;
    const resn = line.slice(17, 20).trim();
    if (!THREE_TO_ONE[resn]) continue;
    const atomChain = line.slice(21, 22).trim() || 'A';
    if (atomChain !== chain) continue;
    const resi = Number(line.slice(22, 26));
    const insertion = line.slice(26, 27).trim();
    const key = `${atomChain}:${resi}:${insertion}`;
    if (!residues.has(key)) residues.set(key, { resn, resi, insertion });
  }
  return [...residues.values()].map(residue => THREE_TO_ONE[residue.resn]).join('');
}

async function resolveSequences(pdbId, chain) {
  const pdb = pdbId.toLowerCase();
  const pdbText = await fetchText(`${RCSB_FILES}/${pdbId.toUpperCase()}.pdb`);
  const coordinateSequence = coordinateSequenceFromPdb(pdbText, chain);
  const instance = await fetchJson(`${RCSB_DATA}/polymer_entity_instance/${pdb}/${encodeURIComponent(chain)}`);
  const entityId = instance.rcsb_polymer_entity_instance_container_identifiers?.entity_id
    || instance.rcsb_polymer_entity_instance_container_identifiers?.entity_ids?.[0];
  const entity = await fetchJson(`${RCSB_DATA}/polymer_entity/${pdb}/${entityId}`);
  const identifiers = entity.rcsb_polymer_entity_container_identifiers || {};
  const uniprot = (identifiers.reference_sequence_identifiers || []).find(item => /uniprot/i.test(item.database_name || ''))?.database_accession
    || identifiers.uniprot_ids?.[0]
    || '';
  const entitySequence = (entity.entity_poly?.pdbx_seq_one_letter_code_can || '').replace(/\s/g, '');
  const uniprotRecord = uniprot ? await fetchJson(`${UNIPROT}/${encodeURIComponent(uniprot)}.json`) : null;
  const canonicalSequence = uniprotRecord?.sequence?.value || '';
  const useCanonical = Boolean(canonicalSequence && Math.abs(canonicalSequence.length - coordinateSequence.length) <= Math.max(3, coordinateSequence.length * 0.08));
  const querySequence = useCanonical ? canonicalSequence : coordinateSequence;
  const querySource = useCanonical ? 'UniProt canonical sequence' : 'coordinate-derived chain sequence';
  return {
    pdbId: pdbId.toUpperCase(),
    chain,
    entityId,
    uniprot,
    coordinateSequence,
    entitySequence,
    canonicalSequence,
    querySequence,
    querySource,
    hash: sequenceHash(querySequence)
  };
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

async function runBlast(sequenceInfo) {
  const fasta = `>${sequenceInfo.pdbId}_${sequenceInfo.chain} ${sequenceInfo.querySource}; ${sequenceInfo.querySequence.length} aa; hash ${sequenceInfo.hash}\n${sequenceInfo.querySequence}`;
  const body = new URLSearchParams({
    email: CONTACT_EMAIL,
    title: `BVA_${sequenceInfo.pdbId}_${sequenceInfo.chain}_diagnostic`,
    sequence: fasta,
    program: 'blastp',
    database: 'uniprotkb_swissprot',
    stype: 'protein',
    matrix: 'BLOSUM62',
    exp: '1e-5',
    scores: '50',
    alignments: '50',
    filter: 'F'
  });
  console.log(`Submitting ${sequenceInfo.pdbId} chain ${sequenceInfo.chain}: ${sequenceInfo.querySource}, ${sequenceInfo.querySequence.length} aa, hash ${sequenceInfo.hash}`);
  const jobId = (await fetchText(`${EBI_BLAST}/run`, {
    method: 'POST',
    headers: { Accept: 'text/plain', 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })).trim();
  assert(jobId.startsWith('ncbiblast-'), `Unexpected job id: ${jobId}`);

  let ready = false;
  for (let poll = 1; poll <= 30; poll++) {
    const status = (await fetchText(`${EBI_BLAST}/status/${encodeURIComponent(jobId)}`, {
      headers: { Accept: 'text/plain' }
    }, 20000)).trim();
    console.log(`${sequenceInfo.pdbId} ${jobId} poll ${poll}: ${status}`);
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
  console.log(`${sequenceInfo.pdbId} top hits: ${hits.slice(0, 8).map(hit => `${hit.accession} ${hit.identity}% ${hit.organism}`).join('; ')}`);
  return { jobId, hits };
}

async function main() {
  assert(typeof fetch === 'function', 'Node 18+ fetch is required.');
  const checks = [
    { pdbId: '1MBN', chain: 'A', expectedTop: 'P02185' },
    { pdbId: '1CA2', chain: 'A', expectedTop: 'P00918' },
    { pdbId: '1AFQ', chain: 'B', expectedTop: 'P00766' }
  ];
  for (const check of checks) {
    const sequenceInfo = await resolveSequences(check.pdbId, check.chain);
    console.log(`${check.pdbId} chain ${check.chain}: coordinate ${sequenceInfo.coordinateSequence.length} aa, RCSB entity ${sequenceInfo.entitySequence.length} aa, UniProt ${sequenceInfo.uniprot || 'none'} canonical ${sequenceInfo.canonicalSequence.length || 'n/a'} aa.`);
    const result = await runBlast(sequenceInfo);
    assert(result.hits.length > 0, 'No candidate hits were parsed from the BLAST TSV result.');
    assert.strictEqual(result.hits[0].accession, check.expectedTop, `Expected ${check.pdbId} chain ${check.chain} to resolve first to UniProt ${check.expectedTop}.`);
    console.log(`Live diagnostic completed for ${check.pdbId}: job ${result.jobId}, raw hits ${result.hits.length}.`);
  }
}

main().catch(error => {
  console.error(`Live diagnostic failed: ${error.message}`);
  process.exitCode = 1;
});
