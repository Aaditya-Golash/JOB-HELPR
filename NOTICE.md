# Third-party attribution

Portions of `plugin/` are ported (adapted, not copied verbatim in most
cases) from the following open-source projects:

- **FarzamHejaziK/claude-linkedin-assistant** — MIT License, Copyright (c)
  2026 Farzam Hejazi. Source for `outreach/SKILL.md`'s scope and quota-aware
  design, and the resume-check pattern in `setup/SKILL.md`.
- **MadsLorentzen/ai-job-search** — MIT License, Copyright (c) 2026 Mads
  Lorentzen. Source for the mandatory compile-and-inspect loop and the
  lualatex fix in `shared/references/ats-patterns.md`.
- **santifer/career-ops** — MIT License, Copyright (c) 2026 Santiago
  Fernández de Valderrama. Source for the duplicate-detection logic adapted
  into `shared/scripts/dedup-check.mjs` and `mcp/lib/dedup.ts`, and the
  explicit no-auto-submit design principle referenced in
  `shared/references/confirmation-gates.md`.
- **proficientlyjobs/proficiently-claude-skills** — declared MIT in its
  `plugin.json`, though the cloned repo did not include a standalone LICENSE
  file at the time of this merge (worth confirming directly with the
  upstream project if this matters for your use). Source for the
  `.claude-plugin/` plugin structure this repo standardizes on, the
  `browser-setup.md` and `priority-hierarchy.md` references (ported with
  minimal changes), and the ATS form-filling mechanics in `apply/SKILL.md`
  (materially changed — see `CONFLICTS.md` #1 for what changed and why).

No file in this repo is a full, unmodified copy of an upstream file except
`shared/references/browser-setup.md`, which was left as-is because it was
already correct and generic.
