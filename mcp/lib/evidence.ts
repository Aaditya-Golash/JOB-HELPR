export type ResumeProjectKey =
  | "taAllocation"
  | "tsxPortfolio"
  | "eyeTracking"
  | "venueWorks"
  | "socialMedia"
  | "calmora"
  | "helpR";

export type ResumeEvidence = {
  name: string;
  type: "project";
  role: string;
  tags: string[];
  tools: string[];
  metrics: string[];
  bullets: string[];
  evidenceNotes: string;
  strength: 1 | 2 | 3 | 4 | 5;
  roleRelevance: string[];
};

// Reusable, resume-ready evidence only. Raw task/approach descriptions remain
// in profile.ts for reference and must never be rendered directly.
export const RESUME_EVIDENCE: Record<ResumeProjectKey, ResumeEvidence> = {
  taAllocation: {
    name: "TA Allocation & Management System",
    type: "project",
    role: "Backend Lead, Product Delivery",
    tags: ["product", "automation", "systems", "data"],
    tools: ["Flask", "MySQL", "Docker", "GitHub"],
    metrics: ["250+ applications", "36+ features", "100% test coverage", "70% faster"],
    bullets: [
      "Delivered a full-stack allocation platform (Flask, MySQL) replacing a manual process, handling 250+ TA applications per term",
      "Defined product requirements and maintained a backlog of 36+ features covering scheduling, conflict resolution, and role-based access",
      "Ran sprint planning with a 6-member Agile team, shipping through a Docker CI/CD pipeline with 100% test coverage",
      "Cut TA assignment processing time by 70%, reducing coordinator workload from multiple days to a few hours per term",
    ],
    evidenceNotes: "Delivered for UBC Computer Science; use only the verified metrics above.",
    strength: 5,
    roleRelevance: ["product", "business systems", "automation", "data", "software"],
  },
  tsxPortfolio: {
    name: "Quantitative Portfolio Optimization (TSX)",
    type: "project",
    role: "Data Lead",
    tags: ["finance", "modeling", "data", "analytics"],
    tools: ["Excel", "Python"],
    metrics: ["37 months", "11x11 covariance matrix", "top 5"],
    bullets: [
      "Built an automated financial data pipeline processing 37 months of TSX equity data for portfolio optimization",
      "Computed log returns and engineered an 11x11 covariance matrix to model asset risk and interdependencies",
      "Implemented Markowitz portfolio optimization, generating the efficient frontier and risk-return optimal allocations",
      "Led a small team validating all computations for accuracy, scoring among the top 5 in class",
    ],
    evidenceNotes: "Course project with verified team result; do not imply professional investment experience.",
    strength: 5,
    roleRelevance: ["finance", "M&A", "equity", "data", "strategy"],
  },
  eyeTracking: {
    name: "Eye-Tracking Usability Research Pipeline",
    type: "project",
    role: "Tobii Pro Glasses 3, WISEC App",
    tags: ["research", "data", "UX", "dashboarding"],
    tools: ["Python", "Flask", "Dash", "Tobii Pro Glasses 3"],
    metrics: ["six analysis tabs"],
    bullets: [
      "Built a Python post-processing pipeline for Tobii Pro Glasses 3 exports, parsing gaze, pupil, and IMU streams into structured metrics",
      "Migrated legacy Linux research tools to Windows, restoring full team access to the analysis environment",
      "Computed fixation summaries, baseline-corrected pupil dilation, and an IMU-based head-motion proxy for attention shifts",
      "Built an interactive dashboard with six analysis tabs for self-service recording review without writing code",
    ],
    evidenceNotes: "Directed-studies research tool; keep claims tied to implemented pipeline and dashboard.",
    strength: 4,
    roleRelevance: ["data", "BI", "product", "UX", "software"],
  },
  venueWorks: {
    name: "VenueWorks",
    type: "project",
    role: "Co-Founder, Product Strategy Lead",
    tags: ["finance", "market research", "product", "strategy"],
    tools: ["Excel", "competitive analysis"],
    metrics: ["$5M+ capacity", "300+ properties", "2nd place", "$1,500 funding"],
    bullets: [
      "Identified $5M+ in idle annual venue capacity and benchmarked 300+ local properties to support pricing and market-entry strategy",
      "Built a commission-plus-premium-listing revenue model and investor pitch, placing 2nd and winning $1,500 in funding",
      "Led product strategy for a marketplace connecting event venues with clients, evaluating supply and demand fit",
      "Benchmarked competitors including Peerspace, LiquidSpace, and Giggster to validate positioning",
    ],
    evidenceNotes: "Validated project, not an operating company; preserve that distinction.",
    strength: 4,
    roleRelevance: ["finance", "business", "product", "marketing", "nonprofit"],
  },
  socialMedia: {
    name: "Social Media Growth & Brand Strategy",
    type: "project",
    role: "Content Strategy Lead",
    tags: ["marketing", "growth", "analytics"],
    tools: ["TikTok analytics"],
    metrics: ["4M+ views", "2M+ views", "10K+ views"],
    bullets: [
      "Built and grew multiple digital brand accounts to 4M+ combined organic views without paid spend",
      "Grew one TikTok account to 2M+ organic views within a year using trend analysis and hook testing",
      "Built a fraternity chapter TikTok from zero to 10K+ views, applying audience analytics to content strategy",
    ],
    evidenceNotes: "Organic account results; do not imply paid campaign ownership.",
    strength: 4,
    roleRelevance: ["marketing", "growth", "analytics"],
  },
  calmora: {
    name: "Calmora",
    type: "project",
    role: "Founder",
    tags: ["automation", "operations", "validation"],
    tools: ["Python", "Discord"],
    metrics: [],
    bullets: [
      "Built a Wizard-of-Oz MVP for a services marketplace, using Python automation for outreach and data cleaning",
      "Coordinated outreach workflows through Discord-based command control and logging for rapid iteration",
      "Validated early demand signals in Vancouver and Calgary through cold outreach and Reddit research",
    ],
    evidenceNotes: "MVP validation project; never present as a scaled company.",
    strength: 3,
    roleRelevance: ["automation", "product operations", "business systems"],
  },
  helpR: {
    name: "HelpR",
    type: "project",
    role: "Founder",
    tags: ["software", "mobile", "public safety"],
    tools: ["Java", "Firebase", "Android"],
    metrics: [],
    bullets: [
      "Built an Android emergency response app in Java with Firebase, surfacing wildfire, accident, and hazard alerts",
      "Designed crowdsourced reporting and community validation workflows for real-time hazard data",
      "Pitched HelpR to the Fire Chief of Alberta as a public-safety application",
    ],
    evidenceNotes: "Prototype and pitch; do not claim production adoption.",
    strength: 3,
    roleRelevance: ["software", "IT", "network systems", "UX"],
  },
};
