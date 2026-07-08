import { describe, it, expect } from "vitest";
import { generateResumeLatex, generateCoverLetterLatex } from "./templates";
import { profile } from "./profile";

const baseInput = {
  jobTitle: "Business Analyst",
  company: "Acme & Co.",
  jobDescription: "Looking for a data-driven business analyst with SQL and stakeholder reporting experience.",
};

describe("generateResumeLatex", () => {
  it("produces a compilable-looking LaTeX document with all required sections", () => {
    const { latex } = generateResumeLatex(baseInput);
    expect(latex).toContain("\\documentclass");
    expect(latex).toContain("\\begin{document}");
    expect(latex).toContain("\\end{document}");
    expect(latex).toContain("\\section*{Education}");
    expect(latex).toContain("\\section*{Professional Experience}");
    expect(latex).toContain("\\section*{Product and Engineering Projects}");
    expect(latex).toContain("\\section*{Technical Skills}");
  });

  it("reports the same projects it actually used in the LaTeX body", () => {
    const { latex, projectsUsed } = generateResumeLatex(baseInput);
    expect(projectsUsed.length).toBeGreaterThanOrEqual(3);
    expect(projectsUsed.length).toBeLessThanOrEqual(5);
    for (const name of projectsUsed) {
      expect(latex).toContain(escapeForContains(name));
    }
  });

  it("respects an explicit projectCount", () => {
    const { projectsUsed } = generateResumeLatex({ ...baseInput, projectCount: 5 });
    expect(projectsUsed).toHaveLength(5);
  });

  it("includes every profile experience entry", () => {
    const { latex } = generateResumeLatex(baseInput);
    for (const exp of profile.experience) {
      expect(latex).toContain(exp.org);
    }
  });
});

describe("generateCoverLetterLatex", () => {
  const coverInput = { ...baseInput, whyThem: "Acme's data culture matches my background." };

  it("produces a compilable-looking LaTeX document", () => {
    const latex = generateCoverLetterLatex(coverInput);
    expect(latex).toContain("\\documentclass");
    expect(latex).toContain("\\begin{document}");
    expect(latex).toContain("\\end{document}");
    expect(latex).toContain("Sincerely");
  });

  it("uses a generic greeting when no hiring manager is given", () => {
    const latex = generateCoverLetterLatex(coverInput);
    expect(latex).toContain("Dear Hiring Manager,");
  });

  it("addresses the named hiring manager when given", () => {
    const latex = generateCoverLetterLatex({ ...coverInput, hiringManager: "Jane Doe" });
    expect(latex).toContain("Dear Jane Doe,");
    expect(latex).not.toContain("Dear Hiring Manager,");
  });

  it("includes the job ID in the Re: line when given", () => {
    const latex = generateCoverLetterLatex({ ...coverInput, jobId: "REQ-42" });
    expect(latex).toMatch(/Re: Business Analyst.*Job ID REQ-42/);
  });

  it("omits the job ID from the Re: line when not given", () => {
    const latex = generateCoverLetterLatex(coverInput);
    expect(latex).not.toContain("Job ID");
  });

  it("includes referral context only when provided", () => {
    const withReferral = generateCoverLetterLatex({
      ...coverInput,
      referralContext: "Jane Doe referred me to this role.",
    });
    expect(withReferral).toContain("Jane Doe referred me to this role.");

    const withoutReferral = generateCoverLetterLatex(coverInput);
    expect(withoutReferral).not.toContain("referred me");
  });

  it("escapes LaTeX special characters in caller-supplied fields (injection safety)", () => {
    // whyThem, hiringManager, company, and jobTitle all come from the MCP
    // caller and are interpolated directly into the LaTeX source -- an
    // unescaped '&', '#', or '$' here would break compilation, or worse,
    // let injected LaTeX commands run.
    const latex = generateCoverLetterLatex({
      ...coverInput,
      company: "Smith & Wesson #1 Inc.",
      hiringManager: "Pat \\& Co",
      whyThem: "Your 100% focus on R&D and $50M in funding stood out.",
    });
    expect(latex).toContain("Smith \\& Wesson \\#1 Inc.");
    expect(latex).toContain("100\\% focus on R\\&D and \\$50M");
    expect(latex).not.toMatch(/[^\\]&(?!\w)/); // no bare unescaped ampersand anywhere
  });

  it("renders a recipient block only when recipientLines is given", () => {
    const withRecipient = generateCoverLetterLatex({
      ...coverInput,
      recipientLines: ["Acme Recruiting Team", "Acme Corp", "Toronto, ON"],
    });
    expect(withRecipient).toContain("Acme Recruiting Team");
    expect(withRecipient).toContain("\\begin{flushleft}");

    const withoutRecipient = generateCoverLetterLatex(coverInput);
    expect(withoutRecipient).not.toContain("Acme Recruiting Team");
  });
});

function escapeForContains(name: string): string {
  // project names in profile.ts are plain text (no LaTeX special chars today),
  // so the escaped and raw forms are identical -- this helper exists so the
  // test still communicates intent if that ever changes.
  return name;
}
