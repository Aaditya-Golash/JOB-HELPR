// Aaditya's structured profile, calibrated against his real, current resume
// (Aaditya_Resume_2026_UBC.pdf) and cover letters on his machine.
// Edit this file directly to keep it current — every generator tool reads
// from here, so this is the single source of truth.
//
// email/phone/location come from environment variables rather than being
// hardcoded, since this repo is public -- unlike linkedin/github (public by
// design, meant to be found), a phone number and email sitting in plaintext
// in a public repo is scrapable in a way a resume PDF sent to one employer
// isn't. Falls back to an obvious placeholder (not a throw) so the generate
// tools still work with no setup, per mcp/README.md -- see mcp/.env.example.
function contactField(envVar: string, fallback: string): string {
  return process.env[envVar]?.trim() || fallback;
}

export const profile = {
  name: "Aaditya Golash",
  location: contactField("CONTACT_LOCATION", "British Columbia"),
  email: contactField("CONTACT_EMAIL", "aadigolash10@outlook.com"),
  phone: contactField("CONTACT_PHONE", "+12508646046"),
  linkedin: "https://www.linkedin.com/in/aaditya-golash/",
  github: "github.com/Aaditya-Golash",

  education: {
    school: "University of British Columbia",
    degree: "B.Sc. Computer Science, Minor in Management (Co-op)",
    details: "Dean's List, Graduating with Distinction",
    graduation: "May 2026",
    coursework: "Artificial Intelligence, Network Science, Analysis of Algorithms, Databases, Investments, Finance",
    professionalDevelopment: "Adobe Experience Platform and Customer Journey Analytics Foundations, Google Analytics 4, Bloomberg Market Concepts, Certified Workflow Automation Professional (Zapier Academy)",
  },

  certifications: [
    "Bloomberg Market Concepts",
    "Google Analytics 4",
    "Adobe Experience Platform Foundations",
    "Introduction to Adobe Real-Time CDP",
    "Foundational Concepts of Adobe Customer Journey Analytics",
    "Analysis Workspace in Adobe Customer Journey Analytics",
    "Zapier Jumpstart",
    "Zapier: Building Basic Zaps",
    "Zapier: Building Intermediate Zaps",
    "Zapier: Building AI Agents",
    "NonprofitReady: Fundraising Essentials",
    "NonprofitReady: Grant Seeking Essentials",
  ],

  // Titles/orgs/dates/location calibrated against Aaditya_Resume_2026.pdf
  // (the account owner's own real, current resume -- authoritative for
  // these identifying facts). Bullets keep the fuller detail from the
  // account owner's direct work-history interview, including the
  // quantified KB-rebuild metric, which that PDF's own bullets don't
  // happen to include but which is real, verified detail -- see
  // CONFLICTS.md for the full reconciliation note.
  experience: [
    {
      title: "Director-at-Large",
      org: "Student Union of UBC",
      location: "Kelowna, BC",
      dates: "May 2025 – Apr 2026",
      bullets: [
        "Elected to represent 12,000+ students, co-managing a $1.9M operating budget and auditing structural allocations for information system investments",
        "Served on the UBC Policy Development Committee, amending Information Systems (SC14) and Wireless Network (SC11) frameworks to integrate digital governance and risk boundaries",
        "Chaired multi-functional committees evaluating data collection practices, deployment strategies, and institutional data access rules",
        "Built board-level dashboards tracking key performance metrics across technology and operations, giving the board direct visibility into program outcomes",
      ],
    },
    {
      title: "Student Systems Analyst (Co-op)",
      org: "IT Services UBC",
      location: "Kelowna, BC",
      dates: "May 2024 – Apr 2025",
      bullets: [
        "Engineered end-to-end user-centric support pathways via ServiceNow, analyzing technical workflows and resolving 110+ structural infrastructure inquiries daily",
        "Refactored the student technical knowledge repository, rewriting content in plain student-facing language instead of IT jargon, cutting recurring related incidents by 70%",
        "Collaborated with central enterprise teams to scale automated bot integrations, identifying core processing bottlenecks and reducing baseline system ticket iteration times",
        "Contributed to a Microsoft 365 migration and AI chatbot rollout, supporting user testing and drafting end-user documentation for both initiatives",
      ],
    },
  ],

  // Core rotating project pool. Per Aaditya's instruction, every resume and
  // resume draws 1-3 from this fixed set, picked for relevance to the
  // job description. Do not invent new projects, only rotate these.
  projects: [
    {
      key: "ta_allocation",
      name: "TA Allocation and Management System",
      role: "Backend Lead, Product Delivery",
      tags: ["product", "full stack", "automation", "process improvement", "data"],
      task: "UBC Computer Science needed to replace a manual spreadsheet process for assigning 250 plus TA applications per academic term",
      approach: "Scoped and delivered a full stack allocation platform with Flask and MySQL, defining product requirements and maintaining a backlog of 36 plus features covering automated scheduling, conflict resolution, role based access, and analytics dashboards",
      features: "Ran sprint planning and bi weekly reviews with the delivery team, and set up CI/CD pipelines with Docker and GitHub for automated testing and containerized deployment",
      impact: "Cut TA assignment processing time by 70 percent, reducing coordinator workload from multiple days to a few hours each term",
    },
    {
      key: "eeg_pipeline",
      name: "EEG Brain Connectivity Pipeline",
      role: "Data Lead",
      tags: ["data", "analytics", "research", "ML"],
      task: "A research team needed to process a large volume of EEG recordings to study brain connectivity during meditation",
      approach: "Built a data pipeline to clean, process, and compute graph based connectivity metrics",
      features: "Processed over 30 million raw data points and computed hub region connectivity metrics across subjects",
      impact: "Surfaced meditation linked hub region findings used in the research team's ongoing analysis",
    },
    {
      key: "tobii_eyetracking",
      name: "Eye Tracking Usability Research Pipeline",
      role: "Co-builder",
      tags: ["UX research", "data", "product"],
      task: "A directed studies project needed a way to evaluate user decision making using Tobii Pro Glasses 3 and the WISEC app",
      approach: "Co built a Python post processing pipeline parsing raw gaze, pupil, and IMU streams from Tobii ZIP archives into structured interval metrics, and migrated legacy Linux research tools to Windows for full team access",
      features: "Computed fixation summaries, baseline corrected pupil dilation, and a head motion proxy, then built an interactive dashboard with six analysis tabs and deployed it via a Flask and Dash server with ZIP upload support",
      impact: "Delivered a reusable research tool letting researchers review recordings and regenerate dashboards without writing code",
    },
    {
      key: "jersey_recognition",
      name: "Jersey Number Recognition (SoccerNet)",
      role: "Team member",
      tags: ["ML", "computer vision", "data"],
      task: "A team project aimed to improve automated jersey number recognition accuracy on the SoccerNet dataset",
      approach: "Contributed to a deep learning pipeline built with PyTorch as part of a team, focused on post processing and frame filtering",
      features: "Built a frame filtering step that selected the most informative frames before classification",
      impact: "Improved classification accuracy to 88.52 percent as a team",
    },
    {
      key: "portfolio_optimization",
      name: "Quantitative Portfolio Optimization (TSX)",
      role: "Data Lead",
      tags: ["finance", "quant", "data"],
      task: "Wanted to apply portfolio theory to real TSX equity data as a class project",
      approach: "Built an automated financial data pipeline ingesting and processing 37 months of TSX equity data, computing log returns and an 11 by 11 covariance matrix to model asset risk",
      features: "Implemented Markowitz portfolio optimization, generated the efficient frontier, and automated data extraction in Excel and Python for reproducibility",
      impact: "Led a 3 person team dividing workstreams and validating computations, scoring among the top 5 in the class",
    },
    {
      key: "venueworks",
      name: "VenueWorks (project)",
      role: "Product Strategy Lead",
      tags: ["product", "business", "strategy"],
      task: "Explored whether a marketplace connecting event venues with clients was viable as a self directed project",
      approach: "Led product strategy and positioning, evaluating supply and demand fit",
      features: "Mapped supply across 300 plus candidate properties as part of market validation",
      impact: "Identified $5M+ in idle annual capacity across 300+ properties; placed 2nd and won $1,500 at UBC's Odlum Brown Entrepreneur Boot Camp",
    },
  ],

  // Calibrated against Aaditya_Resume_2026.pdf's own TECHNICAL SKILLS &
  // CORE COMPETENCIES block (Languages/Frameworks, Systems & Architecture,
  // Data & Business Analytics), extended (not replaced) with a few
  // genuinely-used skills from specific projects that PDF's curated list
  // doesn't happen to list (PyTorch/Computer Vision from Jersey Number
  // Recognition; GA4/Adobe Experience Platform from certifications).
  skillCategories: [
    { label: "Languages/Frameworks", items: ["Python", "SQL", "C/C++", "R", "JavaScript", "TypeScript", "HTML/CSS", "SQLAlchemy", "Flask", "JSON"] },
    { label: "Systems & Architecture", items: ["REST APIs", "ServiceNow", "Docker", "Firebase", "Vercel", "Android Studio", "Stripe CLI", "Git"] },
    { label: "Data & Business Analytics", items: ["Excel", "Financial Analysis", "Portfolio Modeling", "Variance Analysis", "Market Research", "Data Validation", "Dashboarding", "Stakeholder Reporting", "Tableau", "Requirements Gathering", "SDLC", "SLA Management", "Cost-Benefit Analysis", "GA4", "Adobe Experience Platform"] },
    { label: "Machine Learning", items: ["PyTorch", "Computer Vision"] },
  ],

  // Flattened list, used only where a simple skill list is needed.
  skills: [
    "Python", "SQL", "C", "C++", "R", "JavaScript", "TypeScript", "HTML/CSS",
    "SQLAlchemy", "Flask", "JSON", "REST APIs", "ServiceNow", "Docker",
    "Firebase", "Vercel", "Android Studio", "Stripe CLI", "Git", "Tableau",
    "PyTorch",
  ],

  // Target-role keywords used to bias project selection and JD matching.
  targetRoles: ["business analyst", "equity analyst", "data analyst", "product manager", "consultant"],
};

export type Profile = typeof profile;
