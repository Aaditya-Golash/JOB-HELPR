# Scoring rubric

Adapted from `santifer/career-ops`'s evaluation system (`modes/_shared.md` and
`modes/oferta.md`, MIT licensed — see /NOTICE.md). The original is tuned to
its author's own AI/LLMOps-specific archetypes; this version keeps the
scoring mechanics (they generalize well) but replaces the archetype list with
one derived from the saved profile's `targetRoles`, since this account isn't
targeting the same role family career-ops was built around.

## The 1-5 global score

Six dimensions feed a single 1-5 score, not a letter grade:

1. **Match on profile** — skills, experience, and real proof points (from
   `shared/templates/profile.md`) against what the posting actually asks for.
2. **Target-role alignment** — how well the posting fits the saved
   `targetRoles` from setup, not a generic "sounds relevant" judgment.
3. **Comp** — salary positioning against the floor from setup. 5 = at or
   above ask, 1 = well below. Use the posting's advertised number verbatim
   when present; never blend it with an estimate.
4. **Cultural signals** — company culture, stability, growth, remote policy,
   read against whatever the user said they care about in setup. Score with
   specific evidence from the JD or a quick search, not a vibe. If the
   evidence contradicts what the user asked for, cap this at 2/5 and say so
   explicitly, even if every other dimension scores high.
5. **Red flags** — negative adjustments: scope creep in the JD, unrealistic
   requirements for the stated level, vague or contradictory responsibilities.
6. **Global** — weighted average of the above, driving the tier below.

### Score tiers

- **4.5+** — strong match, worth prioritizing
- **4.0–4.4** — good match, worth applying
- **3.5–3.9** — decent but not ideal; only pursue with a specific reason
- **below 3.5** — recommend against applying

## Role-family detection

Career-ops classifies postings into fixed AI-specific archetypes (LLMOps,
Agentic/Automation, Technical AI PM, etc.) to decide which proof points to
lead with. That fixed list doesn't fit every account, so this version derives
categories from the saved `targetRoles` instead of hardcoding them. For each
posting:

1. Match it against the closest saved target role.
2. Note which of the profile's projects/experience bullets are the strongest
   proof points for *that specific* posting — this is what later drives which
   1-3 projects `generate_resume` should lean on (default 3); the one-page
   resume constraint takes priority.
3. If a posting doesn't cleanly match any saved target role, say so rather
   than forcing a fit — that's a signal the role list in setup may need
   revisiting, not a scoring failure.

## Posting legitimacy — separate from the 1-5 score, never blended into it

Ported from career-ops's Block G. This is a qualitative check, reported
alongside the score but never averaged into it.

**Three tiers**: High Confidence (real, active posting) → Proceed with
Caution (mixed signals) → Suspicious (ghost-job indicators).

**Signals to check**: posting age, whether the apply button/flow actually
works, how specific the JD is (a JD that could describe any company at all is
a yellow flag), whether requirements are realistic for the stated level,
recent layoffs at the company, whether the same posting keeps getting
reposted, salary transparency (or the lack of it where local law requires
it), and whether the role actually matches what the company does.

If a posting scores 4.5+ on the 1-5 scale but lands in "Suspicious" here,
surface both numbers together and let the user decide — don't silently
average them into one "safe" number.
