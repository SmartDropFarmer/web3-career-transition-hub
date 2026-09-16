import { z } from "zod";

export const STATUSES = [
  "Interested",
  "Applied",
  "Interview",
  "Final Round",
  "Rejected",
  "Offer",
] as const;
export const PROJECT_TYPES = [
  "Dashboard",
  "Research Report",
  "Python Project",
  "Web3 Tool",
] as const;
export const ROLES = [
  "Crypto Research Analyst",
  "Ecosystem Analyst",
  "Governance Analyst",
] as const;
export const QUESTIONS = [
  "What did I learn this week?",
  "What progress did I make?",
  "What blocked me?",
  "What will I focus on next week?",
];
export const PHASES = [
  {
    id: "sql",
    title: "SQL Fundamentals",
    description: "Build the foundation for onchain analysis.",
    tasks: ["Complete SQLBolt", "Practice SQL queries", "Finish Kaggle SQL"],
  },
  {
    id: "dune",
    title: "Dune Analytics",
    description: "Turn protocol data into useful insights.",
    tasks: [
      "Complete Dune 101",
      "Create first dashboard",
      "Create protocol research dashboard",
    ],
  },
  {
    id: "python",
    title: "Python",
    description: "Automate analysis and work confidently with data.",
    tasks: ["Kaggle Python", "Pandas", "Data Analysis"],
  },
  {
    id: "portfolio",
    title: "Portfolio",
    description: "Publish evidence of your research and analytical thinking.",
    tasks: [
      "Publish research reports",
      "Create GitHub portfolio",
      "Create 3 public dashboards",
    ],
  },
] as const;
export const SKILL_NAMES = [
  "SQL",
  "Dune Analytics",
  "Python",
  "Pandas",
  "Power BI",
  "Tokenomics",
  "Protocol Research",
  "Governance",
  "Data Analysis",
  "Technical Writing",
] as const;
const percent = z.number().min(0).max(100);
const shortText = z.string().max(500);
const notes = z.string().max(20000);
const date = z.iso.date();
export function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
const link = z
  .string()
  .max(2000)
  .refine((v) => v === "" || !!safeUrl(v), "Use an http or https URL.");
const taskSchema = z.object({ id: z.string(), progress: percent, notes });
const skillSchema = z.object({
  name: z.enum(SKILL_NAMES),
  current: z.number().int().min(0).max(5),
  target: z.number().int().min(1).max(5),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
});
export const jobSchema = z.object({
  id: z.string(),
  company: shortText.min(1),
  role: shortText.min(1),
  applicationDate: date.or(z.literal("")),
  status: z.enum(STATUSES),
  fitScore: percent,
  salary: shortText,
  notes,
  url: link,
  interviewed: z.boolean(),
});
export const projectSchema = z.object({
  id: z.string(),
  name: shortText.min(1),
  type: z.enum(PROJECT_TYPES),
  protocol: shortText,
  description: notes,
  completion: percent,
  url: link,
});
export const reviewSchema = z.object({
  id: z.string(),
  week: date,
  answers: z.tuple([notes, notes, notes, notes]),
  score: z.number().int().min(1).max(10),
  readiness: percent,
  roadmap: percent,
});
export const stateSchema = z.object({
  version: z.literal(1),
  targetRole: z.enum(ROLES),
  tasks: z
    .array(taskSchema)
    .length(12)
    .refine(
      (tasks) =>
        PHASES.every((p) =>
          p.tasks.every((_, i) => tasks.some((t) => t.id === `${p.id}-${i}`)),
        ),
      "Invalid roadmap tasks",
    ),
  skills: z
    .array(skillSchema)
    .length(10)
    .refine((skills) => new Set(skills.map((s) => s.name)).size === 10),
  jobs: z.array(jobSchema).max(10000),
  projects: z.array(projectSchema).max(10000),
  reviews: z.array(reviewSchema).max(10000),
  activity: z.array(date).max(50000),
});
export type HubState = z.infer<typeof stateSchema>;
export type Job = z.infer<typeof jobSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Task = z.infer<typeof taskSchema>;
export const initialState: HubState = {
  version: 1,
  targetRole: ROLES[0],
  tasks: PHASES.flatMap((phase) =>
    phase.tasks.map((_, i) => ({
      id: `${phase.id}-${i}`,
      progress: 0,
      notes: "",
    })),
  ),
  skills: SKILL_NAMES.map((name, i) => ({
    name,
    current: [0, 0, 0, 0, 0, 3, 3, 2, 4, 4][i],
    target: [4, 4, 3, 3, 3, 4, 5, 4, 5, 4][i],
    priority:
      i < 2
        ? "Critical"
        : ["Python", "Pandas", "Power BI"].includes(name)
          ? "Medium"
          : name === "Technical Writing"
            ? "Low"
            : "High",
  })),
  jobs: [],
  projects: [],
  reviews: [],
  activity: [],
};
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function weekStart(d = new Date()) {
  const value = new Date(d);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return localDate(value);
}
export function phaseProgress(state: HubState, phase: string) {
  const tasks = state.tasks.filter((t) => t.id.startsWith(`${phase}-`));
  return tasks.reduce((sum, t) => sum + t.progress, 0) / (tasks.length || 1);
}
export function roadmapProgress(state: HubState) {
  return (
    state.tasks.reduce((sum, t) => sum + t.progress, 0) / state.tasks.length
  );
}
export function readiness(state: HubState) {
  const published = state.projects.filter(
    (p) => p.completion === 100 && safeUrl(p.url),
  );
  // Three complete projects are the portfolio milestone. Additional draft projects never reduce maturity.
  const maturity = Math.min(
    100,
    state.projects.reduce((sum, p) => sum + p.completion, 0) / 3,
  );
  const components = [
    { label: "SQL", value: phaseProgress(state, "sql"), weight: 20 },
    { label: "Dune", value: phaseProgress(state, "dune"), weight: 20 },
    { label: "Python", value: phaseProgress(state, "python"), weight: 15 },
    { label: "Portfolio maturity", value: maturity, weight: 20 },
    {
      label: "Public dashboards",
      value: Math.min(
        100,
        (published.filter((p) => p.type === "Dashboard").length / 3) * 100,
      ),
      weight: 15,
    },
    {
      label: "Research reports",
      value: Math.min(
        100,
        (published.filter((p) => p.type === "Research Report").length / 2) *
          100,
      ),
      weight: 10,
    },
  ];
  return {
    score: Math.round(
      components.reduce((sum, c) => sum + (c.value * c.weight) / 100, 0),
    ),
    components,
  };
}
export function streak(activity: string[], today = new Date()) {
  const days = new Set(activity);
  const cursor = new Date(today);
  let count = 0;
  if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDate(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
export function jobStats(jobs: Job[]) {
  return {
    applications: jobs.filter((j) => !!j.applicationDate).length,
    interviews: jobs.filter(
      (j) =>
        j.interviewed ||
        ["Interview", "Final Round", "Offer"].includes(j.status),
    ).length,
    offers: jobs.filter((j) => j.status === "Offer").length,
    active: jobs.filter((j) => !["Rejected", "Offer"].includes(j.status))
      .length,
  };
}
export function nextAction(state: HubState): {
  title: string;
  reason: string;
  tab: "Roadmap" | "Project Portfolio" | "Job Tracker";
  taskId?: string;
} {
  for (const phase of PHASES.slice(0, 3)) {
    const task = state.tasks.find(
      (t) => t.id.startsWith(phase.id) && t.progress < 100,
    );
    if (task)
      return {
        title: phase.tasks[Number(task.id.split("-")[1])],
        reason: `${phase.title} builds evidence for ${state.targetRole.toLowerCase()} roles.`,
        tab: "Roadmap",
        taskId: task.id,
      };
  }
  if (readiness(state).score < 100)
    return {
      title: "Publish your next portfolio milestone",
      reason:
        "Aim for three public dashboards and two research reports with a clear decision or recommendation.",
      tab: "Project Portfolio",
    };
  const task = state.tasks.find((t) => t.progress < 100);
  if (task)
    return {
      title: PHASES[3].tasks[Number(task.id.split("-")[1])],
      reason: "Complete the remaining portfolio roadmap evidence.",
      tab: "Roadmap",
      taskId: task.id,
    };
  return {
    title: "Find your next research opportunity",
    reason:
      "Prioritize remote roles that value KPI analysis, risk assessment and decision support.",
    tab: "Job Tracker",
  };
}
