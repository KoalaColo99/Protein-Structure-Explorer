# AGENTS.md

## Project Context

This repository contains the Biochemistry Visual Atlas, an educational biochemistry visualization tool for CHEM214. The app is currently a static browser application built from:

- `index.html`: main HTML, CSS, and JavaScript application.
- `3Dmol-min.js`: local 3Dmol.js molecular viewer library.
- `1MBN.pdb`: local fallback structure.
- `conservation_pipeline.py`: standalone Python teaching pipeline for conservation mapping.
- `README.md` and `USER_GUIDE.md`: instructor/student documentation.

There is no package manager, frontend framework, bundler, TypeScript setup, lint config, or formal test runner currently present. Treat `outputs/` as the Git repository root.

## Project Principles

- This is an educational biochemistry visualization tool.
- Scientific correctness and transparent calculations take priority over decorative features.
- Existing working features must not be removed or silently changed.
- Use cautious scientific language. Conservation may identify a candidate functional region but does not by itself establish function or adaptation.
- Do not introduce external services, paid APIs, or new data dependencies without explicit approval.
- Preserve the static-app deployment model unless explicitly asked otherwise.

## Sequence And Conservation Language

New sequence-analysis features must include explanatory labels and student-appropriate feedback.

Distinguish clearly among:

1. **Structure-derived sequences:** residues represented in the currently loaded molecular coordinates.
2. **Complete reference sequences:** full biological sequences from curated sequence databases or RCSB FASTA.
3. **Multiple-sequence alignments:** aligned residue positions across multiple related sequences.

Never assume that alignment position, reference-sequence position, and structure residue number are equivalent. When mapping among them, name the mapping explicitly and state its limitations.

## Architecture Guidance

- Keep biological data processing separate from user-interface components when practical.
- Reuse existing state instead of introducing parallel state. For example, residue selection currently uses `state.selectedResidueIndex`.
- Do not change sequence parsing, residue numbering, conservation scoring, or structure loading as a side effect of UI work.
- Structure-derived sequence data currently come from parsed PDB `ATOM` records through `state.residues` and `sequenceFromResidues()`.
- Conservation in the app is a simplified teaching workflow, not a publication-grade evolutionary model.
- Do not render a scientific feature directly from a registry status flag. Use the validated capability-availability resolver.

## Accessibility And Student Usability

- Use accessible controls, keyboard navigation, and color-independent cues.
- Do not rely on color alone to communicate scientific meaning.
- Labels, captions, legends, warnings, and limitations should be visible near the relevant visualization.
- Prefer concise student-facing explanations over jargon-heavy labels.

## Testing And Checks

Add or update tests for parsers, calculations, mappings, and data transformations when the repository structure permits it.

Before completing a task, run the available checks supported by this repository:

```bash
# JavaScript syntax check for the inline app script
awk '/<script>/{flag=1;next}/<\\/script>/{flag=0}flag' index.html > /tmp/bva-index-script.js
node --check /tmp/bva-index-script.js

# Python syntax check for the conservation pipeline
python3 -m py_compile conservation_pipeline.py

# Git whitespace check
git diff --check
```

If using the bundled Codex runtime, use its provided Node.js and Python executables when system tools are unavailable.

There is currently no configured lint, type-check, test, or build command. Do not claim those checks passed unless such tooling has been added. Browser smoke tests may require Playwright or another installed browser runtime; if unavailable, report that limitation.

## Change Discipline

- Keep edits narrowly scoped to the requested behavior.
- Preserve existing conservation and structure behavior unless the task explicitly asks to change it.
- Update `USER_GUIDE.md` or `README.md` when user-facing behavior or scientific interpretation changes.
- Do not overwrite generated teaching artifacts or workbook files unless explicitly requested.
