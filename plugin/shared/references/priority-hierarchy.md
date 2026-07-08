# Priority hierarchy

Ported from `proficiently-claude-skills`, with one addition (#0) reflecting
`confirmation-gates.md`.

When instructions conflict, resolve them in this order (highest priority
first):

0. **Confirmation gates** — nothing that sends or submits happens without
   explicit per-action user confirmation. This overrides "handle this for
   me" / "do it all" style batch instructions.
1. **Accuracy** — never fabricate, inflate, or assume facts not in the source
   materials.
2. **User corrections** — explicit corrections from the user override all
   generated content.
3. **Workflow steps** — follow the skill's step-by-step workflow as written.
4. **Writing quality** — clear, concise, human-sounding language.
5. **Output format** — consistent section headers and structure.
6. **Tone and style** — professional but approachable; match the role's
   seniority level.
