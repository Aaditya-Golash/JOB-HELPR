import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { generateResumeLatex, generateCoverLetterLatex } from "../../../lib/templates";
import { saveApplication, listApplications } from "../../../lib/store";
import { profile } from "../../../lib/profile";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "generate_resume",
      "Generates a one page LaTeX resume tailored to a specific job description, drawing on 3-5 of the strongest matching projects from the fixed project pool.",
      {
        jobTitle: z.string(),
        company: z.string(),
        jobDescription: z.string(),
        projectCount: z.number().min(3).max(5).optional(),
      },
      async ({ jobTitle, company, jobDescription, projectCount }) => {
        const { latex, projectsUsed } = generateResumeLatex({
          jobTitle,
          company,
          jobDescription,
          projectCount,
        });
        return {
          content: [
            { type: "text", text: `Projects used: ${projectsUsed.join(", ")}\n\n${latex}` },
          ],
        };
      },
    );

    server.tool(
      "generate_cover_letter",
      "Generates a one page LaTeX cover letter tailored to a specific job description, matching Aaditya's real format: contact line, optional recipient block, Re: line, greeting, opening paragraph, 2-3 body paragraphs tying JD requirements to real project experience, short closing.",
      {
        jobTitle: z.string(),
        company: z.string(),
        jobDescription: z.string(),
        whyThem: z.string().describe("One to two sentences on why this company and role specifically"),
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
      "Saves a job to the tracked application shortlist. Does NOT submit anything anywhere, this is a tracker only.",
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
  },
  {},
  { basePath: "/api" },
);

export { handler as GET, handler as POST, handler as DELETE };
