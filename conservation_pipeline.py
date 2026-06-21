#!/usr/bin/env python3
"""
Conservation mapping pipeline for Protein Structure & Chemistry Explorer.

Given one reference PDB ID and 4-6 comparison PDB IDs, this script:
1. Downloads PDB structures and FASTA files from RCSB.
2. Parses protein sequences from ATOM/CA records.
3. Aligns each comparison sequence to the reference sequence.
4. Calculates per-reference-residue conservation.
5. Writes conservation scores into the reference PDB B-factor column.
6. Exports a CSV table and PyMOL/ChimeraX coloring helpers.

Example:
    python3 conservation_pipeline.py \
        --reference 1MBN \
        --comparisons 1YOG 1M6M 3VM9 1WLA \
        --reference-chain A \
        --out conservation_1MBN
"""

from __future__ import annotations

import argparse
import csv
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path


AA3_TO_1 = {
    "ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C",
    "GLN": "Q", "GLU": "E", "GLY": "G", "HIS": "H", "ILE": "I",
    "LEU": "L", "LYS": "K", "MET": "M", "PHE": "F", "PRO": "P",
    "SER": "S", "THR": "T", "TRP": "W", "TYR": "Y", "VAL": "V",
    "MSE": "M",
}


@dataclass(frozen=True)
class Residue:
    chain: str
    resseq: int
    icode: str
    resname: str
    aa: str

    @property
    def key(self) -> tuple[str, int, str]:
        return (self.chain, self.resseq, self.icode)

    @property
    def label(self) -> str:
        suffix = self.icode.strip()
        return f"{self.chain}:{self.resname}{self.resseq}{suffix}"


@dataclass
class StructureSequence:
    pdb_id: str
    chain: str
    residues: list[Residue]
    sequence: str
    pdb_text: str


def download_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "ProteinStructureChemistryExplorer/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def fetch_rcsb_files(pdb_id: str, cache_dir: Path) -> tuple[str, str | None]:
    pdb_id = pdb_id.upper()
    cache_dir.mkdir(parents=True, exist_ok=True)
    pdb_path = cache_dir / f"{pdb_id}.pdb"
    fasta_path = cache_dir / f"{pdb_id}.fasta"

    if pdb_path.exists():
        pdb_text = pdb_path.read_text()
    else:
        pdb_text = download_text(f"https://files.rcsb.org/download/{pdb_id}.pdb")
        pdb_path.write_text(pdb_text)

    fasta_text = None
    try:
        if fasta_path.exists():
            fasta_text = fasta_path.read_text()
        else:
            fasta_text = download_text(f"https://www.rcsb.org/fasta/entry/{pdb_id}")
            fasta_path.write_text(fasta_text)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"Warning: FASTA download failed for {pdb_id}: {exc}", file=sys.stderr)

    return pdb_text, fasta_text


def parse_atom_sequences(pdb_id: str, pdb_text: str) -> dict[str, list[Residue]]:
    chains: dict[str, list[Residue]] = {}
    seen: set[tuple[str, int, str]] = set()
    for line in pdb_text.splitlines():
        if not line.startswith("ATOM"):
            continue
        atom_name = line[12:16].strip()
        if atom_name != "CA":
            continue
        resname = line[17:20].strip()
        aa = AA3_TO_1.get(resname)
        if not aa:
            continue
        chain = line[21:22].strip() or "_"
        try:
            resseq = int(line[22:26])
        except ValueError:
            continue
        icode = line[26:27].strip()
        key = (chain, resseq, icode)
        if key in seen:
            continue
        seen.add(key)
        chains.setdefault(chain, []).append(Residue(chain, resseq, icode, resname, aa))
    if not chains:
        raise ValueError(f"No standard protein CA atoms found in {pdb_id}")
    return chains


def choose_chain(pdb_id: str, chains: dict[str, list[Residue]], requested: str | None) -> str:
    if requested:
        requested = requested.strip() or "_"
        if requested not in chains:
            available = ", ".join(sorted(chains))
            raise ValueError(f"{pdb_id} chain {requested} not found. Available chains: {available}")
        return requested
    return max(chains, key=lambda chain: len(chains[chain]))


def load_structure_sequence(pdb_id: str, cache_dir: Path, chain: str | None = None) -> StructureSequence:
    pdb_text, _ = fetch_rcsb_files(pdb_id, cache_dir)
    chains = parse_atom_sequences(pdb_id.upper(), pdb_text)
    chosen_chain = choose_chain(pdb_id.upper(), chains, chain)
    residues = chains[chosen_chain]
    sequence = "".join(residue.aa for residue in residues)
    return StructureSequence(pdb_id.upper(), chosen_chain, residues, sequence, pdb_text)


def needleman_wunsch(ref: str, query: str) -> tuple[str, str]:
    match_score = 2
    mismatch_score = -1
    gap_score = -2
    rows = len(ref) + 1
    cols = len(query) + 1
    score = [[0] * cols for _ in range(rows)]
    trace = [[""] * cols for _ in range(rows)]

    for i in range(1, rows):
        score[i][0] = i * gap_score
        trace[i][0] = "up"
    for j in range(1, cols):
        score[0][j] = j * gap_score
        trace[0][j] = "left"

    for i in range(1, rows):
        for j in range(1, cols):
            diag = score[i - 1][j - 1] + (match_score if ref[i - 1] == query[j - 1] else mismatch_score)
            up = score[i - 1][j] + gap_score
            left = score[i][j - 1] + gap_score
            best = max(diag, up, left)
            score[i][j] = best
            trace[i][j] = "diag" if best == diag else "up" if best == up else "left"

    aligned_ref: list[str] = []
    aligned_query: list[str] = []
    i = len(ref)
    j = len(query)
    while i > 0 or j > 0:
        direction = trace[i][j]
        if i > 0 and j > 0 and direction == "diag":
            aligned_ref.append(ref[i - 1])
            aligned_query.append(query[j - 1])
            i -= 1
            j -= 1
        elif i > 0 and (direction == "up" or j == 0):
            aligned_ref.append(ref[i - 1])
            aligned_query.append("-")
            i -= 1
        else:
            aligned_ref.append("-")
            aligned_query.append(query[j - 1])
            j -= 1

    return "".join(reversed(aligned_ref)), "".join(reversed(aligned_query))


def conservation_scores(reference: StructureSequence, comparisons: list[StructureSequence]) -> list[dict[str, object]]:
    rows = []
    matches = [0] * len(reference.sequence)
    compared = [0] * len(reference.sequence)
    matching_ids: list[list[str]] = [[] for _ in reference.sequence]

    for comp in comparisons:
        aligned_ref, aligned_comp = needleman_wunsch(reference.sequence, comp.sequence)
        ref_pos = -1
        for ref_aa, comp_aa in zip(aligned_ref, aligned_comp):
            if ref_aa != "-":
                ref_pos += 1
            if ref_aa == "-" or comp_aa == "-":
                continue
            compared[ref_pos] += 1
            if ref_aa == comp_aa:
                matches[ref_pos] += 1
                matching_ids[ref_pos].append(f"{comp.pdb_id}:{comp.chain}")

    for index, residue in enumerate(reference.residues):
        total = compared[index]
        score = matches[index] / total if total else 0.0
        rows.append({
            "ref_index": index + 1,
            "chain": residue.chain,
            "resseq": residue.resseq,
            "icode": residue.icode,
            "resname": residue.resname,
            "aa": residue.aa,
            "conservation_score": score,
            "conservation_percent": round(score * 100, 2),
            "matches": matches[index],
            "compared": total,
            "fully_conserved": total > 0 and matches[index] == total,
            "matching_pdb_ids": ";".join(matching_ids[index]),
        })
    return rows


def write_bfactor_pdb(reference: StructureSequence, rows: list[dict[str, object]], output_path: Path) -> None:
    score_by_key = {
        (row["chain"], int(row["resseq"]), str(row["icode"])): float(row["conservation_score"]) * 100.0
        for row in rows
    }
    out_lines = []
    for line in reference.pdb_text.splitlines():
        if line.startswith(("ATOM", "HETATM")) and len(line) >= 66:
            chain = line[21:22].strip() or "_"
            try:
                resseq = int(line[22:26])
            except ValueError:
                out_lines.append(line)
                continue
            icode = line[26:27].strip()
            key = (chain, resseq, icode)
            if key in score_by_key:
                bfactor = f"{score_by_key[key]:6.2f}"
                line = f"{line[:60]}{bfactor}{line[66:]}"
        out_lines.append(line)
    output_path.write_text("\n".join(out_lines) + "\n")


def write_csv(rows: list[dict[str, object]], output_path: Path) -> None:
    fieldnames = [
        "ref_index", "chain", "resseq", "icode", "resname", "aa",
        "conservation_score", "conservation_percent", "matches", "compared",
        "fully_conserved", "matching_pdb_ids",
    ]
    with output_path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_viewer_scripts(prefix: Path, pdb_name: str) -> None:
    prefix.with_suffix(".pml").write_text(
        "\n".join([
            f"load {pdb_name}",
            "spectrum b, blue_white_red, minimum=0, maximum=100",
            "show cartoon",
            "set cartoon_transparency, 0.0",
            "bg_color white",
            "zoom",
            "",
        ])
    )
    prefix.with_suffix(".cxc").write_text(
        "\n".join([
            f"open {pdb_name}",
            "cartoon",
            "color byattribute bfactor palette blue:white:red range 0,100",
            "lighting soft",
            "view",
            "",
        ])
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Map sequence conservation onto reference PDB B-factors.")
    parser.add_argument("--reference", required=True, help="Reference PDB ID, e.g. 1MBN")
    parser.add_argument("--comparisons", nargs="+", required=True, help="4-6 comparison PDB IDs")
    parser.add_argument("--reference-chain", default=None, help="Reference chain ID. Defaults to longest protein chain.")
    parser.add_argument("--comparison-chain", default=None, help="Comparison chain ID for all comparisons. Defaults to longest protein chain in each comparison.")
    parser.add_argument("--out", default=None, help="Output directory. Defaults to conservation_<reference>.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not 4 <= len(args.comparisons) <= 6:
        print("Warning: this teaching pipeline is designed for 4-6 comparison PDB IDs.", file=sys.stderr)

    out_dir = Path(args.out or f"conservation_{args.reference.upper()}").resolve()
    cache_dir = out_dir / "pdb_cache"
    out_dir.mkdir(parents=True, exist_ok=True)

    reference = load_structure_sequence(args.reference, cache_dir, args.reference_chain)
    comparisons = [
        load_structure_sequence(pdb_id, cache_dir, args.comparison_chain)
        for pdb_id in args.comparisons
    ]

    rows = conservation_scores(reference, comparisons)
    prefix = out_dir / f"{reference.pdb_id}_{reference.chain}_conservation"
    pdb_path = prefix.with_suffix(".pdb")
    csv_path = prefix.with_suffix(".csv")
    write_bfactor_pdb(reference, rows, pdb_path)
    write_csv(rows, csv_path)
    write_viewer_scripts(prefix, pdb_path.name)

    fully_conserved = sum(1 for row in rows if row["fully_conserved"])
    print(f"Reference: {reference.pdb_id}:{reference.chain} ({len(reference.residues)} residues)")
    print("Comparisons: " + ", ".join(f"{item.pdb_id}:{item.chain}" for item in comparisons))
    print(f"Fully conserved residues: {fully_conserved} / {len(rows)}")
    print(f"Wrote: {pdb_path}")
    print(f"Wrote: {csv_path}")
    print(f"Wrote: {prefix.with_suffix('.pml')}")
    print(f"Wrote: {prefix.with_suffix('.cxc')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
