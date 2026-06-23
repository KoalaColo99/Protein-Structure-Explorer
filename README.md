# Protein Structure & Chemistry Explorer

An interactive browser-based teaching tool for connecting protein structure, noncovalent interactions, pH, solvent exposure, topology, conservation, mutation effects, and atom-level chemistry.

Open `index.html` in a browser, or publish this folder with GitHub Pages.

## Entering PDB Codes

Use **Gallery Builder** in the app to load a reference structure. Type one 4-character RCSB PDB ID in the **PDB ID** box, such as `1MBN`, `1CA2`, `2PTN`, or `6LU7`, then click **Load structure**.

For the in-app Conservation panel, choose a **Learning Classification** and **Course Protein**. The course protein is the assigned reference structure students are investigating. When available, use the **Suggested Comparison Structures** checklist to select related structures for estimating conservation. Optional custom PDB IDs should be entered one at a time as exactly 4 letters/numbers, such as:

```text
1YOG
```

Do not enter protein names, full RCSB URLs, or the selected reference PDB ID as a custom comparison structure.

Not every course protein currently has a prebuilt suggested comparison set. When no suggested set is available, students may manually add 4-6 biologically related PDB structures. Conservation quality depends strongly on choosing related structures with comparable sequences, structures, and biological roles.

The course list includes a lightweight validation check for duplicate PDB IDs and key name/code mappings. For example, `1LYZ` is used for Lysozyme, while `1BNA` is used only for the DNA Double Helix course entry.

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

The app includes a student-friendly Conservation tab. Students can choose a learning classification and course protein, review the reference PDB ID and functional features, select or remove suggested comparison structures, add optional custom PDB IDs, load the reference structure, and compute a teaching conservation analysis. The results include a status summary, skipped/failed structure warnings, conservation categories, functional feature panels, guided interpretation questions, CER scaffolding, and residue-level 3D coloring on the reference structure.

Conservation results are intended for teaching and exploration. They depend on comparison-structure choice, chain selection, sequence quality, and PDB completeness, so students should interpret them alongside structural and biochemical context.

## GitHub Pages

Because this is a static app, it can be published directly from the repository root or from this folder. If publishing from a repository root, keep `index.html`, `3Dmol-min.js`, and `1MBN.pdb` together in the same directory.
