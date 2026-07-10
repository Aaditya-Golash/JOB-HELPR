import { profile } from "./profile";
import { escapeLatex, selectProjects } from "./match";
import { RESUME_EVIDENCE, type ResumeProjectKey } from "./evidence";
import { selectApplicationLocation } from "./address";

type GenInput = {
  jobTitle: string;
  company: string;
  jobDescription: string;
  projectCount?: number;
  includeFullAddress?: boolean;
};

// ============================================================================
// Resume engine
//
// Same deterministic template/evidence-selector spirit as the cover letter
// engine below -- content planning happens BEFORE any LaTeX is built.
// classifyResumeRole() (an alias of classifyRole(), the two engines share
// one role classifier so the same JD gets a consistent read either way)
// drives selectResumeExperience/selectResumeProjects/selectResumeSkills,
// which produce a ResumeContentPlan. estimateResumeLength() and
// shrinkToOnePage() run on that plan before renderResumeLatex() ever turns
// it into LaTeX -- the old generator's failure mode was rendering first and
// hoping it fit; this one budgets first.
//
// Base format is Aaditya_Resume_2026.pdf (the account owner's real, current
// resume) -- section order, compact skills block, project-first structure,
// all-caps headings, and the header contact-line format are all taken
// directly from it, not reinvented.
// ============================================================================

type ResumeRoleType =
  | RoleType
  | "business_systems_analyst"
  | "software_developer"
  | "supply_chain_ops"
  | "ui_ux_frontend";

// Reuses the cover letter engine's classifier -- same JD, same read, in
// both tools. Widens the return type since resume role selection has a
// few categories (systems analyst, developer, ops, UI/UX) the cover
// letter engine doesn't need a distinct mission-bridge fragment for.
function classifyResumeRole(jobTitle: string, jobDescription: string): { type: ResumeRoleType; confidence: number } {
  const base = classifyRole(jobTitle, jobDescription);
  const title = jobTitle.toLowerCase();
  const description = jobDescription.toLowerCase();

  const extra: { type: ResumeRoleType; keywords: string[] }[] = [
    { type: "business_systems_analyst", keywords: ["business analyst", "systems analyst", "requirements gathering", "uat", "business requirements"] },
    { type: "software_developer", keywords: ["software developer", "software engineer", "backend developer", "full stack", "full-stack developer", "flask", "rest api"] },
    { type: "supply_chain_ops", keywords: ["supply chain", "logistics", "inventory", "work order", "vendor coordination", "warehouse", "procurement coordinator"] },
    { type: "ui_ux_frontend", keywords: ["ui/ux", "ux designer", "ui designer", "frontend developer", "front-end", "user experience", "user interface"] },
  ];

  // Same title-weighted scoring as classifyRole() -- see its comment.
  let best: { type: ResumeRoleType; score: number } = { type: base.type, score: base.confidence };
  for (const rule of extra) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (title.includes(kw)) score += kw.length * 2;
      else if (description.includes(kw)) score += kw.length;
    }
    if (score > best.score) best = { type: rule.type, score };
  }
  return { type: best.type, confidence: best.score };
}

const EDUCATION_LOCATION = "British Columbia";

// Which 3 projects, and how many bullets from each pool (clamped to the
// pool's actual length in selectResumeProjects). Strongest project first;
// only the first gets 4 bullets, matching the "3 max, strongest can have
// 4 if it still fits" rule.
const RESUME_PROJECT_PLAN: Record<ResumeRoleType, { key: ResumeProjectKey; bullets: number }[]> = {
  bi_data_analyst: [{ key: "taAllocation", bullets: 4 }, { key: "eyeTracking", bullets: 3 }, { key: "tsxPortfolio", bullets: 2 }],
  business_systems_analyst: [{ key: "taAllocation", bullets: 4 }, { key: "eyeTracking", bullets: 3 }, { key: "calmora", bullets: 2 }],
  product: [{ key: "taAllocation", bullets: 4 }, { key: "eyeTracking", bullets: 3 }, { key: "venueWorks", bullets: 2 }],
  automation_productops: [{ key: "calmora", bullets: 3 }, { key: "taAllocation", bullets: 3 }, { key: "eyeTracking", bullets: 2 }],
  strategy_ops_consulting: [{ key: "taAllocation", bullets: 4 }, { key: "tsxPortfolio", bullets: 3 }, { key: "venueWorks", bullets: 2 }],
  finance_ma_equity: [{ key: "tsxPortfolio", bullets: 4 }, { key: "taAllocation", bullets: 2 }, { key: "venueWorks", bullets: 2 }],
  nonprofit_climate_program: [{ key: "venueWorks", bullets: 4 }, { key: "taAllocation", bullets: 2 }, { key: "socialMedia", bullets: 2 }],
  network_it_systems: [{ key: "helpR", bullets: 3 }, { key: "taAllocation", bullets: 3 }, { key: "eyeTracking", bullets: 2 }],
  software_developer: [{ key: "taAllocation", bullets: 4 }, { key: "helpR", bullets: 3 }, { key: "eyeTracking", bullets: 2 }],
  supply_chain_ops: [{ key: "taAllocation", bullets: 3 }, { key: "venueWorks", bullets: 2 }, { key: "calmora", bullets: 2 }],
  marketing_growth: [{ key: "socialMedia", bullets: 3 }, { key: "venueWorks", bullets: 3 }, { key: "taAllocation", bullets: 2 }],
  ui_ux_frontend: [{ key: "eyeTracking", bullets: 4 }, { key: "helpR", bullets: 2 }, { key: "socialMedia", bullets: 2 }],
};

type ResumeExperienceKey = "ubcsuo" | "ubcIT";

// Indices into profile.experience[0/1].bullets -- which 1-3 of the 4 real
// bullets per role show up for a given target role type. Both experience
// entries are used by default (Aaditya only has two), trimmed differently
// per role rather than picking which roles to include, since there's
// nothing to pick between -- the selection that matters is which bullets.
const RESUME_EXPERIENCE_PLAN: Record<ResumeRoleType, { key: ResumeExperienceKey; bulletIndices: number[] }[]> = {
  bi_data_analyst: [{ key: "ubcIT", bulletIndices: [0, 1] }, { key: "ubcsuo", bulletIndices: [3] }],
  business_systems_analyst: [{ key: "ubcIT", bulletIndices: [0, 2] }, { key: "ubcsuo", bulletIndices: [1] }],
  product: [{ key: "ubcsuo", bulletIndices: [3, 0] }, { key: "ubcIT", bulletIndices: [1] }],
  automation_productops: [{ key: "ubcIT", bulletIndices: [2, 1] }, { key: "ubcsuo", bulletIndices: [0] }],
  strategy_ops_consulting: [{ key: "ubcsuo", bulletIndices: [0, 2] }, { key: "ubcIT", bulletIndices: [2] }],
  finance_ma_equity: [{ key: "ubcsuo", bulletIndices: [0, 1] }, { key: "ubcIT", bulletIndices: [3] }],
  nonprofit_climate_program: [{ key: "ubcsuo", bulletIndices: [0, 1, 2] }],
  network_it_systems: [{ key: "ubcIT", bulletIndices: [0, 1, 3] }, { key: "ubcsuo", bulletIndices: [0] }],
  software_developer: [{ key: "ubcIT", bulletIndices: [1, 2] }, { key: "ubcsuo", bulletIndices: [3] }],
  supply_chain_ops: [{ key: "ubcsuo", bulletIndices: [0, 2] }, { key: "ubcIT", bulletIndices: [0] }],
  marketing_growth: [{ key: "ubcsuo", bulletIndices: [3, 0] }],
  ui_ux_frontend: [{ key: "ubcIT", bulletIndices: [1] }, { key: "ubcsuo", bulletIndices: [3] }],
};

type SkillLine = { label: string; items: string[] };

// Every item here traces back verbatim to profile.skillCategories -- these
// are role-specific SUBSETS, never invented skills. 3 lines by default.
const RESUME_SKILLS_PLAN: Record<ResumeRoleType, SkillLine[]> = {
  bi_data_analyst: [
    { label: "Languages/Frameworks", items: ["Python", "SQL", "JavaScript", "TypeScript"] },
    { label: "Systems & Architecture", items: ["ServiceNow", "REST APIs", "Docker"] },
    { label: "Data & Business Analytics", items: ["Tableau", "GA4", "Adobe Experience Platform", "Requirements Gathering"] },
  ],
  business_systems_analyst: [
    { label: "Languages/Frameworks", items: ["Python", "SQL", "JavaScript", "TypeScript"] },
    { label: "Systems & Architecture", items: ["ServiceNow", "REST APIs", "Docker"] },
    { label: "Data & Business Analytics", items: ["Requirements Gathering", "SDLC", "SLA Management", "Tableau"] },
  ],
  product: [
    { label: "Languages/Frameworks", items: ["Python", "SQL", "Flask"] },
    { label: "Systems & Architecture", items: ["REST APIs", "Docker", "Git"] },
    { label: "Data & Business Analytics", items: ["Requirements Gathering", "Tableau", "Cost-Benefit Analysis"] },
  ],
  automation_productops: [
    { label: "Languages/Frameworks", items: ["Python", "JSON", "SQL"] },
    { label: "Systems & Architecture", items: ["REST APIs", "ServiceNow", "Docker"] },
    { label: "Data & Business Analytics", items: ["SDLC", "Requirements Gathering", "SLA Management"] },
  ],
  strategy_ops_consulting: [
    { label: "Languages/Frameworks", items: ["Python", "SQL"] },
    { label: "Systems & Architecture", items: ["ServiceNow", "REST APIs"] },
    { label: "Data & Business Analytics", items: ["Cost-Benefit Analysis", "Requirements Gathering", "Tableau", "SLA Management"] },
  ],
  finance_ma_equity: [
    { label: "Finance & Analytics", items: ["Excel", "Financial Analysis", "Portfolio Modeling", "Variance Analysis", "Cost-Benefit Analysis", "Bloomberg Market Concepts"] },
    { label: "Data & Tools", items: ["Python", "SQL", "Tableau", "Data Validation", "Market Research"] },
    { label: "Systems & Reporting", items: ["ServiceNow", "Requirements Gathering", "Dashboarding", "Stakeholder Reporting"] },
  ],
  nonprofit_climate_program: [
    { label: "Languages/Frameworks", items: ["Python", "SQL"] },
    { label: "Systems & Architecture", items: ["REST APIs", "ServiceNow"] },
    { label: "Data & Business Analytics", items: ["Cost-Benefit Analysis", "Tableau", "Requirements Gathering"] },
  ],
  network_it_systems: [
    { label: "Languages/Frameworks", items: ["Python", "SQL", "HTML/CSS"] },
    { label: "Systems & Architecture", items: ["ServiceNow", "Docker", "Git"] },
    { label: "Data & Business Analytics", items: ["SLA Management", "SDLC", "Requirements Gathering"] },
  ],
  software_developer: [
    { label: "Languages/Frameworks", items: ["Python", "Flask", "JavaScript", "TypeScript", "SQL"] },
    { label: "Systems & Architecture", items: ["REST APIs", "Docker", "Git", "Firebase"] },
    { label: "Data & Business Analytics", items: ["SDLC", "Requirements Gathering"] },
  ],
  supply_chain_ops: [
    { label: "Languages/Frameworks", items: ["SQL", "Python"] },
    { label: "Systems & Architecture", items: ["ServiceNow", "REST APIs"] },
    { label: "Data & Business Analytics", items: ["Cost-Benefit Analysis", "SLA Management", "Requirements Gathering"] },
  ],
  marketing_growth: [
    { label: "Languages/Frameworks", items: ["Python", "SQL"] },
    { label: "Data & Business Analytics", items: ["GA4", "Adobe Experience Platform", "Tableau"] },
    { label: "Systems & Architecture", items: ["REST APIs", "Firebase"] },
  ],
  ui_ux_frontend: [
    { label: "Languages/Frameworks", items: ["JavaScript", "TypeScript", "HTML/CSS", "Python"] },
    { label: "Systems & Architecture", items: ["Android Studio", "Firebase", "Git"] },
    { label: "Data & Business Analytics", items: ["Requirements Gathering", "Tableau"] },
  ],
};

// Nontechnical roles read experience-first; every other role stays
// project-first, since Aaditya's strongest tailored evidence is usually
// in projects, per the base format's own design.
const EXPERIENCE_FIRST_ROLES: ResumeRoleType[] = ["supply_chain_ops"];

export type ResumeContentPlan = {
  roleType: ResumeRoleType;
  confidence: number;
  location: string;
  experienceFirst: boolean;
  experience: { title: string; org: string; location: string; dates: string; bullets: string[] }[];
  projects: { name: string; role: string; bullets: string[]; selectionReason: string }[];
  excludedEvidence: { name: string; reason: string }[];
  skills: SkillLine[];
  totalBullets: number;
  strengthScore: number;
  baseStrengthThreshold: number;
  fillReasons: string[];
};

const BASE_RESUME_STRENGTH_THRESHOLD = 30;
const PREFERRED_MIN_BULLETS = 15;
const PREFERRED_MAX_BULLETS = 17;
const HARD_BULLET_CAP = 18;

const ROLE_CRITICAL_TOOLS: Record<ResumeRoleType, string[]> = {
  bi_data_analyst: ["Python", "SQL", "Tableau", "Excel", "ServiceNow"],
  business_systems_analyst: ["SQL", "ServiceNow", "Requirements Gathering", "Tableau"],
  product: ["SQL", "Requirements Gathering", "Docker", "Tableau"],
  automation_productops: ["Python", "SQL", "ServiceNow", "REST APIs"],
  strategy_ops_consulting: ["Python", "SQL", "Tableau", "Cost-Benefit Analysis"],
  finance_ma_equity: ["Excel", "Financial Analysis", "Portfolio Modeling", "Python", "SQL", "Tableau"],
  nonprofit_climate_program: ["Cost-Benefit Analysis", "Tableau", "Requirements Gathering"],
  network_it_systems: ["ServiceNow", "Python", "SQL", "Docker"],
  software_developer: ["Python", "Flask", "SQL", "Docker", "Git"],
  supply_chain_ops: ["SQL", "Python", "ServiceNow", "Cost-Benefit Analysis"],
  marketing_growth: ["GA4", "Adobe Experience Platform", "Tableau", "SQL"],
  ui_ux_frontend: ["JavaScript", "TypeScript", "HTML/CSS", "Python"],
};

const TWO_EXPERIENCE_ROLES = new Set<ResumeRoleType>([
  "bi_data_analyst", "business_systems_analyst", "product", "automation_productops",
  "strategy_ops_consulting", "finance_ma_equity", "network_it_systems", "software_developer",
  "ui_ux_frontend",
]);

export function scoreResumeStrength(plan: ResumeContentPlan): number {
  const bullets = [...plan.projects.flatMap((project) => project.bullets), ...plan.experience.flatMap((role) => role.bullets)];
  const allText = `${bullets.join(" ")} ${plan.skills.flatMap((line) => line.items).join(" ")}`;
  const metricMatches = allText.match(/(?:\$\d[\d,.]*[MK+]*|\b\d+(?:\.\d+)?(?:%|\+|x\d+| months?| features?| applications?| incidents?| students?| properties?| tests?|M\+|K\+))/gi) ?? [];
  let score = metricMatches.length;
  score += (allText.match(/\$\d/gi) ?? []).length * 2;
  score += bullets.filter((bullet) => /delivered|shipped|built .*platform|now runs|deployed|migration|rollout/i.test(bullet)).length * 2;
  score += bullets.filter((bullet) => /(?:cut|reduc\w*).*(?:\d+%|days?|hours?)/i.test(bullet)).length * 2;
  score += bullets.filter((bullet) => /\d[\d,]*\+? (?:students|users|applications|properties|organizations|incidents)/i.test(bullet)).length;

  const criticalTools = ROLE_CRITICAL_TOOLS[plan.roleType];
  score += criticalTools.filter((tool) => allText.toLowerCase().includes(tool.toLowerCase())).length;
  score += plan.projects.length;
  score += plan.experience.length;

  if (plan.totalBullets < 14) score -= (14 - plan.totalBullets) * 3;
  if (TWO_EXPERIENCE_ROLES.has(plan.roleType) && plan.experience.length < 2) score -= 6;
  if (plan.skills.length < 3) score -= (3 - plan.skills.length) * 4;
  if (plan.skills.some((line) => line.items.length < 3)) score -= 2;
  return score;
}

function selectResumeExperience(roleType: ResumeRoleType): ResumeContentPlan["experience"] {
  const plan = RESUME_EXPERIENCE_PLAN[roleType];
  const bySource: Record<ResumeExperienceKey, (typeof profile.experience)[number]> = {
    ubcsuo: profile.experience[0],
    ubcIT: profile.experience[1],
  };
  return plan.map(({ key, bulletIndices }) => {
    const source = bySource[key];
    return {
      title: source.title,
      org: source.org,
      location: source.location,
      dates: source.dates.replace(/\s*[–—]\s*/g, " -- "),
      bullets: bulletIndices.map((i) => source.bullets[i]).filter(Boolean),
    };
  });
}

function selectResumeProjects(roleType: ResumeRoleType, maxProjects = 3): ResumeContentPlan["projects"] {
  const plan = RESUME_PROJECT_PLAN[roleType].slice(0, maxProjects);
  return plan.map(({ key, bullets }, index) => {
    const source = RESUME_EVIDENCE[key];
    return {
      name: source.name,
      role: source.role,
      bullets: source.bullets.slice(0, Math.min(bullets, source.bullets.length)),
      selectionReason: `Ranked ${index + 1} for ${roleType}; strength ${source.strength}/5 and role relevance: ${source.roleRelevance.join(", ")}`,
    };
  });
}

function selectResumeSkills(roleType: ResumeRoleType): SkillLine[] {
  return RESUME_SKILLS_PLAN[roleType];
}

function buildResumeContentPlan(input: GenInput): ResumeContentPlan {
  const { type: roleType, confidence } = classifyResumeRole(input.jobTitle, input.jobDescription);
  const experience = selectResumeExperience(roleType);
  const projects = selectResumeProjects(roleType, input.projectCount ?? 3);
  const selectedNames = new Set(projects.map((project) => project.name));
  const skills = selectResumeSkills(roleType);
  const totalBullets =
    2 + // education bullets, fixed
    experience.reduce((sum, e) => sum + e.bullets.length, 0) +
    projects.reduce((sum, p) => sum + p.bullets.length, 0);

  const plan: ResumeContentPlan = {
    roleType,
    confidence,
    location: selectApplicationLocation(input.jobDescription).cityProvince,
    experienceFirst: EXPERIENCE_FIRST_ROLES.includes(roleType),
    experience,
    projects,
    excludedEvidence: Object.values(RESUME_EVIDENCE)
      .filter((evidence) => !selectedNames.has(evidence.name))
      .map((evidence) => ({ name: evidence.name, reason: "Lower deterministic rank for this role or excluded by the 3-project one-page cap" })),
    skills,
    totalBullets,
    strengthScore: 0,
    baseStrengthThreshold: BASE_RESUME_STRENGTH_THRESHOLD,
    fillReasons: [],
  };
  plan.strengthScore = scoreResumeStrength(plan);
  return plan;
}

function fillResumeToBaseStrength(
  plan: ResumeContentPlan,
  roleType: ResumeRoleType,
  _jobDescription: string,
): ResumeContentPlan {
  const next: ResumeContentPlan = {
    ...plan,
    experience: plan.experience.map((role) => ({ ...role, bullets: [...role.bullets] })),
    projects: plan.projects.map((project) => ({ ...project, bullets: [...project.bullets] })),
    fillReasons: [...plan.fillReasons],
  };

  const needsProof = () => next.totalBullets < PREFERRED_MIN_BULLETS || next.strengthScore < BASE_RESUME_STRENGTH_THRESHOLD;
  const hasCapacity = () => next.totalBullets < HARD_BULLET_CAP && (next.totalBullets < PREFERRED_MAX_BULLETS || next.strengthScore < BASE_RESUME_STRENGTH_THRESHOLD);
  const recompute = () => {
    next.totalBullets = 2 + next.experience.reduce((sum, role) => sum + role.bullets.length, 0) + next.projects.reduce((sum, project) => sum + project.bullets.length, 0);
    next.strengthScore = scoreResumeStrength(next);
  };

  const sourceExperience = {
    ubcsuo: profile.experience[0],
    ubcIT: profile.experience[1],
  };
  const experiencePriorities: Record<"ubcsuo" | "ubcIT", number[]> = {
    ubcsuo: roleType === "finance_ma_equity" ? [0, 1, 3, 2] : roleType === "product" ? [3, 0, 1, 2] : [3, 0, 1, 2],
    ubcIT: roleType === "finance_ma_equity" ? [0, 3, 1, 2] : roleType === "product" ? [3, 1, 0, 2] : [0, 1, 3, 2],
  };

  const ensureExperienceRole = (key: "ubcsuo" | "ubcIT") => {
    const source = sourceExperience[key];
    let target = next.experience.find((role) => role.title === source.title && role.org === source.org);
    if (!target && TWO_EXPERIENCE_ROLES.has(roleType) && hasCapacity()) {
      target = { ...source, dates: source.dates.replace(/\s*[–—]\s*/g, " -- "), bullets: [] };
      next.experience.push(target);
      next.fillReasons.push(`Added ${source.title} because ${roleType} resumes require both professional roles when space permits.`);
    }
    return target;
  };

  const addExperienceBullet = (key: "ubcsuo" | "ubcIT", minimum = 0): boolean => {
    const source = sourceExperience[key];
    const target = ensureExperienceRole(key);
    if (!target || !hasCapacity() || (!needsProof() && target.bullets.length >= minimum)) return false;
    const candidate = experiencePriorities[key].map((index) => source.bullets[index]).find((bullet) => bullet && !target.bullets.includes(bullet));
    if (!candidate) return false;
    target.bullets.push(candidate);
    next.fillReasons.push(`Added ${source.title} fallback proof: ${candidate}`);
    recompute();
    return true;
  };

  const addProjectBullet = (projectIndex: number): boolean => {
    const target = next.projects[projectIndex];
    if (!target || !hasCapacity() || !needsProof()) return false;
    const source = Object.values(RESUME_EVIDENCE).find((evidence) => evidence.name === target.name);
    const candidate = source?.bullets.find((bullet) => !target.bullets.includes(bullet));
    if (!candidate || target.bullets.length >= 4) return false;
    target.bullets.push(candidate);
    next.fillReasons.push(`Added high-signal fallback bullet to ${target.name}: ${candidate}`);
    recompute();
    return true;
  };

  recompute();
  if (!needsProof()) return next;

  // Tier 2 fill order: establish two strong bullets in both professional
  // roles, then deepen the strongest selected projects, then use remaining
  // high-signal professional proof. Tier 3 projects are never introduced here.
  for (const key of ["ubcIT", "ubcsuo"] as const) {
    const target = ensureExperienceRole(key);
    while (target && target.bullets.length < 2 && hasCapacity() && needsProof()) addExperienceBullet(key, 2);
  }
  for (const projectIndex of [0, 1, 2]) {
    const target = next.projects[projectIndex];
    while (target && target.bullets.length < 3 && hasCapacity() && needsProof()) addProjectBullet(projectIndex);
  }
  for (const key of ["ubcIT", "ubcsuo"] as const) {
    while (hasCapacity() && needsProof() && addExperienceBullet(key)) {
      // Continue only while truthful, unused Tier 2 evidence remains.
    }
  }
  return next;
}

// Content-budget check, run BEFORE rendering. Not a real page-layout
// simulator (that needs an actual LaTeX compile, which tailor-resume does
// separately) -- this is the cheap, fast, pre-render check that catches
// the old generator's actual failure mode: dumping unlimited content and
// hoping it fits.
function estimateResumeLength(plan: ResumeContentPlan): { fitsOnePage: boolean; reason?: string } {
  if (plan.totalBullets > 18) return { fitsOnePage: false, reason: `${plan.totalBullets} bullets exceeds the 18-bullet hard cap` };
  if (plan.projects.length > 3) return { fitsOnePage: false, reason: `${plan.projects.length} projects exceeds the 3-project cap` };
  if (plan.skills.length > 4) return { fitsOnePage: false, reason: `${plan.skills.length} skill lines exceeds the 4-line cap` };
  return { fitsOnePage: true };
}

// Shrink order per resume-quality.md: project bullets, then experience
// bullets, then skills lines, then drop the weakest project entirely.
// Mutates a shallow copy, never returns a plan that's still over budget
// without exhausting every step first.
function shrinkToOnePage(plan: ResumeContentPlan): ResumeContentPlan {
  let next = { ...plan, projects: plan.projects.map((p) => ({ ...p, bullets: [...p.bullets] })), experience: plan.experience.map((e) => ({ ...e, bullets: [...e.bullets] })) };

  const recompute = () => {
    next.totalBullets = 2 + next.experience.reduce((s, e) => s + e.bullets.length, 0) + next.projects.reduce((s, p) => s + p.bullets.length, 0);
    next.strengthScore = scoreResumeStrength(next);
  };

  // 1. Reduce project bullets (cap every project at 3, weakest last first)
  if (estimateResumeLength(next).fitsOnePage === false) {
    for (let i = next.projects.length - 1; i >= 0 && next.totalBullets > 18; i--) {
      next.projects[i].bullets = next.projects[i].bullets.slice(0, 3);
      recompute();
    }
  }

  // 2. Reduce experience bullets (cap every role at 2)
  if (next.totalBullets > 18) {
    for (let i = next.experience.length - 1; i >= 0 && next.totalBullets > 18; i--) {
      next.experience[i].bullets = next.experience[i].bullets.slice(0, 2);
      recompute();
    }
  }

  // 3. Compress skills from 4 lines to 3
  if (next.skills.length > 4) next.skills = next.skills.slice(0, 3);

  // 4. Remove the weakest (last) project entirely
  if (next.totalBullets > 18 && next.projects.length > 2) {
    next.projects.pop();
    recompute();
  }

  return next;
}

function resumeSection(title: string, e: (s: string) => string): string {
  return `\\section{${e(title)}}`;
}

function renderResumeLatex(plan: ResumeContentPlan, visibleHeaderLocation = plan.location): string {
  const e = escapeLatex;

  const skillLines = plan.skills.map((s) => `\\textbf{${e(s.label)}:} ${s.items.map(e).join(", ")}\\\\`).join("\n");

  const projectBlocks = plan.projects
    .map((p) => {
      const bullets = p.bullets.map((b) => `  \\resumeItem{${e(b)}}`).join("\n");
      return `\\textbf{${e(p.name)}} $|$ \\textit{${e(p.role)}}
\\begin{itemize}
${bullets}
\\end{itemize}`;
    })
    .join("\n");

  const experienceBlocks = plan.experience
    .map((exp) => {
      const bullets = exp.bullets.map((b) => `  \\resumeItem{${e(b)}}`).join("\n");
      return `\\resumeSubheading{${e(exp.title)}}{${e(exp.location)}}{${e(exp.org)}}{${e(exp.dates)}}
\\begin{itemize}
${bullets}
\\end{itemize}`;
    })
    .join("\n");

  const projectsSection = `${resumeSection("SELECTED PROJECTS", e)}
${projectBlocks}`;
  const experienceSection = `${resumeSection("PROFESSIONAL EXPERIENCE", e)}
${experienceBlocks}`;

  const linkedinHandle = profile.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const showGithub = ["software_developer", "network_it_systems", "ui_ux_frontend"].includes(plan.roleType);
  const contactLine = [visibleHeaderLocation, profile.phone, profile.email, linkedinHandle, ...(showGithub ? [profile.github] : [])]
    .map(e)
    .join(" $|$ ");

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[margin=0.42in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}
\\usepackage[T1]{fontenc}
\\usepackage[english]{babel}
\\usepackage{sourcesanspro}
\\usepackage[usenames,dvipsnames]{color}

\\renewcommand{\\familydefault}{\\sfdefault}
\\pagestyle{empty}
\\color{black}
\\raggedright
\\raggedbottom
\\setlength{\\parindent}{0pt}
\\setlength{\\tabcolsep}{0in}
\\setlist[itemize]{leftmargin=0.15in, itemsep=0pt, topsep=1pt, parsep=0pt, partopsep=0pt}

\\titleformat{\\section}{\\vspace{-8pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{#1}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{1pt}
  \\textbf{#1} \\hfill #2\\\\
  \\textit{#3} \\hfill #4\\\\
  \\vspace{-4pt}
}

\\begin{document}

\\begin{center}
  {\\huge \\textbf{${e(profile.name)}}}\\\\[2pt]
  \\small ${contactLine}
\\end{center}

${resumeSection("EDUCATION", e)}
\\textbf{${e(profile.education.school)}} \\hfill ${e(EDUCATION_LOCATION)}\\\\
\\textit{${e(profile.education.degree)}} \\hfill ${e(profile.education.graduation)}
\\begin{itemize}
  \\resumeItem{\\textbf{Relevant Coursework:} ${e(profile.education.coursework)}}
  \\resumeItem{\\textbf{Professional Development:} ${e(profile.education.professionalDevelopment)}}
\\end{itemize}

${resumeSection("TECHNICAL SKILLS & CORE COMPETENCIES", e)}
${skillLines}

${plan.experienceFirst ? `${experienceSection}\n\n${projectsSection}` : `${projectsSection}\n\n${experienceSection}`}

\\end{document}
`;
}

const RESUME_PROJECT_DUMP_MARKERS = [
  "a directed studies project needed",
  "wanted to apply",
  "explored whether",
  "a research team needed",
  "ubc computer science needed",
  "letting researchers",
  "co built",
  "3 person team",
];
const RESUME_WEAK_VERBS = ["helped", "worked on", "assisted", "participated", "responsible for", "learned", "used "];

export type ResumeAudit = { ok: boolean; violations: string[] };

// Mechanical regression guard mirroring auditCoverLetter() -- checked
// against the plain bullet/skill text the plan produced, not a full LaTeX
// parse or a real page-count (that's tailor-resume's compile-and-verify
// job; this catches content-selection bugs before it ever gets there).
export function auditResumeLatex(latex: string, plan: ResumeContentPlan): ResumeAudit {
  const violations: string[] = [];
  const lower = latex.toLowerCase();

  for (const marker of RESUME_PROJECT_DUMP_MARKERS) {
    if (lower.includes(marker)) violations.push(`Project-dump phrasing detected: "${marker}"`);
  }
  for (const verb of RESUME_WEAK_VERBS) {
    if (new RegExp(`\\\\resumeitem\\{\\\\?[a-z]*\\{?${verb.trim()}`, "i").test(latex.replace(/\\resumeItem/g, "\\resumeitem"))) {
      violations.push(`Weak verb opens a bullet: "${verb.trim()}"`);
    }
  }

  const itemCount = (latex.match(/\\resumeItem\{/g) ?? []).length;
  if (itemCount > 18) violations.push(`${itemCount} bullets exceeds the 18-bullet hard cap`);
  if (itemCount < 12) violations.push(`${itemCount} bullets is below the 12-bullet minimum`);

  if (plan.projects.length > 3) violations.push(`${plan.projects.length} selected projects exceeds the 3-project cap`);
  for (const p of plan.projects) {
    if (p.bullets.length > 4) violations.push(`Project "${p.name}" has ${p.bullets.length} bullets, exceeds the 4-bullet cap`);
  }
  if (plan.skills.length > 4) violations.push(`${plan.skills.length} skill lines exceeds the 4-line cap`);

  if (/\|\s*-\s*\$?\|/.test(latex) || / - \$\|/.test(latex)) violations.push("Malformed project title (trailing ' - |')");
  if (!latex.includes("margin=0.42in")) violations.push("Missing the compact 0.42in margin");
  if (latex.includes("https://")) violations.push("Header contains a full https:// URL instead of a bare handle");
  if (!latex.includes("\\usepackage{sourcesanspro}")) violations.push("Missing sourcesanspro");
  if (/May 2025\s+Apr 2026/.test(latex)) violations.push("Date range is missing a visible separator");

  return { ok: violations.length === 0, violations };
}

export function generateResumeLatex(input: GenInput): { latex: string; projectsUsed: string[]; plan: ResumeContentPlan } {
  let plan = buildResumeContentPlan(input);
  plan = fillResumeToBaseStrength(plan, plan.roleType, input.jobDescription);

  if (!estimateResumeLength(plan).fitsOnePage) {
    plan = shrinkToOnePage(plan);
  }

  const selectedLocation = selectApplicationLocation(input.jobDescription);
  const visibleHeaderLocation = input.includeFullAddress && selectedLocation.fullAddress ? selectedLocation.fullAddress : plan.location;
  const latex = renderResumeLatex(plan, visibleHeaderLocation);

  const audit = auditResumeLatex(latex, plan);
  if (!audit.ok) {
    throw new Error(`Resume failed quality audit: ${audit.violations.join("; ")}`);
  }

  return { latex, projectsUsed: plan.projects.map((p) => p.name), plan };
}

// ============================================================================
// Cover letter engine
//
// Deliberately NOT an LLM call -- this is a deterministic template/evidence
// selector, same spirit as selectProjects() above. classifyRole() scores a
// fixed set of keyword rules against the job title/description, that role
// type picks which pre-written evidence blocks go into paragraphs 2 and 3
// and which metrics inside them get \textbf{}'d, and a fixed skill-bridge
// table handles the "JD wants a tool I don't have" case without ever
// admitting a gap. auditCoverLetter() is a regression guard, not a retry
// loop -- there's no generation step to retry, so a violation means the
// template construction itself has a bug and should throw immediately
// rather than ship a bad letter.
//
// Cover letters do NOT depend on generate_resume or selectProjects -- they
// have their own evidence bank below, richer than the resume's fixed
// 1-3-project resume pool, because a cover letter only ever needs one or two
// pieces of proof, not a full page of them.
// ============================================================================

type RoleType =
  | "bi_data_analyst"
  | "product"
  | "automation_productops"
  | "strategy_ops_consulting"
  | "finance_ma_equity"
  | "nonprofit_climate_program"
  | "network_it_systems"
  | "marketing_growth";

type RoleRule = { type: RoleType; keywords: string[] };

// Order doesn't matter -- classifyRole scores every rule and takes the
// highest total. Keyword weight is just its own length, so a longer, more
// specific phrase ("business intelligence") outweighs a short generic one
// ("crm") without needing a separate weight table.
const ROLE_RULES: RoleRule[] = [
  {
    type: "bi_data_analyst",
    keywords: [
      "business intelligence", "data analyst", "power bi", "tableau", "sql",
      "reporting analyst", "data quality", "dashboards", "dashboard",
      "bi analyst", "stakeholder reporting", "data reporting",
    ],
  },
  {
    type: "product",
    keywords: [
      "product manager", "product analyst", "associate product manager",
      "product owner", "product management", "apm",
    ],
  },
  {
    type: "automation_productops",
    keywords: [
      "automation", "revops", "product operations", "product ops",
      "ai ops", "workflow automation", "process automation", "zapier",
      "no-code", "low-code",
    ],
  },
  {
    type: "strategy_ops_consulting",
    keywords: [
      "strategy", "operations analyst", "business operations", "consultant",
      "consulting", "management consultant", "business analyst",
    ],
  },
  {
    type: "finance_ma_equity",
    keywords: [
      "equity analyst", "investment analyst", "financial analyst", "m&a",
      "mergers and acquisitions", "portfolio management", "finance analyst",
      "investment banking", "valuation",
    ],
  },
  {
    type: "nonprofit_climate_program",
    keywords: [
      "nonprofit", "non-profit", "climate", "program associate",
      "program coordinator", "public sector", "grant", "policy associate",
      "sustainability", "community organization",
    ],
  },
  {
    type: "network_it_systems",
    keywords: [
      "network administrator", "it support", "systems administrator",
      "help desk", "servicenow", "it analyst", "network engineer",
      "desktop support", "itsm",
    ],
  },
  {
    type: "marketing_growth",
    keywords: [
      "marketing", "growth", "customer analytics", "brand", "social media",
      "digital marketing", "content strategy", "audience",
    ],
  },
];

// Title matches count double -- a posted job title is a deliberate,
// low-noise signal ("Product Analyst"), while the JD body can contain
// tangential phrases (e.g. "product requirements gathering" inside a
// product posting) that would otherwise outscore a direct title match
// just by being a longer keyword string. Caught via a real sample: a
// "Product Analyst" JD mentioning "requirements gathering" once in the
// body was classifying as business_systems_analyst instead of product
// before this fix.
export function classifyRole(jobTitle: string, jobDescription: string): { type: RoleType; confidence: number } {
  const title = jobTitle.toLowerCase();
  const description = jobDescription.toLowerCase();
  let best: { type: RoleType; score: number } | null = null;
  for (const rule of ROLE_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (title.includes(kw)) score += kw.length * 2;
      else if (description.includes(kw)) score += kw.length;
    }
    if (score > 0 && (!best || score > best.score)) best = { type: rule.type, score };
  }
  // No signal at all -- default to the richest, most broadly-applicable
  // evidence pairing (ServiceNow/incident-response scale + a delivered
  // product with hard metrics) rather than the vaguest one.
  return { type: best?.type ?? "bi_data_analyst", confidence: best?.score ?? 0 };
}

type EvidenceBlock = {
  // Plain prose, already LaTeX-safe (hand-authored, not run through
  // escapeLatex -- these are fixed strings we control, and escapeLatex
  // would double-escape the \% / \$ already baked in below).
  text: string;
  // Exact substrings within `text`, strongest first, that are candidates
  // for \textbf{}. A role's evidence plan picks which of these actually
  // get bolded for that letter.
  metrics: string[];
};

const PROFESSIONAL_EVIDENCE = {
  ubcIT: {
    text: "At the University of British Columbia's IT department, I supported enterprise systems serving 12,000+ students and staff and resolved 110+ daily ServiceNow incidents against strict SLA requirements. Trend analysis exposed the most common failures, and I partnered with UBC Vancouver engineering to redesign the workflows behind them. I then rebuilt knowledge base KB0019190 in clear, student-facing language, cutting related incidents by 70\\%. I also supported a Microsoft 365 migration and AI chatbot rollout, including the end-user documentation needed for adoption.",
    metrics: ["110+ daily ServiceNow incidents", "12,000+ students and staff", "70\\%"],
  },
  ubcsuo: {
    text: "As Director at the UBC Students' Union, I own analytics reporting and digital strategy for a \\$1.9M operating budget funding 150+ student organizations. I built board-level dashboards that give leadership direct visibility into technology and operations outcomes. Through policy committee work, I also helped update the SC14 Information Systems and SC11 Wireless Network policies, while coordinating finance, procurement, and technology workflows across five standing committees and \\$370,000+ in annual club and association funding.",
    metrics: ["\\$1.9M operating budget", "150+ student organizations", "70,000+ students", "\\$370,000+ in annual club and association funding"],
  },
} satisfies Record<string, EvidenceBlock>;

const PROJECT_EVIDENCE = {
  taAllocation: {
    text: "I led backend delivery of TA Allocation, a full-stack platform that processes 250+ applications per term, replacing a manual spreadsheet workflow. With a 6-member Agile team, I translated coordinator needs into 36+ features covering scheduling, conflict detection, and role-based access. The platform shipped through a Docker-based CI/CD pipeline with 100\\% test coverage and a 95\\% pass rate across 50 tests. It cut allocation processing time by 70\\%, reducing a multi-day task to a few hours each term.",
    metrics: ["250+ applications per term", "36+ features", "100\\% test coverage", "95\\% pass rate across 50 unit and integration tests", "70\\%"],
  },
  tsxPortfolio: {
    text: "For a quantitative finance project, I led a 3-person team building an automated pipeline over 37 months of TSX equity data, computing log returns and an 11 by 11 covariance matrix to model asset risk, then implementing Markowitz portfolio optimization to generate the efficient frontier. I automated the entire data extraction and validation workflow in Excel and Python for reproducibility, and the team's results placed in the top 5 of the class.",
    metrics: ["37 months of TSX equity data", "11 by 11 covariance matrix"],
  },
  venueWorks: {
    text: "As Co-Founder and Product Lead of VenueWorks, I benchmarked 300+ local properties against competitors like Peerspace, LiquidSpace, and Giggster and identified \\$5M+ in idle annual venue capacity in the local market, then built the commission-plus-premium-listing revenue model and investor pitch that placed 2nd place and \\$1,500 in funding at UBC's Odlum Brown Entrepreneur Boot Camp.",
    metrics: ["300+ local properties", "\\$5M+ in idle annual venue capacity", "2nd place and \\$1,500 in funding"],
  },
  calmora: {
    text: "I ran Calmora as a Wizard-of-Oz MVP test for a services marketplace, building Python automation for outreach, scraping, and data cleaning, coordinating the workflow through Discord-based command control and logging, and validating early demand signals directly with prospective users in Vancouver and Calgary through cold outreach and Reddit research.",
    metrics: [],
  },
  socialMedia: {
    text: "Across the digital brands I've run content strategy for, I've driven 4M+ organic views, including growing one TikTok account to 2M+ organic views within a year and building another from zero to 10K+ views, using trend analysis, hook testing, and audience analytics instead of paid spend.",
    metrics: ["4M+ organic views", "2M+ organic views", "10K+ views"],
  },
  eyeTracking: {
    text: "I co-built a Python ETL pipeline that turned raw Tobii Pro Glasses 3 gaze, pupil, and IMU streams into structured fixation timelines, heatmaps, and attention metrics, then packaged the output into a self-service Flask/Dash dashboard so researchers could review recordings and regenerate analyses without writing code.",
    metrics: [],
  },
} satisfies Record<string, EvidenceBlock>;

type RoleEvidencePlan = {
  professionalKey: keyof typeof PROFESSIONAL_EVIDENCE;
  projectKey: keyof typeof PROJECT_EVIDENCE;
  professionalMetrics: string[];
  projectMetrics: string[];
};

// Per-role evidence pairing and which of that evidence's metrics get
// \textbf{}'d -- always totals 2-4 across the letter (auditCoverLetter
// enforces this as a hard check, not just a design intent).
const ROLE_EVIDENCE_PLAN: Record<RoleType, RoleEvidencePlan> = {
  bi_data_analyst: {
    professionalKey: "ubcIT",
    projectKey: "taAllocation",
    professionalMetrics: ["110+ daily ServiceNow incidents", "12,000+ students and staff"],
    projectMetrics: ["250+ applications per term", "70\\%"],
  },
  product: {
    professionalKey: "ubcsuo",
    projectKey: "taAllocation",
    professionalMetrics: ["\\$1.9M operating budget"],
    projectMetrics: ["250+ applications per term", "36+ features"],
  },
  automation_productops: {
    professionalKey: "ubcIT",
    projectKey: "calmora",
    professionalMetrics: ["110+ daily ServiceNow incidents"],
    projectMetrics: [],
  },
  strategy_ops_consulting: {
    professionalKey: "ubcsuo",
    projectKey: "taAllocation",
    professionalMetrics: ["\\$1.9M operating budget", "150+ student organizations"],
    projectMetrics: ["70\\%", "36+ features"],
  },
  finance_ma_equity: {
    professionalKey: "ubcsuo",
    projectKey: "tsxPortfolio",
    professionalMetrics: ["\\$1.9M operating budget"],
    projectMetrics: ["37 months of TSX equity data", "11 by 11 covariance matrix"],
  },
  nonprofit_climate_program: {
    professionalKey: "ubcsuo",
    projectKey: "venueWorks",
    professionalMetrics: ["150+ student organizations", "70,000+ students"],
    projectMetrics: ["\\$5M+ in idle annual venue capacity", "300+ local properties"],
  },
  network_it_systems: {
    professionalKey: "ubcIT",
    projectKey: "taAllocation",
    professionalMetrics: ["12,000+ students and staff", "70\\%"],
    projectMetrics: ["250+ applications per term"],
  },
  marketing_growth: {
    professionalKey: "ubcsuo",
    projectKey: "socialMedia",
    professionalMetrics: [],
    projectMetrics: ["4M+ organic views", "2M+ organic views", "10K+ views"],
  },
};

// Bolds the given metric substrings (first occurrence only, in the order
// given) inside `text`. Pure string replacement -- no LLM, no rewriting.
export function boldMetrics(text: string, metrics: string[]): string {
  let result = text;
  for (const metric of metrics) {
    const idx = result.indexOf(metric);
    if (idx === -1) continue;
    const hasLeadingSpace = idx > 0 && /\s/.test(result[idx - 1]);
    const start = hasLeadingSpace ? idx - 1 : idx;
    const boldedMetric = hasLeadingSpace ? `\\textbf{\\space ${metric}}` : `\\textbf{${metric}}`;
    result = result.slice(0, start) + boldedMetric + result.slice(idx + metric.length);
  }
  return result;
}

function buildProfessionalProof(roleType: RoleType): string {
  const plan = ROLE_EVIDENCE_PLAN[roleType];
  const block = PROFESSIONAL_EVIDENCE[plan.professionalKey];
  return boldMetrics(block.text, plan.professionalMetrics);
}

function buildProjectProof(roleType: RoleType): string {
  const plan = ROLE_EVIDENCE_PLAN[roleType];
  const block = PROJECT_EVIDENCE[plan.projectKey];
  return boldMetrics(block.text, plan.projectMetrics);
}

type CoverLetterEvidenceSelection = {
  opening: string;
  professionalProof: string;
  projectProof: string;
  skillBridge: string | null;
  closing: string;
  professionalKey: keyof typeof PROFESSIONAL_EVIDENCE;
  projectKey: keyof typeof PROJECT_EVIDENCE;
  fillReasons: string[];
};

const SUPPORTING_COVER_LETTER_PROOF: Record<RoleType, { text: string; metrics: string[]; source: string }> = {
  automation_productops: {
    text: "The same approach shaped the TA Allocation platform. 250+ applications per term moved from spreadsheet handling into a structured system spanning 36+ features; the result reduced processing time by 70\\%. This matters in product operations because automation only creates value when the surrounding workflow, ownership, and handoffs become clearer too.",
    metrics: ["250+ applications per term"],
    source: "TA Allocation quantified workflow replacement",
  },
  bi_data_analyst: {
    text: "I bring the same reporting discipline to UBCSUO, where I built board-level dashboards that supported technology and operations decisions tied to a \\$1.9M operating budget. That experience reinforced that useful BI is not just accurate; it gives stakeholders a shared definition of performance and a practical next action.",
    metrics: [],
    source: "UBCSUO dashboard and governance proof",
  },
  product: {
    text: "My Eye-Tracking research work adds another product lens: I transformed raw gaze, pupil, and motion data into structured behavior metrics and a self-service dashboard researchers could use without writing code. It strengthened how I connect user behavior, product questions, and evidence-based prioritization for usability and delivery tradeoffs.",
    metrics: [],
    source: "Eye-Tracking user-behavior analytics",
  },
  finance_ma_equity: {
    text: "VenueWorks added a market-sizing perspective: I identified \\$5M+ in idle annual venue capacity and benchmarked 300+ properties to test pricing assumptions. That required the same investment-analysis discipline: define the market, challenge assumptions, and turn incomplete information into a defensible recommendation.",
    metrics: ["\\$5M+ in idle annual venue capacity"],
    source: "VenueWorks market sizing and benchmarking",
  },
  strategy_ops_consulting: {
    text: "At UBC IT, I applied that same structured approach to recurring service failures, using incident trends to prioritize workflow changes and a knowledge-base rebuild that reduced related incidents by 70\\%. The common thread is moving from symptoms to a measurable operating fix.",
    metrics: [],
    source: "UBC IT process-improvement proof",
  },
  marketing_growth: {
    text: "VenueWorks complements that audience work with commercial validation: I benchmarked 300+ properties, tested positioning against established marketplaces, and translated the findings into pricing and market-entry assumptions. It shows how I connect attention metrics to an underlying customer and business decision.",
    metrics: [],
    source: "VenueWorks market-validation proof",
  },
  nonprofit_climate_program: {
    text: "Across that work, the practical lesson has been that mission outcomes depend on clear funding rules, accountable reporting, and decisions stakeholders can understand. I would bring that same discipline to program delivery, where credibility matters as much as intent.",
    metrics: [],
    source: "funding-governance relevance bridge",
  },
  network_it_systems: {
    text: "I also supported a Microsoft 365 migration and AI chatbot rollout, including user testing and documentation needed for adoption. That experience reinforced that reliable systems work includes change management and clear user handoffs, not only the technical implementation.",
    metrics: [],
    source: "M365 and AI chatbot adoption proof",
  },
};

const ROLE_IMPACT_BRIDGES: Record<RoleType, string> = {
  automation_productops: "Together, these examples show how I approach product operations: identify repeated friction, make the workflow observable, automate the right steps, and measure whether the new process actually improves delivery.",
  bi_data_analyst: "Together, these experiences have taught me to treat reporting as an operating system for decisions: definitions must be consistent, data must be trustworthy, and the final dashboard must answer a real stakeholder question.",
  product: "Together, these projects show how I work as a product analyst: start with the user and operating constraint, translate both into measurable requirements, and use evidence to decide what should be built next.",
  finance_ma_equity: "Together, these experiences have trained me to connect quantitative analysis with business context, validate assumptions carefully, and communicate the reasoning behind a recommendation rather than presenting a model in isolation.",
  strategy_ops_consulting: "Together, these examples reflect how I approach ambiguous operating problems: establish the evidence, identify the highest-leverage constraint, and translate the analysis into an implementable sequence of decisions.",
  marketing_growth: "Together, these examples show how I connect audience behavior, experimentation, and commercial context instead of treating reach as an outcome on its own.",
  nonprofit_climate_program: "That combination of governance, funding awareness, and measurable delivery is the perspective I would bring to mission-driven program work.",
  network_it_systems: "Together, these experiences show a systems approach grounded in reliability, user impact, documented handoffs, and continuous improvement.",
};

const ROLE_STRENGTH_EXTENSIONS: Record<RoleType, string> = {
  automation_productops: "The value I would bring is practical follow-through: tracing an operational problem from repeated friction through implementation, adoption, and a measurable result that operators can keep using after launch.",
  bi_data_analyst: "The value I would bring is reporting that remains technically sound while staying clear enough for leaders to use in day-to-day decisions, prioritization discussions, and follow-up operating reviews. That balance is what keeps analysis connected to action after the dashboard is delivered.",
  product: "The value I would bring is disciplined product judgment grounded in user evidence, delivery constraints, and measurable outcomes rather than feature volume alone, especially when teams need clarity under ambiguity.",
  finance_ma_equity: "The value I would bring is careful analytical work paired with concise communication about assumptions, tradeoffs, and the business consequence of the model, so recommendations stay both rigorous and usable.",
  strategy_ops_consulting: "The value I would bring is a practical link between analysis and execution, with clear ownership, measurable outcomes, and communication that keeps stakeholders aligned through implementation.",
  marketing_growth: "The value I would bring is an experimental mindset that connects audience signals to positioning, customer behavior, and a measurable commercial objective instead of optimizing isolated channel metrics.",
  nonprofit_climate_program: "The value I would bring is disciplined program execution that respects funding constraints while keeping stakeholder trust and measurable mission outcomes in view across partners, timelines, and reporting.",
  network_it_systems: "The value I would bring is reliable execution that connects technical operations with clear documentation, user adoption, and measurable service improvement in environments where uptime matters.",
};

function proseWordCount(text: string): number {
  return text.replace(/\\[A-Za-z]+(?:\{[^}]*\})?/g, " ").split(/\s+/).filter(Boolean).length;
}

const COVER_LETTER_MINIMUM_STRENGTH_SENTENCE =
  "That is the standard I would bring to the role: evidence-backed work that improves the operating rhythm, not just the written deliverable.";

function coverLetterWordCount(selection: CoverLetterEvidenceSelection): number {
  return [selection.opening, selection.professionalProof, selection.projectProof, selection.skillBridge, selection.closing]
    .filter((paragraph): paragraph is string => Boolean(paragraph))
    .join(" ")
    .replace(/\\[A-Za-z]+(?:\{[^}]*\})?/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function fillCoverLetterToStrength(
  roleType: RoleType,
  _jobDescription: string,
  selectedEvidence: CoverLetterEvidenceSelection,
): CoverLetterEvidenceSelection {
  const filled = { ...selectedEvidence, fillReasons: [...selectedEvidence.fillReasons] };
  const directPlan = ROLE_EVIDENCE_PLAN[roleType];
  const directProjectMetrics = PROJECT_EVIDENCE[directPlan.projectKey].metrics.length;
  const currentMetrics = (filled.professionalProof.match(/\d[\d,.]*(?:\+|\%|M|K| months?| features?| applications?)/g) ?? []).length
    + (filled.projectProof.match(/\d[\d,.]*(?:\+|\%|M|K| months?| features?| applications?)/g) ?? []).length;
  const needsSupport = coverLetterWordCount(filled) < 330 || directProjectMetrics === 0 || currentMetrics < 3;

  if (needsSupport) {
    const support = SUPPORTING_COVER_LETTER_PROOF[roleType];
    const renderedSupport = boldMetrics(support.text, support.metrics);
    const appendToProject = proseWordCount(filled.projectProof) + proseWordCount(renderedSupport) <= 110;
    const candidate = appendToProject
      ? { ...filled, projectProof: `${filled.projectProof} ${renderedSupport}` }
      : { ...filled, skillBridge: `${renderedSupport} ${filled.skillBridge ?? ""}`.trim() };
    if (coverLetterWordCount(candidate) <= 430) {
      filled.projectProof = candidate.projectProof;
      filled.skillBridge = candidate.skillBridge;
      filled.fillReasons.push(`Added ${support.source} because the direct letter was under-strength.`);
    }
  }

  if (!filled.skillBridge) {
    filled.skillBridge = ROLE_IMPACT_BRIDGES[roleType];
    filled.fillReasons.push("Added a role-impact bridge to explain why the selected evidence matters.");
  }

  if (coverLetterWordCount(filled) < 300) {
    const extension = ROLE_STRENGTH_EXTENSIONS[roleType];
    if (coverLetterWordCount({ ...filled, skillBridge: `${filled.skillBridge ?? ""} ${extension}` }) <= 430) {
      filled.skillBridge = `${filled.skillBridge ?? ""} ${extension}`.trim();
      filled.fillReasons.push("Expanded the role bridge with a role-specific value statement to meet the 300-word minimum.");
    }
  }
  if (coverLetterWordCount(filled) < 300) {
    const candidate = {
      ...filled,
      skillBridge: `${filled.skillBridge ?? ""} ${COVER_LETTER_MINIMUM_STRENGTH_SENTENCE}`.trim(),
    };
    if (coverLetterWordCount(candidate) <= 430) {
      filled.skillBridge = candidate.skillBridge;
      filled.fillReasons.push("Added one final relevance sentence to keep the cover letter above the minimum strength floor.");
    }
  }
  return filled;
}

// One "operating problem" fragment per role type, dropped into the
// preferred opening pattern below. This is what keeps the opening from
// being generic without needing an LLM to invent it per company -- the
// fragment is role-specific, the company/title/referral/whyThem are
// caller-specific, so the sentence as a whole is not identical across
// letters even though the scaffolding is fixed.
const MISSION_REASONS: Record<RoleType, string> = {
  bi_data_analyst: "the role focuses on turning operational data into dashboards and reporting that leaders can actually use",
  product: "the role connects user needs, product decisions, and measurable execution",
  automation_productops: "the role sits at the intersection I enjoy most: improving workflows, reducing manual work, and building cleaner operating systems",
  strategy_ops_consulting: "the role turns complex operating problems into clear, well-sequenced decisions",
  finance_ma_equity: "the role turns market research, financial data, and business judgment into clearer investment decisions",
  nonprofit_climate_program: "the role connects mission-driven work with the operational discipline needed to deliver measurable public outcomes",
  network_it_systems: "the role focuses on keeping complex systems reliable for the people who depend on them every day",
  marketing_growth: "the role connects audience data with a content and growth strategy that compounds without paid spend",
};

function buildMissionBridge(
  input: { company: string; jobTitle: string; whyThem?: string; referralContext?: string },
  roleType: RoleType,
): string {
  const e = escapeLatex;
  const company = e(input.company);
  const reason = MISSION_REASONS[roleType];
  const referral = input.referralContext ? ` ${e(input.referralContext)}` : "";
  const extra = input.whyThem ? ` ${e(input.whyThem)}` : "";
  const biBridge = roleType === "bi_data_analyst" ? " What draws me to this work is the chance to make information genuinely useful to decision-makers." : "";
  return `${company} stands out to me because ${reason}.${biBridge}${referral} That is the kind of work I have consistently moved toward: using data, systems, and stakeholder coordination to turn complex operations into clearer decisions and measurable improvement.${extra}`;
}

// Tool/industry-specific bridges -- exact sentences so a JD asking for a
// tool Aaditya's strongest experience isn't in never gets a direct
// admission of the gap, only a transfer story. Checked before the
// role-based certification bridges below, since a JD naming a specific
// tool is a stronger, more specific signal than the role classification.
const SKILL_BRIDGES: { pattern: RegExp; text: string }[] = [
  {
    pattern: /power\s*bi/i,
    text: "My strongest dashboarding experience has been with Tableau, Excel, and custom reporting tools, and the underlying skills transfer directly to Power BI: clean data models, consistent KPI definitions, visualization logic, and stakeholder-focused reporting.",
  },
  {
    pattern: /salesforce|\bcrm\b|\bcdp\b/i,
    text: "My experience with ServiceNow workflows, Adobe Experience Platform concepts, and structured stakeholder reporting gives me a strong foundation for CRM data quality, user records, and customer data workflows.",
  },
  {
    pattern: /\baws\b|amazon web services/i,
    text: "My experience with Docker, backend systems, data pipelines, and deployment workflows gives me a strong base to ramp quickly into AWS-based environments.",
  },
  {
    pattern: /airline|network schedul|crew schedul|route network/i,
    text: "The strongest transfer from my background is constraint-based operational thinking: balancing capacity, availability, urgency, tradeoffs, and stakeholder needs in systems where reliability matters.",
  },
];

const ZAPIER_BRIDGE = "My Zapier automation and AI agent training, combined with Python workflow experience, gives me a strong foundation for identifying repeatable processes and replacing manual steps with lightweight automation.";
const ADOBE_BI_BRIDGE = "My Adobe Experience Platform and Customer Journey Analytics training complements my hands-on dashboarding experience by giving me stronger context in customer data, segmentation, journey analysis, and digital reporting.";
const ADOBE_MARKETING_BRIDGE = "My Adobe Experience Platform, Customer Journey Analytics, and Google Analytics 4 training gives me formal grounding in the segmentation and journey-analysis concepts behind the organic growth work I have run directly.";
const NONPROFIT_BRIDGE = "My Fundraising Essentials and Grant Seeking Essentials training from NonprofitReady sharpens how I think about funding structures and grant strategy, which complements the budget and funding-allocation work I already do at UBCSUO.";
const FINANCE_CERT_BRIDGE = "My Bloomberg Market Concepts certification and coursework in investments and finance ground the portfolio work above in the same market fundamentals professional analysts use daily.";
const GENERIC_TRANSFER_BRIDGE = "The strongest transfer from my background is the operating problem itself: data quality, stakeholder coordination, workflow design, and measurable improvement.";

// Returns null when no bridge is needed -- paragraph 4 is genuinely
// optional (per the "only if needed" rule), not a slot that must always
// be filled with something.
function buildSkillBridge(jobDescription: string, roleType: RoleType, confidence: number): string | null {
  for (const bridge of SKILL_BRIDGES) {
    if (bridge.pattern.test(jobDescription)) return bridge.text;
  }
  if (/\bzapier\b|workflow automation|process automation/i.test(jobDescription)) return ZAPIER_BRIDGE;

  if (roleType === "automation_productops") return ZAPIER_BRIDGE;
  if (roleType === "bi_data_analyst" && /customer analytics|digital reporting|journey analytics/i.test(jobDescription)) {
    return ADOBE_BI_BRIDGE;
  }
  if (roleType === "marketing_growth") return ADOBE_MARKETING_BRIDGE;
  if (roleType === "nonprofit_climate_program") return NONPROFIT_BRIDGE;
  if (roleType === "finance_ma_equity") return FINANCE_CERT_BRIDGE;

  // Nothing else matched and the role classifier itself found no real
  // signal in the JD -- this is the "JD asks for industry experience I
  // don't have as my strongest direct experience" case the generic bridge
  // exists for.
  if (confidence === 0) return GENERIC_TRANSFER_BRIDGE;

  return null;
}

function buildClosing(company: string): string {
  const e = escapeLatex;
  return `I would welcome a conversation about how I can help ${e(company)} turn evidence, stakeholder needs, and execution discipline into work the team can use immediately.`;
}

const BANNED_OPENINGS = [
  "i am writing to express my interest",
  "i am excited to submit my application",
  "as a recent graduate",
  "i believe i would be a great fit",
];

const BANNED_WEAK_LANGUAGE = [
  "could still be a fit",
  "my current trajectory",
  "despite my lack of",
  "although i do not have",
  "while i may not have",
  "i am early in my career",
  "i hope to be considered",
  "i lack",
  "i do not know",
  "i have no experience",
  "i am a fast learner",
  "i would be a great fit",
  "i am passionate",
  "i hope",
];

// Signatures of the old task/approach/impact dump this rewrite removes --
// kept here as a regression guard even though the new evidence bank is
// hand-authored prose that should never produce these on its own.
const PROJECT_DUMP_MARKERS = [
  "a directed studies project needed",
  "wanted to apply",
  "explored whether",
  "a research team needed",
  "ubc computer science needed",
  "a team project aimed",
];

export type CoverLetterAudit = { ok: boolean; violations: string[] };

// Regression guard, not a retry loop: there is no generation step here to
// retry against, so a violation means the deterministic template
// construction has a real bug and should surface immediately rather than
// silently ship a bad letter.
export function auditCoverLetter(text: string, companyName?: string, enforceStrength = false): CoverLetterAudit {
  const lower = text.toLowerCase();
  const violations: string[] = [];

  for (const phrase of BANNED_OPENINGS) {
    if (lower.includes(phrase)) violations.push(`Banned opening phrase: "${phrase}"`);
  }
  for (const phrase of BANNED_WEAK_LANGUAGE) {
    if (lower.includes(phrase)) violations.push(`Banned weak-language phrase: "${phrase}"`);
  }
  for (const marker of PROJECT_DUMP_MARKERS) {
    if (lower.includes(marker)) violations.push(`Project-dump phrasing detected: "${marker}"`);
  }

  const boldCount = (text.match(/\\textbf\{/g) ?? []).length;
  if (boldCount < 2) violations.push(`Only ${boldCount} bolded metric(s) found -- need at least 2`);
  if (boldCount > 4) violations.push(`${boldCount} bolded metrics found -- must not exceed 4`);

  if (companyName && !lower.includes(companyName.toLowerCase())) {
    violations.push("Company name not found in letter body -- missing mission/company bridge");
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (enforceStrength && wordCount < 300) violations.push(`Body is ${wordCount} words -- below the 300-word minimum`);
  if (wordCount > 450) violations.push(`Body is ${wordCount} words -- exceeds the 450-word hard cap`);
  const paragraphCount = text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length;
  if (enforceStrength && (paragraphCount < 5 || paragraphCount > 6)) violations.push(`Body has ${paragraphCount} paragraphs -- expected 5 by default, 6 only for broad roles`);
  for (const paragraph of text.split(/\n\s*\n/)) {
    const paragraphWords = paragraph.split(/\s+/).filter(Boolean).length;
    if (paragraphWords > 115) violations.push(`Paragraph is ${paragraphWords} words -- split or tighten it`);
  }

  return { ok: violations.length === 0, violations };
}

export function generateCoverLetterLatex(
  input: GenInput & {
    hiringManager?: string;
    recipientLines?: string[];
    referralContext?: string;
    jobId?: string;
    whyThem?: string;
  },
): string {
  const e = escapeLatex;
  const { type: roleType, confidence } = classifyRole(input.jobTitle, input.jobDescription);

  const greeting = input.hiringManager ? `Dear ${e(input.hiringManager)},` : "Dear Hiring Manager,";
  const reLine = input.jobId
    ? `Re: ${e(input.jobTitle)} -- Job ID ${e(input.jobId)}`
    : `Re: ${e(input.jobTitle)}`;

  const recipientBlock = input.recipientLines?.length
    ? `\\begin{flushleft}\n${input.recipientLines.map(e).join("\\\\\n")}\n\\end{flushleft}\n\\vspace{8pt}\n`
    : "";

  const para1 = buildMissionBridge(input, roleType);
  const directPlan = ROLE_EVIDENCE_PLAN[roleType];
  const selectedEvidence = fillCoverLetterToStrength(roleType, input.jobDescription, {
    opening: para1,
    professionalProof: buildProfessionalProof(roleType),
    projectProof: buildProjectProof(roleType),
    skillBridge: buildSkillBridge(input.jobDescription, roleType, confidence),
    closing: buildClosing(input.company),
    professionalKey: directPlan.professionalKey,
    projectKey: directPlan.projectKey,
    fillReasons: [],
  });

  const bodyParas = [selectedEvidence.opening, selectedEvidence.professionalProof, selectedEvidence.projectProof, selectedEvidence.skillBridge, selectedEvidence.closing]
    .filter((paragraph): paragraph is string => Boolean(paragraph));

  // Audit against the *escaped* company name -- the body text it's
  // checking against is already LaTeX-escaped, so a raw name containing
  // "&"/"#"/"$" etc. would never match otherwise.
  const audit = auditCoverLetter(bodyParas.join("\n\n"), e(input.company), true);
  if (!audit.ok) {
    throw new Error(`Cover letter failed quality audit: ${audit.violations.join("; ")}`);
  }
  const linkedinHandle = profile.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const selectedLocation = selectApplicationLocation(input.jobDescription);
  const visibleLocation = input.includeFullAddress && selectedLocation.fullAddress ? selectedLocation.fullAddress : selectedLocation.cityProvince;

  const latex = `\\documentclass[10.5pt,letterpaper]{article}
\\usepackage[margin=0.68in]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fontspec}
\\usepackage[usenames,dvipsnames]{color}
\\setmainfont{Source Sans 3}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.65em}
\\color{black}
\\sloppy
\\emergencystretch=3em
\\hyphenpenalty=10000
\\exhyphenpenalty=10000

\\begin{document}

\\begin{flushleft}
{\\Large \\textbf{${e(profile.name)}}}\\\\
${e(visibleLocation)} \\quad $\\vert$ \\quad ${e(profile.phone)} \\quad $\\vert$ \\quad ${e(profile.email)} \\quad $\\vert$ \\quad ${e(linkedinHandle)}
\\end{flushleft}

\\vspace{8pt}

${recipientBlock}
\\textbf{${reLine}}

\\vspace{8pt}

${greeting}

${bodyParas.join("\n\n")}

Sincerely,\\\\
${e(profile.name)}

\\end{document}
`;

  return latex;
}
