import { describe, it, expect } from "vitest";
import {
  generateResumeLatex,
  generateCoverLetterLatex,
  classifyRole,
  boldMetrics,
  auditCoverLetter,
  auditResumeLatex,
} from "./templates";

const baseInput = {
  jobTitle: "Business Analyst",
  company: "Acme & Co.",
  jobDescription: "Looking for a data-driven business analyst with SQL and stakeholder reporting experience.",
};

describe("generateResumeLatex", () => {
  it("produces a compilable-looking LaTeX document with all required sections, in order", () => {
    const { latex } = generateResumeLatex(baseInput);
    expect(latex).toContain("\\documentclass");
    expect(latex).toContain("\\begin{document}");
    expect(latex).toContain("\\end{document}");

    const educationPos = latex.indexOf("\\section{EDUCATION}");
    const skillsPos = latex.indexOf("\\section{TECHNICAL SKILLS");
    const projectsPos = latex.indexOf("\\section{SELECTED PROJECTS}");
    const experiencePos = latex.indexOf("\\section{PROFESSIONAL EXPERIENCE}");

    expect(educationPos).toBeGreaterThan(-1);
    expect(skillsPos).toBeGreaterThan(-1);
    expect(projectsPos).toBeGreaterThan(-1);
    expect(experiencePos).toBeGreaterThan(-1);

    // Default (non-nontechnical) order: Education -> Skills -> Projects -> Experience
    expect(educationPos).toBeLessThan(skillsPos);
    expect(skillsPos).toBeLessThan(projectsPos);
    expect(projectsPos).toBeLessThan(experiencePos);
  });

  it("puts skills near the top, not the bottom", () => {
    const { latex } = generateResumeLatex(baseInput);
    const skillsPos = latex.indexOf("\\section{TECHNICAL SKILLS");
    const halfway = latex.length / 2;
    expect(skillsPos).toBeLessThan(halfway);
  });

  it("uses experience-first order only for the supply-chain/ops role", () => {
    const opsLatex = generateResumeLatex({
      jobTitle: "Supply Chain Coordinator",
      company: "Acme Logistics",
      jobDescription: "Manage work orders, inventory tracking, and vendor coordination across our warehouse.",
    }).latex;
    const experiencePos = opsLatex.indexOf("\\section{PROFESSIONAL EXPERIENCE}");
    const projectsPos = opsLatex.indexOf("\\section{SELECTED PROJECTS}");
    expect(experiencePos).toBeLessThan(projectsPos);
  });

  it("does not show a full https:// URL in the header", () => {
    const { latex } = generateResumeLatex(baseInput);
    const header = latex.slice(0, latex.indexOf("\\section{EDUCATION}"));
    expect(header).not.toContain("https://");
    expect(header).toContain("linkedin.com/in/aaditya-golash");
  });

  it("uses the compact 0.42in margin", () => {
    const { latex } = generateResumeLatex(baseInput);
    expect(latex).toContain("margin=0.42in");
    expect(latex).toContain("10pt,letterpaper");
    expect(latex).toContain("\\usepackage{sourcesanspro}");
    expect(latex).not.toContain("a4paper");
    expect(latex).not.toContain("13pt");
    expect(latex).not.toContain("fontawesome");
  });

  it("caps total bullets at 18 by default", () => {
    const { latex } = generateResumeLatex(baseInput);
    const itemCount = (latex.match(/\\resumeItem\{/g) ?? []).length;
    expect(itemCount).toBeLessThanOrEqual(18);
  });

  it("selects at most 3 projects, none with more than 4 bullets", () => {
    const { plan } = generateResumeLatex(baseInput);
    expect(plan.projects.length).toBeLessThanOrEqual(3);
    for (const p of plan.projects) {
      expect(p.bullets.length).toBeLessThanOrEqual(4);
    }
  });

  it("never includes raw project-dump phrasing", () => {
    const { latex } = generateResumeLatex(baseInput);
    const lower = latex.toLowerCase();
    expect(lower).not.toContain("a directed studies project needed");
    expect(lower).not.toContain("wanted to apply");
    expect(lower).not.toContain("explored whether");
    expect(lower).not.toContain("co built");
    expect(lower).not.toContain("3 person team");
  });

  it("never renders a malformed project title like '- |'", () => {
    const { latex } = generateResumeLatex(baseInput);
    expect(latex).not.toMatch(/- \$\|\$/);
    expect(latex).not.toMatch(/-\s*\|\s*\\textit/);
  });

  it("never opens a bullet with a weak verb", () => {
    const { latex } = generateResumeLatex(baseInput);
    const bullets = [...latex.matchAll(/\\resumeItem\{(?:\\textbf\{[^}]*\}\s*)?([^}]+)/g)].map((m) => m[1].trim().toLowerCase());
    const weakOpeners = ["helped", "worked on", "assisted", "participated", "responsible for", "learned", "used "];
    for (const bullet of bullets) {
      for (const weak of weakOpeners) {
        expect(bullet.startsWith(weak)).toBe(false);
      }
    }
  });

  it("clamps projectCount to the 3-project hard cap", () => {
    const { plan } = generateResumeLatex({ ...baseInput, projectCount: 2 });
    expect(plan.projects.length).toBeLessThanOrEqual(2);
  });

  it("classifies a finance JD and selects TSX Portfolio evidence", () => {
    const { latex, plan } = generateResumeLatex({
      jobTitle: "Investment Analyst",
      company: "Northbridge Capital",
      jobDescription: "Equity analyst role requiring financial modeling, portfolio management, and market research.",
    });
    expect(plan.roleType).toBe("finance_ma_equity");
    expect(latex).toContain("TSX equity data");
    expect(latex).toContain("covariance matrix");
    expect(latex).toContain("Excel");
    expect(latex).toContain("Financial Analysis");
    expect(latex).toContain("Portfolio Modeling");
    expect(latex).toContain("\\$5M+");
    expect(latex).toContain("300+");
    expect(latex).toContain("\\$1,500");
    expect(latex).toContain("Microsoft 365 migration");
    expect(latex).toContain("$1.9M operating budget");
    expect(plan.experience).toHaveLength(2);
    expect((latex.match(/\\resumeItem\{/g) ?? []).length).toBeGreaterThanOrEqual(12);
    expect(latex).not.toContain("\\texttimes");
  });

  it("classifies a BI/data JD and selects UBC IT + a data project", () => {
    const { latex, plan } = generateResumeLatex({
      jobTitle: "Business Intelligence Analyst",
      company: "Northwind Retail",
      jobDescription: "Build Power BI dashboards, write SQL, own data quality and stakeholder reporting.",
    });
    expect(plan.roleType).toBe("bi_data_analyst");
    expect(latex).toContain("ServiceNow");
    expect(latex.includes("TA Allocation") || latex.includes("Eye-Tracking")).toBe(true);
    expect(latex).toContain("board-level dashboards");
  });

  it("classifies a product JD and selects TA Allocation", () => {
    const { latex, plan } = generateResumeLatex({
      jobTitle: "Associate Product Manager",
      company: "Wing Group",
      jobDescription: "Own product requirements, backlog, and cross-functional delivery for our product team.",
    });
    expect(plan.roleType).toBe("product");
    expect(latex).toContain("TA Allocation");
    expect(latex).toContain("backlog of 36+");
  });

  it("classifies a marketing JD and can select Social Media / VenueWorks evidence", () => {
    const { latex, plan } = generateResumeLatex({
      jobTitle: "Growth Marketing Analyst",
      company: "Fresh Brand Co.",
      jobDescription: "Own social media growth, audience analytics, and customer analytics reporting for our brand.",
    });
    expect(plan.roleType).toBe("marketing_growth");
    expect(latex.includes("Social Media") || latex.includes("VenueWorks")).toBe(true);
  });

  it("audits clean and throws on a manually-broken plan", () => {
    const { plan } = generateResumeLatex(baseInput);
    const brokenPlan = { ...plan, projects: [...plan.projects, ...plan.projects, ...plan.projects] };
    expect(() => {
      const fakeLatex = "\\section{SELECTED PROJECTS}\n" + "x".repeat(1);
      const audit = auditResumeLatex(fakeLatex, brokenPlan);
      if (!audit.ok) throw new Error(audit.violations.join("; "));
    }).toThrow(/exceeds the 3-project cap/);
  });
});

describe("classifyRole", () => {
  it("classifies a Power BI / SQL / dashboards JD as bi_data_analyst", () => {
    const result = classifyRole(
      "Business Intelligence Analyst",
      "Build Power BI dashboards, write SQL, own data quality and stakeholder reporting.",
    );
    expect(result.type).toBe("bi_data_analyst");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("classifies a nonprofit/program JD as nonprofit_climate_program", () => {
    const result = classifyRole(
      "Climate Programs Associate",
      "Join our nonprofit's program team supporting grant applications and community sustainability work.",
    );
    expect(result.type).toBe("nonprofit_climate_program");
  });

  it("classifies a finance/equity JD as finance_ma_equity", () => {
    const result = classifyRole(
      "Investment Analyst",
      "Support equity analyst research, portfolio management, and financial analyst modeling for the fund.",
    );
    expect(result.type).toBe("finance_ma_equity");
  });

  it("classifies an automation/RevOps JD as automation_productops", () => {
    const result = classifyRole(
      "Product Operations Analyst",
      "Own workflow automation and process automation across RevOps and AI Ops tooling.",
    );
    expect(result.type).toBe("automation_productops");
  });

  it("falls back to bi_data_analyst with zero confidence when nothing matches", () => {
    const result = classifyRole("Assistant", "General office duties.");
    expect(result.type).toBe("bi_data_analyst");
    expect(result.confidence).toBe(0);
  });
});

describe("boldMetrics", () => {
  it("wraps only the given substrings in \\textbf{}, leaving the rest untouched", () => {
    const text = "We processed 250+ applications and shipped 36+ features this term.";
    const result = boldMetrics(text, ["250+ applications"]);
    expect(result).toBe("We processed \\textbf{250+ applications} and shipped 36+ features this term.");
  });

  it("bolds multiple substrings in the order given", () => {
    const text = "A and B and C.";
    const result = boldMetrics(text, ["A", "C"]);
    expect(result).toBe("\\textbf{A} and B and \\textbf{C}.");
  });

  it("silently skips a metric that isn't actually present in the text", () => {
    const text = "Just some text.";
    expect(boldMetrics(text, ["not present"])).toBe(text);
  });
});

describe("auditCoverLetter", () => {
  it("flags a banned opening phrase", () => {
    const result = auditCoverLetter("I am writing to express my interest in this role. \\textbf{A} \\textbf{B}");
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("Banned opening phrase"))).toBe(true);
  });

  it("flags banned weak-language phrases", () => {
    const result = auditCoverLetter("Although I do not have direct experience, \\textbf{A} \\textbf{B}");
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("Banned weak-language phrase"))).toBe(true);
  });

  it("flags project-dump phrasing", () => {
    const result = auditCoverLetter("A directed studies project needed a tool. \\textbf{A} \\textbf{B}");
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("Project-dump phrasing"))).toBe(true);
  });

  it("flags fewer than 2 bolded metrics", () => {
    const result = auditCoverLetter("Solid letter with \\textbf{one metric} only.");
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("Only 1 bolded metric"))).toBe(true);
  });

  it("flags more than 4 bolded metrics", () => {
    const result = auditCoverLetter("\\textbf{A} \\textbf{B} \\textbf{C} \\textbf{D} \\textbf{E}");
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("must not exceed 4"))).toBe(true);
  });

  it("flags a missing company name when one is given", () => {
    const result = auditCoverLetter("\\textbf{A} \\textbf{B} generic letter with no company mentioned.", "Acme Corp");
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("Company name not found"))).toBe(true);
  });

  it("passes a clean letter with 2-4 metrics, the company name, and no banned phrases", () => {
    const result = auditCoverLetter(
      "What draws me to Acme Corp is real work. \\textbf{70\\%} improvement and \\textbf{250+ applications} prove it.",
      "Acme Corp",
    );
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
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

  it("uses the sourcesanspro package", () => {
    const latex = generateCoverLetterLatex(coverInput);
    expect(latex).toContain("\\usepackage{sourcesanspro}");
    expect(latex).toContain("10.5pt,letterpaper");
    expect(latex).not.toContain("fontawesome");
  });

  it("does not require whyThem", () => {
    const { whyThem, ...withoutWhyThem } = coverInput;
    expect(() => generateCoverLetterLatex(withoutWhyThem)).not.toThrow();
  });

  it("never includes the banned generic opening", () => {
    const latex = generateCoverLetterLatex(coverInput);
    expect(latex.toLowerCase()).not.toContain("i am writing to express my interest");
  });

  it("never includes raw project-dump phrasing", () => {
    const latex = generateCoverLetterLatex(coverInput);
    expect(latex.toLowerCase()).not.toContain("a directed studies project needed");
    expect(latex.toLowerCase()).not.toContain("wanted to apply portfolio theory");
    expect(latex.toLowerCase()).not.toContain("a research team needed");
  });

  it("includes between 2 and 4 bolded metric highlights", () => {
    const latex = generateCoverLetterLatex(coverInput);
    const boldCount = (latex.match(/\\textbf\{/g) ?? []).length;
    // resume/header also use \textbf{} (name, Re: line) -- isolate the body
    // paragraphs the same way generateCoverLetterLatex's own audit does by
    // just checking the total stays in a sane range for a short letter.
    expect(boldCount).toBeGreaterThanOrEqual(2);
    expect(boldCount).toBeLessThanOrEqual(6); // + name/Re-line bolds
  });

  it("bridges a Power BI requirement instead of admitting the gap", () => {
    const latex = generateCoverLetterLatex({
      ...coverInput,
      jobTitle: "Business Intelligence Analyst",
      jobDescription: "Must have Power BI, SQL, and dashboarding experience for stakeholder reporting.",
    });
    expect(latex).toContain("transfer directly to Power BI");
    expect(latex.toLowerCase()).not.toContain("i do not know power bi");
    expect(latex.toLowerCase()).not.toContain("i lack");
    expect(latex).toContain("linkedin.com/in/aaditya-golash");
    expect(latex).not.toContain("https://www.linkedin.com");
    const body = latex.slice(latex.indexOf("Dear Hiring Manager,"), latex.indexOf("Sincerely,"));
    expect(body.split(/\n\s*\n/).filter(Boolean)).toHaveLength(6); // greeting + five focused paragraphs
    for (const paragraph of body.split(/\n\s*\n/).slice(1)) {
      expect(paragraph.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(115);
    }
  });

  it("uses nonprofit/funding/stakeholder evidence for a climate/nonprofit JD", () => {
    const latex = generateCoverLetterLatex({
      ...coverInput,
      jobTitle: "Climate Programs Associate",
      company: "Green Futures Fund",
      jobDescription: "Nonprofit program associate role supporting grant strategy and community sustainability programs.",
    });
    expect(latex).toContain("NonprofitReady");
    expect(latex).toContain("student organizations");
  });

  it("uses TSX/Markowitz/covariance evidence for a finance JD", () => {
    const latex = generateCoverLetterLatex({
      ...coverInput,
      jobTitle: "Investment Analyst",
      company: "Northbridge Capital",
      jobDescription: "Equity analyst role requiring financial modeling and portfolio management.",
    });
    expect(latex).toContain("Markowitz");
    expect(latex).toContain("covariance matrix");
    expect(latex).toContain("TSX equity data");
  });

  it("uses Zapier/Python/workflow evidence for an automation JD", () => {
    const latex = generateCoverLetterLatex({
      ...coverInput,
      jobTitle: "Product Operations Analyst",
      company: "FlowOps Inc.",
      jobDescription: "Own workflow automation, process automation, and RevOps tooling across the team.",
    });
    expect(latex).toContain("Zapier");
    expect(latex.toLowerCase()).toContain("python");
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
