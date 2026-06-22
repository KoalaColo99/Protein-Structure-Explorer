# Protein Structure & Chemistry Explorer

An interactive browser-based teaching tool for connecting protein structure, noncovalent interactions, pH, solvent exposure, topology, conservation, mutation effects, and atom-level chemistry.

Open `index.html` in a browser, or publish this folder with GitHub Pages.

## Entering PDB Codes

Use **Gallery Builder** in the app to load a reference structure. Type one 4-character RCSB PDB ID in the **PDB ID** box, such as `1MBN`, `1CA2`, `2PTN`, or `6LU7`, then click **Load structure**.

For the in-app Conservation panel, choose a curated protein family and use the checklist to select homologous comparison structures. Optional custom PDB IDs should be entered one at a time as exactly 4 letters/numbers, such as:

```text
1YOG
```

Do not enter protein names, full RCSB URLs, or the selected reference PDB ID as a custom comparison structure.

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

The app includes a student-friendly Conservation tab. Students can choose a protein family, review the reference PDB ID and functional features, select or remove curated homologs, add optional custom PDB IDs, load the reference structure, and compute a teaching conservation analysis. The results include a status summary, skipped/failed structure warnings, conservation categories, functional feature panels, guided interpretation questions, CER scaffolding, and residue-level 3D coloring on the reference structure.

Conservation results are intended for teaching and exploration. They depend on homolog choice, chain selection, sequence quality, and PDB completeness, so students should interpret them alongside structural and biochemical context.

## GitHub Pages

Because this is a static app, it can be published directly from the repository root or from this folder. If publishing from a repository root, keep `index.html`, `3Dmol-min.js`, and `1MBN.pdb` together in the same directory.
