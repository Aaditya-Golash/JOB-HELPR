---
name: job-search
description: Find jobs matching the saved profile and preferences across connected job boards and LinkedIn, and score them for fit before anything gets drafted.
---

# Job search

Merged from `ai-job-search`'s portal-search pattern, `career-ops`'s
`scan.mjs` / `scan-ats-full.mjs`, and `proficiently-claude-skills`'
job-search skill.

## 1. Search

Follow the discovery hierarchy in `shared/references/job-portals.md` —
cheapest and most reliable first: direct public ATS API calls (Greenhouse,
Lever), then direct company career-page navigation, then broad web search as
the widest, staleness-prone fallback. Apply the saved filters from setup
before anything moves to scoring: target role, salary floor, location,
exclusions.

`ai-job-search`'s portal skills are Denmark-specific (Jobindex, Jobnet,
Akademikernes Jobbank) — not relevant here, so they're not ported directly.
The pattern worth keeping is generic: one small search adapter per source,
each returning a common shape (title, company, location, url, posted_date,
salary if available), so scoring in the next step doesn't need to know which
source a listing came from.

Before treating any result as new, check it against `list_applications`
(already tracked) and against results already surfaced this session — a
posting resurfacing from a later discovery tier isn't a new listing.

## 2. Score for fit

Run every result through the full rubric in
`shared/references/scoring-rubric.md` (adapted from career-ops's evaluation
system): a 1-5 score across profile match, target-role alignment, comp,
cultural signals, and red flags, plus a separate posting-legitimacy check
that's never blended into the numeric score. Two things worth calling out
explicitly:

- **Seniority match**: don't collapse "Senior X" and "X II" into the same
  bucket — keep title-level seniority words as a distinct signal, not just
  keyword overlap. (This traces back to a real seniority-handling bug
  career-ops's own scan filtering had to account for — see
  `scoring-rubric.md`.)
- **Comp**: use the posting's advertised number verbatim; never blend it
  with an estimate.

## 3. Present, don't auto-queue

Show the ranked matches with a one-line reason for each ranking. Let the user
pick which ones move to `tailor-resume`. This skill never automatically
queues a job for `apply` — picking what to pursue stays a human decision.
