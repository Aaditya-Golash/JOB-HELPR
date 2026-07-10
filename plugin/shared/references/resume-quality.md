# Resume quality rulebook

The actual generation logic lives in `mcp/lib/templates.ts`
(`generateResumeLatex` and its helpers) -- this file documents the rules
that code implements. `Aaditya_Resume_2026(1).pdf` is the base format: all
generated resumes should preserve its one-page spacing, section order,
compact skills block, project-first structure, and all-caps headings
unless a role-specific reason overrides it.

This is a deterministic template/evidence selector, not an LLM call.
Content planning (`buildResumeContentPlan`) happens before any LaTeX is
rendered, and `estimateResumeLength` / `shrinkToOnePage` run on that plan
before `renderResumeLatex` ever sees it -- the old generator's failure mode
was rendering first and hoping it fit; this one budgets first.

## The one-page rule

Never return a resume that spills to page 2. `verify_resume_pdf.py`
compiles and checks the actual page count -- `tailor-resume` must run it
and treat page count != 1 as a hard failure requiring the shrink strategy,
not something to hand back anyway.

## Base section order

```
Header
EDUCATION
TECHNICAL SKILLS & CORE COMPETENCIES
SELECTED PROJECTS
PROFESSIONAL EXPERIENCE
```

Headings are literal all-caps text in the LaTeX source (not a
`\MakeUppercase` macro relying on rendering) so both a human reading the
.tex file and a mechanical test checking the source string see the same
thing.

### Role-based section order exceptions

Projects before experience is the default for early-career technical,
data, product, analyst, and software roles, because Aaditya's strongest
tailored evidence is usually in projects. Experience-first is used only for
clearly nontechnical roles (`supply_chain_ops` in the role type table
below) where the work-history narrative matters more than a project list.

## Content budget

- 1 page only.
- 14-16 bullets preferred, **18 hard cap**.
- Education: 2 bullets max.
- Skills: 3 lines by default, 4 max.
- Projects: 3 max, 8-11 bullets total, strongest project can have 4 bullets
  (others 2-3) only if the resume still fits.
- Experience: both real roles by default (there are only two), 5-6 bullets
  total, 3 max per role.

## Shrink order

If the content plan or a real compile shows the resume spilling, reduce in
this exact order and never stop before it fits:

1. Reduce project bullets (cap every project at 3).
2. Reduce experience bullets (cap every role at 2).
3. Compress skills from 4 lines to 3.
4. Remove the weakest (least relevant) project entirely.
5. Tighten spacing slightly (LaTeX-level, not a content change).
6. Never return 2 pages -- if every step above still doesn't fit, cut
   further rather than shipping page 2.

`shrinkToOnePage()` in `templates.ts` implements steps 1-4 mechanically.

## Bullet formulas

12-28 words normally, 32 max only if unavoidable. Every bullet follows one
of:

- Built [system] using [tools], supporting [scale] and achieving [impact].
- Analyzed [data/source] to identify [insight], enabling [business/
  operational outcome].
- Automated [manual process] across [scale], reducing [time/errors/
  workload] by [metric].
- Designed [workflow/dashboard/data model] for [stakeholders], improving
  [decision/reporting/process outcome].
- Led [team/process] across [scope], delivering [result] under
  [constraints].

**Banned weak verbs** (never open a bullet with these): helped, worked on,
assisted, participated, responsible for, learned, used.

**Preferred strong verbs**: Built, Implemented, Designed, Automated,
Analyzed, Generated, Refactored, Delivered, Migrated, Validated, Optimized,
Produced, Restructured, Coordinated, Scoped, Led, Developed, Maintained.

**Symbols, not words**: `250+` not "250 plus"; `70%` not "70 percent";
`$1.9M` not "1.9 million dollar"; `11×11` not "11 by 11"; `full-stack` not
"full stack"; `role-based` not "role based"; `biweekly` not "bi weekly".

## Banned raw project-dump phrases

- "A directed studies project needed"
- "A research team needed"
- "UBC Computer Science needed"
- "Wanted to apply"
- "Explored whether"
- "Letting researchers"
- "Co built"
- "3 person team"

**Bad** → **Good**:
- "UBC Computer Science needed to replace a manual spreadsheet process for
  assigning 250 plus TA applications per academic term. Scoped and
  delivered…" → "Delivered a full-stack allocation platform (Flask, MySQL)
  replacing a manual process, handling 250+ TA applications per term."
- "Wanted to apply portfolio theory to real TSX equity data as a class
  project." → "Built a Python/Excel pipeline analyzing 37 months of TSX
  equity data, computing log returns and an 11×11 covariance matrix."
- "A directed studies project needed a way to evaluate user decision
  making…" → "Built a Python ETL pipeline for Tobii Pro Glasses 3 exports,
  transforming gaze, pupil, and IMU streams into structured usability
  metrics."

## Metric bank

`250+`, `36+`, `70%`, `100%`, `95%`, `37 months`, `11×11`, `\$1.9M`,
`\$370,000+`, `150+`, `110+`, `12,000+`, `70,000+`, `\$5M+`, `300+`, `2nd
place and \$1,500`, `4M+`, `2M+`, `10K+`. Bold the metric only when it's
the strongest proof point in a bullet, not in every bullet.

## Evidence bank -- role type table

Each role type (`ResumeRoleType` in `templates.ts`) has a fixed
professional-experience selection (which bullets from the two real roles),
a fixed 3-project selection with bullet counts, and a fixed 3-line skills
selection. Full detail lives in `RESUME_EXPERIENCE_PLAN` /
`RESUME_PROJECT_PLAN` / `RESUME_SKILLS_PLAN` in `templates.ts`; summary:

| Role type | Projects (in order) | Experience emphasis |
|---|---|---|
| Business Intelligence / Data Analyst | TA Allocation, Eye Tracking, TSX Portfolio | UBC IT (ServiceNow, incidents), UBCSUO (dashboards) |
| Business Analyst / Systems Analyst | TA Allocation, Eye Tracking, Calmora | UBC IT (workflows, bot integration), UBCSUO (governance) |
| Product Analyst / APM / PM | TA Allocation, Eye Tracking, VenueWorks | UBCSUO (dashboards, stakeholder), UBC IT (KB rewrite) |
| Automation / AI Ops / RevOps / Product Ops | Calmora, TA Allocation, Eye Tracking | UBC IT (bot integration, bottlenecks) |
| Strategy / Operations / Consulting | TA Allocation, TSX Portfolio, VenueWorks | UBCSUO (budget, committees), UBC IT (process improvement) |
| Finance / M&A / Equity | TSX Portfolio, TA Allocation, VenueWorks | UBCSUO (budget/funding) |
| Nonprofit / Climate / Program | VenueWorks, TA Allocation, Social Media | UBCSUO (budget, funding, policy, committees) |
| IT / Systems / Network | HelpR, TA Allocation, Eye Tracking | UBC IT (incidents, users, KB, M365) |
| Software Developer / Backend / Full Stack | TA Allocation, HelpR, Eye Tracking | UBC IT (technical refactor, bot integration) |
| Supply Chain / Operations / Logistics | TA Allocation, VenueWorks, Calmora | UBCSUO (budget, committees) -- experience-first order |
| Marketing / Growth / Product Marketing | Social Media, VenueWorks, TA Allocation | UBCSUO (dashboards, digital strategy) |
| UI / UX / Frontend | Eye Tracking, HelpR, Social Media | UBC IT (KB rewrite) |

**Known gap, not fabricated**: the account owner mentioned additional real
work (a campus food cart, a "Destination UBC" event, inventory work at
"Costoso Italiano") as evidence for the Supply Chain/Ops role, but without
enough detail (employer relationship, dates, title) to responsibly write a
resume bullet without guessing. That evidence isn't in the bank yet --
ask the account owner for the missing specifics before adding it, rather
than inventing them.

## Spacing rules (from the compact LaTeX format)

```
\documentclass[10pt,letterpaper]{article}
\usepackage[margin=0.42in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage[hidelinks]{hyperref}
\usepackage[T1]{fontenc}
\usepackage[english]{babel}

\pagestyle{empty}
\raggedright
\raggedbottom
\setlength{\parindent}{0pt}
\setlength{\tabcolsep}{0in}
\setlist[itemize]{leftmargin=*, itemsep=0pt, topsep=1pt, parsep=0pt, partopsep=0pt}

\titleformat{\section}{\vspace{-7pt}\bfseries\raggedright\large}{}{0em}{}[\titlerule \vspace{-4pt}]
```

Header: name, then one line of `City, Province | phone | email |
linkedin.com/in/... | github.com/...` -- bare handles, never a full
`https://` URL, no street address, no icons (fontawesome5 + pdflatex
extraction risk -- always compile with lualatex regardless). Location is
role-dependent (`selectResumeLocation`, matched by keyword against the
JD's city/province, defaulting to Kelowna, BC) for the header/education
line only -- Professional Experience always shows the real historical
location (Kelowna, BC for both roles), never the target job's city.

## Final audit checklist

`auditResumeLatex()` checks every one of these mechanically; a violation
throws rather than shipping a broken resume:

- [ ] No banned project-dump phrase
- [ ] No bullet opens with a weak verb
- [ ] At most 18 `\resumeItem{}` bullets
- [ ] At most 3 selected projects, none with more than 4 bullets
- [ ] At most 4 skill lines
- [ ] No malformed project title (trailing `- |`)
- [ ] Uses the compact `margin=0.42in`
- [ ] Header has no full `https://` URL

Not mechanically checked by `auditResumeLatex` (needs a real compile):
one-page fit -- that's `verify_resume_pdf.py`'s job, run after
`lualatex`, per `tailor-resume/SKILL.md`.
