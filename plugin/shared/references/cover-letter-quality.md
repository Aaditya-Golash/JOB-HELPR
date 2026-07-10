# Cover letter quality rulebook

The actual generation logic lives in `mcp/lib/templates.ts`
(`generateCoverLetterLatex` and its helpers) -- this file documents the
rules that code implements, so a human (or a future edit) can check the
code against the intent without reverse-engineering it from the source.

This is a deterministic template/evidence selector, not an LLM call. There
is no generation step to "retry" -- `auditCoverLetter()` is a regression
guard that throws if the template construction itself produced a
rule-violating letter, which should never happen if the code is correct.

## Aaditya's style pattern

1. **Mission bridge first.** Connect the company's mission, product,
   industry, operating model, or role context to Aaditya's own background.
   The opening must never be generic enough to send to any company
   unchanged -- the company name and a role-specific "operating problem"
   fragment are always present in the first sentence.
2. **Transferable value.** Explain how the background in data, systems,
   operations, stakeholder coordination, analytics, product delivery,
   finance, and technical execution transfers to the role being applied
   for.
3. **Metric proof.** 2 to 4 bolded metrics with `\textbf{}`. Never bold
   every number in a paragraph. Prioritize impact metrics (cut X by 70%)
   over activity metrics (attended N meetings).
4. **Skill bridge, not admission.** If the JD asks for a tool or industry
   experience that isn't Aaditya's strongest direct experience, never admit
   the gap directly. Bridge through adjacent experience and transferable
   concepts -- see the skill bridge bank below.
5. **Business relevance.** Every project is translated into business value
   (what changed, what it's worth, who uses it now), never described as a
   standalone technical summary.

### Preferred opening pattern

> "What draws me to [Company] is [specific mission/product/operating
> problem]. That is the kind of work I have consistently moved toward:
> using data, systems, and stakeholder coordination to turn complex
> operations into clearer decisions and measurable improvement."

This is a model, not a script -- the code varies the middle clause per role
type (see the fragment list below) and per company/title, so it does not
produce the identical sentence on every letter.

### Default structure (4-6 short paragraphs, ~320-430 words)

1. Company mission/role context + value proposition (mission bridge)
2. Most relevant professional proof, with metrics
3. Most relevant project/leadership/technical proof, with metrics
4. Tool/skill/industry bridge -- **only if needed**, omitted otherwise
5. Company-specific close and confident value proposition

## Role selection matrix

Each role type pairs one professional-experience block with one project
block, and specifies which of that evidence's metrics get bolded (2-4
total across the letter). Full text for each evidence block lives in
`mcp/lib/templates.ts`'s `PROFESSIONAL_EVIDENCE` / `PROJECT_EVIDENCE`
objects.

| Role type | Professional proof | Project proof | Bolded metrics |
|---|---|---|---|
| Business Intelligence / Data Analyst | UBC IT | TA Allocation | 110+ daily ServiceNow incidents, 12,000+ students and staff, 250+ applications per term, 70% |
| Product Analyst / APM / PM | UBCSUO | TA Allocation | $1.9M operating budget, 150+ student organizations, 250+ applications per term, 36+ features |
| Automation / AI Ops / RevOps / Product Ops | UBC IT | Calmora | 110+ daily ServiceNow incidents, 70% (+ Zapier skill bridge, always included) |
| Strategy / Operations / Consulting | UBCSUO | TA Allocation | $1.9M operating budget, 150+ student organizations, 70%, 36+ features |
| Finance / M&A / Equity / Investment Analyst | UBCSUO | TSX Portfolio Optimization | $1.9M operating budget, 37 months of TSX equity data, 11 by 11 covariance matrix (+ Bloomberg cert bridge, always included) |
| Nonprofit / Climate / Program / Public Sector | UBCSUO | VenueWorks | 150+ student organizations, 70,000+ students, $5M+ in idle annual venue capacity, 300+ local properties (+ NonprofitReady cert bridge, always included) |
| Network / IT / Systems | UBC IT | TA Allocation | 12,000+ students and staff, 70%, 250+ applications per term |
| Marketing / Growth / Customer Analytics | UBCSUO (unbolded) | Social Media Growth | 4M+ organic views, 2M+ organic views, 10K+ views (+ Adobe/GA4 cert bridge, always included) |

Role classification (`classifyRole` in `templates.ts`) scores a fixed
keyword list per role type against the job title + description and takes
the highest score. No match at all falls back to Business Intelligence /
Data Analyst (the richest, most broadly-applicable evidence pairing) and
triggers the generic transfer bridge in paragraph 4.

## Metric bank

Bold only from this bank, and only the metrics that fit the specific
role/JD -- never bold the same metric twice in one letter.

```
\textbf{70\% reduction}
\textbf{\$1.9M operating budget}
\textbf{\$370,000+ in annual club and association funding}
\textbf{70,000+ students}
\textbf{12,000+ students and staff}
\textbf{150+ student organizations}
\textbf{110+ daily ServiceNow incidents}
\textbf{250+ applications per term}
\textbf{36+ features}
\textbf{100\% test coverage}
\textbf{95\% pass rate across 50 unit and integration tests}
\textbf{37 months of TSX equity data}
\textbf{11 by 11 covariance matrix}
\textbf{\$5M+ in idle annual venue capacity}
\textbf{300+ local properties}
\textbf{2nd place and \$1,500 in funding}
\textbf{4M+ organic views}
\textbf{2M+ organic views}
\textbf{10K+ views}
```

Rules: bold the metric substring, not the whole sentence. Use only metrics
that fit the job. Prioritize impact metrics over activity metrics. For
BI/data roles, bold reporting/data/scale metrics. For product/ops roles,
bold process-improvement and workflow metrics. For finance roles, bold
financial/data-modeling metrics. For climate/program roles, bold
stakeholder, budget, policy, and market-validation metrics.

## Skill bridge bank

Checked in this order: JD mentions a specific tool → role-specific
certification bridge → generic transfer bridge (only when the role
classifier found no signal at all in the JD).

| JD signal | Bridge (verbatim) |
|---|---|
| Power BI | "My strongest dashboarding experience has been with Tableau, Excel, and custom reporting tools, and the underlying skills transfer directly to Power BI: clean data models, consistent KPI definitions, visualization logic, and stakeholder-focused reporting." |
| Salesforce / CRM / CDP | "My experience with ServiceNow workflows, Adobe Experience Platform concepts, and structured stakeholder reporting gives me a strong foundation for CRM data quality, user records, and customer data workflows." |
| AWS | "My experience with Docker, backend systems, data pipelines, and deployment workflows gives me a strong base to ramp quickly into AWS-based environments." |
| Automation tools / Zapier | "My Zapier automation and AI agent training, combined with Python workflow experience, gives me a strong foundation for identifying repeatable processes and building lightweight automation." |
| Airline / network scheduling | "The strongest transfer from my background is constraint-based operational thinking: balancing capacity, availability, urgency, tradeoffs, and stakeholder needs in systems where reliability matters." |
| No signal matched at all (generic industry-fit gap) | "The strongest transfer from my background is the operating problem itself: data quality, stakeholder coordination, workflow design, and measurable improvement." |

## Certification bridge bank

Never dump certifications, never list more than 2 families in one letter,
and certifications must support real experience, never replace it.

- **BI role + customer analytics/digital reporting/journey analytics
  signal in JD**: "My Adobe Experience Platform and Customer Journey
  Analytics training complements my hands-on dashboarding experience by
  giving me stronger context in customer data, segmentation, journey
  analysis, and digital reporting."
- **Marketing role (always)**: "My Adobe Experience Platform, Customer
  Journey Analytics, and Google Analytics 4 training gives me formal
  grounding in the segmentation and journey-analysis concepts behind the
  organic growth work I have run directly."
- **Nonprofit/climate/program role (always)**: "My Fundraising Essentials
  and Grant Seeking Essentials training from NonprofitReady sharpens how I
  think about funding structures and grant strategy, which complements the
  budget and funding-allocation work I already do at UBCSUO."
- **Finance role (always)**: "My Bloomberg Market Concepts certification
  and coursework in investments and finance ground the portfolio work
  above in the same market fundamentals professional analysts use daily."

**Wrong** (what these rules exist to prevent): "I have Adobe Experience
Platform, Adobe CDP, Adobe CJA, Zapier, Fundraising Essentials, and Grant
Seeking Essentials certifications."

## Banned phrases

**Openings** -- never start a letter with any of these:
- "I am writing to express my interest"
- "I am excited to submit my application"
- "As a recent graduate"
- "I believe I would be a great fit"

**Weak/lack-admission language** -- never appears anywhere in the letter:
- "could still be a fit"
- "my current trajectory"
- "despite my lack of"
- "although I do not have"
- "while I may not have"
- "I am early in my career"
- "I hope to be considered"
- "I lack"
- "I do not know"
- "I have no experience"

**Project-dump phrasing** -- signatures of the old task/approach/impact
paragraph style this rewrite removed entirely:
- "A directed studies project needed..."
- "Wanted to apply..."
- "Explored whether..."
- "A research team needed..."
- "UBC Computer Science needed..."
- Any raw "[org] needed X. Built/Scoped/Led Y." task-dump pattern.

## Final audit checklist

`auditCoverLetter()` in `templates.ts` checks every one of these
mechanically before a letter is returned; a violation throws rather than
shipping a bad letter:

- [ ] No banned opening phrase
- [ ] No banned weak-language phrase
- [ ] No project-dump phrasing marker
- [ ] Between 2 and 4 `\textbf{}` metric highlights (not 0, not 1, not 5+)
- [ ] Company name appears in the letter body (mission bridge present)
- [ ] Body is under ~480 words (stays to one page)
