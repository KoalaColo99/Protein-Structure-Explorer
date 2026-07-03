# CHEM214 Molecular Exploration Notebook Assignment Templates

## Purpose

The Molecular Exploration Notebook is a weekly, low-stakes visualization literacy assignment for CHEM214. Students use the Biochemistry Visual Atlas to connect molecular structure, chemistry, evolution, and function. Each entry is designed for 15-25 minutes and is worth 10 points.

Course learning cycle:

Scientific Question -> Lecture -> Reading Guide -> Molecular Exploration Notebook -> Adaptive Quiz -> Homework

Core student product each week:

- One screenshot from the Biochemistry Visual Atlas.
- A short caption.
- Structured observations.
- A brief reflection.
- Confidence, difficulty, and usefulness ratings for learning analytics.

Recommended grading model:

- Automatically graded: completion checks, selected options, required field presence.
- Completion graded: short structured responses that meet minimum length or selection requirements.
- Manually reviewed: screenshot relevance, caption quality, structure-function reasoning, reflection quality.

## Canvas Assignment Naming Convention

Use a consistent title pattern so assignments sort cleanly:

- `CHEM214 MEN 01 - Structure Begins with Chemistry`
- `CHEM214 MEN 02 - Recognition and Catalysis`
- `CHEM214 MEN 03 - Molecules in Systems`
- `CHEM214 MEN 04 - Structure Explains Metabolism`

Suggested Canvas module placement:

- Place each MEN after the weekly Reading Guide and before the Adaptive Quiz.
- Due date: 24 hours before the Adaptive Quiz.
- Time estimate in description: 15-25 minutes.
- Points: 10.
- Submission type: Canvas New Quiz or external Qualtrics link plus Canvas completion assignment.

## Canvas New Quiz Setup

Recommended settings:

- Quiz type: New Quiz.
- Points: 10.
- Shuffle questions: off.
- One attempt recommended for pilot; allow second attempt only if using as practice.
- Display one question at a time: optional. Off is easier for a notebook style.
- File upload item: screenshot upload.
- Manual review required for screenshot and short reasoning items.

General Canvas point structure:

| Section | Points | Grading |
|---|---:|---|
| Setup and protein selection | 1.0 | mostly auto/completion |
| Screenshot and caption | 2.0 | manual/completion |
| Universal molecular observations | 1.5 | completion plus manual spot check |
| Entry-specific weekly investigation | 2.5 | completion plus manual review |
| Structure-function reasoning and limitation | 1.5 | manual |
| Reflection and learning analytics | 1.5 | mostly completion/auto |

## Qualtrics Survey Setup

Recommended Qualtrics structure:

- One survey per entry, copied from the master template.
- Use embedded data: `course = CHEM214`, `assignment_type = MEN`, `entry_number`.
- Use forced response for core fields except optional notes.
- Use file upload question for screenshot.
- Use short text fields for captions and observations.
- Use multiple choice, dropdown, checkbox, and matrix items for analytics.
- Export response data as CSV for later analysis.

Recommended Qualtrics blocks:

1. Consent/instruction block.
2. Atlas setup block.
3. Screenshot and caption block.
4. Guided observation block.
5. Structure-function reasoning block.
6. Reflection and analytics block.

## Reusable Master Question Bank

Use these questions for all four entries. Customize the prompt text and dropdown choices where indicated.

### Block A. Setup

1. Entry confirmation
   - Type: Multiple choice.
   - Prompt: Which Molecular Exploration Notebook entry are you completing?
   - Choices: Entry 1, Entry 2, Entry 3, Entry 4.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `entry_id`.

2. Protein or molecule selected
   - Type: Short answer.
   - Prompt: Enter the protein, molecule, or structure name you explored.
   - Canvas grading: completion.
   - Qualtrics variable: `protein_name`.

3. PDB ID
   - Type: Short answer.
   - Prompt: Enter the 4-character PDB ID used in the Atlas, if available.
   - Validation guidance: letters/numbers only, example `1MBN`.
   - Canvas grading: completion.
   - Qualtrics variable: `pdb_id`.

4. Molecular class
   - Type: Dropdown.
   - Prompt: Which category best describes your selected structure?
   - Choices: oxygen transport/storage, enzyme, protease/drug target, DNA/RNA binding, signaling/hormone, membrane/transport, structural assembly, disease/misfolding, metabolic enzyme, other/unsure.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `molecular_class`.

5. Atlas feature used
   - Type: Checkbox.
   - Prompt: Which Atlas tools did you use? Select all that apply.
   - Choices: structure view, sequence, conservation, Ramachandran, interactions, chemistry lens, pH and charge, solvent access, hydrophobic core, ligand/cofactor, mutation sandbox, guided lesson, gallery.
   - Canvas grading: completion.
   - Qualtrics variable: `atlas_features_used`.

### Block B. Screenshot and Caption

6. Screenshot upload
   - Type: File upload.
   - Prompt: Upload one screenshot from the Biochemistry Visual Atlas that supports your observations.
   - Canvas grading: manual/completion.
   - Qualtrics variable: `screenshot_upload`.

7. Screenshot caption
   - Type: Short answer.
   - Prompt: Write a one-sentence caption explaining what your screenshot shows.
   - Suggested length: 15-35 words.
   - Canvas grading: manual/completion.
   - Qualtrics variable: `screenshot_caption`.

### Block C. Guided Observations

8. Key structural feature
   - Type: Dropdown.
   - Prompt: Which structural feature is most important in your screenshot?
   - Choices: alpha helix, beta sheet, loop/turn, active site, ligand-binding pocket, cofactor, ionizable residue, hydrophobic core, surface region, subunit interface, membrane-spanning region, DNA/RNA contact, other.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `key_structural_feature`.

9. Molecular interaction observed
   - Type: Checkbox.
   - Prompt: Which molecular interactions or chemical features did you observe? Select all that apply.
   - Choices: hydrogen bonding, ionic interaction/salt bridge, hydrophobic interaction, van der Waals contact, metal coordination, ligand/cofactor binding, pH-dependent ionization, resonance/delocalization, solvent accessibility, no clear interaction observed, unsure.
   - Canvas grading: completion.
   - Qualtrics variable: `interaction_features`.

10. Guided observation 1
   - Type: Short answer.
   - Prompt: What is one specific molecular detail you noticed?
   - Suggested length: 1-2 sentences.
   - Canvas grading: completion/manual spot check.
   - Qualtrics variable: `observation_specific_detail`.

11. Guided observation 2
   - Type: Short answer.
   - Prompt: How does this detail relate to the weekly scientific question?
   - Suggested length: 1-2 sentences.
   - Canvas grading: manual.
   - Qualtrics variable: `observation_scientific_question`.

### Block D. Structure-Function Reasoning

12. Structure-function claim
   - Type: Short answer.
   - Prompt: Make one concise claim connecting structure to function.
   - Suggested length: 1 sentence.
   - Canvas grading: manual.
   - Qualtrics variable: `structure_function_claim`.

13. Evidence type
   - Type: Dropdown.
   - Prompt: What kind of evidence most directly supports your claim?
   - Choices: residue identity, noncovalent interaction, secondary structure, ligand/cofactor location, active-site geometry, conservation, pH/charge behavior, solvent accessibility, hydrophobic packing, subunit/interface location, other.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `evidence_type`.

14. Evidence statement
   - Type: Short answer.
   - Prompt: State the evidence from your screenshot or Atlas exploration.
   - Suggested length: 1-2 sentences.
   - Canvas grading: manual.
   - Qualtrics variable: `evidence_statement`.

15. Limitation or uncertainty
   - Type: Short answer.
   - Prompt: What is one limitation or uncertainty in your interpretation?
   - Suggested length: 1 sentence.
   - Canvas grading: completion/manual.
   - Qualtrics variable: `limitation_uncertainty`.

### Block E. Reflection and Analytics

16. Confidence rating
   - Type: Likert.
   - Prompt: How confident are you in your interpretation?
   - Scale: 1 not confident, 2 slightly confident, 3 moderately confident, 4 confident, 5 very confident.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `confidence_rating`.

17. Difficulty rating
   - Type: Likert.
   - Prompt: How difficult was this exploration?
   - Scale: 1 very easy, 2 easy, 3 moderate, 4 difficult, 5 very difficult.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `difficulty_rating`.

18. Usefulness rating
   - Type: Likert.
   - Prompt: How useful was the Atlas for understanding this week?
   - Scale: 1 not useful, 2 slightly useful, 3 moderately useful, 4 useful, 5 very useful.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `usefulness_rating`.

19. Time on task
   - Type: Multiple choice.
   - Prompt: About how long did this entry take?
   - Choices: under 10 minutes, 10-15 minutes, 15-25 minutes, 25-35 minutes, over 35 minutes.
   - Canvas grading: auto/completion.
   - Qualtrics variable: `time_on_task`.

20. Muddiest point
   - Type: Short answer.
   - Prompt: What is one thing that still feels unclear?
   - Suggested length: 1 sentence.
   - Canvas grading: completion.
   - Qualtrics variable: `muddiest_point`.

## Entry-Specific Canvas New Quiz Blueprints

### Entry 1. Structure Begins with Chemistry

Canvas title: `CHEM214 MEN 01 - Structure Begins with Chemistry`

Scientific question: How does chemistry give rise to biological structure?

Concepts: water, amino acids, ionization, protein structure.

Student task: Choose a protein from the Atlas. Identify protein name, class, function, one ionizable residue, one structural feature, and explain how structure supports function.

Recommended Canvas items:

1. Multiple choice: Entry confirmation.
2. Short answer: Protein name.
3. Short answer: PDB ID.
4. Dropdown: Molecular class.
5. Checkbox: Atlas features used.
6. File upload: Screenshot.
7. Short answer: Screenshot caption.
8. Dropdown: Key structural feature.
9. Dropdown: Ionizable residue type observed: Asp, Glu, His, Cys, Tyr, Lys, Arg, N-terminus, C-terminus, none/unsure.
10. Short answer: What charge or protonation behavior might matter for this residue?
11. Short answer: Structure-function claim.
12. Short answer: Evidence statement.
13. Short answer: Limitation or uncertainty.
14. Likert: Confidence.
15. Likert: Difficulty.
16. Likert: Usefulness.
17. Multiple choice: Time on task.
18. Short answer: Muddiest point.

Entry 1 extra variable names:

- `ionizable_residue_type`
- `ionization_charge_explanation`

### Entry 2. Recognition and Catalysis

Canvas title: `CHEM214 MEN 02 - Recognition and Catalysis`

Scientific question: How do proteins recognize molecules and catalyze chemical reactions?

Concepts: ligand binding, active sites, cofactors, enzyme catalysis.

Student task: Investigate a ligand, active site, cofactor, or catalytic residue. Describe molecular recognition and connect structure to catalysis.

Recommended Canvas items:

1. Master setup items 1-7.
2. Dropdown: Feature investigated: ligand, substrate analog, inhibitor, cofactor, catalytic residue, metal ion, binding pocket, other/unsure.
3. Checkbox: Recognition features observed: shape complementarity, hydrogen bonding, ionic interaction, hydrophobic pocket, metal coordination, cofactor positioning, pH-sensitive residue, conserved active-site residue.
4. Short answer: Which molecule or residue is being recognized?
5. Short answer: What structural feature helps recognition?
6. Short answer: How could this structure support catalysis?
7. Master reflection and analytics items 16-20.

Entry 2 extra variable names:

- `recognition_feature_type`
- `recognition_features_observed`
- `recognized_molecule_or_residue`
- `recognition_structure_detail`
- `catalysis_connection`

### Entry 3. Molecules in Systems

Canvas title: `CHEM214 MEN 03 - Molecules in Systems`

Scientific question: How do cells organize molecules into functional systems?

Concepts: carbohydrates, membranes, transport, signaling, metabolism.

Student task: Investigate a protein involved in cellular organization, membrane biology, transport, signaling, or metabolic regulation.

Recommended Canvas items:

1. Master setup items 1-7.
2. Dropdown: System context: membrane transport, signaling, metabolic regulation, structural organization, carbohydrate recognition, cellular assembly, other/unsure.
3. Checkbox: System-level features observed: membrane-spanning region, binding site, subunit interface, channel/pore, regulatory domain, carbohydrate interaction, nucleotide-binding site, conformational change, surface charge pattern.
4. Short answer: What cellular system or process does this molecule support?
5. Short answer: What structural feature helps it participate in that system?
6. Short answer: How does molecular organization support biological function?
7. Master reflection and analytics items 16-20.

Entry 3 extra variable names:

- `system_context`
- `system_features_observed`
- `cellular_process`
- `system_structure_detail`
- `system_function_connection`

### Entry 4. Structure Explains Metabolism

Canvas title: `CHEM214 MEN 04 - Structure Explains Metabolism`

Scientific question: How does molecular structure explain energy metabolism?

Concepts: metabolic enzymes, active sites, substrates, pathway function.

Student task: Investigate one metabolic enzyme and explain how its structure supports its function in metabolism.

Recommended Canvas items:

1. Master setup items 1-7.
2. Dropdown: Metabolic role: glycolysis, citric acid cycle, electron transport, ATP synthesis, fermentation, amino acid metabolism, lipid metabolism, nucleotide metabolism, other/unsure.
3. Checkbox: Metabolic enzyme features observed: active site, substrate-binding pocket, cofactor, metal ion, catalytic residue, flexible loop, oligomer/interface, conserved residue, charged pocket.
4. Short answer: What reaction or pathway is associated with this enzyme?
5. Short answer: Which structural feature supports the enzyme's metabolic function?
6. Short answer: How does this molecular structure help explain energy flow or pathway function?
7. Master reflection and analytics items 16-20.

Entry 4 extra variable names:

- `metabolic_role`
- `metabolic_features_observed`
- `metabolic_reaction_pathway`
- `metabolic_structure_detail`
- `metabolic_function_connection`

## Entry-Specific Qualtrics Survey Blueprints

Use the same block structure for all entries. Recommended survey names:

- `CHEM214_MEN_01_structure_begins_with_chemistry`
- `CHEM214_MEN_02_recognition_and_catalysis`
- `CHEM214_MEN_03_molecules_in_systems`
- `CHEM214_MEN_04_structure_explains_metabolism`

### Qualtrics Embedded Data

Set these at the start of each survey:

| Embedded data field | Entry 1 | Entry 2 | Entry 3 | Entry 4 |
|---|---|---|---|---|
| `course` | CHEM214 | CHEM214 | CHEM214 | CHEM214 |
| `assignment_type` | MEN | MEN | MEN | MEN |
| `entry_number` | 1 | 2 | 3 | 4 |
| `entry_title` | structure_begins_with_chemistry | recognition_and_catalysis | molecules_in_systems | structure_explains_metabolism |
| `scientific_question` | chemistry_to_structure | recognition_and_catalysis | molecules_in_systems | structure_explains_metabolism |

### Qualtrics Blocks by Entry

Entry 1 block additions:

- `ionizable_residue_type`
- `ionization_charge_explanation`

Entry 2 block additions:

- `recognition_feature_type`
- `recognition_features_observed`
- `recognized_molecule_or_residue`
- `recognition_structure_detail`
- `catalysis_connection`

Entry 3 block additions:

- `system_context`
- `system_features_observed`
- `cellular_process`
- `system_structure_detail`
- `system_function_connection`

Entry 4 block additions:

- `metabolic_role`
- `metabolic_features_observed`
- `metabolic_reaction_pathway`
- `metabolic_structure_detail`
- `metabolic_function_connection`

## 10-Point Rubric

| Criterion | Points | Full credit | Partial credit | Minimal/no credit |
|---|---:|---|---|---|
| Atlas setup and structure identification | 1.0 | Protein/molecule, class, and PDB ID or equivalent are clear | Some identifying information missing | Selection unclear or absent |
| Screenshot | 1.5 | Relevant screenshot clearly supports the entry | Screenshot included but weakly connected | Missing or unusable screenshot |
| Caption | 0.5 | Caption accurately explains what is shown | Caption vague | Missing |
| Universal molecular observations | 1.5 | Specific molecular details are described accurately | Details are present but generic or partly unclear | Little molecular observation |
| Entry-specific weekly investigation | 2.5 | Response directly addresses the week's scientific question and task | Weekly connection is plausible but underdeveloped | Weekly task is mostly missing |
| Structure-function reasoning and limitation | 1.5 | Claim, evidence, and limitation are clear and connected | Connection is plausible but thin | Claim is absent or unsupported |
| Reflection and analytics completion | 1.5 | Ratings, time estimate, and muddiest point are completed thoughtfully | One component is weak or missing | Multiple components missing |

Recommended grade interpretation:

- 9-10: strong visualization literacy evidence.
- 7-8.5: complete and reasonable, but reasoning could be deeper.
- 5-6.5: partial completion or mostly descriptive.
- below 5: missing core evidence or screenshot.

## Recommended Instructor Workflow for Summer Pilot

1. Before July 14, publish the Atlas link and a 3-5 minute orientation video or demo.
2. Build one master Canvas New Quiz or Qualtrics survey, then copy it four times.
3. Edit only the entry title, scientific question, weekly concept prompt, and entry-specific dropdowns.
4. Release Entry 1 during the first week after students have seen protein structure basics.
5. Grade with the 10-point rubric, but use light feedback. The goal is practice, not polished writing.
6. Review analytics weekly:
   - confidence vs difficulty,
   - most-used Atlas features,
   - muddiest points,
   - time on task,
   - common evidence types.
7. Use 2-3 anonymized screenshots or captions in the next class to model stronger molecular reasoning.
8. After Entry 2, adjust prompts if students are writing too much or missing the screenshot-evidence connection.
9. At the end of summer, export Canvas/Qualtrics data and identify which prompts were most useful for fall scaling.

## Scaling to a 15-Week Fall Course

Keep the same master question bank, but rotate the weekly scientific question and concept focus.

Possible 15-week expansion:

1. Water, pH, and ionization.
2. Amino acids and functional groups.
3. Protein secondary structure.
4. Protein tertiary structure and hydrophobic effect.
5. Ligand binding and molecular recognition.
6. Enzyme active sites and catalysis.
7. Allostery and conformational change.
8. Membranes and transport.
9. Carbohydrate recognition and glycoproteins.
10. Nucleic acid binding proteins.
11. Metabolism I: glycolysis.
12. Metabolism II: citric acid cycle and oxidative phosphorylation.
13. Signaling proteins and receptors.
14. Disease, mutation, and misfolding.
15. Comparative structure, prediction, and final synthesis.

Scaling recommendations:

- Keep each weekly entry at 10 points.
- Use the same variables every week for longitudinal learning analytics.
- Add optional challenge prompts for honors or graduate-level extension.
- Build a small library of acceptable PDB choices per week.
- Use student screenshot examples to create a visual reasoning gallery.
- In fall, consider a final portfolio where students revise 2-3 MEN entries into a short molecular explanation.
