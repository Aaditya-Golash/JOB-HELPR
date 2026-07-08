import { describe, it, expect } from "vitest";
import { escapeLatex, selectProjects } from "./match";
import { profile } from "./profile";

describe("escapeLatex", () => {
  it("escapes every LaTeX special character", () => {
    const input = "100% & $50 #1 {a}_b ~c ^d \\e";
    const out = escapeLatex(input);
    expect(out).toContain("\\%");
    expect(out).toContain("\\&");
    expect(out).toContain("\\$");
    expect(out).toContain("\\#");
    expect(out).toContain("\\_");
    expect(out).toContain("\\{");
    expect(out).toContain("\\}");
    expect(out).toContain("\\textasciitilde{}");
    expect(out).toContain("\\textasciicircum{}");
    expect(out).toContain("\\textbackslash{}");
  });

  it("leaves plain text untouched", () => {
    expect(escapeLatex("Business Analyst at Acme Corp")).toBe(
      "Business Analyst at Acme Corp",
    );
  });

  it("escapes the backslash introduced by other replacements exactly once", () => {
    // A naive implementation that escapes '&' after introducing backslashes
    // from an earlier replacement would double-escape. Guard against that.
    const out = escapeLatex("&");
    expect(out).toBe("\\&");
  });
});

describe("selectProjects", () => {
  it("clamps the requested count into the 3-5 range", () => {
    expect(selectProjects("business analyst product data", 1)).toHaveLength(3);
    expect(selectProjects("business analyst product data", 10)).toHaveLength(5);
    expect(selectProjects("business analyst product data", 4)).toHaveLength(4);
  });

  it("defaults to 4 when no count is given", () => {
    expect(selectProjects("business analyst product data")).toHaveLength(4);
  });

  it("ranks projects whose tags match the job description above unrelated ones", () => {
    const jd =
      "We are hiring a quantitative analyst to build portfolio optimization models using financial data.";
    const [top] = selectProjects(jd, 3);
    expect(top.key).toBe("portfolio_optimization");
  });

  it("only ever returns projects from the fixed pool", () => {
    const results = selectProjects("anything at all", 5);
    const validKeys = new Set(profile.projects.map((p) => p.key));
    for (const r of results) {
      expect(validKeys.has(r.key)).toBe(true);
    }
  });

  it("returns projects even when the JD matches nothing", () => {
    const results = selectProjects("zzz qqq nonexistent keywords", 3);
    expect(results).toHaveLength(3);
  });
});
