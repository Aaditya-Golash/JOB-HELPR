# Changelog

## 0.1.0 — initial merge

Merged and hardened from four source projects. See `/CONFLICTS.md` at the
repo root for the full list of conflicts found and how each was resolved.

- `setup`, `job-search`, `tailor-resume`, `cover-letter`, `apply`,
  `outreach`, `tracker` skills, all under the standard
  `.claude-plugin/plugin.json` + `SKILL.md` format.
- Tracker delegates entirely to `job-pipeline-mcp` rather than keeping a
  local CSV/markdown file — see `shared/references/tracker-schema.md`.
- `apply` and `outreach` both require explicit per-action confirmation before
  anything sends or submits — see `shared/references/confirmation-gates.md`.
  This is a deliberate change from an earlier, unattended-mode version of
  this plugin built in a prior session; that version doesn't match how any
  of the four source projects it drew from actually designed this, and two
  of them explicitly warn against it.
- `shared/scripts/verify_pdf.py` and `shared/scripts/dedup-check.mjs` are
  both tested against real inputs (compiled PDFs, sample company-name
  collisions), not just written and assumed correct. One real bug was found
  and fixed in `dedup-check.mjs` during that testing (see CONFLICTS.md #3).
