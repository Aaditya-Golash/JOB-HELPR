# MCP connection setup

The Claude Code plugin cannot safely declare one fixed MCP URL because each
installation may use a local server or a different Vercel deployment. Connect
`job-pipeline-mcp` separately, then install or use the plugin.

## Local server

1. Copy `.env.example` to `.env.local` and set contact fields. Blob credentials
   are needed only for tracker tools. `MCP_API_KEY` may be left unset locally;
   the server prints a warning and accepts local requests.
2. Run `npm install` and `npm run dev` inside `mcp/`.
3. Add `http://localhost:3000/api/mcp` as an HTTP MCP server named
   `job-pipeline-mcp` in Claude Code. If you set a local key, add either header:

   ```text
   Authorization: Bearer <MCP_API_KEY>
   x-mcp-api-key: <MCP_API_KEY>
   ```

## Vercel deployment

1. Connect a Vercel Blob store and set the contact/address variables described
   in `.env.example`.
2. Generate a strong random `MCP_API_KEY`, add it to every deployed environment,
   and redeploy. Production refuses requests when the key is missing.
3. Connect `https://<deployment>/api/mcp` as `job-pipeline-mcp`, configuring one
   of the headers above. Never commit the key or put it in the URL.

## Verify

Call `get_profile`. A configured client receives the structured profile. A
missing or incorrect key receives HTTP 401. Then call `list_applications`; it
will either return the tracker or the documented `BLOB_READ_WRITE_TOKEN` setup
error.

The plugin manifest format used here does not provision a user-specific remote
MCP URL or secret header. This separate connection step is therefore required.

## Claude Code context hygiene

Generated PDFs and LaTeX logs, `.next`, `node_modules`, uploaded archives, and
`.job-helpr` are ignored so they do not create oversized Claude/Codex cache
reads. Inspect only files relevant to the current task. Generated documents
belong in `mcp/generated/` and must not be committed. `.job-helpr/` is local
runtime/plugin state, not source documentation: keep it locally, but do not
commit it. In particular, `.job-helpr/profile.md` is runtime profile/preference
state and should stay compact; stable setup instructions belong in tracked docs
or source files instead. When a task needs a generated PDF, regenerate or
inspect that file directly instead of retaining the generated directory in the
default project context.

Do not run `job-helpr setup` for small edits. Use setup only when installing,
changing preferences, or repairing configuration. For small code changes, tell
Claude exactly which files to inspect. After a lockout or reset caused by huge
context, run `claude compact` or restart the CLI before continuing.

MCP tools should return compact responses by default. Use `get_profile` with
`detailLevel: "summary"` unless full profile data is needed for document
generation. Use `list_applications` with `limit` and filters such as `status`,
`company`, `role`, or `since`; do not request full application history unless
the task specifically needs it. Generated LaTeX is omitted by default from
generation tools; request it explicitly with `includeLatex: true` when rendering
documents.

## Token safety checklist

Before starting Claude Code:

1. Confirm `.claudeignore` exists.
2. Confirm `.job-helpr/`, `.next/`, `node_modules/`, `mcp/generated/`, PDFs,
   logs, and zip files are ignored.
3. Do not run setup unless needed.
4. Ask Claude to inspect only task-relevant files.
5. Prefer specific MCP lookups over broad history/list calls.
6. If context gets huge, run `claude compact` or restart the CLI.
