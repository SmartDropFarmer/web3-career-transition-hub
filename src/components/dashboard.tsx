import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  Check,
  Target,
  Layers,
  Sparkles,
  BookOpen,
  BarChart3,
  Code2,
  Send,
  MessagesSquare,
  FileText,
} from "lucide-react";
import {
  HubState,
  PHASES,
  ROLES,
  jobStats,
  localDate,
  nextAction,
  phaseProgress,
  readiness,
  roadmapProgress,
  streak,
} from "@/lib/model";
import { update } from "@/lib/store";
import { Progress, SectionTitle } from "./ui";

export function Dashboard({
  data,
  navigate,
}: {
  data: HubState;
  navigate: (tab: string, taskId?: string) => void;
}) {
  const { score, components } = readiness(data);
  const progress = roadmapProgress(data);
  const jobs = jobStats(data.jobs);
  const action = nextAction(data);
  const courses = [
    "sql-0",
    "sql-2",
    "dune-0",
    "python-0",
    "python-1",
    "python-2",
  ].filter((id) =>
    data.tasks.some((t) => t.id === id && t.progress === 100),
  ).length;
  const complete = data.projects.filter((p) => p.completion === 100);
  const metrics = [
    {
      label: "Courses completed",
      value: courses,
      detail: "of 6 learning milestones",
      icon: BookOpen,
    },
    {
      label: "Dune dashboards",
      value: complete.filter((p) => p.type === "Dashboard").length,
      detail: "completed dashboards",
      icon: BarChart3,
    },
    {
      label: "Python projects",
      value: complete.filter((p) => p.type === "Python Project").length,
      detail: "analysis in practice",
      icon: Code2,
    },
    {
      label: "Applications sent",
      value: jobs.applications,
      detail: "with application date",
      icon: Send,
    },
    {
      label: "Interviews obtained",
      value: jobs.interviews,
      detail: "across all applications",
      icon: MessagesSquare,
    },
    {
      label: "Research reports",
      value: complete.filter((p) => p.type === "Research Report").length,
      detail: "completed reports",
      icon: FileText,
    },
  ];
  const today = localDate();
  const logged = data.activity.includes(today);
  const activity = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 13 + i);
    return localDate(d);
  });
  const latest = [...data.reviews].sort((a, b) =>
    b.week.localeCompare(a.week),
  )[0];
  return (
    <>
      <SectionTitle
        eyebrow="YOUR NEXT CHAPTER"
        title="Build on what you know."
        description="From engineering experience to Web3 research & analytics."
      >
        <span className="badge">
          <span className="dot" />
          Personal career workspace
        </span>
      </SectionTitle>
      <div className="hero-grid">
        <section className="panel hero-panel">
          <div className="panel-top">
            <span className="eyebrow">
              <Sparkles size={15} /> CAREER TRANSITION PROGRESS
            </span>
            <span className="badge subtle">Building momentum</span>
          </div>
          <div className="hero-main">
            <div>
              <h2>
                Your experience.
                <br />
                <span>A new ecosystem.</span>
              </h2>
              <p>
                Turn 10+ years of quantitative analysis, KPI monitoring and risk
                assessment into evidence that Web3 teams can use.
              </p>
              <button
                className="btn primary"
                onClick={() => navigate("Roadmap")}
              >
                Continue your roadmap <ArrowRight size={16} />
              </button>
            </div>
            <div
              className="score-ring"
              style={{ "--score": `${score}%` } as React.CSSProperties}
            >
              <div>
                <strong>
                  {score}
                  <small>/ 100</small>
                </strong>
                <span>Readiness Score</span>
              </div>
            </div>
          </div>
          <div className="hero-footer">
            <div>
              <span>Roadmap completion</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <Progress value={progress} label="Career transition progress" />
            <small>
              {data.tasks.filter((t) => t.progress === 100).length} of 12
              milestones complete · Your progress, at your pace
            </small>
          </div>
        </section>
        <section className="panel next-action">
          <span className="icon-box">
            <ArrowUpRight size={23} />
          </span>
          <div className="eyebrow">NEXT BEST ACTION</div>
          <h2>{action.title}</h2>
          <p>{action.reason}</p>
          <div className="action-note">
            <Target size={16} />
            <span>A focused step toward your target role</span>
          </div>
          <button
            className="btn light"
            onClick={() => navigate(action.tab, action.taskId)}
          >
            Take the next step <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <div className="metrics-grid">
        {metrics.map((m) => (
          <section className="panel stat" key={m.label}>
            <div>
              <span>{m.label}</span>
              <m.icon size={17} />
            </div>
            <strong>{m.value.toString().padStart(2, "0")}</strong>
            <small>{m.detail}</small>
          </section>
        ))}
      </div>
      <div className="two-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your transition roadmap</h2>
              <p>Build skills. Put them to work. Publish the evidence.</p>
            </div>
            <button className="text-button" onClick={() => navigate("Roadmap")}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="phase-list">
            {PHASES.map((phase, i) => {
              const value = phaseProgress(data, phase.id);
              return (
                <button
                  className="phase-row"
                  key={phase.id}
                  onClick={() => navigate("Roadmap", `${phase.id}-0`)}
                >
                  <span
                    className={`phase-number ${value === 100 ? "done" : ""}`}
                  >
                    {value === 100 ? <Check size={17} /> : `0${i + 1}`}
                  </span>
                  <div>
                    <strong>{phase.title}</strong>
                    <small>
                      {
                        data.tasks.filter(
                          (t) =>
                            t.id.startsWith(phase.id) && t.progress === 100,
                        ).length
                      }
                      /3 milestones
                    </small>
                  </div>
                  <div className="phase-bar">
                    <span>{Math.round(value)}%</span>
                    <Progress
                      value={value}
                      label={`${phase.title} completion`}
                    />
                  </div>
                  <ArrowRight size={16} />
                </button>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Readiness breakdown</h2>
              <p>Evidence behind your score</p>
            </div>
            <Layers size={19} />
          </div>
          <div className="breakdown">
            {components.map((c) => (
              <div key={c.label}>
                <div>
                  <span>
                    {c.label} <small>{c.weight}% weight</small>
                  </span>
                  <strong>{Math.round(c.value)}%</strong>
                </div>
                <Progress value={c.value} label={`${c.label} readiness`} />
              </div>
            ))}
          </div>
          <details className="formula">
            <summary>How is my score calculated?</summary>
            <p>
              Weighted phase completion for SQL, Dune and Python. Portfolio
              maturity = total project completion ÷ 3, capped at 100%. Public
              dashboard goal: 3. Published research report goal: 2. Publications
              require 100% completion and an http(s) link. This planning score
              does not predict employment.
            </p>
          </details>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Target size={18} /> Target roles
            </h2>
          </div>
          <p className="muted">Choose your current focus</p>
          <div className="role-list">
            {ROLES.map((role) => (
              <button
                aria-pressed={data.targetRole === role}
                className={`role-chip ${data.targetRole === role ? "selected" : ""}`}
                key={role}
                onClick={() => update((s) => ({ ...s, targetRole: role }))}
              >
                {role}
                {data.targetRole === role && <Check size={14} />}
              </button>
            ))}
          </div>
          <small className="muted">
            Also aligned with strategy, DAO research and protocol operations.
          </small>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Flame size={19} className="orange" /> Learning streak
            </h2>
            <strong className="streak">
              {streak(data.activity)} <small>days</small>
            </strong>
          </div>
          <div className="activity-grid">
            {activity.map((day) => (
              <span
                key={day}
                title={`${day}: ${data.activity.includes(day) ? "Activity logged" : "No activity"}`}
                className={data.activity.includes(day) ? "active" : ""}
              />
            ))}
          </div>
          <div className="spread">
            <small className="muted">Last 14 days</small>
            <button
              className="text-button"
              disabled={logged}
              onClick={() => update((s) => ({ ...s }), true)}
            >
              {logged ? "✓ Today recorded" : "+ Log learning today"}
            </button>
          </div>
        </section>
        <section className="panel reflection">
          <span className="eyebrow">KEEP PERSPECTIVE</span>
          <blockquote>
            “Your next career starts with the evidence you build today.”
          </blockquote>
          <p>Your engineering judgement is already an asset.</p>
          {latest ? (
            <button
              className="text-button"
              onClick={() => navigate("Weekly Review")}
            >
              Latest review: {latest.score}/10 <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className="text-button"
              onClick={() => navigate("Weekly Review")}
            >
              Make time to reflect <ArrowRight size={14} />
            </button>
          )}
        </section>
      </div>
    </>
  );
}
