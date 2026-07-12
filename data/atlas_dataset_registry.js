(function(root) {
  root.BVA_ATLAS_DATASET_REGISTRY = {
    schemaVersion: 1,
    datasets: [
      {
        stableDatasetId: 'rubisco',
        title: 'Rubisco Evolution Case Study',
        canonicalBiologicalName: 'Ribulose-1,5-bisphosphate carboxylase/oxygenase',
        shortDescription: 'Curated RbcL reference sequences and alignment for exploring photosynthesis, enzymes, and carbon fixation.',
        datasetType: 'protein_case_study',
        status: 'active',
        conceptIds: ['photosynthesis', 'enzymes', 'carbon_fixation'],
        moduleIds: ['evolution', 'system'],
        proteinClass: 'enzyme',
        proteinFamily: 'Rubisco large subunit',
        tags: ['RbcL', 'oxygenic phototrophs', 'chloroplast', 'sequence alignment'],
        defaultLens: 'evolution',
        availableLenses: ['system', 'evolution'],
        displayOrder: 10,
        thumbnailId: 'photosynthesis',
        capabilities: {
          system: { status: 'available', note: 'Photosynthesis/carbon-fixation system context is available as a concept identifier.' },
          structure: { status: 'unavailable', note: 'No verified representative Rubisco structure has been added to the Atlas yet.' },
          evolution: { status: 'available', note: 'Curated RbcL reference sequences and instructor-supplied alignment are available.' },
          function: { status: 'planned', note: 'Functional interpretation will be added after structure and annotation sources are verified.' },
          referenceSequences: { status: 'available' },
          comparativeSequenceOverview: { status: 'available' },
          alignment: { status: 'available' },
          alignmentColumnExploration: { status: 'available' },
          descriptiveColumnStatistics: { status: 'available' },
          atlasConservationScore: { status: 'available' },
          phylogeny: { status: 'planned' },
          sequenceToStructureMapping: { status: 'unavailable', note: 'Mapping requires a verified representative structure and explicit residue mapping.' }
        },
        resources: {
          systemModelId: 'photosynthesis',
          curatedSequenceDatasetId: 'photosynthesis_rubisco_large_subunit_oxygenic_phototrophs',
          curatedAlignmentId: 'rubisco_rbcl_oxygenic_phototrophs_msa',
          provenanceReferences: [
            'data/source/rubisco_rbcl_verified.fasta',
            'data/source/rubisco_rbcl_aligned.fasta'
          ],
          documentationReferences: ['data/README.md']
        },
        educational: {
          guidingQuestion: 'How can comparative RbcL sequences help students reason about photosynthesis, carbon fixation, and molecular evolution?',
          suggestedCourseLevel: 'Undergraduate biochemistry',
          estimatedExplorationTime: '15-25 minutes',
          prerequisiteConcepts: ['amino-acid identity', 'multiple-sequence alignment', 'photosynthesis', 'protein evolution'],
          learningObjectives: [
            'Distinguish complete reference sequences from structure-derived sequences.',
            'Use alignment columns to compare residue identities and biochemical properties.',
            'Interpret Atlas conservation scores as dataset-specific evidence rather than proof of function.'
          ],
          cautionNotes: [
            'Rubisco structure is explicitly unavailable until a verified representative structure is added.',
            'C3, C4, and algal categories describe organism-level context and are not determined by RbcL sequence alone.',
            'No sequence-to-structure mapping should be inferred from organism or protein name.'
          ]
        }
      },
      {
        stableDatasetId: 'myoglobin',
        title: 'Myoglobin Structure Case Study',
        canonicalBiologicalName: 'Myoglobin',
        shortDescription: 'Representative myoglobin structure for exploring protein folding, heme binding, noncovalent interactions, pH, charge, and structure-function reasoning.',
        datasetType: 'protein_case_study',
        status: 'active',
        conceptIds: ['globins', 'oxygen_binding', 'protein_structure'],
        moduleIds: ['structure', 'function'],
        proteinClass: 'oxygen transport and storage protein',
        proteinFamily: 'globin',
        tags: ['myoglobin', 'heme', 'oxygen storage', '1MBN'],
        defaultLens: 'structure',
        availableLenses: ['structure', 'function'],
        displayOrder: 20,
        thumbnailId: 'heme_protein',
        capabilities: {
          system: { status: 'planned' },
          structure: { status: 'available' },
          evolution: { status: 'planned' },
          function: { status: 'available', note: 'Function is represented at the current structural-exploration level.' },
          referenceSequences: { status: 'unavailable' },
          comparativeSequenceOverview: { status: 'unavailable' },
          alignment: { status: 'unavailable' },
          alignmentColumnExploration: { status: 'unavailable' },
          descriptiveColumnStatistics: { status: 'unavailable' },
          atlasConservationScore: { status: 'unavailable' },
          phylogeny: { status: 'unavailable' },
          sequenceToStructureMapping: { status: 'unavailable' }
        },
        resources: {
          representativePdbId: '1MBN',
          localStructureFilePath: '1MBN.pdb',
          functionAnnotationDatasetId: 'myoglobin_structural_features_builtin',
          provenanceReferences: ['1MBN.pdb'],
          documentationReferences: ['README.md', 'USER_GUIDE.md']
        },
        educational: {
          guidingQuestion: 'How does the molecular structure of myoglobin support oxygen storage and heme-based function?',
          suggestedCourseLevel: 'Undergraduate biochemistry',
          estimatedExplorationTime: '15-25 minutes',
          prerequisiteConcepts: ['protein secondary structure', 'noncovalent interactions', 'heme chemistry', 'pH and charge'],
          learningObjectives: [
            'Connect helices, side-chain contacts, and heme-pocket chemistry to protein function.',
            'Use a structure-derived sequence without confusing it with a complete reference sequence.',
            'Distinguish structure and function evidence from unavailable evolutionary data.'
          ],
          cautionNotes: [
            'Myoglobin currently has no curated reference-sequence set in the Visual Evolution Explorer.',
            'Do not associate 1MBN with the Rubisco sequence dataset.'
          ]
        }
      }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
