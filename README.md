# Protein Structure & Chemistry Explorer

An interactive browser-based teaching tool for connecting protein structure, noncovalent interactions, pH, solvent exposure, topology, conservation, mutation effects, and atom-level chemistry.

Open `index.html` in a browser, or publish this folder with GitHub Pages.

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

## GitHub Pages

Because this is a static app, it can be published directly from the repository root or from this folder. If publishing from a repository root, keep `index.html`, `3Dmol-min.js`, and `1MBN.pdb` together in the same directory.
