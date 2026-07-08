---
name: tracker
description: Check application status, log a new application, and catch likely duplicates — all through job-pipeline-mcp, the single source of truth for tracked applications.
---

# Tracker

See `shared/references/tracker-schema.md` for why this skill has no local
CSV/markdown file of its own, unlike three of the four source projects.

## Checking status

Call `job-pipeline-mcp`'s `list_applications` tool. Don't reimplement
filtering/sorting logic elsewhere — read what the tool returns directly.

## Logging a new application

Call `save_application` with `company` and `jobTitle` (plus whatever optional
fields apply — `jobUrl`, `source`, `salary`, `postedDaysAgo`, `matchNotes`,
`projectsUsed`). The tool runs the duplicate check server-side and returns
`likelyDuplicateOf` in its response — check that field directly rather than
calling `list_applications` first and diffing client-side:

```js
const result = await saveApplication({ company, jobTitle, ... }); // via the MCP tool
if (result.likelyDuplicateOf) {
  // tell the user before treating this as a new, distinct application
}
```

If `likelyDuplicateOf` is non-null, tell the user before treating this as a
new entry — don't silently ignore it, and don't silently merge without asking
either (career-ops's dedup logic merges automatically offline; here, since a
human is in the loop live, ask instead). The standalone
`shared/scripts/dedup-check.mjs` implementation is available as a fallback
for any path that isn't going through `save_application` directly.

## Status values

`shortlisted` < `materials_ready` < `outreach_drafted` < `applied` — see
`shared/references/tracker-schema.md` for the real schema. Never move an
application backward in status without the user explicitly saying that's what
happened.
