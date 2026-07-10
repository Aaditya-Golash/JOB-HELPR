# job-pipeline-mcp

MCP server exposing 6 tools for the job search pipeline: `generate_resume`,
`generate_cover_letter`, `save_application`, `list_applications`,
`get_profile`, `get_mailing_address`.

## Tools exposed

- `generate_resume` — one-page LaTeX resume tailored to a job description,
  drawing on 1-3 of the strongest matching projects (default 3). The
  one-page policy always takes priority.
- `generate_cover_letter` — one page LaTeX cover letter tailored to a job
  description, matched to Aaditya's real format.
- `save_application` — logs a job to the tracked application shortlist. Does
  NOT submit anything anywhere, this is a tracker only. Flags likely
  duplicates (same company + job title as an existing entry) via
  `mcp/lib/dedup.ts` instead of silently creating a second row.
- `list_applications` — reads back the tracker, optionally filtered by status.
- `get_profile` — returns the structured profile data (education, experience,
  projects, skills) this server generates materials from.
- `get_mailing_address` — region-matched mailing address for an actual ATS
  form field, given a job's city/province (see `lib/address.ts`).
  Deliberately not part of `get_profile` or the generate tools, so a street
  address never ends up baked into a generated resume/cover letter by
  default — only the `apply` skill calls this, and only when a real form
  field asks for one.

## Setup

```bash
npm install
npm run dev
```

Set `MCP_API_KEY` for every deployed environment. Clients must send it as
`Authorization: Bearer <key>` or `x-mcp-api-key: <key>`. A missing key is
allowed only during local development (with a warning); production fails
closed. See [`MCP_SETUP.md`](MCP_SETUP.md) for local and Vercel examples.

`save_application` / `list_applications` need a Vercel Blob store connected
to persist data — see `.env.example`. In the Vercel dashboard: Storage tab to
create a Blob store, then connect it to this project so
`BLOB_READ_WRITE_TOKEN` is set automatically for deployments; for local dev,
copy the token into a local `.env`. The generate tools work with no setup.
If the token is missing, `mcp/lib/store.ts` throws a clear error naming the
fix instead of failing silently.

`generate_resume` / `generate_cover_letter`'s contact line (`CONTACT_EMAIL`,
`CONTACT_PHONE`, `CONTACT_LOCATION`) and `get_mailing_address`'s five
region addresses (`ADDRESS_*`) are also env-var driven — this repo is
public, and none of those values are committed anywhere, even as an
example. Without them set, the contact fields show an obvious placeholder
and `get_mailing_address` returns `address: null` for a matched region
rather than fabricating a value. See `.env.example` for the full list and
`lib/address.ts` for exactly which cities map to which region.

## Testing

```bash
npm test              # unit tests for lib/ (match, templates, dedup, store, address) -- no network, no server needed
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
                              # running server and calls all 6 tools end-to-end.
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

## Token safety

Do not run `job-helpr setup` for small edits. Use setup only when installing,
changing preferences, or repairing configuration. For small code changes, ask
Claude to inspect only the task-relevant files. Prefer filtered MCP lookups over
broad tracker history calls, and request full generated LaTeX only when
rendering a document. If Claude Code context gets huge after a lockout or reset,
run `claude compact` or restart the CLI before continuing.

Before starting Claude Code:

1. Confirm `.claudeignore` exists.
2. Confirm `.job-helpr/`, `.next/`, `node_modules/`, `mcp/generated/`, PDFs,
   logs, and zip files are ignored.
3. Do not run setup unless needed.
4. Ask Claude to inspect only task-relevant files.
5. Prefer specific MCP lookups over broad history/list calls.
6. If context gets huge, run `claude compact` or restart the CLI.
