# Conflicts found while merging, and how each was resolved

## 1. Auto-submit vs. manual applications

**Conflict**: `proficiently-claude-skills` auto-submits ATS forms with no
described confirmation step. `claude-linkedin-assistant` and `career-ops`
explicitly keep applications manual, on purpose, for safety — career-ops's
own docs say so directly, and one of its GitHub discussions has a user
reporting an account ban from this class of automation.

**Resolution**: kept Proficiently's actual form-filling mechanics (it's the
only one of the four with real ATS field-filling logic worth reusing) but
added a hard stop before final submit — see `apply/SKILL.md` and
`shared/references/confirmation-gates.md`. Three votes for "stay manual /
confirm first," one for "auto-submit" — went with the majority and the more
cautious authors.

## 2. Unattended LinkedIn connection requests vs. rate-aware manual sends

**Conflict**: none of the four repos actually implement fully unattended,
unlimited connection-sending — that was a design choice added when this
plugin was first assembled in an earlier session, not something any source
repo does. Farzam's repo specifically caps connection requests to "without a
note" to conserve LinkedIn's monthly quota, and keeps everything else manual.

**Resolution**: `outreach/SKILL.md` follows Farzam's original design: low
default volume, one confirmation per send, no unattended batches.

## 3. Three competing application trackers vs. one already-working one

**Conflict**: `claude-linkedin-assistant` (CSV), `career-ops` (markdown table
with header-based column mapping, hardened across issues #946/#954), and
`proficiently-claude-skills` (per-application folders) each keep their own
local tracker. This account already has a working tracker via
`job-pipeline-mcp`'s `save_application`/`list_applications` (Vercel Blob).

**Resolution**: `job-pipeline-mcp` is the single source of truth (see
`plugin/shared/references/tracker-schema.md`). The plugin's `tracker` skill
is a thin wrapper around the MCP tools, not a fourth competing store. Career-
ops's duplicate-detection logic was genuinely worth keeping, so it was
ported (not copied) into `shared/scripts/dedup-check.mjs` — adapted from
storage-format-specific (markdown row merging) to storage-agnostic
(check-before-insert against whatever the MCP already has).

**Bug found while testing this port**: the first version of
`normalizeCompany()` stripped *all* parenthetical content, on the assumption
it was just branding noise. Testing it against `"Bell (Canada) Inc."` vs.
`"Bell Canada"` showed they *stopped* matching after that stripping, because
the parenthetical held a real distinguishing word, not noise. Fixed to strip
known legal-entity suffixes only (Inc., Ltd., LLC, Corp.), which keeps
`"Bell (Canada)"` correctly distinct from `"Bell (Mexico)"` while still
matching `"Bell Canada"` to `"Bell Canada Inc."`. Verified with both the
original failing case and the region-distinction case afterward.

## 4. Four different plugin/skill formats

**Conflict**: Farzam's repo uses bare `.claude/commands/`. `ai-job-search`
uses both `.agents/skills/` and `.claude/commands/` (multi-CLI support: Claude
Code, Codex, Gemini, etc.). `career-ops` and `proficiently-claude-skills`
both use the official `.claude-plugin/plugin.json` + `skills/*/SKILL.md`
format.

**Resolution**: standardized on the `.claude-plugin/` + `SKILL.md` format
(what career-ops and proficiently-claude-skills already agreed on) since it's
the one built specifically for Claude Code plugin distribution, and it's what
the marketplace-install flow in this README depends on.

## 5. LaTeX engine

**Conflict/verification**: `ai-job-search`'s commit history says pdflatex's
fontawesome5 handling breaks ATS text extraction; lualatex fixes it. This was
actually compiled and tested rather than taken on faith — see the sandbox
session that produced this repo. Confirmed: pdflatex extracted an icon glyph
as a bare `#` and dropped another entirely; lualatex extracted both as their
literal icon names ("Envelope", "Phone"). Also found, while testing: lualatex
needs `texlive-luatex` (for `luatexbase.sty`) installed alongside
`texlive-fonts-extra`, or it fails outright rather than falling back —
`ats-patterns.md` and `verify_pdf.py` both reflect this now.

## 7. Placeholder MCP schema vs. the real, deployed one

**Conflict**: this repo's `mcp/` was originally a from-spec reconstruction
(the real `job-pipeline-mcp` source lived only on the account owner's local
machine and wasn't reachable in the session that produced this plugin — see
the git history this was merged from). The reconstruction guessed a
`save_application` schema of `{ company, role, status, notes, savedAt }`
with an eight-value status enum (`skip`/`discarded`/`rejected`/`evaluated`/
`applied`/`responded`/`interview`/`offer`). `plugin/shared/scripts/
dedup-check.mjs` and `plugin/shared/references/tracker-schema.md` were
written against that guess.

**Resolution**: when this plugin was merged into the real JOB-HELPR repo
(which already had the actual, working `mcp/` ported directly from the local
`job-pipeline-mcp` source), the real schema turned out to be
`{ company, jobTitle, jobUrl?, source?, salary?, postedDaysAgo?, status,
matchNotes?, projectsUsed? }` with a four-value status enum (`shortlisted`
default → `materials_ready` → `outreach_drafted` → `applied`). Updated
`dedup-check.mjs`, `tracker-schema.md`, and `tracker/SKILL.md` to match the
real field names and status values, and ported the dedup check itself
server-side into `mcp/lib/dedup.ts` so `save_application` now returns
`likelyDuplicateOf` directly instead of requiring a separate client-side
check.

## 8. career-ops's 622 files vs. this plugin's ~15

**Not really a conflict, a scoping decision, stated plainly**: career-ops is
a full standalone Node.js application (70+ scripts, i18n READMEs in 15
languages, its own Docker setup) as much as it is a Claude Code plugin. This
merge did not vendor all 622 files — it ported the specific pieces that
solve a real problem better than starting fresh (header-based tracker
parsing, dedup logic, the seniority-collapse fix concept for role matching).
If a specific career-ops script turns out to be needed that isn't here yet,
it's a `git clone santifer/career-ops` away, not lost.

## 9. career-ops's scan/score engine, and two corrections to #6-#8 above

**Follow-up scope decision**: after #8 above shipped without career-ops's
45+-portal scanner or its A-G evaluation system, the account owner asked for
that piece to be ported too. Unlike the dedup logic, career-ops's scanner
(`modes/scan.md` + 58 files in `providers/`) is a standalone Node app hitting
its own HTTP client against locally-configured company lists — not something
that vendors cleanly into a Claude Code skill. What got ported instead is the
*strategy*: `shared/references/job-portals.md` (the tiered discovery order —
direct public ATS API call, then direct page navigation, then broad web
search, cheapest/most-reliable first) and `shared/references/
scoring-rubric.md` (the 1-5 scoring dimensions and the separate,
never-blended posting-legitimacy check). The Greenhouse and Lever public API
endpoint formats documented in `job-portals.md` were independently verified
against each platform's own developer docs before being written down, not
carried over from career-ops's code as-is.

**Two corrections, found while doing that verification directly against
career-ops's real source** (not just re-stated from the original merge
session, which this repo's own `CONFLICTS.md` #5 established as the right
standard):

1. **The scoring system is not "A-F" or "10 weighted dimensions."** An
   earlier description of this repo (in conversation, not previously written
   into this file) characterized it that way. The real system
   (`modes/_shared.md`, `modes/oferta.md`) is a 1-5 numeric score across six
   dimensions (match on profile/CV, role alignment, comp, cultural signals,
   red flags, global average), with the "A-G" label referring to seven
   *evaluation workflow blocks* (role summary, CV match, level strategy,
   comp, customization, interview prep, legitimacy) — not a letter grade.
   `scoring-rubric.md` reflects the real 1-5 system.
2. **No file literally named `role-matcher.mjs` could be confirmed to
   exist** in career-ops via the GitHub API and raw-content checks run
   during this port (GitHub's code search requires authentication this
   session didn't have, so this isn't a fully exhaustive check). The real,
   confirmed mechanism for seniority-aware filtering is a `positive` /
   `negative` / `seniority_boost` keyword configuration referenced in
   `modes/scan.md`. The underlying concept the original merge captured
   (don't collapse seniority signals into plain keyword overlap) is still
   accurate and still worth keeping in `job-search/SKILL.md` — the filename
   attribution was the part that couldn't be verified, not the lesson
   itself.

## 10. False positive in `verify_pdf.py`'s stray-symbol check

**Bug found during real use, not a port-time review**: running
`tailor-resume` against 8 real job postings, `verify_pdf.py` reported FAIL
on all 16 compiled PDFs (8 resumes + 8 cover letters) — "stray isolated
symbol token(s) (|)". The account's actual resume template uses a bare `|`
as a plain-text separator in the contact line ("British Columbia |
+1250... | email | linkedin"), which is a completely ordinary resume
convention with zero relation to the fontawesome5-icon-corruption failure
mode this check exists to catch. Confirmed via `pdftotext` that the
extracted text was exactly correct in all 16 PDFs before concluding this
was a false positive rather than a real compile problem.

**Fix**: dropped `|` from the stray-symbol character class in
`check_garbled_glyphs()` — kept the other symbols (`#`, `*`, `~`, `^`,
backtick), which are rarer and more likely to indicate real corruption, but
a bare pipe on its own isn't a reliable corruption signal, since it's
exactly what an intentional separator looks like too. The PUA-codepoint
check (the stronger signal) is untouched. Re-verified all 16 PDFs after the
fix: all PASS.

## 11. `profile.ts`'s experience titles/orgs vs. the account owner's real resume PDF

**Conflict**: `mcp/lib/profile.ts`'s `experience` entries were originally
written from the account owner's own verbal work-history interview
(session-earlier `setup` skill run), which used the titles "Director" /
"UBC Students' Union (UBCSUO)" and "IT Analyst (Co-op)" / "University of
British Columbia". When the account owner later uploaded
`Aaditya_Resume_2026.pdf` (his real, current resume) as the base format
reference for the resume-generator rewrite, that PDF uses different,
presumably-more-current titles: "Director-at-Large" / "Student Union of
UBC Okanagan" and "Student Systems Analyst (Co-op)" / "IT Services UBC" --
plus a per-role work location ("Kelowna, BC") the interview-derived
version didn't capture at all.

**Resolution**: treated the PDF as authoritative for identifying facts
(title, org, location) since it's the account owner's own real, current
document, and updated `profile.ts` to match. Bullet *content* was kept
from the interview version rather than replaced with the PDF's own
(shorter, less specific) bullets, because the interview surfaced one piece
of real, verified, quantified detail the PDF's bullets don't happen to
include -- the KB-rewrite work specifically cutting recurring incidents by
70%, which the account owner described directly and which `f155415`
already committed. Titles/orgs/locations were a simple, low-risk field
update; bullet content was a judgment call to preserve verified specificity
rather than silently downgrade to vaguer phrasing. Flagged to the account
owner directly in the same turn this was done, in case the merge call was
wrong.

**Also updated from the same PDF**: `skillCategories` was extended (not
replaced) with the PDF's fuller, real skill list -- R, HTML/CSS,
SQLAlchemy, JSON, Firebase, Vercel, Android Studio, Stripe CLI -- and
`education.professionalDevelopment` gained the Zapier Academy credential
the PDF lists that the interview-derived version didn't mention.
`education.graduation` ("May 2026") and `education.details` ("Dean's List,
Graduating with Distinction") were deliberately left unchanged even though
the PDF's education line reads differently ("Graduated Dean's List", no
visible date) -- whether the account owner has already graduated is a
substantive factual question this session has no basis to guess at
silently, unlike a skills-list addition.
