---
name: apply
description: Fill out an ATS application form (Greenhouse, Lever, Workday) using the tailored resume and cover letter — drafts and stages the submission, then stops for explicit confirmation before it goes in.
---

# Apply

Ported from `proficiently-claude-skills`' `/proficiently:apply`, with one
deliberate change: **this version never clicks the final submit button on its
own.** Read `shared/references/confirmation-gates.md` before touching this
skill — this is the exact case it exists for.

## 1. Prerequisites

A tailored resume and cover letter for this specific posting must already
exist (run `tailor-resume` and `cover-letter` first if not). Both must have
passed the `verify_pdf.py` check.

## 2. Fill the form

Navigate to the application form. Detect the ATS platform and use the
matching notes in `shared/references/ats-patterns.md` (Greenhouse field
stability, Lever auto-fill re-verification, Workday's variable pagination
depth). Upload the tailored resume and cover letter. Fill any short-answer
questions using the saved work history — never invent an answer that isn't
grounded in it.

## 3. Stop at the review page. Always.

Once the form reaches its final review/summary page (before any "Submit
Application" action), stop. Show the user:
- Every field as filled
- Which document versions were uploaded
- Any short-answer text that was generated

Ask explicitly: "Ready to submit this to <Company>? (yes/no)"

**Do not click submit without an explicit yes in this session.** This
includes when a job was described as part of a batch or "handle these for
me" — batch approval for drafting is not the same as batch approval for
submitting. Each submission gets its own confirmation.

## 4. After confirmation

Only after an explicit yes: submit, then record the application via
`job-pipeline-mcp`'s `save_application` tool (see
`shared/references/tracker-schema.md` — this is the single source of truth,
not a local file).

## 5. If the form requires solving a CAPTCHA or defeating a bot check

Stop and tell the user. This skill does not attempt to get past bot
detection.
