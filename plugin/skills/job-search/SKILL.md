---
name: job-search
description: Find jobs matching the saved profile and preferences across connected job boards and LinkedIn, and score them for fit before anything gets drafted.
---

# Job search

Merged from `ai-job-search`'s portal-search pattern, `career-ops`'s
`scan.mjs` / `scan-ats-full.mjs`, and `proficiently-claude-skills`'
job-search skill.

## 1. Search

Use whatever job-search connectors are available (Dice, Indeed, ZipRecruiter,
LinkedIn search, direct company career pages) plus web search as a fallback.
Apply the saved filters from setup: role, salary floor, location, exclusions.

`ai-job-search`'s portal skills are Denmark-specific (Jobindex, Jobnet,
Akademikernes Jobbank) — not relevant here, so they're not ported directly.
The pattern worth keeping is generic: one small search adapter per source,
each returning a common shape (title, company, location, url, posted_date,
salary if available), so scoring in the next step doesn't need to know which
source a listing came from.

## 2. Score for fit

For each result, evaluate against the saved profile:
- Which required/preferred skills match, and which are gaps
- Seniority match (don't collapse "Senior X" and "X II" into the same
  bucket — career-ops's `role-matcher.mjs` had a real bug here where
  seniority signals in the title got discarded; keep title-level seniority
  words as a distinct signal, not just keyword overlap)
- Salary fit against the floor from setup, if salary data is available

## 3. Present, don't auto-queue

Show the ranked matches with a one-line reason for each ranking. Let the user
pick which ones move to `tailor-resume`. This skill never automatically
queues a job for `apply` — picking what to pursue stays a human decision.
