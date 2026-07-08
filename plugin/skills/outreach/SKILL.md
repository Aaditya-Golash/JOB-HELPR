---
name: outreach
description: Draft LinkedIn connection requests and first-DMs to people at target companies — drafts only, one send at a time, with explicit confirmation and quota awareness.
---

# Outreach

Ported from `claude-linkedin-assistant`'s outreach flow — this is the repo
that was already the most conservative of the four on this exact capability,
so its defaults are kept rather than loosened.

## Scope, kept narrow on purpose

- **1st-degree connections at a target company**: draft a short first-person
  DM. No em-dashes. Reference something specific and true (a shared program,
  a real mutual interest, the actual role posting) — never a generic
  templated opener.
- **2nd-degree contacts**: draft a connection request. Per the source
  project's own design, these go out **without a personalized note**, to
  conserve LinkedIn's monthly personalized-invite quota rather than spend it
  on cold 2nd-degree adds.

## Volume

Default to low volume per session (a handful, not dozens). If the user asks
for a large batch, say so explicitly and confirm the number before drafting
that many — this keeps the account's activity looking like a person doing
outreach, not a script.

## Confirmation — one at a time

Draft each message, show it, and get an explicit yes before it sends. Do not
queue multiple sends from one approval. See
`shared/references/confirmation-gates.md`.

## What stays manual, per the source project

Reply handling, follow-ups, and the application itself are out of scope for
this skill. Once someone replies, hand the conversation back to the user
rather than auto-drafting a follow-up chain.
