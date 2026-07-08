// Aaditya's structured profile, calibrated against his real, current resume
// (Aaditya_Resume_2026_UBC.pdf) and cover letters on his machine.
// Edit this file directly to keep it current — every generator tool reads
// from here, so this is the single source of truth.

export const profile = {
  name: "Aaditya Golash",
  location: "Kelowna, BC",
  email: "aadigolash10@outlook.com",
  phone: "250-864-6046",
  linkedin: "linkedin.com/in/aaditya-golash",
  github: "github.com/Aaditya-Golash",

  education: {
    school: "University of British Columbia",
    degree: "B.Sc. Computer Science, Minor in Management (Co-op)",
    details: "Dean's List, Graduating with Distinction",
    graduation: "May 2026",
    coursework: "Artificial Intelligence, Network Science, Analysis of Algorithms, Databases, Investments, Finance",
    professionalDevelopment: "Adobe Experience Platform and Customer Journey Analytics Foundations, Google Analytics 4, Bloomberg Market Concepts",
  },

  certifications: [
    "Bloomberg Market Concepts",
    "Google Analytics 4",
    "Adobe Experience Platform Foundations",
  ],

  experience: [
    {
      title: "Director",
      org: "UBC Students' Union (UBCSUO)",
      dates: "May 2025 – April 2026",
      bullets: [
        "Manage analytics reporting and digital strategy for a 1.9 million dollar operating budget serving 11,000 plus students across 150 plus campus stakeholders",
        "Revised the Data Governance Policy SC14, defining data ownership, quality standards, and compliance requirements for institutional data assets",
        "Built board level dashboards tracking key performance metrics across technology and operations, giving the board direct visibility into program outcomes",
      ],
    },
    {
      title: "IT Analyst (Co-op)",
      org: "University of British Columbia",
      dates: "May 2024 – Apr 2025",
      bullets: [
        "Resolved 110 plus daily ServiceNow incidents under SLA requirements, supporting enterprise IT systems for 12,000 plus students and staff",
        "Ran incident trend analysis to identify the top recurring failure types across campus systems, then partnered with UBC Vancouver engineering to redesign affected workflows and reduce repeat incident rates",
        "Rebuilt knowledge base KB0019190 by restructuring metadata and content tagging, improving search accuracy for support teams across campus",
        "Contributed to a Microsoft 365 migration and AI chatbot rollout, supporting user testing and drafting end user documentation for both initiatives",
        "Produced weekly operational reports from ServiceNow data, surfacing trends in ticket volume, resolution times, and system failures for IT leadership",
      ],
    },
  ],

  // Core rotating project pool. Per Aaditya's instruction, every resume and
  // cover letter draws 3-5 from this fixed set, picked for relevance to the
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
      impact: "Validated market interest and demand assumptions before deciding not to pursue it as a company",
    },
  ],

  skillCategories: [
    { label: "Languages", items: ["Python", "SQL", "JavaScript/TypeScript", "C/C++"] },
    { label: "Backend and Systems", items: ["Flask", "REST APIs", "Docker", "CI/CD Pipelines", "Git", "Linux"] },
    { label: "Data and Analytics", items: ["ETL/ELT Pipelines", "MySQL", "MongoDB", "Tableau", "GA4", "Adobe Experience Platform"] },
    { label: "Machine Learning", items: ["PyTorch", "Computer Vision"] },
    { label: "Product and Delivery", items: ["Excel", "PowerPoint", "Agile/Scrum", "ServiceNow ITSM", "Product Requirements", "Stakeholder Reporting"] },
  ],

  // Flattened list, used only where a simple skill list is needed.
  skills: [
    "Python", "SQL", "JavaScript", "TypeScript", "C", "C++", "Flask", "Docker",
    "MySQL", "MongoDB", "Tableau", "Git", "PyTorch", "Excel", "Agile/Scrum", "ServiceNow ITSM",
  ],

  // Target-role keywords used to bias project selection and JD matching.
  targetRoles: ["business analyst", "equity analyst", "data analyst", "product manager", "consultant"],
};

export type Profile = typeof profile;
