(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BVASequenceDisplay = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  function uniqueValues(values) {
    return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
  }

  function joinList(values, fallback = 'not provided') {
    const unique = uniqueValues(values);
    return unique.length ? unique.join('; ') : fallback;
  }

  function sequenceLengthStats(records) {
    const lengths = records.map(record => (record.aminoAcidSequence || '').length).filter(length => length > 0);
    if (!lengths.length) return { min: 0, max: 0, difference: 0 };
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    return { min, max, difference: max - min };
  }

  function sequenceLengthRange(records) {
    const stats = sequenceLengthStats(records);
    if (!stats.max) return 'not available';
    return stats.min === stats.max ? `${stats.min} amino acids` : `${stats.min}-${stats.max} amino acids`;
  }

  function sequencePreview(sequence, previewLength = 30) {
    return String(sequence || '').slice(0, previewLength);
  }

  function sequencePositionRows(sequence, interval = 10) {
    const text = String(sequence || '');
    const rows = [];
    for (let index = 0; index < text.length; index += interval) {
      rows.push({ start: index + 1, sequence: text.slice(index, index + interval) });
    }
    return rows;
  }

  function sortedCuratedRecords(records, sortMode) {
    const indexed = records.map((record, index) => ({ record, index }));
    const textSort = accessor => indexed.sort((a, b) => {
      const valueA = String(accessor(a.record) || '').localeCompare(String(accessor(b.record) || ''), undefined, { sensitivity: 'base' });
      return valueA || a.index - b.index;
    });
    if (sortMode === 'organism') textSort(record => record.organism);
    else if (sortMode === 'group') textSort(record => record.broadTaxonomicGroup);
    else if (sortMode === 'category') textSort(record => record.photosyntheticCategory);
    else if (sortMode === 'length') indexed.sort((a, b) => ((a.record.aminoAcidSequence || '').length - (b.record.aminoAcidSequence || '').length) || a.index - b.index);
    else indexed.sort((a, b) => a.index - b.index);
    return indexed.map(item => item.record);
  }

  function alignmentColumnRows(sequence, blockSize = 60) {
    const text = String(sequence || '');
    const rows = [];
    for (let index = 0; index < text.length; index += blockSize) {
      rows.push({
        start: index + 1,
        end: Math.min(index + blockSize, text.length),
        sequence: text.slice(index, index + blockSize)
      });
    }
    return rows;
  }

  function alignmentMarkerLine(start, sequence, markerInterval = 10) {
    return [...sequence].map((_, index) => ((start + index) % markerInterval === 0 ? '|' : '.')).join('');
  }

  const AMINO_ACID_NAMES = {
    A: 'alanine',
    C: 'cysteine',
    D: 'aspartate',
    E: 'glutamate',
    F: 'phenylalanine',
    G: 'glycine',
    H: 'histidine',
    I: 'isoleucine',
    K: 'lysine',
    L: 'leucine',
    M: 'methionine',
    N: 'asparagine',
    P: 'proline',
    Q: 'glutamine',
    R: 'arginine',
    S: 'serine',
    T: 'threonine',
    V: 'valine',
    W: 'tryptophan',
    Y: 'tyrosine'
  };

  const BIOCHEMICAL_PROPERTY_CATEGORIES = [
    { key: 'nonpolar_aliphatic', label: 'nonpolar aliphatic', residues: ['A', 'V', 'L', 'I', 'M'] },
    { key: 'aromatic', label: 'aromatic', residues: ['F', 'Y', 'W'] },
    { key: 'polar_uncharged', label: 'polar uncharged', residues: ['S', 'T', 'N', 'Q'] },
    { key: 'positively_charged', label: 'positively charged', residues: ['K', 'R', 'H'] },
    { key: 'negatively_charged', label: 'negatively charged', residues: ['D', 'E'] },
    { key: 'special_structural_cases', label: 'special structural cases', residues: ['G', 'P', 'C'] }
  ];

  const PROPERTY_BY_RESIDUE = BIOCHEMICAL_PROPERTY_CATEGORIES.reduce((lookup, category) => {
    category.residues.forEach(residue => {
      lookup[residue] = category;
    });
    return lookup;
  }, {});

  const ALIGNMENT_CONSERVATION_SCORE_CONFIG = {
    identityWeight: 0.7,
    propertySimilarityWeight: 0.3
  };

  function referencePositionForAlignmentColumn(alignedSequence, zeroBasedColumnIndex) {
    const text = String(alignedSequence || '');
    const index = Number(zeroBasedColumnIndex);
    if (!Number.isInteger(index) || index < 0 || index >= text.length) return null;
    if (text[index] === '-') return null;
    let position = 0;
    for (let cursor = 0; cursor <= index; cursor += 1) {
      if (text[cursor] !== '-') position += 1;
    }
    return position;
  }

  function residueDisplayName(residue) {
    const code = String(residue || '').toUpperCase();
    return AMINO_ACID_NAMES[code] || 'ambiguous or unsupported residue symbol';
  }

  function residuePropertyCategory(residue) {
    const code = String(residue || '').toUpperCase();
    return PROPERTY_BY_RESIDUE[code] || null;
  }

  function alignmentColumnState({ residueCount, gapCount, distinctResidueCount }) {
    if (residueCount === 0) return 'all gaps';
    if (distinctResidueCount === 1 && gapCount > 0) return 'invariant residues plus one or more gaps';
    if (distinctResidueCount === 1) return 'invariant among non-gap residues';
    if (gapCount > 0) return 'variable residues plus one or more gaps';
    return 'variable among non-gap residues';
  }

  function alignmentColumnStatistics(characters) {
    const column = Array.from(characters || []).map(char => String(char || '').toUpperCase() || '-');
    const totalSequences = column.length;
    const residueCounts = {};
    const unsupportedResidueCounts = {};
    let gapCount = 0;
    column.forEach(char => {
      if (char === '-') {
        gapCount += 1;
        return;
      }
      residueCounts[char] = (residueCounts[char] || 0) + 1;
      if (!residuePropertyCategory(char)) unsupportedResidueCounts[char] = (unsupportedResidueCounts[char] || 0) + 1;
    });
    const residueCount = totalSequences - gapCount;
    const distinctResidueCount = Object.keys(residueCounts).length;
    const frequencies = Object.entries(residueCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([residue, count]) => ({
        residue,
        name: residueDisplayName(residue),
        count,
        frequencyAmongAll: totalSequences ? count / totalSequences : 0,
        frequencyAmongResidues: residueCount ? count / residueCount : 0
      }));
    const propertyGroups = BIOCHEMICAL_PROPERTY_CATEGORIES.map(category => {
      const residues = category.residues
        .filter(residue => residueCounts[residue])
        .map(residue => ({
          residue,
          name: residueDisplayName(residue),
          count: residueCounts[residue]
        }));
      const count = residues.reduce((sum, residue) => sum + residue.count, 0);
      return { key: category.key, label: category.label, residues, count };
    }).filter(group => group.count > 0);
    const unsupportedResidues = Object.entries(unsupportedResidueCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([residue, count]) => ({ residue, count }));

    return {
      totalSequences,
      residueCount,
      gapCount,
      gapFrequency: totalSequences ? gapCount / totalSequences : 0,
      distinctResidueCount,
      residueCounts,
      frequencies,
      propertyGroups,
      unsupportedResidues,
      state: alignmentColumnState({ residueCount, gapCount, distinctResidueCount })
    };
  }

  function alignmentColumnStatisticsForRecords(records, zeroBasedColumnIndex) {
    const index = Number(zeroBasedColumnIndex);
    const characters = (records || []).map(record => String(record?.alignedSequence || '')[index] || '-');
    return alignmentColumnStatistics(characters);
  }

  function mostCommonCountedItem(items, labelKey = 'label') {
    if (!items.length) return null;
    return [...items].sort((a, b) => (b.count - a.count) || String(a[labelKey]).localeCompare(String(b[labelKey])))[0];
  }

  function identityScore(stats) {
    if (!stats || !stats.residueCount) return null;
    const mostCommonResidue = mostCommonCountedItem(stats.frequencies, 'residue');
    return {
      score: mostCommonResidue.count / stats.residueCount,
      mostCommonResidue
    };
  }

  function propertySimilarityScore(stats) {
    if (!stats || !stats.residueCount) return null;
    const mostCommonProperty = mostCommonCountedItem(stats.propertyGroups, 'label');
    return {
      score: mostCommonProperty ? mostCommonProperty.count / stats.residueCount : 0,
      mostCommonProperty
    };
  }

  function gapCoverage(stats) {
    if (!stats || !stats.totalSequences) return null;
    return stats.residueCount / stats.totalSequences;
  }

  function conservationScoreBand(score) {
    if (score === null || score === undefined || Number.isNaN(score)) return 'unavailable: no amino-acid residues';
    if (score >= 0.9) return 'very high similarity in this dataset';
    if (score >= 0.7) return 'high similarity in this dataset';
    if (score >= 0.4) return 'moderate similarity in this dataset';
    return 'low similarity in this dataset';
  }

  function alignmentColumnConservationSummary(characters, config = ALIGNMENT_CONSERVATION_SCORE_CONFIG) {
    const stats = alignmentColumnStatistics(characters);
    const identity = identityScore(stats);
    const property = propertySimilarityScore(stats);
    const coverage = gapCoverage(stats);
    if (!identity || !property || coverage === null || stats.residueCount === 0) {
      return {
        stats,
        identityScore: null,
        propertySimilarityScore: null,
        gapCoverage: coverage,
        finalScore: null,
        scoreBand: conservationScoreBand(null),
        mostCommonResidue: null,
        mostCommonProperty: null,
        weights: config
      };
    }
    const weightedSimilarity = (config.identityWeight * identity.score) + (config.propertySimilarityWeight * property.score);
    const finalScore = coverage * weightedSimilarity;
    return {
      stats,
      identityScore: identity.score,
      propertySimilarityScore: property.score,
      gapCoverage: coverage,
      weightedSimilarity,
      finalScore,
      scoreBand: conservationScoreBand(finalScore),
      mostCommonResidue: identity.mostCommonResidue,
      mostCommonProperty: property.mostCommonProperty,
      weights: config
    };
  }

  function alignmentColumnConservationSummaryForRecords(records, zeroBasedColumnIndex, config = ALIGNMENT_CONSERVATION_SCORE_CONFIG) {
    const index = Number(zeroBasedColumnIndex);
    const characters = (records || []).map(record => String(record?.alignedSequence || '')[index] || '-');
    return alignmentColumnConservationSummary(characters, config);
  }

  function fullAlignmentConservationScores(records, config = ALIGNMENT_CONSERVATION_SCORE_CONFIG) {
    const alignmentLength = Math.max(0, ...((records || []).map(record => String(record?.alignedSequence || '').length)));
    const scores = [];
    for (let index = 0; index < alignmentLength; index += 1) {
      scores.push({
        columnIndex: index,
        ...alignmentColumnConservationSummaryForRecords(records, index, config)
      });
    }
    return scores;
  }

  return {
    uniqueValues,
    joinList,
    sequenceLengthStats,
    sequenceLengthRange,
    sequencePreview,
    sequencePositionRows,
    sortedCuratedRecords,
    alignmentColumnRows,
    alignmentMarkerLine,
    referencePositionForAlignmentColumn,
    residueDisplayName,
    residuePropertyCategory,
    alignmentColumnState,
    alignmentColumnStatistics,
    alignmentColumnStatisticsForRecords,
    identityScore,
    propertySimilarityScore,
    gapCoverage,
    conservationScoreBand,
    alignmentColumnConservationSummary,
    alignmentColumnConservationSummaryForRecords,
    fullAlignmentConservationScores,
    BIOCHEMICAL_PROPERTY_CATEGORIES,
    ALIGNMENT_CONSERVATION_SCORE_CONFIG
  };
});
