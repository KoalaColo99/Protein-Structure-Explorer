# Protein Structure & Chemistry Explorer User Guide

## What This Tool Is

The Protein Structure & Chemistry Explorer is an interactive teaching tool for connecting protein structure to chemical reasoning. It opens with myoglobin 1MBN, but students can load other RCSB PDB IDs and inspect the same kinds of structural features when the needed coordinates are available.

The tool is designed for guided exploration rather than one-click answers. Many overlays are heuristic teaching aids, so students should use them to generate evidence-based claims and then compare those claims with the 3D structure.

## Getting Started

Open `index.html` in a browser. The structure viewer is on the left, and the feature controls are on the right.

Use the mouse or trackpad to rotate, zoom, and pan the molecule. Use the Display controls to change the protein representation:

- Cartoon / ribbon: best for overall fold and secondary structure.
- Trace / backbone: best for following the alpha-carbon path.
- Wireframe / sticks: best for atom-level chemistry and noncovalent contacts.
- Space-filling: best for volume, packing, and steric fit.
- Surface rendering: best for pockets, solvent exposure, and exterior charge patches.

The default palette is color-blind safe. The atom zoom option shows more atom detail when the view is focused on specific contacts.

## Loading Proteins

Use Gallery Builder to choose a class of protein and suggested examples, or enter a 4-character PDB ID manually.

To enter your own structure:

1. Click **Gallery Builder**.
2. Find the **PDB ID** text box.
3. Type one valid 4-character RCSB PDB code, such as `1MBN`, `1CA2`, `2PTN`, or `6LU7`.
4. Use letters and numbers only. Spaces, punctuation, protein names, and full URLs should not be entered in this box.
5. Click **Load structure**.

Correct examples:

```text
1MBN
1CA2
2PTN
6LU7
```

Incorrect examples:

```text
myoglobin
PDB 1MBN
https://www.rcsb.org/structure/1MBN
1MBN, 1YOG
```

The manual PDB ID box loads **one reference structure at a time**. When a new structure loads, the tool recomputes residues, backbone hydrogen bonds, phi/psi values, side-chain contacts, solvent accessibility, hydrophobic regions, charge surfaces, beta-sheet records, ligand/cofactor contacts, and helix-pattern candidates from the loaded coordinates.

Some features require curated comparison data. If that data is not available, the tool says unavailable instead of showing unrelated results.

## Feature Guide

### Overview

Shows the full protein fold. Cartoon view makes helices, sheets, loops, domains, and overall packing easier to see. It hides atom identity, partial charges, lone pairs, resonance, and many side-chain contacts, so students should switch to atom-level views when making chemical arguments.

### Backbone H-bonds

Highlights candidate backbone hydrogen bonds that stabilize secondary structure. Dashed lines connect carbonyl oxygens and backbone nitrogens. Thicker lines indicate shorter contacts. When a contact is selected, atom labels help students identify donor and acceptor atoms.

Students can glean:

- Which backbone atoms participate in H-bonds.
- Whether repeated H-bond patterns support helices or other secondary structures.
- How distance and approximate angle affect contact strength.

### Helix Patterns

Compares alpha helices, 3-10 helices, and pi helices using H-bond spacing, minimum length, phi/psi ranges, rise per residue, pitch, approximate radius, and ring size.

Students can glean:

- Alpha helix: C=O(i) to H-N(i+4), about 3.6 residues/turn.
- 3-10 helix: C=O(i) to H-N(i+3), often shorter and tighter.
- Pi helix: C=O(i) to H-N(i+5), wider and rarer.
- Whether the loaded protein contains candidate helix regions that fit those teaching ranges.

These are candidate calls, not a full DSSP secondary-structure assignment.

### Phi / Psi Angles

Shows backbone torsion angles for individual residues and plots them on a Ramachandran diagram. The plot labels broad regions associated with beta/extended conformations, alpha helix, 3-10 helix, pi helix, and left-handed helix.

Students can glean:

- How backbone rotation contributes to protein conformation.
- Why different secondary structures occupy different phi/psi regions.
- Which residues fall outside common regions and may represent turns, strain, or special local geometry.

### Side-chain Contacts

Shows tertiary structure contacts among side chains and cofactors. Contact types include salt bridges, side-chain H-bonds, hydrophobic contacts, and heme/ligand neighborhoods when present.

Students can glean:

- How residues far apart in sequence can interact in 3D.
- Which atoms form specific contacts.
- Whether a contact is likely electrostatic, polar, hydrophobic, or ligand-associated.

### Chemistry Lens

Zooms in on chemical features behind interactions. The current options include backbone H-bond donor/acceptor chemistry, carboxylate resonance, peptide bond resonance, arginine guanidinium resonance, salt bridge charge pairing, and heme/cofactor polarity.

Students can glean:

- Which atoms tend to be electron-rich or electron-poor.
- Where lone pairs and partial charges help explain interactions.
- How resonance delocalizes charge in carboxylates, peptide bonds, and guanidinium groups.
- How ligand or cofactor environments depend on nearby protein atoms.

### pH & Charge

Uses typical teaching pKa values to estimate the fraction of an ionizable group that is charged at a selected pH. This is not a full microenvironment pKa calculation, but it helps students connect pH, pKa, protonation, and charge state.

Students can glean:

- Why protonated and deprotonated forms can coexist.
- How pH changes alter the fraction of charged molecules.
- Which residues are usually charged near physiological pH.

### Solvent Access

Estimates solvent-accessible surface area using a Shrake-Rupley-style rolling-water probe approximation. Larger values indicate more exposure to water.

Students can glean:

- Which residues are exposed versus buried.
- Which charged residues are solvent-accessible.
- Which low-SASA residues may contribute to the interior core.

### Hydrophobic Core

Highlights hydrophobic residues grouped by solvent accessibility.

Students can glean:

- Which nonpolar residues are buried in the protein core.
- Which hydrophobic residues remain exposed.
- How hydrophobic packing supports a compact globular fold.

### Charge Surface

Colors exposed acidic and basic regions at the selected pH. Acidic groups are shown in orange-red, basic groups in blue, and neutral/polar regions in gray.

Students can glean:

- Where acidic or basic patches occur on the protein surface.
- How pH can change apparent charge.
- Where electrostatic interactions or binding surfaces may occur.

### Conservation

The Conservation panel can compare the currently loaded reference protein with 4-6 related PDB structures. Conservation is meaningful only when the comparison structures are homologous or otherwise biologically appropriate comparisons.

To build an in-app conservation overlay:

1. Load the reference protein first using **Gallery Builder** or the **PDB ID** box.
2. Click **Conservation**.
3. Find the **Compare** text box.
4. Enter 4-6 valid 4-character PDB IDs for related structures.
5. Separate codes with spaces, commas, or semicolons.
6. Do not include the reference PDB ID in the comparison list.
7. Click **Build conservation overlay**.

Correct comparison-list examples:

```text
1YOG 1M6M 3VM9 1WLA
1YOG, 1M6M, 3VM9, 1WLA
1YOG; 1M6M; 3VM9; 1WLA
```

Incorrect comparison-list examples:

```text
1MBN
1MBN 1YOG
myoglobin horse myoglobin
https://www.rcsb.org/structure/1YOG
```

The first incorrect example has too few comparison structures. The second includes the reference structure itself. The third uses protein names instead of PDB IDs. The fourth uses a URL instead of the 4-character PDB code.

For the built-in myoglobin example, a small myoglobin comparison set is available. For other proteins, students or instructors should enter related comparison PDB IDs in the **Compare** box.

Students can glean:

- Which residues are conserved across a comparison set.
- Which conserved residues may be functionally or structurally important.
- Why conservation requires careful selection and alignment of related proteins.

### Mutation Sandbox

For myoglobin, curated mutation scenarios are available. For other loaded proteins, the tool performs a generic mutation scan by highlighting a current-protein feature such as a charged contact, buried hydrophobic group, or ionizable residue.

Students can glean:

- What might change when charge, polarity, size, or hydrophobicity changes.
- Why a mutation can disrupt a salt bridge, hydrogen bond, ligand contact, or hydrophobic core.
- How to form a testable structure-function prediction.

### Guided Lesson

Guided Lesson provides preset scenes, prompts, a student response box, feedback, and several possible responses. The feedback is intentionally formative. It does not treat one answer as the only correct answer; it suggests factors students may consider to make their structural reasoning richer.

Students can glean:

- How to connect visual evidence to chemical explanations.
- How different views support different kinds of claims.
- How to revise an answer by adding structure-based evidence.

### Gallery Builder

Provides starting PDB examples by protein class, including oxygen transporters, enzymes, proteases, DNA-binding proteins, membrane proteins, signaling proteins, structural proteins, and disease/drug targets.

Students can glean:

- Which structural evidence is useful for different protein classes.
- How the same analysis framework transfers across different protein types.
- When a structure needs additional curated data, such as homologs for conservation.

### Beta / Topology

Reads PDB SHEET records when available and classifies beta-sheet assignments as parallel, antiparallel, mixed, or barrel-like candidates.

Students can glean:

- Whether the loaded protein contains assigned beta structure.
- How strand direction contributes to topology.
- Why beta barrels, beta sandwiches, and mixed sheets require topology-level reasoning.

## Conservation Pipeline

This folder includes `conservation_pipeline.py`, a separate command-line pipeline for building conservation overlays from a reference PDB ID and 4-6 comparison PDB IDs. It downloads RCSB structures and FASTA files, parses protein sequences, aligns comparison sequences to the reference, calculates per-residue conservation, writes conservation scores into the reference PDB B-factor column, and exports a CSV table.

Example:

```bash
python3 conservation_pipeline.py --reference 1MBN --comparisons 1YOG 1M6M 3VM9 1WLA --reference-chain A --out conservation_1MBN
```

The output PDB can be colored by B-factor in PyMOL or ChimeraX.

## GitHub Notes

This app is a static website. The minimum files for GitHub Pages are:

- `index.html`
- `3Dmol-min.js`
- `1MBN.pdb`
- `USER_GUIDE.md`
- `README.md`
- `conservation_pipeline.py`

To connect automatic updates to GitHub, the folder needs to become a git repository and be linked to a GitHub remote. That step requires the GitHub repository URL and appropriate authentication.
