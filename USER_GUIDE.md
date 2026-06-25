# Biochemistry Visual Atlas User Guide

## What This Tool Is

The Biochemistry Visual Atlas is an interactive teaching tool for connecting molecular structure to biochemical reasoning. It opens with myoglobin 1MBN, but students can load other RCSB PDB IDs and inspect the same kinds of structural features when the needed coordinates are available.

The tool is designed for guided exploration rather than one-click answers. Many overlays are heuristic teaching aids, so students should use them to generate evidence-based claims and then compare those claims with the 3D structure.

The atlas helps students move between levels of explanation:

- **Molecular structure:** What does the protein look like in 3D?
- **Chemical properties:** Which atoms, charges, pH effects, and interactions matter?
- **Function:** How might the structure support binding, catalysis, stability, or regulation?
- **Prediction and comparison:** How can related structures or future predicted models be compared with experimental evidence?

## Getting Started

Open `index.html` in a browser. The structure viewer is on the left, and the feature controls are on the right.

The atlas navigation is organized into four modules:

- **Protein Explorer:** structure, sequence placeholders, conservation, Ramachandran plots, backbone H-bonds, side-chain interactions, helices, beta topology, solvent access, hydrophobic regions, and structure loading.
- **Chemical Properties:** pH & Charge, Buffers, Amino Acids, Chemistry Lens, and Charge Surface.
- **Function:** mutation sandbox and guided lessons. Ligand Binding and Active Sites are visible as coming-soon entries.
- **Prediction:** AlphaFold prediction and comparative structural analysis are future modules. They will complement experimental Protein Data Bank structures rather than replace them.

Coming-soon entries are visible so students can see where the atlas is headed, but they are not active tools yet.

Use the mouse or trackpad to rotate, zoom, and pan the molecule. Use the Display controls to change the protein representation:

- Cartoon / ribbon: best for overall fold and secondary structure.
- Trace / backbone: best for following the alpha-carbon path.
- Wireframe / sticks: best for atom-level chemistry and noncovalent contacts.
- Space-filling: best for volume, packing, and steric fit.
- Surface rendering: best for pockets, solvent exposure, and exterior charge patches.

The default palette is color-blind safe. The atom zoom option shows more atom detail when the view is focused on specific contacts.

Use **Structure View Controls** when you need to move between whole-protein context and molecular detail:

- **Fit Whole Structure:** centers and zooms out to show the full loaded structure.
- **Focus Selected Residue:** zooms to the currently selected residue, contact, hydrogen bond, or conservation-table residue when available.
- **Focus Functional Site:** zooms to a mapped functional feature, ligand, cofactor, or metal site when available.
- **Reset View:** returns to a broad whole-protein view.

If the molecule feels too zoomed in after using an analysis tab, start with **Fit Whole Structure** or **Reset View**, then focus on a specific residue again when you need atom-level detail.

## Loading Proteins

Use Structure Gallery to choose a class of protein and suggested examples, or enter a 4-character PDB ID manually.

To enter your own structure:

1. Click **Structure Gallery**.
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

## How To Use Protein Explorer

Protein Explorer is the main workflow for connecting a PDB structure to structure-function reasoning.

1. **Load a PDB structure.** Use Structure Gallery or enter a 4-character RCSB PDB ID. The loaded structure becomes the reference model for most tools.
2. **Inspect the overall fold.** Start with Structure/Overview in cartoon or ribbon view. Look for helices, sheets, loops, domains, cofactors, pockets, and subunit organization.
3. **Inspect secondary structure.** Use Backbone H-bonds, Helix Patterns, Beta / Topology, and Solvent Access to ask how local geometry and noncovalent interactions stabilize the fold.
4. **Use Conservation.** Choose a course protein and comparison structures when available. Conserved residues can suggest regions important for folding, binding, catalysis, or interaction, but conservation is evidence rather than proof.
5. **Inspect the Ramachandran plot.** Use the residue scan to connect each residue's phi/psi backbone angles to its position on the plot and to the highlighted residue in the 3D structure.
6. **Connect structure to function.** Combine observations from fold, contacts, solvent exposure, conservation, chemistry, pH, and mutation tools to build a claim supported by structural evidence.

For assignments, a strong workflow is to include one overall structure observation, one atom-level or interaction observation, one conservation or Ramachandran observation, and one limitation of the analysis.

## Mobile Use Tips

The atlas works best with a wide screen, but it can still be used on a phone or tablet.

- Rotate a phone or tablet horizontally if the 3D viewer, navigation, or Ramachandran plot feels cramped.
- Use the selected residue details in the Ramachandran panel instead of relying only on tiny plotted points.
- Pinch or browser-zoom into plots when reading axis labels or region labels.
- Use screenshots for assignments, especially after selecting a residue, contact, conservation row, or mutation scenario.
- If a panel feels long on mobile, scroll slowly through one module at a time and return to the 3D viewer to verify the structural location.

## Prediction Module Note

The Prediction module is a future-facing part of the atlas. AlphaFold prediction and comparative structural analysis tools are not implemented yet.

When added, these tools should help students compare predicted models with experimental structures. They should not replace experimental evidence from crystallography, NMR, cryo-EM, biochemical assays, the Protein Data Bank, or curated structural interpretation. Predicted models are useful evidence, but students should still ask what is known experimentally, what is uncertain, and whether the model supports the biochemical claim.

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

Phi (φ) and psi (ψ) are backbone torsion angles. They describe rotation around the protein backbone near each alpha carbon. Because peptide bonds have partial double-bond character, proteins do not rotate freely around every backbone bond; phi and psi are major degrees of freedom that shape secondary structure.

Different secondary structures tend to occupy different regions of the Ramachandran plot:

- **Alpha-helical residues** usually cluster in a negative phi, negative psi region.
- **Beta-sheet or extended residues** usually cluster in a negative phi, positive psi region.
- **Left-handed helix or outlier-like regions** may reflect unusual local geometry, special residues, turns, flexibility, or model limitations.

Outliers should not be treated automatically as errors. They may indicate a real strained conformation, a flexible loop, a glycine-rich region, a binding-site distortion, unusual local chemistry, or a limitation of the deposited model. Interpret outliers with structural context by checking the 3D location, nearby contacts, secondary structure, ligand/cofactor environment, and model quality when available.

Students can glean:

- How backbone rotation contributes to protein conformation.
- Why different secondary structures occupy different phi/psi regions.
- Which residues fall outside common regions and may represent turns, strain, or special local geometry.
- How one selected residue connects the residue scan, the highlighted point on the plot, and the highlighted residue in the 3D structure.

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

Uses typical teaching pKa values to estimate the fraction of an ionizable group that is protonated or deprotonated at a selected pH. This is not a full microenvironment pKa calculation, but it helps students connect pH, pKa, protonation, and charge state.

Using the pH & Charge Tab:

- **pH** describes how acidic or basic the solution is.
- **pKa** is the pH where an ionizable group is about 50% protonated and 50% deprotonated.
- **Percent protonation** estimates the fraction of molecules carrying the protonated form.
- **Percent deprotonation** estimates the fraction of molecules carrying the deprotonated form.
- For acid-type groups, the protonated form is neutral and the deprotonated form is negative.
- For base-type groups, the protonated form is positive and the deprotonated form is neutral.
- Charge changes with pH because changing pH changes the balance between protonated and deprotonated forms.
- This matters for proteins because protonation can alter salt bridges, hydrogen bonding, ligand binding, folding stability, and interactions with water or other molecules.
- In the Amino Acid Charge Explorer, a free amino acid's net charge is estimated by summing the charge contributions from the alpha carboxyl group, alpha amino group, and any ionizable side chain.
- Non-ionizable side chains are labeled clearly; their interaction potential depends on polarity, hydrogen bonding, aromaticity, hydrophobicity, or special structural behavior.
- Histidine is especially important near physiological pH because its side chain can shift substantially between protonated and deprotonated forms.
- The amino acid net-charge model is a teaching model for free amino acids. Residues inside proteins do not usually have free alpha amino and alpha carboxyl groups unless they are at the N- or C-terminus.
- In the Buffer Explorer, compare the solution pH with a selected buffer pKa to estimate the ratio of conjugate base A- to acid HA.
- Buffers resist pH change best when pH is close to pKa because meaningful amounts of both HA and A- are present.
- The pKa +/- 1 rule is a useful guide: buffers are generally most useful within about one pH unit of their pKa.
- Buffers matter for proteins because protein charge, salt bridges, hydrogen bonding, folding stability, and enzyme activity can all change when pH changes.

Students can glean:

- Why protonated and deprotonated forms can coexist.
- How pH changes alter the fraction of charged molecules.
- Which residues are usually charged near physiological pH.
- Why groups buffer most strongly when pH is close to pKa.
- How side chains can change salt-bridge, hydrogen-bonding, hydrophobic, or metal-interaction potential.
- Whether a selected buffer is excellent, useful, or poor for maintaining the current pH.
- Why pH control is important for preserving protein structure and biochemical function.

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

The Conservation panel lets students choose a **Learning Classification** and **Course Protein**, inspect the reference PDB ID, select or remove suggested comparison structures, optionally add custom 4-character PDB IDs, and compute a teaching conservation analysis from the selected set. The Course Protein is the assigned structure students are investigating. Suggested Comparison Structures are related structures used to estimate conservation.

This feature is different from ConSurf. ConSurf is a rigorous bioinformatics server for estimating evolutionary conservation from homolog searches, multiple sequence alignment, phylogenetic trees, and Rate4Site-based evolutionary-rate calculations. This Explorer is a classroom reasoning tool: students choose a reference PDB structure and a small comparison set, then use the result to connect conservation with structural layers and Claim-Evidence-Reasoning explanations. Use ConSurf when you need a publication-strength evolutionary conservation analysis; use this Explorer when the learning goal is to connect conservation, structure, chemistry, and function.

Conservation is meaningful only when the comparison structures are homologous or otherwise biologically appropriate comparisons. Unrelated proteins will give misleading conservation scores.

Not every course protein currently has a prebuilt suggested comparison set. If the checklist says no curated set is available yet, students can manually add 4-6 related PDB IDs. Conservation quality depends on choosing biologically related structures with comparable sequences, structures, and functions.

The course list includes a validation check that flags duplicate PDB IDs or important code/name mismatches for review. In the current list, `1LYZ` is Lysozyme and `1BNA` is DNA Double Helix.

To compute conservation from a selected comparison set:

1. Click **Conservation**.
2. Choose a learning classification from the **Learning Classification** dropdown.
3. Choose a course protein from the **Course Protein** dropdown.
4. Review the reference PDB ID, biological function, and key functional features.
5. Click **Load Reference Structure** if you want that course-protein reference in the viewer.
6. Select or deselect suggested comparison structures in the checklist, when available.
7. Optionally type one custom 4-character PDB ID and click **Add**.
8. Use the readiness summary to check whether the set has 4-6 comparison structures.
9. Click **Compute Conservation**.
10. Review the results status, attempted/used/skipped counts, and any warnings.
11. Use the table to compare residue conservation score, category, functional annotation, and interpretation prompt.
12. Click **Map Conservation to Structure** to color the loaded reference structure.
13. Use the visualization controls to show all residues, highlight highly conserved residues, highlight variable residues, highlight functional features, or reset the conservation coloring.
14. Inspect the **Functional Features to Inspect** panel to compare known course-protein features with their conservation scores when those residues are mappable.
15. Use **Interpret Your Conservation Map** questions to turn the color pattern into structure-function reasoning.
16. Use **Generate CER Scaffold** as a starting point, then revise the claim, evidence, and reasoning in your own words.

Custom PDB IDs should use this format:

```text
1YOG
1M6M
3VM9
1WLA
```

Incorrect custom PDB entries:

```text
myoglobin
PDB 1YOG
https://www.rcsb.org/structure/1YOG
```

Use exactly four letters/numbers. Do not enter protein names, labels such as "PDB", full URLs, or the selected reference PDB ID.

If one comparison structure cannot be fetched or parsed, the app reports a warning and continues with the valid structures that remain. If no comparison structures can be used, the result is marked failed instead of crashing.

Students can glean:

- Which residues are conserved across a comparison set.
- Which conserved residues may be functionally or structurally important.
- Why conservation requires careful selection and alignment of related proteins.

Conservation categories are:

- **Highly conserved**: 0.90-1.00
- **Conserved**: 0.70-0.89
- **Moderately variable**: 0.50-0.69
- **Variable**: below 0.50

The structure coloring uses:

- **Red**: highly conserved
- **Orange**: conserved
- **Yellow**: moderately variable
- **Blue**: variable
- **Gray**: unmapped or unavailable

Clicking a Conservation Table row zooms to that residue and adds a label with the residue, conservation score, category, and functional annotation when available.

Important limitation: structure coloring is mapped from conservation scores onto the reference PDB. Residue numbering and chain selection can affect interpretation, especially for structures with multiple chains, fragments, or engineered mutations. Treat the colored structure as visual evidence to interpret, not as absolute proof.

How to interpret conservation maps:

- Red/highly conserved regions often deserve closer inspection because they may support folding, binding, catalysis, stability, or regulation.
- Conserved clusters near ligands, cofactors, catalytic residues, or subunit interfaces may suggest functional importance.
- Variable surface residues may reflect evolutionary flexibility, solvent exposure, or tolerance for substitution.
- Students should support claims with both the conservation map and the structural location of the residue or region.
- Conservation is evidence, not proof. A variable residue is not automatically unimportant, and a conserved residue may be conserved for several possible reasons.
- CER scaffold responses should be revised by the student and should not be treated as final generated answers.

Classroom use:

For assignments, students should include:

- Selected course protein and learning classification.
- Reference PDB.
- Comparison structures used.
- Screenshot of the conservation map.
- One highly conserved region.
- One variable region.
- Claim-Evidence-Reasoning explanation.
- One limitation of the analysis.

Limitations:

This tool uses a simplified teaching-level conservation workflow. Results depend on comparison-structure choice, chain selection, sequence quality, and PDB structure completeness. Conservation maps should be interpreted alongside biochemical context.

Use the **Layer** menu to ask more specific questions:

- **Sequence conservation** measures residue identity across the aligned comparison set. Conserved positions are colored on the reference structure so students can ask what evolutionary pressure might preserve that residue.
- **Structural conservation** filters for conserved residues with stabilizing structural roles, such as buried core positions, secondary structure, contact networks, or H-bond regions. This helps students connect conservation to folding and packing.
- **Secondary structure conservation** filters conserved residues in helix candidates, beta-sheet records, or backbone H-bond patterns. This helps students decide whether conservation supports the fold scaffold.
- **Active-site conservation** filters conserved residues near ligands, metals, or strong polar/charged contacts. This helps students connect conservation to catalysis, recognition, or biochemical activity.
- **Ligand/cofactor pocket conservation** filters conserved residues close to non-water ligands or cofactors. This helps students ask how a pocket preserves shape, polarity, or binding atoms.
- **Metal coordination conservation** filters conserved residues close to metal ions such as zinc, iron, magnesium, manganese, calcium, copper, nickel, or cobalt. This helps students identify donor atoms and coordination geometry.
- **Side-chain interaction conservation** filters conserved residues that form salt bridges, side-chain hydrogen bonds, or hydrophobic contacts. This helps students ask what interaction would be lost after mutation.
- **Backbone hydrogen-bond conservation** filters conserved residues that participate in candidate backbone H-bonds. This helps students connect conservation to helix, sheet, or turn geometry.
- **Solvent accessibility conservation** combines conservation with exposure or burial. Conserved buried residues often stabilize the core; conserved exposed residues may support binding or recognition.
- **Tertiary contact conservation** filters conserved residues that contact sequence-distant residues in the folded 3D structure. This helps students see that far-apart sequence positions can become close in space.
- **Quaternary interface conservation** filters conserved residues that contact another protein chain when multiple chains are present. This helps students reason about assembly and partner recognition.
- **B-factor/flexibility conservation** optionally compares conservation with deposited B-factors. Conserved low-B-factor regions may anchor the structure, while conserved flexible regions may support motion or binding.

The **Show conserved residues in this layer only** checkbox narrows the view to residues with stronger conservation within the selected layer.

The sortable Conservation Table includes:

- **Residue number**: the residue position in the loaded reference structure.
- **Residue identity**: the reference amino acid and residue label.
- **Conservation score**: the fraction of comparison structures that match the reference residue at the aligned position.
- **Structural role**: the detected structural context, such as buried core, ligand pocket, side-chain contact, backbone H-bond, interface, or B-factor context.
- **Functional annotation**: a short interpretation of the residue's possible role.
- **Student interpretation prompt**: a question students can use to turn the observation into a biochemical explanation.

Clicking a table row zooms to that residue in the structure.

The **CER generator** provides a starter scaffold:

```text
Claim:
Evidence:
Reasoning:
```

Students should revise the scaffold in their own words. A strong CER answer should state why a residue may matter, cite visual evidence from conservation and structure, and explain how that evidence connects to folding, binding, catalysis, stability, or regulation.

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

### Structure Gallery

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
