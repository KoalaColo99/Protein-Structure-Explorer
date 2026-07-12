(function(root) {
  root.BVA_CURATED_SEQUENCE_SETS = {
    formatVersion: 1,
    acceptedResidueSymbols: 'ACDEFGHIKLMNPQRSTVWYBXZ',
    datasets: [
      {
        datasetId: 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs',
        title: 'Photosynthesis: Rubisco large subunit across oxygenic phototrophs',
        description: 'Instructor-supplied reference sequence set for Rubisco large subunit proteins across oxygenic phototrophs. These are complete protein Reference Sequences, not residues parsed from a loaded structure.',
        status: 'instructor_verified',
        notes: 'Sequences were imported from data/source/rubisco_rbcl_verified.fasta, downloaded directly from NCBI Protein. C3, C4, and algal categories describe organism-level photosynthetic context and should not be interpreted as physiology determined by RbcL sequence alone.',
        records: [
          {
            stableSequenceId: 'rbcl_arabidopsis_thaliana_np_051067_1',
            proteinName: 'ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit (chloroplast)',
            geneName: 'rbcL',
            organism: 'Arabidopsis thaliana',
            broadTaxonomicGroup: 'flowering plant (eudicot)',
            photosyntheticCategory: 'C3',
            aminoAcidSequence: 'MSPQTETKASVGFKAGVKEYKLTYYTPEYETKDTDILAAFRVTPQPGVPPEEAGAAVAAESSTGTWTTVWTDGLTSLDRYKGRCYHIEPVPGEETQFIAYVAYPLDLFEEGSVTNMFTSIVGNVFGFKALAALRLEDLRIPPAYTKTFQGPPHGIQVERDKLNKYGRPLLGCTIKPKLGLSAKNYGRAVYECLRGGLDFTKDDENVNSQPFMRWRDRFLFCAEAIYKSQAETGEIKGHYLNATAGTCEEMIKRAVFARELGVPIVMHDYLTGGFTANTSLSHYCRDNGLLLHIHRAMHAVIDRQKNHGMHFRVLAKALRLSGGDHIHAGTVVGKLEGDRESTLGFVDLLRDDYVEKDRSRGIFFTQDWVSLPGVLPVASGGIHVWHMPALTEIFGDDSVLQFGGGTLGHPWGNAPGAVANRVALEACVQARNEGRDLAVEGNEIIREACKWSPELAAACEVWKEITFNFPTIDKLDGQE',
            sourceDatabase: 'NCBI RefSeq',
            sourceAccession: 'NP_051067.1',
            notes: 'Imported from instructor-supplied NCBI Protein FASTA. Sequence length: 479 amino acids. Organism-level photosynthetic category: C3.'
          },
          {
            stableSequenceId: 'rbcl_zea_mays_np_043033_1',
            proteinName: 'ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit (chloroplast)',
            geneName: 'rbcL',
            organism: 'Zea mays',
            broadTaxonomicGroup: 'flowering plant (monocot)',
            photosyntheticCategory: 'C4',
            aminoAcidSequence: 'MSPQTETKASVGFKAGVKDYKLTYYTPEYETKDTDILAAFRVTPQLGVPPEEAGAAVAAESSTGTWTTVWTDGLTSLDRYKGRCYHIEPVPGDPDQYICYVAYPLDLFEEGSVTNMFTSIVGNVFGFKALRALRLEDLRIPPAYSKTFQGPPHGIQVERDKLNKYGRPLLGCTIKPKLGLSAKNYGRACYECLRGGLDFTKDDENVNSQPFMRWRDRFVFCAEAIYKAQAETGEIKGHYLNATAGTCEEMIKRAVFARELGVPIVMHDYLTGGFTANTTLSHYCRDNGLLLHIHRAMHAVIDRQKNHGMHFRVLAKALRMSGGDHIHSGTVVGKLEGEREITLGFVDLLRDDFIEKDRSRGIFFTQDWVSMPGVIPVASGGIHVWHMPALTEIFGDDSVLQFGGGTLGHPWGNAPGAAANRVALEACVQARNEGRDLAREGNEIIKAACKWSAELAAACEIWKEIKFDGFKAMDTI',
            sourceDatabase: 'NCBI RefSeq',
            sourceAccession: 'NP_043033.1',
            notes: 'Imported from instructor-supplied NCBI Protein FASTA. Sequence length: 476 amino acids. Organism-level photosynthetic category: C4.'
          },
          {
            stableSequenceId: 'rbcl_chlamydomonas_reinhardtii_np_958405_1',
            proteinName: 'ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit (chloroplast)',
            geneName: 'rbcL',
            organism: 'Chlamydomonas reinhardtii',
            broadTaxonomicGroup: 'green alga',
            photosyntheticCategory: 'oxygenic green alga',
            aminoAcidSequence: 'MVPQTETKAGAGFKAGVKDYRLTYYTPDYVVRDTDILAAFRMTPQLGVPPEECGAAVAAESSTGTWTTVWTDGLTSLDRYKGRCYDIEPVPGEDNQYIAYVAYPIDLFEEGSVTNMFTSIVGNVFGFKALRALRLEDLRIPPAYVKTFVGPPHGIQVERDKLNKYGRGLLGCTIKPKLGLSAKNYGRAVYECLRGGLDFTKDDENVNSQPFMRWRDRFLFVAEAIYKAQAETGEVKGHYLNATAGTCEEMMKRAVCAKELGVPIIMHDYLTGGFTANTSLAIYCRDNGLLLHIHRAMHAVIDRQRNHGIHFRVLAKALRMSGGDHLHSGTVVGKLEGEREVTLGFVDLMRDDYVEKDRSRGIYFTQDWCSMPGVMPVASGGIHVWHMPALVEIFGDDACLQFGGGTLGHPWGNAPGAAANRVALEACTQARNEGRDLAREGGDVIRSACKWSPELAAACEVWKEIKFEFDTIDKL',
            sourceDatabase: 'NCBI RefSeq',
            sourceAccession: 'NP_958405.1',
            notes: 'Imported from instructor-supplied NCBI Protein FASTA. Sequence length: 475 amino acids. Photosynthetic category: oxygenic green alga.'
          }
        ]
      }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
