---
name: tailor-resume
description: Tailor a one-page LaTeX resume to a specific job posting, compile it, and verify the PDF is ATS-safe and one page before handing it back.
---

# Tailor resume

Call `job-pipeline-mcp`'s `generate_resume` tool. It is a deterministic
template/evidence selector, not an LLM call: it classifies the role type
from the job title/description, selects content from a fixed evidence bank
based on that role (base format from `Aaditya_Resume_2026(1).pdf` --
EDUCATION, TECHNICAL SKILLS & CORE COMPETENCIES, SELECTED PROJECTS,
PROFESSIONAL EXPERIENCE, projects before experience by default), budgets
content to fit one page before ever rendering LaTeX, and runs a
banned-phrase audit before returning. Read
`shared/references/resume-quality.md` for the full rulebook (content
budget, role selection matrix, bullet formulas, metric bank, shrink order,
banned phrases) -- this file is the workflow around that tool, not a
replacement for it.

**Never blindly accept the generator's output as final.** It gets you a
strong first draft with the right content already selected; this skill's
job is to compile it, verify it's actually one page, and reduce content and
retry if it isn't -- not to hand back whatever came out of the tool call
unchecked.

## 1. Understand what got selected, and why

Before touching LaTeX, read the notes `generate_resume` returns alongside
the document: role classification, location, section order, which projects
were used, total bullet count. This skill should be able to explain the
selected evidence and any tradeoffs (why this project over another, why
this section order) -- it must never present a resume as if it dumped
every experience and project the account has, because it doesn't.

## 2. Adjust only if the posting calls for it

Reorder or lightly adjust bullets to lead with what this specific posting
cares about most, but stay inside the tool's role-based evidence selection
-- don't manually re-introduce a full profile dump or add back content the
generator deliberately left out. Every claim must trace back to something
in the saved work history -- never fabricate or round up a skill or
result.

## 3. Compile with lualatex

```
lualatex main_<company>.tex
```

Use `lualatex`, not `pdflatex` -- see `shared/references/ats-patterns.md`
for why (fontawesome5-style icon glyphs, if ever reintroduced, extract as
garbage under pdflatex). This resume format doesn't use icons at all for
exactly this reason, but the compiler choice still matters for font
handling generally.

## 4. Verify -- one page is mandatory, not optional

Run both checks:
```
python3 shared/scripts/verify_pdf.py output.pdf --name "<Full Name>" --email "<email>"
python3 ../mcp/scripts/verify_resume_pdf.py output.pdf --name "<Full Name>" --email "<email>"
```
The second script exists specifically for the resume's one-page
constraint: it compiles and checks the real page count, not just glyph
safety. **If page count is anything other than 1, this skill must not hand
back the PDF.** Apply the shrink order from `resume-quality.md` (reduce
project bullets → reduce experience bullets → compress skills to 3 lines →
drop the weakest project → tighten spacing) and recompile. Repeat until
`verify_resume_pdf.py` reports PASS. Never return a resume that spills to
page 2.

## 5. Keyword coverage, never stuffing

Cross-check the posting's keywords against what the resume genuinely
supports. Add ones the profile backs up; leave real gaps visible rather
than stuffing keywords the resume can't justify.
