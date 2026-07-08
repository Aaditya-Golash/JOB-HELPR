# Tracker: single source of truth

## The conflict

Three of the four source projects each keep their own application tracker:

- `claude-linkedin-assistant`: `job_tracker.csv` (flat CSV, positional columns)
- `career-ops`: `data/applications.md` (markdown table, header-aware column
  mapping added later after issues #946/#954 broke on inserted columns —
  see `tracker-parse.mjs` for the fix)
- `ai-job-search`: no persistent tracker; relies on the drafter/reviewer session
  and the files it produces per application folder
- `proficiently-claude-skills`: `~/.proficiently/` per-application folders,
  no CSV/markdown ledger

Meanwhile this account already has a working tracker: the `job-pipeline-mcp`
server's `save_application` / `list_applications` tools, backed by Vercel Blob.

## The resolution

**`job-pipeline-mcp` is the single source of truth for application status.**
Nothing in `plugin/` maintains its own CSV or markdown ledger. The `tracker`
skill in this plugin is a thin wrapper: it calls the MCP tools directly instead
of re-implementing tracking locally. This avoids the exact class of bug that
`career-ops` had to fix twice (#946, #954, and the later fuzzy-dedup guard) —
two independent readers of the same data drifting out of sync.

## What was still worth keeping

Even though the storage layer is now centralized, one piece of logic from
`career-ops` is genuinely better than starting from scratch, so it's ported
(not copied wholesale) into `shared/scripts/dedup-check.mjs` and, since the
JOB-HELPR merge, directly into the MCP server itself (`mcp/lib/dedup.ts`):

- **Duplicate detection before insert.** Before adding a new application row,
  check company + job title against existing entries and flag likely
  duplicates rather than silently creating two rows for the same application.
  `save_application` now runs this check server-side and returns
  `likelyDuplicateOf` in its response, so the tracker skill doesn't need to
  fetch the full list and check client-side first — it can just read the
  field back from the save call.

## Actual field names and status values

The real `job-pipeline-mcp` schema (see `mcp/lib/store.ts`), not the
placeholder used when this plugin was first assembled without access to the
real server code:

- `save_application` takes `company`, `jobTitle` (not `role`), plus optional
  `jobUrl`, `source`, `salary`, `postedDaysAgo`, `matchNotes`, `projectsUsed`.
- `status` is one of `shortlisted` (default), `materials_ready`,
  `outreach_drafted`, `applied` — a shortlist-to-applied pipeline, not the
  post-applied `responded` / `interview` / `offer` / `rejected` states an
  earlier reconstruction guessed at. Track post-applied outcomes as
  `matchNotes` until/unless the schema is extended.
