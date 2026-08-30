# Biochemistry Visual Atlas

An interactive browser-based educational platform for exploring protein structure, sequence context, evolutionary conservation, protein chemistry, pH and charge, and structure-function relationships.

Open `index.html` in a browser, or publish this folder with GitHub Pages.

## Atlas Modules

The app is organized into four navigation groups:

- **Protein Explorer:** structure, structure conservation, Ramachandran plots, backbone H-bonds, side-chain interactions, helices, beta topology, solvent access, hydrophobic regions, and structure loading.
- **Atlas Case Studies:** optional curated datasets such as the Rubisco Sequence Atlas. These case studies do not take viewer space unless selected.
- **Chemical Properties:** pH & Charge, Buffers, Amino Acids, Chemistry Lens, and Charge Surface tools.
- **Function:** mutation sandbox and guided lessons, with Ligand Binding and Active Sites marked as coming soon.
- **Prediction:** AlphaFold prediction and comparative structural analysis are future modules. They will complement experimental Protein Data Bank structures rather than replace them.

Future modules will include Ligand Binding, an expanded Mutation Explorer, AlphaFold prediction, and comparative structural analysis.

## Entering PDB Codes

Use **Structure Gallery** in the app to load a reference structure. Type one 4-character RCSB PDB ID in the **PDB ID** box, such as `1MBN`, `1CA2`, `2PTN`, or `6LU7`, then click **Load structure**.

For the in-app **Structure Conservation** panel, choose a **Learning Classification** and **Course Protein**. The course protein is the assigned reference structure students are investigating. When available, use the **Suggested Comparison Structures** checklist to select related structures for estimating conservation. Optional custom PDB IDs should be entered one at a time as exactly 4 letters/numbers, such as:

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

## In-App Structure Conservation Tab

The app includes a student-friendly Structure Conservation tab. Students can choose a learning classification and course protein, review the reference PDB ID and functional features, select or remove suggested comparison structures, add optional custom PDB IDs, load the reference structure, and compute a teaching conservation analysis.

The in-browser score is based on PDB-derived sequences: selected comparison structures are fetched from RCSB, their represented amino-acid sequences are aligned to the loaded reference structure sequence, and each reference residue is scored by the fraction of usable comparisons with the same amino acid at that aligned position. This is a classroom reasoning tool, not ConSurf or a publication-grade evolutionary-rate analysis.

If live comparison-structure fetching fails for the default myoglobin case, the app can fall back to built-in myoglobin teaching sequences so the conservation table still demonstrates the workflow. The results include a status summary, skipped/failed structure warnings, conservation categories, functional feature panels, guided interpretation questions, CER scaffolding, and residue-level 3D coloring on the reference structure.

Conservation results are intended for teaching and exploration. They depend on comparison-structure choice, chain selection, sequence quality, and PDB completeness, so students should interpret them alongside structural and biochemical context.

The Rubisco Sequence Atlas is separate. Its curated RbcL sequence/alignment conservation view is not mapped onto the 3D structure viewer until a verified Rubisco structure and explicit residue mapping are added.

## GitHub Pages

Because this is a static app, it can be published directly from the repository root or from this folder. If publishing from a repository root, keep `index.html`, `3Dmol-min.js`, and `1MBN.pdb` together in the same directory.
