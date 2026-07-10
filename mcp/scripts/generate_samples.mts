import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateCoverLetterLatex, generateResumeLatex } from "../lib/templates";

const output = resolve(process.cwd(), "generated");
mkdirSync(output, { recursive: true });

const samples = {
  "resume-finance-ma-analyst.tex": generateResumeLatex({
    jobTitle: "Finance M&A Analyst",
    company: "Northbridge Capital",
    jobDescription: "Finance and M&A analyst role requiring financial analysis, Excel modeling, valuation, portfolio analysis, market research, variance analysis, and executive reporting in British Columbia.",
  }).latex,
  "cover-letter-business-intelligence-analyst.tex": generateCoverLetterLatex({
    jobTitle: "Business Intelligence Analyst",
    company: "Northwind Telecom",
    jobDescription: "Build Power BI dashboards, write SQL, maintain data quality, define KPIs, and deliver stakeholder reporting across telecom operations.",
  }),
  "resume-product-analyst.tex": generateResumeLatex({
    jobTitle: "Product Analyst",
    company: "Wing Labs",
    jobDescription: "Own product requirements, feature prioritization, backlog analysis, user research, stakeholder reporting, SQL, and cross-functional product delivery.",
  }).latex,
  "cover-letter-product-ops-automation.tex": generateCoverLetterLatex({
    jobTitle: "Product Operations Analyst",
    company: "FlowOps",
    jobDescription: "Improve product operations through workflow automation, Zapier, Python, process analysis, stakeholder coordination, and measurable operational reporting.",
  }),
};

for (const [name, source] of Object.entries(samples)) {
  writeFileSync(resolve(output, name), source, "utf8");
  console.log(resolve(output, name));
}
