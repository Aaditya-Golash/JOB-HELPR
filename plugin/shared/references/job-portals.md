# Job discovery: portals and ATS APIs

Adapted from `santifer/career-ops`'s scan system (`modes/scan.md` and the 58
per-board adapters in `providers/`, MIT licensed — see /NOTICE.md). Career-ops
runs as a standalone Node app with its own HTTP client and locally-parsed
company configs; this version keeps the discovery *strategy* (cheapest,
most-reliable source first) but replaces the vendored provider code with
direct calls to the same public APIs, since this plugin runs inside Claude
Code / Claude in Chrome rather than as its own long-running service.

## Discovery hierarchy, cheapest and most reliable first

### 1. Direct public ATS API calls (fastest, most reliable, no browser needed)

If a target company is known to use one of these platforms, fetch its board
directly. All of these are unauthenticated, public, GET-only endpoints —
verified against each platform's own docs before being written down here:

- **Greenhouse**: `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs`
  (add `?content=true` for full HTML descriptions; filter with `department_id`
  / `office_id`). `board_token` is usually the company's slug as it appears
  in `https://job-boards.greenhouse.io/{board_token}`.
- **Lever**: `GET https://api.lever.co/v0/postings/{company}?mode=json`
  (filter with `team`, `department`, `location`, `commitment`, `skip`,
  `limit`). EU-hosted accounts use `api.eu.lever.co` instead.
- **Ashby**: job board pages are typically server-rendered at
  `https://jobs.ashbyhq.com/{company}` — no documented public JSON endpoint
  as stable as Greenhouse/Lever's, so treat Ashby postings via level 2
  (direct page navigation) rather than assuming an API shape.

Don't guess a `board_token`/`company` slug — get it from the company's actual
careers page URL first, then confirm the API call returns real data before
treating the result as authoritative.

### 2. Direct company careers page (Playwright/Claude-in-Chrome navigation)

For companies not on a known ATS API, or where the API call comes back
empty/wrong, navigate to the company's own careers page directly and extract
listings from the rendered page. See `browser-setup.md` for the tab/context
setup and the context-window-safety rules (don't `get_page_text` a full
listings page — extract with a selector instead).

### 3. Broad web search (widest net, staleness risk)

Use targeted site-specific search queries (e.g. `site:boards.greenhouse.io
"business analyst"`) to surface companies not already being tracked. Search
results can be weeks stale — never add a result from this tier to the
pipeline without a liveness check first (open the actual posting URL and
confirm it still resolves to an active listing before scoring it).

## Filtering before scoring

Apply the saved job preferences from `setup` (target roles, salary floor,
location, exclusions) before anything reaches the scoring rubric in
`scoring-rubric.md`:

- **Title relevance**: at least one saved target-role keyword must appear in
  the title or JD; drop anything matching a saved exclusion outright.
- **Location**: apply the saved location/remote preference; if a posting has
  no location data, don't drop it on that basis alone.
- **Duplicate check**: before surfacing a "new" result, check it against
  `list_applications` (already-tracked) and against results already
  surfaced this session — don't re-present the same posting twice because it
  came back from two different discovery tiers.

## Where to start looking

Not an exhaustive company list — a starting set of ATS platforms worth
checking directly via tier 1 before falling back to search, since a large
fraction of mid-size-to-large employers run their careers page on one of
these: Greenhouse, Lever, Ashby, Workday, BambooHR, Teamtailor, Breezy,
SmartRecruiters, Workable, Recruitee, Personio. Which specific companies to
target comes from the saved profile's target roles/industries, not a fixed
list — unlike career-ops's own pre-configured company set, which is tuned to
its author's AI/LLMOps job search and wouldn't transfer meaningfully here.
