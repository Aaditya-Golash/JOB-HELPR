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

## Testing

```bash
npm test              # unit tests for lib/ (match, templates, dedup, store) -- no network, no server needed
npm run test:watch    # same, in watch mode
```

`store.test.ts` mocks `@vercel/blob` with an in-memory fake so the full
save/dedup/list cycle is tested without real credentials.

Two more checks aren't part of `npm test` because they need live network
access or a running server, which would make CI flaky:

```bash
npm run check:connectors   # live check of the public Greenhouse/Lever ATS
                            # APIs documented in plugin/shared/references/job-portals.md
npm run dev                 # in one terminal
npm run smoke                # in another -- connects a real MCP client to the
                              # running server and calls all 5 tools end-to-end.
                              # save_application/list_applications degrade to
                              # verifying the clear BLOB_READ_WRITE_TOKEN error
                              # if no Blob store is configured locally.
```

## Deploy

```bash
npx vercel --prod
```

## Editing the profile

Edit `lib/profile.ts` directly whenever experience, projects, or skills
change — that file is the single source of truth for everything this server
generates.
