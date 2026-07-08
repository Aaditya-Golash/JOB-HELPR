---
name: setup
description: One-time setup — resume intake, job preferences, and a work history interview so every later skill has real material to draw from instead of just the one-page resume.
---

# Setup

Run this once before anything else. Adapted from `proficiently-claude-skills`'
setup flow and `claude-linkedin-assistant`'s Step 0 resume check.

## 1. Resume check (from claude-linkedin-assistant)

Look for an existing resume. If none is found, don't just error out — ask for
it directly, and accept any of: a file dropped in this project, a paste/attach
in chat, or a path on disk. Any of `.pdf`, `.tex`, `.md`, `.docx` is fine.

Extract at minimum: full name, current title, target roles, and a few
headline skills. These get used immediately after to verify you're talking to
the right person before anything else runs.

## 2. Job preferences

Ask for (skip any already known):
- Target roles / titles
- Minimum salary
- Location(s) and remote/hybrid/onsite preference
- Years of experience range to filter by
- Anything to exclude (e.g. "no IT support, no cold-calling sales")

## 3. Work history interview (from proficiently-claude-skills)

The one-page resume is a summary, not the source material. Walk through each
past role and ask about context, accomplishments with real numbers, and why
the person left — this is what makes later tailored resumes and cover letters
specific instead of generic. Save the result using
`shared/templates/profile.md` as the template.

## 4. Confirm the tracker backend

This plugin does not keep its own local tracker file (see
`shared/references/tracker-schema.md` for why). Confirm the `job-pipeline-mcp`
MCP server is connected and its `get_profile` tool responds. If it isn't
connected, tell the user before continuing — every later skill in this plugin
assumes it's there.
