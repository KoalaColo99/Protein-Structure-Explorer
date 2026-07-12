# Curated Sequence Data

This folder stores local, instructor-curated data used by the Biochemistry Visual Atlas.

## Atlas Dataset Registry

`atlas_dataset_registry.js` is the central metadata registry for Atlas case-study datasets. It describes dataset identity, educational context, available capabilities, and links to scientific resources. It does not store biological sequences, alignments, PDB coordinates, functional annotations, or residue mappings.

Registry entries should answer questions such as:

- What concept or protein case study is this?
- Which lenses are available: System, Structure, Evolution, and/or Function?
- Which capabilities are available, planned, partial, unavailable, or archived?
- Which scientific data files or identifiers support those capabilities?
- What cautions should students and instructors see before interpreting the dataset?

Capability statuses are explicit:

- `available`: the Atlas has a verified resource and can expose the capability.
- `partial`: a limited resource exists, but interpretation should remain constrained.
- `planned`: the capability is intended but not ready.
- `unavailable`: no verified resource is present, and the app must not infer or simulate the capability.
- `archived`: retained for recordkeeping but not intended for active classroom use.

To add a new Atlas dataset:

1. Add or verify the scientific data in the appropriate file, such as `curated_sequence_sets.js`, `curated_sequence_alignments.js`, a local structure file, or a future mapping/annotation file.
2. Add a registry entry with a stable dataset ID, concepts, lenses, capability statuses, and resource references.
3. Mark unavailable capabilities explicitly instead of relying on generic app features.
4. Run the registry, sequence, and alignment validation tests.

Resource references connect registry metadata to data files:

- `curatedSequenceDatasetId` points to a dataset in `curated_sequence_sets.js`.
- `curatedAlignmentId` points to an alignment in `curated_sequence_alignments.js`.
- `representativePdbId` and `localStructureFilePath` identify verified structure resources.
- `structureMappingId` is reserved for future explicit sequence-to-structure mappings.
- `functionAnnotationDatasetId` is reserved for curated function annotations.

## Reference Sequences

`curated_sequence_sets.js` contains verified, unaligned reference protein sequences. These records are complete curated protein sequences, not residues parsed from a loaded PDB structure.

For the Rubisco large-subunit dataset, the unaligned source FASTA is:

- `data/source/rubisco_rbcl_verified.fasta`

## Multiple-Sequence Alignments

`curated_sequence_alignments.js` stores read-only alignment metadata separately from unaligned reference sequences. Alignment gap characters are not stored in `curated_sequence_sets.js`.

For the Rubisco large-subunit alignment, the aligned source FASTA is:

- `data/source/rubisco_rbcl_aligned.fasta`

The app does not generate alignments at runtime. The alignment is instructor supplied and is displayed only after validation.

Validation requires that:

- every aligned accession matches exactly one curated reference sequence;
- every curated reference sequence is represented in the alignment;
- all aligned sequences have the same alignment length;
- only accepted amino-acid symbols and the gap character `-` are present;
- removing gaps from each aligned sequence reproduces the verified curated reference sequence exactly.

Alignment columns represent inferred sequence correspondence. Alignment position, reference-sequence position, and structure residue number are different numbering systems.
