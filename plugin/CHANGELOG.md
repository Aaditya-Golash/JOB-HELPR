# Changelog

## 0.2.0 — career-ops scan/score port

- `shared/references/scoring-rubric.md` — career-ops's 1-5 scoring system
  (profile match, target-role alignment, comp, cultural signals, red flags)
  and its separate posting-legitimacy check, adapted with career-ops's
  fixed AI-specific archetype list replaced by role-family detection driven
  by the saved profile's `targetRoles`.
- `shared/references/job-portals.md` — the tiered discovery strategy from
  career-ops's scanner (direct public ATS API call, then page navigation,
  then broad web search), reimplemented as direct calls to the public
  Greenhouse/Lever APIs (endpoint formats independently verified against
  each platform's own docs) rather than vendoring career-ops's Node HTTP
  client.
- `job-search/SKILL.md` now points at both instead of describing scoring
  and discovery ad hoc.
- Corrects two claims from the original merge (`CONFLICTS.md` #9): the
  scoring system is a 1-5 numeric score, not "A-F"/"10 dimensions"; no file
  literally named `role-matcher.mjs` could be confirmed in career-ops (the
  real mechanism is a keyword config in `modes/scan.md`), though the
  underlying seniority-matching lesson still holds.
- Also on this MCP server: `save_application` now runs duplicate-detection
  server-side (`mcp/lib/dedup.ts`) and returns `likelyDuplicateOf` directly.

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
