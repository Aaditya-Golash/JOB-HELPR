import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { generateResumeLatex, generateCoverLetterLatex } from "../../../lib/templates";
import { saveApplication, listApplications } from "../../../lib/store";
import { profile } from "../../../lib/profile";
import { selectAddress } from "../../../lib/address";
import { authorizeMcpRequest } from "../../../lib/auth";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "generate_resume",
      "Deprecated for now unless explicitly requested -- cover-letter generation is the priority workflow. Generates a one-page, role-specific LaTeX resume using Aaditya_Resume_2026(1).pdf as the base format: compact header, all-caps sections, skills near top, selected projects before experience, content budget, role classification, concise bullets, and one-page constraints. Does not dump the full profile.",
      {
        jobTitle: z.string(),
        company: z.string(),
        jobDescription: z.string(),
        projectCount: z.number().min(1).max(3).optional().describe("Max projects to include (hard cap 3, matching the one-page budget)."),
      },
      async ({ jobTitle, company, jobDescription, projectCount }) => {
        const { latex, projectsUsed, plan } = generateResumeLatex({
          jobTitle,
          company,
          jobDescription,
          projectCount,
        });
        const notes = [
          `Role classified as: ${plan.roleType} (confidence ${plan.confidence})`,
          `Location: ${plan.location}`,
          `Section order: ${plan.experienceFirst ? "Education, Skills, Experience, Projects" : "Education, Skills, Projects, Experience"}`,
          `Projects used: ${projectsUsed.join(", ")}`,
          `Total bullets: ${plan.totalBullets}`,
        ].join("\n");
        return {
          content: [
            { type: "text", text: `${notes}\n\n${latex}` },
          ],
        };
      },
    );

    server.tool(
      "generate_cover_letter",
      "Generates a polished one-page LaTeX cover letter tailored to a specific job description. Does not depend on a tailored resume. Uses Aaditya's mission bridge, evidence bank, metric highlighting, and skill bridge style. Avoids project-dump paragraphs and generic openings.",
      {
        jobTitle: z.string(),
        company: z.string(),
        jobDescription: z.string(),
        whyThem: z.string().optional().describe("Optional: one to two extra sentences of company-specific color to fold into the opening. The mission bridge already generates a non-generic opening without this."),
        hiringManager: z.string().optional(),
        recipientLines: z
          .array(z.string())
          .optional()
          .describe("e.g. ['Acme Recruiting Team', 'Acme Corp', 'Toronto, ON']"),
        referralContext: z.string().optional().describe("e.g. 'Jane Doe referred me to this role.'"),
        jobId: z.string().optional(),
      },
      async ({ jobTitle, company, jobDescription, whyThem, hiringManager, recipientLines, referralContext, jobId }) => {
        const latex = generateCoverLetterLatex({
          jobTitle,
          company,
          jobDescription,
          whyThem,
          hiringManager,
          recipientLines,
          referralContext,
          jobId,
        });
        return { content: [{ type: "text", text: latex }] };
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
      "Lists all tracked applications, optionally filtered by status.",
      {
        status: z
          .enum(["shortlisted", "materials_ready", "outreach_drafted", "applied"])
          .optional(),
      },
      async ({ status }) => {
        const all = await listApplications(status ? { status } : undefined);
        return { content: [{ type: "text", text: JSON.stringify(all, null, 2) }] };
      },
    );

    server.tool(
      "get_profile",
      "Returns the structured profile data (education, experience, projects, skills) this server generates materials from.",
      {},
      async () => {
        return { content: [{ type: "text", text: JSON.stringify(profile, null, 2) }] };
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
