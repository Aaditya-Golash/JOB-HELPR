import { profile } from "./profile";
import { escapeLatex, selectProjects } from "./match";

type GenInput = {
  jobTitle: string;
  company: string;
  jobDescription: string;
  projectCount?: number;
};

export function generateResumeLatex(input: GenInput): { latex: string; projectsUsed: string[] } {
  const chosen = selectProjects(input.jobDescription, input.projectCount ?? 3);
  const e = escapeLatex;

  const projectBlocks = chosen
    .map((p) => {
      return `\\textbf{${e(p.name)}} \\textit{| ${e(p.role)}}
\\begin{itemize}[leftmargin=*, itemsep=0pt, topsep=2pt]
  \\item ${e(p.task)}. ${e(p.approach)}.
  \\item ${e(p.features)}.
  \\item \\textbf{${e(p.impact)}.}
\\end{itemize}`;
    })
    .join("\n\n");

  const expBlocks = profile.experience
    .map((exp) => {
      const bullets = exp.bullets.map((b) => `  \\item ${e(b)}`).join("\n");
      return `\\textbf{${e(exp.title)}} \\hfill ${e(exp.dates)}\\\\
\\textit{${e(exp.org)}}
\\begin{itemize}[leftmargin=*, itemsep=0pt, topsep=2pt]
${bullets}
\\end{itemize}`;
    })
    .join("\n\n");

  const skillLines = profile.skillCategories
    .map((cat) => `\\textbf{${e(cat.label)}:} ${e(cat.items.join(", "))}\\\\`)
    .join("\n");

  const latex = `\\documentclass[10.5pt]{article}
\\usepackage[margin=0.55in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{parskip}
\\pagestyle{empty}

\\titleformat{\\section}{\\bfseries\\large}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}

\\begin{document}

\\begin{center}
  {\\LARGE ${e(profile.name)}}\\\\
  ${e(profile.location)} \\quad | \\quad ${e(profile.phone)} \\quad | \\quad ${e(profile.email)} \\quad | \\quad ${e(profile.linkedin)} \\quad | \\quad ${e(profile.github)}
\\end{center}

\\section*{Education}
\\textbf{${e(profile.education.school)}} \\hfill ${e(profile.education.graduation)}\\\\
${e(profile.education.degree)}, ${e(profile.education.details)}
\\begin{itemize}[leftmargin=*, itemsep=0pt, topsep=2pt]
  \\item \\textbf{Relevant Coursework:} ${e(profile.education.coursework)}
  \\item \\textbf{Professional Development:} ${e(profile.education.professionalDevelopment)}
\\end{itemize}

\\section*{Professional Experience}
${expBlocks}

\\section*{Product and Engineering Projects}
${projectBlocks}

\\section*{Technical Skills}
${skillLines}

\\end{document}
`;

  return { latex, projectsUsed: chosen.map((p) => p.name) };
}

// Cover letter style calibrated against Aaditya's own past cover letters:
// contact line, optional recipient/re line, greeting, an opening paragraph
// naming the role and any referral, 2-3 paragraphs mirroring the job
// description's own phrasing while walking through relevant project work,
// and a short, plain closing. No run-on sentences, no hyphens in prose.
export function generateCoverLetterLatex(
  input: GenInput & {
    hiringManager?: string;
    recipientLines?: string[];
    referralContext?: string;
    jobId?: string;
    whyThem: string;
  },
): string {
  const chosen = selectProjects(input.jobDescription, 3);
  const e = escapeLatex;
  const greeting = input.hiringManager ? `Dear ${e(input.hiringManager)},` : "Dear Hiring Manager,";
  const reLine = input.jobId
    ? `Re: ${e(input.jobTitle)} -- Job ID ${e(input.jobId)}`
    : `Re: ${e(input.jobTitle)}`;

  const recipientBlock = input.recipientLines?.length
    ? `\\begin{flushleft}\n${input.recipientLines.map(e).join("\\\\\n")}\n\\end{flushleft}\n\\vspace{8pt}\n`
    : "";

  const bodyParas = chosen
    .map((p) => `${e(p.task)}. ${e(p.approach)}. ${e(p.impact)}.`)
    .join("\n\n");

  const latex = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{parskip}
\\pagestyle{empty}

\\begin{document}

\\begin{flushleft}
${e(profile.name)}\\\\
${e(profile.email)} $\\vert$ ${e(profile.phone)}
\\end{flushleft}

\\vspace{8pt}

${recipientBlock}
\\textbf{${reLine}}

\\vspace{8pt}

${greeting}

I am writing to express my interest in the ${e(input.jobTitle)} role at ${e(input.company)}.${input.referralContext ? " " + e(input.referralContext) : ""} ${e(input.whyThem)}

${bodyParas}

Thank you for considering my application.

\\vspace{8pt}

Sincerely,\\\\
${e(profile.name)}

\\end{document}
`;

  return latex;
}
