# job-pipeline-mcp

MCP server exposing 5 tools for the job search pipeline: `generate_resume`,
`generate_cover_letter`, `save_application`, `list_applications`,
`get_profile`.

## Tools exposed

- `generate_resume` — one page LaTeX resume tailored to a job description,
  drawing on 3-5 of the strongest matching projects from the fixed project
  pool.
- `generate_cover_letter` — one page LaTeX cover letter tailored to a job
  description, matched to Aaditya's real format.
- `save_application` — logs a job to the tracked application shortlist. Does
  NOT submit anything anywhere, this is a tracker only. Flags likely
  duplicates (same company + job title as an existing entry) via
  `mcp/lib/dedup.ts` instead of silently creating a second row.
- `list_applications` — reads back the tracker, optionally filtered by status.
- `get_profile` — returns the structured profile data (education, experience,
  projects, skills) this server generates materials from.

## Setup

```bash
npm install
npm run dev
```

`save_application` / `list_applications` need a Vercel Blob store connected
to persist data — see `.env.example`. In the Vercel dashboard: Storage tab to
create a Blob store, then connect it to this project so
`BLOB_READ_WRITE_TOKEN` is set automatically for deployments; for local dev,
copy the token into a local `.env`. The generate tools work with no setup.
If the token is missing, `mcp/lib/store.ts` throws a clear error naming the
fix instead of failing silently.

## Deploy

```bash
npx vercel --prod
```

## Editing the profile

Edit `lib/profile.ts` directly whenever experience, projects, or skills
change — that file is the single source of truth for everything this server
generates.
