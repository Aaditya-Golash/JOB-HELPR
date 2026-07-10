import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { generateResumeLatex, generateCoverLetterLatex } from "../../../lib/templates";
import { saveApplication, listApplications } from "../../../lib/store";
import { profile } from "../../../lib/profile";
import { selectAddress } from "../../../lib/address";
import { authorizeMcpRequest } from "../../../lib/auth";

function compactProfileSummary() {
  return {
    name: profile.name,
    location: profile.location,
    targetRoles: profile.targetRoles,
    headline: profile.education.degree,
    education: {
      school: profile.education.school,
      graduation: profile.education.graduation,
    },
    experience: profile.experience.map((role) => ({
      title: role.title,
      org: role.org,
      dates: role.dates,
      highlights: role.bullets.slice(0, 2),
    })),
    projects: profile.projects.map((project) => ({
      key: project.key,
      name: project.name,
      tags: project.tags,
      impact: project.impact,
    })),
    skillCategories: profile.skillCategories.map((category) => ({
      label: category.label,
      items: category.items.slice(0, 8),
    })),
    detail: "summary",
    fullProfileHint: "Call get_profile with detailLevel: 'full' only when generating or auditing documents.",
  };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "generate_resume",
      "Deprecated for now unless explicitly requested -- cover-letter generation is the priority workflow. Generates a one-page, role-specific LaTeX resume using Aaditya_Resume_2026(1).pdf as the base format. Returns compact notes by default; set includeLatex true only when you need the full LaTeX source.",
      {
        jobTitle: z.string(),
        company: z.string(),
        jobDescription: z.string(),
        projectCount: z.number().min(1).max(3).optional().describe("Max projects to include (hard cap 3, matching the one-page budget)."),
        includeLatex: z.boolean().default(false).describe("Return full LaTeX source. Default false to avoid large MCP responses."),
        includeFullAddress: z.boolean().default(false).describe("Include full street address in the visible document header. Default false; use only when explicitly requested."),
      },
      async ({ jobTitle, company, jobDescription, projectCount, includeLatex, includeFullAddress }) => {
        const { latex, projectsUsed, plan } = generateResumeLatex({
          jobTitle,
          company,
          jobDescription,
          projectCount,
          includeFullAddress,
        });
        const notes = [
          `Role classified as: ${plan.roleType} (confidence ${plan.confidence})`,
          `Location: ${plan.location}`,
          `Section order: ${plan.experienceFirst ? "Education, Skills, Experience, Projects" : "Education, Skills, Projects, Experience"}`,
          `Projects used: ${projectsUsed.join(", ")}`,
          `Total bullets: ${plan.totalBullets}`,
          `Strength score: ${plan.strengthScore}/${plan.baseStrengthThreshold} base benchmark`,
          `Fallback fill: ${plan.fillReasons.length ? plan.fillReasons.join(" | ") : "not needed"}`,
          includeLatex ? "LaTeX source included because includeLatex=true." : "LaTeX source omitted. Re-run with includeLatex=true when rendering the document.",
        ].join("\n");
        return {
          content: [
            { type: "text", text: includeLatex ? `${notes}\n\n${latex}` : notes },
          ],
        };
      },
    );

    server.tool(
      "generate_cover_letter",
      "Generates a polished one-page LaTeX cover letter tailored to a specific job description. Returns compact confirmation by default; set includeLatex true only when you need the full LaTeX source.",
      {
        jobTitle: z.string(),
        company: z.string(),
        jobDescription: z.string(),
        includeLatex: z.boolean().default(false).describe("Return full LaTeX source. Default false to avoid large MCP responses."),
        includeFullAddress: z.boolean().default(false).describe("Include full street address in the visible document header. Default false; use only when explicitly requested."),
        whyThem: z.string().optional().describe("Optional: one to two extra sentences of company-specific color to fold into the opening. The mission bridge already generates a non-generic opening without this."),
        hiringManager: z.string().optional(),
        recipientLines: z
          .array(z.string())
          .optional()
          .describe("e.g. ['Acme Recruiting Team', 'Acme Corp', 'Toronto, ON']"),
        referralContext: z.string().optional().describe("e.g. 'Jane Doe referred me to this role.'"),
        jobId: z.string().optional(),
      },
      async ({ jobTitle, company, jobDescription, includeLatex, includeFullAddress, whyThem, hiringManager, recipientLines, referralContext, jobId }) => {
        const latex = generateCoverLetterLatex({
          jobTitle,
          company,
          jobDescription,
          includeFullAddress,
          whyThem,
          hiringManager,
          recipientLines,
          referralContext,
          jobId,
        });
        const summary = [
          `Cover letter generated for ${company} -- ${jobTitle}.`,
          "Format: one-page LaTeX, clean extraction audited, 5-paragraph default.",
          includeLatex ? "LaTeX source included because includeLatex=true." : "LaTeX source omitted. Re-run with includeLatex=true when rendering the document.",
        ].join("\n");
        return { content: [{ type: "text", text: includeLatex ? `${summary}\n\n${latex}` : summary }] };
      },
    );

    server.tool(
      "save_application",
      "Saves a job to the tracked application shortlist. Does NOT submit anything anywhere, this is a tracker only. Flags likely duplicates (same company + job title as an existing entry) in the response instead of silently creating a second row.",
      {
        company: z.string(),
        jobTitle: z.string(),
        jobUrl: z.string().optional(),
        source: z.string().optional(),
        salary: z.string().optional(),
        postedDaysAgo: z.number().optional(),
        status: z
          .enum(["shortlisted", "materials_ready", "outreach_drafted", "applied"])
          .default("shortlisted"),
        matchNotes: z.string().optional(),
        projectsUsed: z.array(z.string()).optional(),
      },
      async (input) => {
        const record = await saveApplication(input);
        return { content: [{ type: "text", text: JSON.stringify(record, null, 2) }] };
      },
    );

    server.tool(
      "list_applications",
      "Lists tracked applications with compact pagination and optional filters. Does not return full history by default.",
      {
        status: z
          .enum(["shortlisted", "materials_ready", "outreach_drafted", "applied"])
          .optional(),
        company: z.string().optional(),
        role: z.string().optional(),
        since: z.string().optional().describe("ISO date/date-time lower bound for createdAt."),
        limit: z.number().int().min(1).max(100).default(25),
        offset: z.number().int().min(0).default(0),
      },
      async ({ status, company, role, since, limit, offset }) => {
        const result = await listApplications({ status, company, role, since, limit, offset });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      },
    );

    server.tool(
      "get_profile",
      "Returns a compact profile summary by default. Use detailLevel='full' only when generating or auditing documents.",
      {
        detailLevel: z.enum(["summary", "full"]).default("summary"),
      },
      async ({ detailLevel }) => {
        return {
          content: [
            { type: "text", text: JSON.stringify(detailLevel === "full" ? profile : compactProfileSummary(), null, 2) },
          ],
        };
      },
    );

    server.tool(
      "get_mailing_address",
      "Looks up the mailing address to use for a physical/mailing-address field on a real ATS application form, matched by the job's city/province. Deliberately separate from generate_resume and generate_cover_letter -- an address should only be filled into a form field that explicitly asks for one, never baked into a generated resume/cover letter by default. Returns null if no region matches or that region's address isn't configured -- never guesses.",
      {
        jobLocation: z.string().describe("e.g. 'Vancouver, BC', 'Toronto, ON', 'Remote - Alberta'"),
      },
      async ({ jobLocation }) => {
        const match = selectAddress(jobLocation);
        return { content: [{ type: "text", text: JSON.stringify(match, null, 2) }] };
      },
    );
  },
  {},
  { basePath: "/api" },
);

type RouteHandler = (request: Request) => Response | Promise<Response>;

function protectedHandler(request: Request): Response | Promise<Response> {
  return authorizeMcpRequest(request) ?? (handler as RouteHandler)(request);
}

export { protectedHandler as GET, protectedHandler as POST, protectedHandler as DELETE };
