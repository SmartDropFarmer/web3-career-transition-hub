"use client";
import { useState, type FormEvent } from "react";
import {
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Search,
  X,
  FolderOpen,
  BarChart3,
  FileText,
  Code2,
  Wrench,
} from "lucide-react";
import {
  HubState,
  Job,
  Project,
  PROJECT_TYPES,
  STATUSES,
  jobSchema,
  jobStats,
  localDate,
  projectSchema,
  safeUrl,
} from "@/lib/model";
import { update } from "@/lib/store";
import { Empty, Field, Metric, Progress, SectionTitle } from "./ui";

function newJob(): Job {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    applicationDate: "",
    status: "Interested",
    fitScore: 0,
    salary: "",
    notes: "",
    url: "",
    interviewed: false,
  };
}
function newProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "Dashboard",
    protocol: "",
    description: "",
    completion: 0,
    url: "",
  };
}
function remove(kind: "jobs" | "projects", id: string) {
  if (
    window.confirm(
      "Delete this record? This cannot be undone without a backup.",
    )
  )
    update((s) => ({ ...s, [kind]: s[kind].filter((item) => item.id !== id) }));
}

export function Jobs({ data }: { data: HubState }) {
  const [editor, setEditor] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [minFit, setMinFit] = useState(0);
  const stats = jobStats(data.jobs);
  const filtered = data.jobs
    .filter(
      (job) =>
        `${job.company} ${job.role} ${job.salary}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (status === "All statuses" || job.status === status) &&
        job.fitScore >= minFit,
    )
    .sort((a, b) => b.fitScore - a.fitScore);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;
    const parsed = jobSchema.safeParse({
      ...editor,
      company: editor.company.trim(),
      role: editor.role.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (editor.status !== "Interested" && !editor.applicationDate) {
      setError(
        "Add an application date for an application you have submitted.",
      );
      return;
    }
    if (
      update((s) => ({
        ...s,
        jobs: [parsed.data, ...s.jobs.filter((j) => j.id !== editor.id)],
      }))
    ) {
      setEditor(null);
      setError("");
    }
  }
  return (
    <>
      <SectionTitle
        eyebrow="OPPORTUNITY PIPELINE"
        title="Job tracker"
        description="Prioritize research, analytics, strategy and operations roles that value your experience."
      >
        <button
          className="btn primary"
          onClick={() => {
            setEditor(newJob());
            setError("");
          }}
        >
          <Plus size={17} />
          Add opportunity
        </button>
      </SectionTitle>
      <div className="metric-strip">
        <Metric
          label="Applications"
          value={stats.applications}
          detail="Submission date recorded"
        />
        <Metric
          label="Interviews"
          value={stats.interviews}
          detail="Includes past interview stages"
        />
        <Metric
          label="Active opportunities"
          value={stats.active}
          detail="Interested through final round"
        />
        <Metric
          label="Offers"
          value={stats.offers}
          detail="Your next chapter"
        />
      </div>
      {editor && (
        <section className="panel editor">
          <div className="panel-heading">
            <h2>
              {data.jobs.some((j) => j.id === editor.id)
                ? "Edit opportunity"
                : "New opportunity"}
            </h2>
            <button
              className="icon-button"
              aria-label="Close opportunity form"
              onClick={() => setEditor(null)}
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Company">
                <input
                  required
                  maxLength={500}
                  value={editor.company}
                  onChange={(e) =>
                    setEditor({ ...editor, company: e.target.value })
                  }
                />
              </Field>
              <Field label="Role">
                <input
                  required
                  maxLength={500}
                  value={editor.role}
                  onChange={(e) =>
                    setEditor({ ...editor, role: e.target.value })
                  }
                />
              </Field>
              <Field label="Application Date">
                <input
                  type="date"
                  max={localDate()}
                  required={editor.status !== "Interested"}
                  value={editor.applicationDate}
                  onChange={(e) =>
                    setEditor({ ...editor, applicationDate: e.target.value })
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  value={editor.status}
                  onChange={(e) => {
                    const status = e.target.value as Job["status"];
                    setEditor({
                      ...editor,
                      status,
                      interviewed:
                        editor.interviewed ||
                        ["Interview", "Final Round", "Offer"].includes(status),
                    });
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Fit Score (0–100)">
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={editor.fitScore}
                  onChange={(e) =>
                    setEditor({ ...editor, fitScore: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Salary">
                <input
                  maxLength={500}
                  placeholder="€65,000 / year or not disclosed"
                  value={editor.salary}
                  onChange={(e) =>
                    setEditor({ ...editor, salary: e.target.value })
                  }
                />
              </Field>
              <Field label="Application link">
                <input
                  type="url"
                  placeholder="https://…"
                  value={editor.url}
                  onChange={(e) =>
                    setEditor({ ...editor, url: e.target.value })
                  }
                />
              </Field>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={editor.interviewed}
                  onChange={(e) =>
                    setEditor({ ...editor, interviewed: e.target.checked })
                  }
                />
                Interview obtained (including past stages)
              </label>
            </div>
            <Field label="Notes">
              <textarea
                maxLength={20000}
                placeholder="Remote eligibility, fit, requirements, follow-up…"
                value={editor.notes}
                onChange={(e) =>
                  setEditor({ ...editor, notes: e.target.value })
                }
              />
            </Field>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button className="btn primary" type="submit">
                Save opportunity
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="panel">
        <div className="filters">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search opportunities"
              placeholder="Search company, role or salary…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Minimum fit score"
            value={minFit}
            onChange={(e) => setMinFit(Number(e.target.value))}
          >
            <option value="0">Any fit score</option>
            <option value="70">Fit ≥ 70</option>
            <option value="85">Fit ≥ 85</option>
            <option value="90">Fit ≥ 90</option>
          </select>
        </div>
        {!filtered.length ? (
          <Empty
            title={
              data.jobs.length
                ? "No matching opportunities"
                : "Your next role starts here"
            }
            description={
              data.jobs.length
                ? "Try a different search or filter."
                : "Save a remote Web3 opportunity and track your progress from first interest to offer."
            }
            action={data.jobs.length ? undefined : "Add your first opportunity"}
            onAction={() => setEditor(newJob())}
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Company / Role</th>
                  <th>Application Date</th>
                  <th>Status</th>
                  <th>Fit Score</th>
                  <th>Salary</th>
                  <th>Notes</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <strong>{job.company}</strong>
                      <span className="cell-sub">{job.role}</span>
                      {safeUrl(job.url) && (
                        <a
                          className="text-button"
                          href={safeUrl(job.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Application <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td>{job.applicationDate || "Not submitted"}</td>
                    <td>
                      <span
                        className={`badge status-${job.status.replace(" ", "-").toLowerCase()}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <strong className={job.fitScore >= 85 ? "green" : ""}>
                        {job.fitScore}
                      </strong>
                      <small className="muted"> / 100</small>
                    </td>
                    <td>{job.salary || "Not disclosed"}</td>
                    <td className="notes-cell">{job.notes || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${job.company}`}
                          onClick={() => {
                            setEditor(job);
                            setError("");
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Delete ${job.company}`}
                          onClick={() => remove("jobs", job.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="table-caption">
          {filtered.length} opportunities · Highest fit first · Fit scores are
          your own assessment
        </p>
      </section>
    </>
  );
}

export function Portfolio({ data }: { data: HubState }) {
  const [editor, setEditor] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All projects");
  const projects = data.projects.filter(
    (p) => filter === "All projects" || p.type === filter,
  );
  const icons = {
    Dashboard: BarChart3,
    "Research Report": FileText,
    "Python Project": Code2,
    "Web3 Tool": Wrench,
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;
    const parsed = projectSchema.safeParse({
      ...editor,
      name: editor.name.trim(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (
      update(
        (s) => ({
          ...s,
          projects: [
            parsed.data,
            ...s.projects.filter((p) => p.id !== editor.id),
          ],
        }),
        true,
      )
    ) {
      setEditor(null);
      setError("");
    }
  }
  return (
    <>
      <SectionTitle
        eyebrow="PROOF OF WORK"
        title="Project portfolio"
        description="Show how you turn protocol data into decisions. Every project is evidence."
      >
        <button
          className="btn primary"
          onClick={() => {
            setEditor(newProject());
            setError("");
          }}
        >
          <Plus size={17} />
          Add project
        </button>
      </SectionTitle>
      <div className="metric-strip">
        <Metric
          label="Projects"
          value={data.projects.length}
          detail="Your body of work"
        />
        <Metric
          label="Completed"
          value={data.projects.filter((p) => p.completion === 100).length}
          detail="Ready to demonstrate"
        />
        <Metric
          label="Public dashboards"
          value={`${data.projects.filter((p) => p.type === "Dashboard" && p.completion === 100 && safeUrl(p.url)).length} / 3`}
          detail="Readiness milestone"
        />
        <Metric
          label="Published reports"
          value={`${data.projects.filter((p) => p.type === "Research Report" && p.completion === 100 && safeUrl(p.url)).length} / 2`}
          detail="Readiness milestone"
        />
      </div>
      {editor && (
        <section className="panel editor">
          <div className="panel-heading">
            <h2>
              {data.projects.some((p) => p.id === editor.id)
                ? "Edit project"
                : "New project"}
            </h2>
            <button
              className="icon-button"
              aria-label="Close project form"
              onClick={() => setEditor(null)}
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Project Name">
                <input
                  required
                  maxLength={500}
                  value={editor.name}
                  onChange={(e) =>
                    setEditor({ ...editor, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Type">
                <select
                  value={editor.type}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      type: e.target.value as Project["type"],
                    })
                  }
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Protocol">
                <input
                  maxLength={500}
                  placeholder="Ethereum, Aave, Arbitrum…"
                  value={editor.protocol}
                  onChange={(e) =>
                    setEditor({ ...editor, protocol: e.target.value })
                  }
                />
              </Field>
              <Field label="Completion %">
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={editor.completion}
                  onChange={(e) =>
                    setEditor({ ...editor, completion: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Publication Link">
                <input
                  type="url"
                  placeholder="https://…"
                  value={editor.url}
                  onChange={(e) =>
                    setEditor({ ...editor, url: e.target.value })
                  }
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                maxLength={20000}
                placeholder="Research question, method, findings and decision value…"
                value={editor.description}
                onChange={(e) =>
                  setEditor({ ...editor, description: e.target.value })
                }
              />
            </Field>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                className="btn"
                type="button"
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button className="btn primary" type="submit">
                Save project
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="tabs-filter" aria-label="Project type filters">
        {["All projects", ...PROJECT_TYPES].map((t) => (
          <button
            className={filter === t ? "active" : ""}
            aria-pressed={filter === t}
            key={t}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {!projects.length ? (
        <section className="panel">
          <Empty
            title={
              data.projects.length
                ? "No projects of this type yet"
                : "Make your experience visible"
            }
            description="Start with a protocol KPI dashboard, a governance analysis or a Python risk assessment."
            action="Create a project"
            onAction={() => setEditor(newProject())}
          />
        </section>
      ) : (
        <div className="portfolio-grid">
          {projects.map((project) => {
            const Icon = icons[project.type];
            return (
              <article className="panel project-card" key={project.id}>
                <div className="panel-heading">
                  <span className="icon-box">
                    <Icon size={23} />
                  </span>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Edit ${project.name}`}
                      onClick={() => {
                        setEditor(project);
                        setError("");
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Delete ${project.name}`}
                      onClick={() => remove("projects", project.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <span className="eyebrow">{project.type}</span>
                <h2>{project.name}</h2>
                <span className="protocol">
                  <FolderOpen size={13} />
                  {project.protocol || "Cross-ecosystem"}
                </span>
                <p className="project-description">
                  {project.description ||
                    "Add a description of the question, analysis and findings."}
                </p>
                <div className="spread">
                  <small>Completion</small>
                  <strong>{project.completion}%</strong>
                </div>
                <Progress
                  value={project.completion}
                  label={`${project.name} completion`}
                />
                <div className="project-footer">
                  {safeUrl(project.url) ? (
                    <a
                      className="text-button"
                      href={safeUrl(project.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View publication <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="muted">Not published yet</span>
                  )}
                  <span className="badge">
                    {project.completion === 100 ? "Complete" : "In progress"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
