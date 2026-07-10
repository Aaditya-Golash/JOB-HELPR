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
