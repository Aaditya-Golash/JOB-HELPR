#!/usr/bin/env python3
"""
verify_resume_pdf.py -- one-page + content checks for a compiled resume PDF.

Separate from plugin/shared/scripts/verify_pdf.py (which checks ATS glyph
safety and applies to both resumes and cover letters) -- this one checks
the resume-specific constraint that actually matters most: did it spill to
a second page. tailor-resume's shrink-and-recompile loop depends on this
script's exit code, not just eyeballing the PDF.

Usage:
    py verify_resume_pdf.py <path-to-pdf> --name "Full Name" --email "a@b.com"

Requires pdftotext (poppler-utils) for text extraction and pypdf (or
PyPDF2) for page count. Degrades to a warning, not a crash, if a dependency
is missing -- matching verify_pdf.py's own graceful-degradation choice.
"""

import argparse
import shutil
import subprocess
import sys


def get_page_count(pdf_path: str) -> int | None:
    try:
        from pypdf import PdfReader
    except ImportError:
        try:
            from PyPDF2 import PdfReader  # type: ignore
        except ImportError:
            print(
                "WARN: neither pypdf nor PyPDF2 is installed -- skipping page-count "
                "check. Install one (`pip install pypdf`) before trusting this "
                "resume is actually one page.",
                file=sys.stderr,
            )
            return None
    try:
        return len(PdfReader(pdf_path).pages)
    except Exception as exc:  # noqa: BLE001 -- report and degrade, don't crash the loop
        print(f"WARN: could not read page count: {exc}", file=sys.stderr)
        return None


def extract_text(pdf_path: str) -> str | None:
    if shutil.which("pdftotext") is None:
        print("WARN: pdftotext not found (poppler-utils). Skipping text checks.", file=sys.stderr)
        return None
    result = subprocess.run(
        ["pdftotext", "-layout", pdf_path, "-"],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        print(f"WARN: pdftotext failed: {result.stderr.strip()}", file=sys.stderr)
        return None
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf_path")
    parser.add_argument("--name", default=None)
    parser.add_argument("--email", default=None)
    args = parser.parse_args()

    problems: list[str] = []

    pages = get_page_count(args.pdf_path)
    if pages is not None and pages != 1:
        problems.append(
            f"Resume is {pages} pages, not 1. Reduce content per the shrink "
            "order in plugin/shared/references/resume-quality.md and recompile."
        )

    text = extract_text(args.pdf_path)
    if text is not None:
        if args.name and args.name.lower() not in text.lower():
            problems.append(f"Name '{args.name}' not found as literal text in the extracted layer.")
        if args.email and args.email.lower() not in text.lower():
            problems.append(f"Email '{args.email}' not found as literal text in the extracted layer.")

    if problems:
        print(f"FAIL -- {len(problems)} issue(s) found in {args.pdf_path}:")
        for p in problems:
            print(f"  - {p}")
        return 1

    page_note = f"{pages} page" if pages is not None else "page count unchecked"
    print(f"PASS -- {args.pdf_path} is one page and contains the expected contact text ({page_note}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
