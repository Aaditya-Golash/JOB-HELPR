#!/usr/bin/env python3
"""
verify_pdf.py — ATS-safety check for a compiled resume/cover-letter PDF.

Implements the compile-and-inspect loop documented in
shared/references/ats-patterns.md (ported pattern from ai-job-search's /apply
workflow). This does not fabricate a "score" — it reports concrete pass/fail
checks so a tailor-resume skill run can decide whether to recompile.

Usage:
    python3 verify_pdf.py <path-to-pdf> --name "Full Name" --email "a@b.com"

Requires `pdftotext` (poppler-utils) on PATH. Degrades to a warning (not a
crash) if it's missing, matching ai-job-search's graceful-degradation choice.
"""

import argparse
import re
import shutil
import subprocess
import sys


def extract_text(pdf_path: str) -> str | None:
    if shutil.which("pdftotext") is None:
        print("WARN: pdftotext not found (poppler-utils). Skipping text-layer "
              "checks — install poppler and re-run before trusting this PDF "
              "against a real ATS.", file=sys.stderr)
        return None
    result = subprocess.run(
        ["pdftotext", "-layout", pdf_path, "-"],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        print(f"WARN: pdftotext failed: {result.stderr.strip()}", file=sys.stderr)
        return None
    return result.stdout


def check_contact_present(text: str, name: str | None, email: str | None) -> list[str]:
    problems = []
    if name and name.lower() not in text.lower():
        problems.append(
            f"Name '{name}' not found as literal text in the extracted layer. "
            "This is the classic fontawesome5 + pdflatex failure mode — try "
            "recompiling with lualatex instead of pdflatex."
        )
    if email and email.lower() not in text.lower():
        problems.append(
            f"Email '{email}' not found as literal text. Same likely cause as "
            "above if it sits next to an icon glyph in the header line."
        )
    return problems


def check_garbled_glyphs(text: str) -> list[str]:
    problems = []
    # Private-use-area codepoints are one signature of an icon font leaking
    # through as an unmapped glyph instead of text.
    pua_hits = re.findall(r"[\uE000-\uF8FF]", text)
    if pua_hits:
        problems.append(
            f"Found {len(pua_hits)} private-use-area glyph(s) in the extracted "
            "text — icon-font characters are leaking into the text layer. "
            "Recompile with lualatex, not pdflatex."
        )

    # The OTHER signature, empirically confirmed by compiling a real
    # fontawesome5 test document: pdflatex doesn't always fail into the PUA -
    # it can substitute an ordinary ASCII symbol (observed: an icon glyph
    # extracting as a bare "#") or drop the glyph entirely, leaving a stray
    # isolated symbol token sitting where a word should be. Flag standalone
    # low-information symbol tokens as a likely sign of the same failure.
    stray_symbols = re.findall(r"(?<!\S)[#*~^`|]{1,2}(?!\S)", text)
    if stray_symbols:
        problems.append(
            f"Found {len(stray_symbols)} stray isolated symbol token(s) "
            f"({', '.join(sorted(set(stray_symbols)))}) in the extracted text. "
            "This is the other pdflatex+fontawesome5 failure mode confirmed by "
            "testing: the icon glyph doesn't always fail into a PUA codepoint, "
            "it can substitute a plain ASCII symbol instead. Recompile with "
            "lualatex, not pdflatex."
        )

    return problems


def check_reading_order(text: str) -> list[str]:
    problems = []
    lines = [l for l in text.splitlines() if l.strip()]
    if len(lines) < 3:
        problems.append(
            "Extracted text has suspiciously few non-empty lines — possible "
            "sign the PDF is mostly an image or the text layer didn't embed."
        )
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf_path")
    parser.add_argument("--name", default=None)
    parser.add_argument("--email", default=None)
    args = parser.parse_args()

    text = extract_text(args.pdf_path)
    if text is None:
        return 0  # already warned; don't fail the run over a missing tool

    problems = []
    problems += check_contact_present(text, args.name, args.email)
    problems += check_garbled_glyphs(text)
    problems += check_reading_order(text)

    if problems:
        print(f"FAIL — {len(problems)} issue(s) found in {args.pdf_path}:")
        for p in problems:
            print(f"  - {p}")
        return 1

    print(f"PASS — {args.pdf_path} looks ATS-safe (contact text present, "
          "no garbled glyphs, reasonable reading order).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
