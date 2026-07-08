# JOB-HELPR

An MCP server for generating tailored job application materials and tracking applications.

Point an MCP client at `<deployment-url>/api/mcp`.

## Tools exposed

- `generate_resume` — one page LaTeX resume tailored to a job description
- `generate_cover_letter` — one page LaTeX cover letter tailored to a job description
- `save_application` — logs a job to the tracker (no submission)
- `list_applications` — reads back the tracker
- `get_profile` — returns the structured profile data used for generation

## Setup

```
npm install
npm run dev
```

This project needs a Vercel Blob store connected for `save_application` / `list_applications` to persist data. In the Vercel dashboard: Storage tab to create a Blob store, then connect it to this project so `BLOB_READ_WRITE_TOKEN` is set automatically. The generate tools work with no setup.

Edit `lib/profile.ts` directly whenever experience, projects, or skills change — that file is the single source of truth for everything this server generates.