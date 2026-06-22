# Protein Structure & Chemistry Explorer

An interactive browser-based teaching tool for connecting protein structure, noncovalent interactions, pH, solvent exposure, topology, conservation, mutation effects, and atom-level chemistry.

Open `index.html` in a browser, or publish this folder with GitHub Pages.

## Entering PDB Codes

Use **Gallery Builder** in the app to load a reference structure. Type one 4-character RCSB PDB ID in the **PDB ID** box, such as `1MBN`, `1CA2`, `2PTN`, or `6LU7`, then click **Load structure**.

For the in-app Conservation panel, type 4-6 related comparison PDB IDs in the **Compare** box, separated by spaces or commas, such as:

```text
1YOG 1M6M 3VM9 1WLA
```

Do not enter protein names, full RCSB URLs, or the reference PDB ID in the comparison list.

## Included Files

- `index.html`: the full static web app.
- `3Dmol-min.js`: local 3Dmol.js viewer library.
- `1MBN.pdb`: local fallback myoglobin structure.
- `USER_GUIDE.md`: teaching guide and feature descriptions.
- `conservation_pipeline.py`: command-line conservation mapping pipeline.

## Conservation Pipeline Example

```bash
python3 conservation_pipeline.py --reference 1MBN --comparisons 1YOG 1M6M 3VM9 1WLA --reference-chain A --out conservation_1MBN
```

The pipeline writes a B-factor-colored reference PDB, a residue conservation CSV, and helper scripts for PyMOL and ChimeraX.

## In-App Conservation Tab

The app also includes an interactive Conservation tab. After students enter 4-6 related comparison PDB IDs, the app aligns the loaded reference sequence with the comparison structures, maps conservation onto the reference model, and lets students filter conserved residues by sequence, structural role, secondary structure, active-site context, ligand/cofactor pocket, metal coordination, side-chain interactions, backbone hydrogen bonds, solvent accessibility, tertiary contacts, quaternary interfaces, and optional B-factor/flexibility context. A sortable table and CER generator help students connect evolutionary conservation to biochemical function.

## GitHub Pages

Because this is a static app, it can be published directly from the repository root or from this folder. If publishing from a repository root, keep `index.html`, `3Dmol-min.js`, and `1MBN.pdb` together in the same directory.
