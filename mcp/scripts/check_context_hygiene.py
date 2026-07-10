#!/usr/bin/env python3
"""Lightweight checks that generated/state files stay out of Claude and git."""

from pathlib import Path
import fnmatch
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True)


def contains(path: Path, needle: str) -> bool:
    return path.exists() and needle in path.read_text(encoding="utf-8")


def check(condition: bool, message: str, problems: list[str]) -> None:
    print(f"{'PASS' if condition else 'FAIL'} -- {message}")
    if not condition:
        problems.append(message)


def tracked(pattern: str) -> list[str]:
    result = git("ls-files", pattern)
    return [line for line in result.stdout.splitlines() if line.strip()]


def ignored(path: str) -> bool:
    result = git("check-ignore", "-v", path)
    if result.returncode != 0:
        return False
    pattern = result.stdout.split(":", 2)[-1].split(None, 1)[0]
    return not pattern.startswith("!")


def claude_ignored(path: str) -> bool:
    claudeignore = ROOT / ".claudeignore"
    if not claudeignore.exists():
        return False
    ignored_state = False
    normalized = path.replace("\\", "/")
    for raw in claudeignore.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        negate = line.startswith("!")
        pattern = line[1:] if negate else line
        pattern = pattern.replace("\\", "/")
        candidates = [pattern, pattern.rstrip("/"), f"**/{pattern.rstrip('/')}"]
        matched = any(
            normalized == candidate.rstrip("/")
            or fnmatch.fnmatch(normalized, candidate)
            or (pattern.endswith("/") and normalized.startswith(pattern))
            or (pattern.startswith("**/") and f"/{pattern[3:].rstrip('/')}/" in f"/{normalized}/")
            for candidate in candidates
        )
        if matched:
            ignored_state = not negate
    return ignored_state


def main() -> int:
    problems: list[str] = []
    claudeignore = ROOT / ".claudeignore"
    gitignore = ROOT / ".gitignore"

    check(claudeignore.exists(), ".claudeignore exists", problems)
    for pattern in (".job-helpr/", "mcp/generated/", ".next/", "node_modules/"):
        check(contains(claudeignore, pattern), f".claudeignore includes {pattern}", problems)

    for pattern in ("mcp/generated/", ".job-helpr/", "*.pdf", "*.log"):
        check(contains(gitignore, pattern), f".gitignore includes {pattern}", problems)

    env_tracked = tracked(".env") + tracked(".env.*")
    pdf_tracked = tracked("*.pdf")
    job_state_tracked = tracked(".job-helpr/*") + tracked("**/.job-helpr/*")

    check(not env_tracked, "no .env files are tracked", problems)
    check(not pdf_tracked, "no generated PDFs are tracked", problems)
    check(not job_state_tracked, "no .job-helpr files are tracked", problems)

    for important in ("package.json", "mcp/package.json", "mcp/tsconfig.json"):
        check(not ignored(important), f"{important} is not ignored", problems)

    important_sources = (
        "mcp/lib/evidence.ts",
        "mcp/lib/profile.ts",
        "mcp/lib/templates.ts",
        "mcp/lib/auth.ts",
        "mcp/lib/store.ts",
        "mcp/scripts/verify_pdf_output.py",
        "plugin/skills/setup/SKILL.md",
        "plugin/shared/references/profile-source.md",
        "mcp/README.md",
        "mcp/MCP_SETUP.md",
        "mcp/lib/templates.test.ts",
    )
    for source in important_sources:
        check(not ignored(source), f"{source} is not ignored", problems)
        check(not claude_ignored(source), f"{source} is not ignored by .claudeignore", problems)

    generated_paths = (
        ".job-helpr/profile.md",
        "mcp/generated/resume-finance-ma-analyst.pdf",
        "mcp/mock-outputs/resumes/v1/sample.pdf",
        "mcp/.next/trace",
        "node_modules/example/index.js",
    )
    for generated in generated_paths:
        check(ignored(generated), f"{generated} is ignored", problems)
        check(claude_ignored(generated), f"{generated} is ignored by .claudeignore", problems)

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
