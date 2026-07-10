# Profile Source Guidance

`mcp/lib/profile.ts` is the source profile used by the MCP generators.
`.job-helpr/profile.md` is local runtime state for setup/preferences and should
stay compact. Do not treat `.job-helpr/profile.md` as source documentation, do
not append full conversation history to it, and do not ask Claude to read
`.job-helpr/` after setup.

When stable setup or profile-maintenance instructions are needed, keep them in
tracked documentation such as this file, `mcp/MCP_SETUP.md`, or
`docs/job-helpr-setup.md`.
