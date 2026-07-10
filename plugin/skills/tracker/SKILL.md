---
name: tracker
description: Check application status, log a new application, and catch likely duplicates -- all through job-pipeline-mcp, the single source of truth for tracked applications.
---

# Tracker

See `shared/references/tracker-schema.md` for why this skill has no local
CSV/markdown file of its own, unlike three of the four source projects.

## Checking status

Call `job-pipeline-mcp`'s `list_applications` tool with the narrowest useful
filters: `limit`, `status`, `company`, `role`, and `since`. Do not request broad
history by default, and do not reimplement filtering/sorting logic elsewhere.
Read the compact paginated response directly; use `nextOffset` only when the
user explicitly needs more rows.

## Logging a new application

Call `save_application` with `company` and `jobTitle` plus whatever optional
fields apply: `jobUrl`, `source`, `salary`, `postedDaysAgo`, `matchNotes`, and
`projectsUsed`. The tool runs the duplicate check server-side and returns
`likelyDuplicateOf` in its response. Check that field directly rather than
calling `list_applications` first and diffing client-side:

```js
const result = await saveApplication({ company, jobTitle, ... }); // via the MCP tool
if (result.likelyDuplicateOf) {
  // tell the user before treating this as a new, distinct application
}
```

If `likelyDuplicateOf` is non-null, tell the user before treating this as a
new entry. Do not silently ignore it, and do not silently merge without asking
either. The standalone `shared/scripts/dedup-check.mjs` implementation is
available as a fallback for any path that is not going through
`save_application` directly.

## Status values

`shortlisted` < `materials_ready` < `outreach_drafted` < `applied` -- see
`shared/references/tracker-schema.md` for the real schema. Never move an
application backward in status without the user explicitly saying that is what
happened.
