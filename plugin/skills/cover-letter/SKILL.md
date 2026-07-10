---
name: cover-letter
description: Write a natural, honest cover letter tailored to a specific posting, matched to the tailored resume for the same role.
---

# Cover letter

Call `job-pipeline-mcp`'s `generate_cover_letter` tool directly with the job
title, company, and full job description. **This does not require or depend
on `tailor-resume`.** Cover letters are generated straight from the job
description, the saved profile, work history, and the evidence bank in
`shared/references/cover-letter-quality.md` -- not from a resume that may or
may not already exist for this posting.

`generate_resume` is deprecated for now unless the user explicitly asks for
a resume. The priority workflow is excellent cover letters.

## What the tool already does for you

`generate_cover_letter` is a deterministic template/evidence selector, not
an LLM call -- it classifies the role type from the job title/description,
picks pre-written evidence blocks matched to that role, bolds 2-4 of the
strongest metrics in them, and runs every letter through a banned-phrase
audit before returning it. You do not need to write any of the prose
yourself. Read `shared/references/cover-letter-quality.md` for the full
rulebook (style pattern, role selection matrix, metric bank, skill bridges,
banned phrases) -- this file is the short version.

## Voice rules

- First person, no em dashes.
- Mission bridge first: open by connecting the company's mission, product,
  or operating problem to Aaditya's background -- never a generic "I am
  writing to express my interest" opener.
- 2 to 4 bolded metrics (`\textbf{}`), never more, never the whole sentence.
- Skill bridge, not admission: if the JD asks for a tool or industry
  experience that isn't Aaditya's strongest direct experience, bridge
  through adjacent/transferable experience -- never say "I lack X" or
  "although I do not have Y."
- Strict honesty — never fabricates or exaggerates anything not already in
  the resume/work history. The evidence bank only contains real, verified
  facts; bridging language reframes real experience, it never invents new
  experience.
- Mirror the employer's own language from the posting where it's genuinely
  accurate, not as a keyword-stuffing exercise.
