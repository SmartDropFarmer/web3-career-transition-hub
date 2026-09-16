import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  jobStats,
  nextAction,
  readiness,
  safeUrl,
  stateSchema,
  streak,
  weekStart,
  type Project,
} from "../src/lib/model";

test("readiness starts at zero and preserves the specified weights", () => {
  assert.equal(readiness(initialState).score, 0);
  assert.deepEqual(
    readiness(initialState).components.map((c) => c.weight),
    [20, 20, 15, 20, 15, 10],
  );
  const state = structuredClone(initialState);
  state.tasks
    .filter((t) => t.id.startsWith("sql"))
    .forEach((t) => (t.progress = 100));
  assert.equal(readiness(state).score, 20);
  state.tasks
    .filter((t) => t.id.startsWith("dune"))
    .forEach((t) => (t.progress = 50));
  assert.equal(readiness(state).score, 30);
});
function project(
  id: string,
  type: Project["type"],
  completion = 100,
  url = "https://example.org/report",
): Project {
  return { id, name: id, type, protocol: "", description: "", completion, url };
}
test("public evidence requires complete projects and safe links; score caps at 100", () => {
  const state = structuredClone(initialState);
  state.tasks.forEach((t) => (t.progress = 100));
  state.projects = [
    project("draft", "Dashboard", 90),
    project("private", "Dashboard", 100, ""),
    project("unsafe", "Research Report", 100, "javascript:alert(1)"),
  ];
  assert.equal(readiness(state).components[4].value, 0);
  assert.equal(readiness(state).components[5].value, 0);
  state.projects = [
    project("d1", "Dashboard"),
    project("d2", "Dashboard"),
    project("d3", "Dashboard"),
    project("r1", "Research Report"),
    project("r2", "Research Report"),
  ];
  assert.equal(readiness(state).score, 100);
  state.projects.push(project("draft2", "Web3 Tool", 0));
  assert.equal(readiness(state).score, 100);
});
test("streak uses calendar days, handles yesterday, gaps, duplicate dates and month boundary", () => {
  const today = new Date(2026, 2, 1, 12);
  assert.equal(
    streak(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-01"], today),
    3,
  );
  assert.equal(streak(["2026-02-27", "2026-02-28"], today), 2);
  assert.equal(streak(["2026-02-27"], today), 0);
  assert.equal(weekStart(new Date(2026, 8, 20, 12)), "2026-09-14");
});
test("import rejects incomplete roadmap, duplicate skills, unsafe URLs and unsupported versions", () => {
  assert.equal(stateSchema.safeParse(initialState).success, true);
  assert.equal(
    stateSchema.safeParse({ ...initialState, version: 2 }).success,
    false,
  );
  assert.equal(
    stateSchema.safeParse({
      ...initialState,
      tasks: initialState.tasks.slice(1),
    }).success,
    false,
  );
  assert.equal(
    stateSchema.safeParse({
      ...initialState,
      skills: Array(10).fill(initialState.skills[0]),
    }).success,
    false,
  );
  assert.equal(
    stateSchema.safeParse({
      ...initialState,
      projects: [project("unsafe", "Dashboard", 100, "javascript:alert(1)")],
    }).success,
    false,
  );
  assert.equal(safeUrl("data:text/html,test"), "");
});
test("application and interview counts preserve real submission and interview history", () => {
  const base = {
    id: "1",
    company: "Example",
    role: "Analyst",
    applicationDate: "2026-09-10",
    status: "Rejected" as const,
    fitScore: 90,
    salary: "",
    notes: "",
    url: "",
    interviewed: true,
  };
  assert.deepEqual(
    jobStats([
      base,
      {
        ...base,
        id: "2",
        applicationDate: "",
        status: "Interested",
        interviewed: false,
      },
    ]),
    { applications: 1, interviews: 1, offers: 0, active: 1 },
  );
});
test("next action advances with completed milestones", () => {
  assert.equal(nextAction(initialState).taskId, "sql-0");
  const state = structuredClone(initialState);
  state.tasks[0].progress = 100;
  assert.equal(nextAction(state).taskId, "sql-1");
  state.tasks.forEach((t) => (t.progress = 100));
  assert.equal(nextAction(state).tab, "Project Portfolio");
});
