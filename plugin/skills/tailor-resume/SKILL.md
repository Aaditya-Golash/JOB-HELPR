---
name: tailor-resume
description: Tailor a one-page LaTeX resume to a specific job posting, compile it, and verify the PDF is ATS-safe before handing it back.
---

# Tailor resume

Primary path: call `job-pipeline-mcp`'s `generate_resume` tool — it already
has the calibrated profile, project pool, and one-page LaTeX formatting rules
(no run-ons, no hyphens in prose, task/approach/features/impact bullet
structure). Use this skill when you need the extra tailoring/verification
steps around that call, or when working from local LaTeX directly.

## 1. Draft

Reorder and adjust bullets to lead with what this specific posting cares
about most. Every claim must trace back to something in the saved work
history — never fabricate or round up a skill or result (this rule shows up
independently in `ai-job-search`, `career-ops`, and `proficiently-claude-skills`
— all three converged on it, which is a good sign it's non-negotiable).

## 2. Compile with lualatex

See `shared/references/ats-patterns.md`. Use `lualatex`, not `pdflatex`. This
one line is the single highest-value fix ported from `ai-job-search`'s commit
history — the fontawesome5 icon glyphs in a header line will otherwise
extract as garbage or nothing for an ATS parser.

```
lualatex main_<company>.tex
```

## 3. Verify — mandatory, not optional

Run:
```
python3 shared/scripts/verify_pdf.py output.pdf --name "<Full Name>" --email "<email>"
```
If it reports FAIL, fix the flagged issue and recompile. Do not hand back a
PDF that hasn't passed this check at least once. This mirrors `ai-job-search`'s
"mandatory compile-and-inspect" rule almost exactly — it exists because a
`.tex` file that looks fine routinely produces a broken PDF (orphaned titles,
page 2 spillover, silently-substituted fonts).

## 4. Keyword coverage, never stuffing

Cross-check the posting's keywords against what the resume genuinely
supports. Add ones the profile backs up; leave real gaps visible rather than
stuffing keywords the resume can't justify.
