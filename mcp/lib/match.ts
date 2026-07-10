import { profile } from "./profile";

const LATEX_ESCAPES: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "_": "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

// Escapes LaTeX special characters so JD text or generated prose never breaks
// compilation. A single-pass replace over the *original* string -- chaining
// sequential .replace() calls (the previous implementation) re-escapes the
// literal '{' and '}' that the backslash/tilde/caret replacements themselves
// introduce, corrupting e.g. "\textbackslash{}" into "\textbackslash\{\}".
export function escapeLatex(input: string): string {
  return input.replace(/[\\&%$#_{}~^]/g, (ch) => LATEX_ESCAPES[ch]);
}

// Picks the 1-3 best matching projects for a job description by simple
// keyword overlap against project tags/name/task text. Deterministic and
// explainable rather than a black box, so it is easy to sanity check.
export function selectProjects(jobDescription: string, count = 3) {
  const jd = jobDescription.toLowerCase();

  const scored = profile.projects.map((p) => {
    const haystack = `${p.name} ${p.tags.join(" ")} ${p.task} ${p.approach}`.toLowerCase();
    let score = 0;
    for (const tag of p.tags) {
      if (jd.includes(tag.toLowerCase())) score += 3;
    }
    // light bonus for individual words from the project overlapping the JD
    for (const word of haystack.split(/\W+/)) {
      if (word.length > 4 && jd.includes(word)) score += 1;
    }
    return { project: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const clamped = Math.min(Math.max(count, 1), 3);
  return scored.slice(0, clamped).map((s) => s.project);
}
