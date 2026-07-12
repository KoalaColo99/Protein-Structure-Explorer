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

  return {
    uniqueValues,
    joinList,
    sequenceLengthStats,
    sequenceLengthRange,
    sequencePreview,
    sequencePositionRows,
    sortedCuratedRecords
  };
});
