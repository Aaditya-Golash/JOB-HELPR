import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { generateCoverLetterLatex, generateResumeLatex } from "./templates";
import { profile } from "./profile";

const hasTool = (name: string) => spawnSync(name, ["--version"], { stdio: "ignore" }).status === 0;
const canCompile = hasTool("lualatex") && hasTool("python");
const integration = canCompile ? describe : describe.skip;

integration("LuaLaTeX PDF extraction", () => {
  const directory = mkdtempSync(join(tmpdir(), "job-helpr-pdf-"));
  const original = { email: profile.email, phone: profile.phone, location: profile.location };

  beforeAll(() => {
    profile.email = "aadigolash10@outlook.com";
    profile.phone = "250-864-6046";
    profile.location = "Kelowna, BC";
  });

  afterAll(() => {
    Object.assign(profile, original);
    rmSync(directory, { recursive: true, force: true });
  });

  function compileAndVerify(name: string, latex: string, kind: "resume" | "cover-letter") {
    const tex = join(directory, `${name}.tex`);
    writeFileSync(tex, latex, "utf8");
    execFileSync("lualatex", ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${directory}`, tex], { stdio: "pipe" });
    const pdf = join(directory, `${name}.pdf`);
    const verifier = resolve(import.meta.dirname, "../scripts/verify_pdf_output.py");
    const result = spawnSync("python", [verifier, pdf, "--kind", kind], { encoding: "utf8" });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  }

  it("extracts the Product Ops letter without joined or hyphenated words", () => {
    compileAndVerify("cover-letter-product-ops-automation", generateCoverLetterLatex({
      jobTitle: "Product Operations Analyst",
      company: "FlowOps",
      jobDescription: "Improve product operations through workflow automation, Zapier, Python, process analysis, stakeholder coordination, and measurable operational reporting.",
    }), "cover-letter");
  }, 30_000);

  it("keeps the Finance/M&A resume full, clean, and one page", () => {
    compileAndVerify("resume-finance-ma-analyst", generateResumeLatex({
      jobTitle: "Finance M&A Analyst",
      company: "Northbridge Capital",
      jobDescription: "Finance and M&A analyst requiring financial analysis, Excel modeling, portfolio analysis, market research, variance analysis, and executive reporting.",
    }).latex, "resume");
  }, 30_000);

  it("extracts the BI letter with intact Power BI bridge phrases", () => {
    compileAndVerify("cover-letter-business-intelligence-analyst", generateCoverLetterLatex({
      jobTitle: "Business Intelligence Analyst",
      company: "Northwind Telecom",
      jobDescription: "Build Power BI dashboards, write SQL, define KPIs, and deliver stakeholder reporting.",
    }), "cover-letter");
  }, 30_000);

  it("extracts the Product Analyst letter with intact product proof", () => {
    compileAndVerify("cover-letter-product-analyst", generateCoverLetterLatex({
      jobTitle: "Product Analyst",
      company: "Wing Labs",
      jobDescription: "Own product requirements, feature prioritization, backlog analysis, user research, stakeholder reporting, SQL, and cross-functional product delivery.",
    }), "cover-letter");
  }, 30_000);

  it("extracts the Finance/M&A letter with intact finance proof", () => {
    compileAndVerify("cover-letter-finance-ma-analyst", generateCoverLetterLatex({
      jobTitle: "Finance M&A Analyst",
      company: "Northbridge Capital",
      jobDescription: "Finance and M&A analyst role requiring financial analysis, Excel modeling, valuation, portfolio analysis, market research, variance analysis, and executive reporting.",
    }), "cover-letter");
  }, 30_000);
});
