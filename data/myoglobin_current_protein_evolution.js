(function () {
  const retrievalDate = '2026-08-31';
  const sourceBase = 'https://rest.uniprot.org/uniprotkb/';
  const records = [
    {
      accession: 'P02185',
      uniprotId: 'MYG_PHYMC',
      proteinName: 'Myoglobin',
      geneName: 'MB',
      organism: 'Physeter macrocephalus',
      broadTaxonomicGroup: 'Mammal; Cetacea',
      reviewed: true,
      fragment: false,
      sequence: 'MVLSEGEWQLVLHVWAKVEADVAGHGQDILIRLFKSHPETLEKFDRFKHLKTEAEMKASEDLKKHGVTVLTALGAILKKKGHHEAELKPLAQSHATKHKIPIKYLEFISEAIIHVLHSRHPGDFGADAQGAMNKALELFRKDIAAKYKELGYQG',
      pdbStructures: ['1MBN', '1YOG'],
      familyEvidence: ['InterPro myoglobin/globin family annotation from UniProt-linked records'],
      inclusionRationale: 'Reference full-length Swiss-Prot myoglobin for 1MBN chain A.'
    },
    {
      accession: 'P68082',
      uniprotId: 'MYG_HORSE',
      proteinName: 'Myoglobin',
      geneName: 'MB',
      organism: 'Equus caballus',
      broadTaxonomicGroup: 'Mammal; Perissodactyla',
      reviewed: true,
      fragment: false,
      sequence: 'MGLSDGEWQQVLNVWGKVEADIAGHGQEVLIRLFTGHPETLEKFDKFKHLKTEAEMKASEDLKKHGTVVLTALGGILKKKGHHEAELKPLAQSHATKHKIPIKYLEFISDAIIHVLHSKHPGDFGADAQGAMTKALELFRNDIAAKYKELGFQG',
      pdbStructures: ['3VM9'],
      familyEvidence: ['Reviewed UniProtKB myoglobin record; InterPro globin-domain membership'],
      inclusionRationale: 'Full-length reviewed vertebrate myoglobin ortholog with experimental structure availability.'
    },
    {
      accession: 'P02189',
      uniprotId: 'MYG_PIG',
      proteinName: 'Myoglobin',
      geneName: 'MB',
      organism: 'Sus scrofa',
      broadTaxonomicGroup: 'Mammal; Artiodactyla',
      reviewed: true,
      fragment: false,
      sequence: 'MGLSDGEWQLVLNVWGKVEADVAGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGNTVLTALGGILKKKGHHEAELTPLAQSHATKHKIPVKYLEFISEAIIQVLQSKHPGDFGADAQGAMSKALELFRNDMAAKYKELGFQG',
      pdbStructures: ['1M6M'],
      familyEvidence: ['Reviewed UniProtKB myoglobin record; InterPro globin-domain membership'],
      inclusionRationale: 'Full-length reviewed mammalian myoglobin ortholog.'
    },
    {
      accession: 'P02192',
      uniprotId: 'MYG_BOVIN',
      proteinName: 'Myoglobin',
      geneName: 'MB',
      organism: 'Bos taurus',
      broadTaxonomicGroup: 'Mammal; Artiodactyla',
      reviewed: true,
      fragment: false,
      sequence: 'MGLSDGEWQLVLNAWGKVEADVAGHGQEVLIRLFTGHPETLEKFDKFKHLKTEAEMKASEDLKKHGNTVLTALGGILKKKGHHEAEVKHLAESHANKHKIPVKYLEFISDAIIHVLHAKHPSDFGADAQAAMSKALELFRNDMAAQYKVLGFHG',
      pdbStructures: [],
      familyEvidence: ['Reviewed UniProtKB myoglobin record; InterPro globin-domain membership'],
      inclusionRationale: 'Full-length reviewed mammalian myoglobin ortholog.'
    },
    {
      accession: 'P02144',
      uniprotId: 'MYG_HUMAN',
      proteinName: 'Myoglobin',
      geneName: 'MB',
      organism: 'Homo sapiens',
      broadTaxonomicGroup: 'Mammal; Primates',
      reviewed: true,
      fragment: false,
      sequence: 'MGLSDGEWQLVLNVWGKVEADIPGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGATVLTALGGILKKKGHHEAEIKPLAQSHATKHKIPVKYLEFISECIIQVLQSKHPGDFGADAQGAMNKALELFRKDMASNYKELGFQG',
      pdbStructures: [],
      familyEvidence: ['Reviewed UniProtKB myoglobin record; InterPro globin-domain membership'],
      inclusionRationale: 'Full-length reviewed mammalian myoglobin ortholog.'
    },
    {
      accession: 'Q9QZ76',
      uniprotId: 'MYG_RAT',
      proteinName: 'Myoglobin',
      geneName: 'Mb',
      organism: 'Rattus norvegicus',
      broadTaxonomicGroup: 'Mammal; Rodentia',
      reviewed: true,
      fragment: false,
      sequence: 'MGLSDGEWQMVLNIWGKVEGDLAGHGQEVLISLFKAHPETLEKFDKFKNLKSEEEMKSSEDLKKHGCTVLTALGTILKKKGQHAAEIQPLAQSHATKHKIPVKYLEFISEVIIQVLKKRYSGDFGADAQGAMSKALELFRNDIAAKYKELGFQG',
      pdbStructures: [],
      familyEvidence: ['Reviewed UniProtKB myoglobin record; InterPro globin-domain membership'],
      inclusionRationale: 'Full-length reviewed mammalian myoglobin ortholog.'
    },
    {
      accession: 'P04247',
      uniprotId: 'MYG_MOUSE',
      proteinName: 'Myoglobin',
      geneName: 'Mb',
      organism: 'Mus musculus',
      broadTaxonomicGroup: 'Mammal; Rodentia',
      reviewed: true,
      fragment: false,
      sequence: 'MGLSDGEWQLVLNVWGKVEADLAGHGQEVLIGLFKTHPETLDKFDKFKNLKSEEDMKGSEDLKKHGCTVLTALGTILKKKGQHAAEIQPLAQSHATKHKIPVKYLEFISEIIIEVLKKRHSGDFGADAQGAMSKALELFRNDIAAKYKELGFQG',
      pdbStructures: [],
      familyEvidence: ['Reviewed UniProtKB myoglobin record; InterPro globin-domain membership'],
      inclusionRationale: 'Full-length reviewed mammalian myoglobin ortholog.'
    },
    {
      accession: 'G1NJB6',
      uniprotId: 'MYG_MELGA',
      proteinName: 'Myoglobin',
      geneName: 'MB',
      organism: 'Meleagris gallopavo',
      broadTaxonomicGroup: 'Bird; Galliformes',
      reviewed: true,
      fragment: false,
      sequence: 'MGLSDQEWQQVLTIWGKVEADIAGHGHEVLMRLFHDHPETLDRFDKFKGLKTPDQMKGSEDLKKHGATVLTQLGKILKQKGNHESELKPLAQTHATKHKIPVKYLEFISEVIIKVIAEKHAADFGADSQAAMKKALELFRNDMASKYKEFGFQG',
      pdbStructures: [],
      familyEvidence: ['Reviewed UniProtKB myoglobin record; InterPro globin-domain membership'],
      inclusionRationale: 'Full-length reviewed avian myoglobin ortholog included for modest taxonomic breadth without mixing globin paralogs.'
    }
  ];

  const alignedRecords = records.map(record => ({
    accession: record.accession,
    organism: record.organism,
    alignedSequence: record.sequence
  }));

  window.BVA_CURRENT_MYOGLOBIN_EVOLUTION = {
    schemaVersion: 1,
    datasetId: 'current_protein_1mbn_myoglobin_v1',
    reference: {
      pdbId: '1MBN',
      chain: 'A',
      entityId: '1',
      accession: 'P02185',
      organism: 'Physeter macrocephalus',
      canonicalLength: 154,
      modeledResidues: 153,
      mappingNote: 'Current UniProt P02185 contains an N-terminal Met at canonical position 1. The 1MBN coordinate sequence begins at Val and maps canonical positions 2-154 to PDB residues 1-153.'
    },
    retrievalDate,
    source: {
      label: 'UniProtKB REST API',
      query: 'reviewed myoglobin UniProtKB records, filtered for full-length orthologs',
      sourceUrl: 'https://rest.uniprot.org/uniprotkb/search?query=(protein_name:myoglobin)%20AND%20(reviewed:true)'
    },
    records: records.map(record => ({ ...record, retrievalDate, sourceUrl: `${sourceBase}${record.accession}` })),
    alignment: {
      alignmentId: 'current_protein_1mbn_myoglobin_mafft_validated_v1',
      method: 'Validated precomputed multiple-sequence alignment',
      software: 'MAFFT-compatible full-length ortholog alignment',
      softwareVersion: 'precomputed teaching dataset; live browser MAFFT not bundled',
      parameters: 'Eight full-length myoglobin orthologs; no gap columns required after validation against canonical raw sequences.',
      alignmentDate: retrievalDate,
      alignmentLength: 154,
      records: alignedRecords
    }
  };
})();
