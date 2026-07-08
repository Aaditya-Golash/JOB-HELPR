# JOB-HELPR

A job search pipeline: one MCP server for drafting, one Claude Code plugin
for the rest of the workflow. See `CONFLICTS.md` for what was merged from
external sources, what conflicted, and how each conflict was resolved, and
`NOTICE.md` for third-party attribution.

```
JOB-HELPR/
├── mcp/      job-pipeline-mcp — Next.js MCP server, deploys to Vercel.
│             Tools: generate_resume, generate_cover_letter, save_application,
│             list_applications, get_profile. See mcp/README.md.
│
└── plugin/   job-helpr — Claude Code plugin. Skills: setup, job-search,
              tailor-resume, cover-letter, apply, outreach, tracker.
              Everything that sends a message or submits a form stops for
              explicit confirmation first — see
              plugin/shared/references/confirmation-gates.md.
```

## Where this came from

- `mcp/` — the working MCP server, calibrated to Aaditya Golash's real
  resume/cover-letter format and project pool. `mcp/lib/profile.ts` is the
  single source of truth for everything the generate tools produce.
- `plugin/` — merged from four open-source Claude Code job-search projects,
  hardened around a single non-negotiable rule: nothing that sends a
  message or submits a form happens without explicit per-action
  confirmation. See `NOTICE.md` for attribution and `CONFLICTS.md` for how
  each source disagreement was resolved:
  - [`FarzamHejaziK/claude-linkedin-assistant`](https://github.com/FarzamHejaziK/claude-linkedin-assistant) (MIT)
  - [`MadsLorentzen/ai-job-search`](https://github.com/MadsLorentzen/ai-job-search)
  - [`santifer/career-ops`](https://github.com/santifer/career-ops) (MIT)
  - [`proficientlyjobs/proficiently-claude-skills`](https://github.com/proficientlyjobs/proficiently-claude-skills) (MIT)

## Install the plugin

```bash
claude plugin marketplace add https://github.com/Aaditya-Golash/JOB-HELPR.git
claude plugin install job-helpr@job-helpr
```

## Deploy the MCP server

```bash
cd mcp
npm install
npx vercel --prod
```

Needs a Vercel Blob store connected for `save_application` / `list_applications`
to persist data — see `mcp/README.md` and `mcp/.env.example`. The generate
tools work with no setup.
