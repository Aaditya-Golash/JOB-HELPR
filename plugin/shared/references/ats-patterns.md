# ATS patterns

## LaTeX engine: lualatex, not pdflatex

`ai-job-search` hit this directly (commit-traced fix: pdflatex → lualatex). If your
resume template uses `fontawesome5` for icons (phone/email/link glyphs in a
header line), `pdflatex` can emit those glyphs as icon-font codepoints that
extract as garbage or nothing when an ATS runs its own text extraction on the
PDF. `lualatex` handles the same fontawesome5 glyphs without that failure mode.

Compile with:
```
lualatex main.tex
```
not:
```
pdflatex main.tex
```

## Mandatory compile-and-inspect loop

From `ai-job-search`'s `/apply` workflow — this step is non-skippable, not
optional politeness. A `.tex` file that looks correct routinely produces a
broken PDF: job titles orphaned onto the next page, a cover letter spilling
onto page 2, bullet fonts silently falling back to the body font when a custom
font file didn't load. After every compile:

1. Extract the PDF's text layer (`pdftotext`, or an equivalent extractor) and
   read it the way an ATS parser would: contact details present as literal
   text, no garbled glyphs, sane reading order top to bottom.
2. Visually inspect the rendered PDF (not just the source) for page-break
   problems.
3. If either check fails, apply a targeted fix (`\needspace`,
   `\enlargethispage`, a font-matching wrapper around the offending list) and
   recompile. Repeat until both checks pass.
4. Never hand back a PDF that hasn't been through this loop at least once.

## Header-based extraction verification, never keyword-stuffing

Score the posting's keyword coverage against what the extracted text actually
contains. Keywords the candidate's real profile supports get surfaced and
added; genuine gaps stay visible rather than being papered over with stuffed
keywords the resume can't back up.

## ATS platform navigation notes (Greenhouse / Lever / Workday)

- **Greenhouse**: form fields are mostly stable by `name` attribute across
  postings; file upload for resume/cover letter is usually a single dropzone
  per document.
- **Lever**: multi-step form, resume parse-back can populate fields
  incorrectly — always re-verify auto-filled fields against the tailored
  resume rather than trusting the parse.
- **Workday**: paginated, and pagination depth varies by employer's Workday
  configuration — don't assume a fixed page count; keep advancing and
  re-checking for a final review page rather than a hardcoded "submit" step
  count.

None of this changes the confirmation gate in `confirmation-gates.md`: getting
to the review page is automatable, clicking final submit is not, without the
user explicitly saying to.
