import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateCoverLetterLatex, generateResumeLatex } from "../lib/templates";

const output = resolve(process.cwd(), "generated");
mkdirSync(output, { recursive: true });

const financeResume = generateResumeLatex({
  jobTitle: "Finance M&A Analyst",
  company: "Northbridge Capital",
  jobDescription: "Finance and M&A analyst role requiring financial analysis, Excel modeling, valuation, portfolio analysis, market research, variance analysis, and executive reporting in British Columbia.",
});
const productResume = generateResumeLatex({
  jobTitle: "Product Analyst",
  company: "Wing Labs",
  jobDescription: "Own product requirements, feature prioritization, backlog analysis, user research, stakeholder reporting, SQL, and cross-functional product delivery.",
});
const biResume = generateResumeLatex({
  jobTitle: "Business Intelligence Analyst",
  company: "Northwind Telecom",
  jobDescription: "Build Power BI dashboards, write SQL and Python, maintain data quality, define KPIs, and deliver stakeholder reporting across telecom operations.",
});

const samples = {
  "resume-finance-ma-analyst.tex": financeResume.latex,
  "cover-letter-business-intelligence-analyst.tex": generateCoverLetterLatex({
    jobTitle: "Business Intelligence Analyst",
    company: "Northwind Telecom",
    jobDescription: "Build Power BI dashboards, write SQL, maintain data quality, define KPIs, and deliver stakeholder reporting across telecom operations.",
  }),
  "cover-letter-product-analyst.tex": generateCoverLetterLatex({
    jobTitle: "Product Analyst",
    company: "Wing Labs",
    jobDescription: "Own product requirements, feature prioritization, backlog analysis, user research, stakeholder reporting, SQL, and cross-functional product delivery.",
  }),
  "cover-letter-finance-ma-analyst.tex": generateCoverLetterLatex({
    jobTitle: "Finance M&A Analyst",
    company: "Northbridge Capital",
    jobDescription: "Finance and M&A analyst role requiring financial analysis, Excel modeling, valuation, portfolio analysis, market research, variance analysis, and executive reporting in British Columbia.",
  }),
  "resume-product-analyst.tex": productResume.latex,
  "resume-bi-data-analyst.tex": biResume.latex,
  "cover-letter-product-ops-automation.tex": generateCoverLetterLatex({
    jobTitle: "Product Operations Analyst",
    company: "FlowOps",
    jobDescription: "Improve product operations through workflow automation, Zapier, Python, process analysis, stakeholder coordination, and measurable operational reporting.",
  }),
};

const plans = {
  "resume-finance-ma-analyst.plan.json": financeResume.plan,
  "resume-product-analyst.plan.json": productResume.plan,
  "resume-bi-data-analyst.plan.json": biResume.plan,
};

for (const [name, source] of Object.entries(samples)) {
  writeFileSync(resolve(output, name), source, "utf8");
  console.log(resolve(output, name));
}
for (const [name, plan] of Object.entries(plans)) {
  writeFileSync(resolve(output, name), JSON.stringify(plan, null, 2), "utf8");
}
