# Curated Sequence Data

This folder stores local, instructor-curated data used by the Biochemistry Visual Atlas.

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
