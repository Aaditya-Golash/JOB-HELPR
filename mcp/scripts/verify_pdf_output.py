#!/usr/bin/env python3
"""Strict one-page and ATS text-layer verification for generated PDFs."""

import argparse
import re
import sys
import unicodedata
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError as exc:
    raise SystemExit("pypdf is required: python -m pip install pypdf") from exc

RAW_LATEX = (r"\&", r"\texttimes", r"\textbf", r"\href", r"\fa")
BANNED_OPENINGS = (
    "i am writing to express my interest",
    "i am excited to submit my application",
    "as a recent graduate",
)
PROJECT_DUMP = (
    "a directed studies project needed",
    "wanted to apply",
    "explored whether",
    "a research team needed",
)
BAD_SPACING = (
    "drawsme",
    "productoperations",
    "replacingmanual",
    "dashboardsfor",
    "definitionsvisualization",
    "stakeholderfocused",
)
BAD_SPLITS = {
    "stakeholder": re.compile(r"stake[-\u00ad]\s*holder", re.I),
    "failures": re.compile(r"fail[-\u00ad]\s*ures", re.I),
    "definitions": re.compile(r"def[-\u00ad]\s*initions", re.I),
    "identified": re.compile(r"identi[-\u00ad]\s*fied", re.I),
    "workflows": re.compile(r"work[-\u00ad]\s*flows", re.I),
}


def extract(reader: PdfReader) -> str:
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def common_checks(text: str, pages: int) -> list[str]:
    problems: list[str] = []
    if pages != 1:
        problems.append(f"page count is {pages}, expected 1")
    for required in ("Aaditya Golash", "aadigolash10@outlook.com"):
        if required.lower() not in text.lower():
            problems.append(f"missing required text: {required}")
    if "https://www.linkedin.com" in text.lower():
        problems.append("visible header contains full LinkedIn URL")
    for command in RAW_LATEX:
        if command in text:
            problems.append(f"raw LaTeX leaked into extracted text: {command}")
    if "\ufffd" in text or "ï¿½" in text:
        problems.append("replacement character found")
    if "\u00ad" in text:
        problems.append("soft hyphen U+00AD found")
    if any(ch in text for ch in ("\ufffc", "\ufffe", "\uffff")):
        problems.append("object replacement or Unicode noncharacter found")
    if any(unicodedata.category(ch) == "Co" for ch in text):
        problems.append("private-use glyph found")
    controls = sorted({ord(ch) for ch in text if unicodedata.category(ch) == "Cc" and ch not in "\t\n\r"})
    if controls:
        problems.append(f"ASCII/control characters found: {controls}")
    if re.search(r"May 2025\s+Apr 2026", text):
        problems.append("date range lost its separator")
    for joined in BAD_SPACING:
        if joined in text.lower():
            problems.append(f"joined word boundary found: {joined}")
    for word, pattern in BAD_SPLITS.items():
        if pattern.search(text):
            problems.append(f"hyphenated/split word found: {word}")
    return problems


def normalize_plain(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("’", "'").replace("–", "-")).strip().lower()


def latex_body_to_plain(source: str) -> str:
    body_match = re.search(r"Dear [^\n]+,\s*(.*?)\s*Sincerely,", source, re.S)
    if not body_match:
        return ""
    body = body_match.group(1)
    body = re.sub(r"\\textbf\{([^{}]*)\}", r"\1", body)
    body = re.sub(r"\\hspace\{[^{}]*\}", " ", body)
    replacements = {r"\%": "%", r"\$": "$", r"\&": "&", r"\#": "#", r"\_": "_"}
    for latex, plain in replacements.items():
        body = body.replace(latex, plain)
    body = body.replace("~", " ")
    body = re.sub(r"\\[A-Za-z]+(?:\[[^\]]*\])?", "", body)
    return normalize_plain(body)


def resume_checks(text: str, tex_path: Path) -> list[str]:
    problems: list[str] = []
    required = ["EDUCATION", "TECHNICAL SKILLS", "SELECTED PROJECTS", "PROFESSIONAL EXPERIENCE"]
    positions = []
    for heading in required:
        pos = text.find(heading)
        if pos < 0:
            problems.append(f"missing resume section: {heading}")
        positions.append(pos)
    if all(pos >= 0 for pos in positions) and positions != sorted(positions):
        problems.append("default resume sections are out of order")
    for phrase in PROJECT_DUMP:
        if phrase in text.lower():
            problems.append(f"raw project-dump phrase found: {phrase}")
    bullet_count = len(re.findall(r"[•●▪]", text))
    if bullet_count and not 12 <= bullet_count <= 18:
        problems.append(f"resume has {bullet_count} extracted bullets, expected 12-18")
    if "Finance & Analytics" in text:
        normalized_resume = normalize_plain(text)
        for skill in (
            "Excel",
            "Financial Analysis",
            "Portfolio Modeling",
            "Bloomberg Market Concepts",
            "Quantitative Portfolio Optimization (TSX)",
            "VenueWorks",
            "Student Systems Analyst",
        ):
            if normalize_plain(skill) not in normalized_resume:
                problems.append(f"finance resume missing {skill}")
    if tex_path.exists() and "Finance & Analytics" in tex_path.read_text(encoding="utf-8"):
        for phrase in ("37 months of TSX equity data", "$5M+ in idle annual venue capacity", "Microsoft 365 migration"):
            if normalize_plain(phrase) not in normalize_plain(text):
                problems.append(f"finance evidence phrase missing or broken: {phrase}")
    return problems


def cover_letter_checks(text: str, tex_path: Path) -> list[str]:
    problems: list[str] = []
    lower = text.lower()
    for required in ("Dear", "Sincerely"):
        if required.lower() not in lower:
            problems.append(f"cover letter missing {required}")
    for phrase in BANNED_OPENINGS:
        if phrase in lower:
            problems.append(f"banned opening found: {phrase}")
    if tex_path.exists():
        source = tex_path.read_text(encoding="utf-8")
        body = source.partition("Dear ")[2].partition("Sincerely,")[0]
        bold_count = len(re.findall(r"\\textbf\{", body))
        if not 2 <= bold_count <= 4:
            problems.append(f"cover-letter body has {bold_count} bold metrics, expected 2-4")
        paragraphs = [p for p in re.split(r"\n\s*\n", body) if p.strip()][1:]
        if not 4 <= len(paragraphs) <= 6:
            problems.append(f"cover-letter body has {len(paragraphs)} paragraphs, expected 4-6")
        for index, paragraph in enumerate(paragraphs, 1):
            words = len(paragraph.split())
            if words > 115:
                problems.append(f"cover-letter paragraph {index} has {words} words")
        if "power bi" in lower and "transfer directly to power bi" not in lower:
            problems.append("Power BI requirement lacks transfer bridge")
        expected_body = latex_body_to_plain(source)
        if expected_body and expected_body not in normalize_plain(text):
            problems.append("source-vs-extracted body mismatch (word join, hyphenation, or dropped text)")
        if "Microsoft 365" in source and "microsoft365" in lower:
            problems.append("joined word boundary found: Microsoft365")

        if "Product Operations Analyst" in source:
            required_phrases = (
                "FlowOps stands out to me",
                "Product Operations Analyst",
                "replacing manual",
                "stakeholder coordination",
                "most common failures",
                "Sincerely",
                "Aaditya Golash",
            )
        elif "Business Intelligence Analyst" in source:
            required_phrases = (
                "Northwind Telecom stands out to me",
                "Business Intelligence Analyst",
                "board-level dashboards that supported technology and operations decisions",
                "Power BI: clean data models, consistent KPI definitions, visualization logic",
                "stakeholder-focused reporting",
                "Sincerely",
                "Aaditya Golash",
            )
        else:
            required_phrases = ()
        normalized_text = normalize_plain(text)
        for phrase in required_phrases:
            if normalize_plain(phrase) not in normalized_text:
                problems.append(f"required extracted phrase missing or broken: {phrase}")
    else:
        problems.append(f"matching LaTeX source not found: {tex_path}")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf")
    parser.add_argument("--kind", required=True, choices=("resume", "cover-letter"))
    args = parser.parse_args()
    path = Path(args.pdf)
    if not path.exists():
        raise SystemExit(f"PDF not found: {path}")
    reader = PdfReader(path)
    text = extract(reader)
    problems = common_checks(text, len(reader.pages))
    problems += resume_checks(text, path.with_suffix(".tex")) if args.kind == "resume" else cover_letter_checks(text, path.with_suffix(".tex"))
    if problems:
        print(f"FAIL -- {path}")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print(f"PASS -- {path} ({len(reader.pages)} page, clean extracted text)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
