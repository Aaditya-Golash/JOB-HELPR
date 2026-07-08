# Confirmation gates

This is the one rule every skill in this plugin defers to. It exists because the four
source projects this plugin was merged from disagree with each other on this exact
point, and two of them were explicit that they disagree with the riskiest option:

- `claude-linkedin-assistant` (Farzam): applications stay manual by design. Its own
  README calls the scope "intentionally minimal so it's safe to share." Connection
  requests go out "without a note" specifically to conserve LinkedIn's monthly
  personalized-invite quota — not unattended, not unlimited.
- `career-ops` (santifer): "The default prompts instruct the AI not to auto-submit
  applications, but AI models can behave unpredictably" — a safety rail the author
  built in on purpose. A GitHub discussion on that repo has a user reporting an
  account ban from running this class of automation.
- `ai-job-search` (MadsLorentzen): never submits anything. It's a drafter → reviewer
  → revise loop that ends with a compiled PDF, not a submitted form.
- `proficiently-claude-skills`: the one repo that does auto-submit ATS forms
  (`/proficiently:apply`), no confirmation step described.

This plugin follows the majority and the more cautious authors, not the outlier:

1. **Any action that sends a message, sends a connection request, or submits a
   form is drafted, shown to the user in full, and requires an explicit "yes, send
   it" / "yes, submit it" before it happens.** No skill in this plugin skips this
   step, regardless of what "auto" or "full-auto" might imply elsewhere.
2. **Rate and volume awareness carries over from Farzam's design**: outreach
   skills should default to low volume and flag LinkedIn's monthly invite quota
   rather than assuming unlimited sends.
3. **The tracker is not a rubber stamp.** An application isn't marked "Applied" in
   the tracker until the user has confirmed it was actually submitted.
4. **If a skill's browser-automation step would need to defeat a CAPTCHA or bot
   check to proceed, it stops and tells the user, rather than trying to get past
   it.**

If you (the person running this plugin) want to change this posture, that's your
call to make explicitly — but it isn't the default, and no skill file in this
plugin should be edited to silently remove the confirmation step.
