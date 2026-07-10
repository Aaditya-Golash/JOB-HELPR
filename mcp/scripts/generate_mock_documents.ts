import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateCoverLetterLatex, generateResumeLatex, classifyRole } from "../lib/templates";
import { selectAddress, selectApplicationLocation } from "../lib/address";

type MockJob = {
  slug: string;
  documentType: "resume" | "cover-letter";
  jobTitle: string;
  company: string;
  jobLocation: string;
  jobDescription: string;
};

const resumeJobs: MockJob[] = [
  {
    slug: "bi-data-analyst",
    documentType: "resume",
    jobTitle: "Business Intelligence Analyst",
    company: "Northwind Telecom",
    jobLocation: "Toronto, ON",
    jobDescription: "Build Power BI dashboards, write SQL, maintain data quality, define KPIs, and deliver stakeholder reporting in Toronto, ON.",
  },
  {
    slug: "finance-ma-analyst",
    documentType: "resume",
    jobTitle: "Finance M&A Analyst",
    company: "Northbridge Capital",
    jobLocation: "Calgary, AB",
    jobDescription: "Finance and M&A analyst requiring financial analysis, Excel modeling, valuation, portfolio analysis, market research, and executive reporting in Calgary, AB.",
  },
  {
    slug: "product-analyst",
    documentType: "resume",
    jobTitle: "Product Analyst",
    company: "Wing Labs",
    jobLocation: "Vancouver, BC",
    jobDescription: "Own product requirements, feature prioritization, backlog analysis, user research, stakeholder reporting, SQL, and cross-functional product delivery in Vancouver, BC.",
  },
];

const coverLetterJobs: MockJob[] = [
  { ...resumeJobs[0], documentType: "cover-letter" },
  { ...resumeJobs[1], documentType: "cover-letter" },
  { ...resumeJobs[2], documentType: "cover-letter" },
  {
    slug: "product-ops-automation",
    documentType: "cover-letter",
    jobTitle: "Product Operations Analyst",
    company: "FlowOps",
    jobLocation: "Edmonton, AB",
    jobDescription: "Improve product operations through workflow automation, Zapier, Python, process analysis, stakeholder coordination, and measurable operational reporting in Edmonton, AB.",
  },
];

function nextVersionDir(base: string): string {
  for (let i = 1; i < 1000; i++) {
    const dir = resolve(base, `v${i}`);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      return dir;
    }
  }
  throw new Error(`Could not find next version directory under ${base}`);
}

function extractText(pdfPath: string): string {
  const script = [
    "from pathlib import Path",
    "from pypdf import PdfReader",
    "import sys",
    "reader = PdfReader(sys.argv[1])",
    "print('\\n'.join(page.extract_text() or '' for page in reader.pages))",
  ].join("; ");
  return execFileSync("python", ["-c", script, pdfPath], {
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
}

function wordCountFromLatexBody(latex: string): number {
  const body = latex.includes("Dear ")
    ? latex.split(/Dear [^\n]+,\n/)[1]?.split("Sincerely,")[0] ?? latex
    : latex;
  return body
    .replace(/\\textbf\{([^{}]*)\}/g, "$1")
    .replace(/\\[A-Za-z]+(?:\{[^{}]*\})?/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function compileVerifyAndWrite(job: MockJob, latex: string, outputDir: string, metadata: Record<string, unknown>) {
  const texPath = resolve(outputDir, `${job.slug}.tex`);
  const pdfPath = resolve(outputDir, `${job.slug}.pdf`);
  const txtPath = resolve(outputDir, `${job.slug}.txt`);
  const metadataPath = resolve(outputDir, `${job.slug}.metadata.json`);
  writeFileSync(texPath, latex, "utf8");
  execFileSync("lualatex", ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${outputDir}`, texPath], { stdio: "pipe" });
  const verifier = resolve(process.cwd(), "scripts", "verify_pdf_output.py");
  const verifierResult = spawnSync("python", [verifier, pdfPath, "--kind", job.documentType === "resume" ? "resume" : "cover-letter"], { encoding: "utf8" });
  const extracted = extractText(pdfPath);
  writeFileSync(txtPath, extracted, "utf8");
  writeFileSync(metadataPath, JSON.stringify({
    ...metadata,
    verifierResult: {
      status: verifierResult.status,
      stdout: verifierResult.stdout.trim(),
      stderr: verifierResult.stderr.trim(),
    },
  }, null, 2), "utf8");
  if (verifierResult.status !== 0) {
    throw new Error(`${job.slug} failed verification:\n${verifierResult.stdout}\n${verifierResult.stderr}`);
  }
  console.log(`${job.documentType}: ${texPath}`);
}

function selectedAddress(jobLocation: string) {
  const match = selectAddress(jobLocation);
  return match?.address ?? null;
}

const outputRoot = resolve(process.cwd(), "mock-outputs");
const resumeDir = nextVersionDir(resolve(outputRoot, "resumes"));
const coverLetterDir = nextVersionDir(resolve(outputRoot, "cover-letters"));
const generatedAt = new Date().toISOString();

for (const job of resumeJobs) {
  const { latex, plan } = generateResumeLatex({ jobTitle: job.jobTitle, company: job.company, jobDescription: job.jobDescription });
  compileVerifyAndWrite(job, latex, resumeDir, {
    roleTitle: job.jobTitle,
    company: job.company,
    jobLocation: job.jobLocation,
    selectedCity: plan.location,
    selectedFullAddress: selectedAddress(job.jobLocation),
    documentType: "resume",
    generatedAt,
    roleClassified: plan.roleType,
    selectedEvidence: plan.projects.map((project) => project.name),
    excludedEvidence: plan.excludedEvidence,
    bulletCount: plan.totalBullets,
  });
}

for (const job of coverLetterJobs) {
  const latex = generateCoverLetterLatex({ jobTitle: job.jobTitle, company: job.company, jobDescription: job.jobDescription });
  const role = classifyRole(job.jobTitle, job.jobDescription);
  compileVerifyAndWrite(job, latex, coverLetterDir, {
    roleTitle: job.jobTitle,
    company: job.company,
    jobLocation: job.jobLocation,
    selectedCity: selectApplicationLocation(job.jobDescription).cityProvince,
    selectedFullAddress: selectedAddress(job.jobLocation),
    documentType: "cover-letter",
    generatedAt,
    roleClassified: role.type,
    selectedEvidence: "cover-letter evidence selected by role proof stack",
    excludedEvidence: [],
    wordCount: wordCountFromLatexBody(latex),
  });
}

console.log(`resumeOutput=${resumeDir}`);
console.log(`coverLetterOutput=${coverLetterDir}`);
