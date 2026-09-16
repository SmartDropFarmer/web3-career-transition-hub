import { PHASES, HubState, phaseProgress } from "@/lib/model";
import { update } from "@/lib/store";
import { Progress, SectionTitle } from "./ui";
import { Check, ChevronDown } from "lucide-react";

export function Roadmap({
  data,
  focusTask,
}: {
  data: HubState;
  focusTask?: string;
}) {
  function patch(id: string, values: { progress?: number; notes?: string }) {
    update(
      (s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...values } : t)),
      }),
      true,
    );
  }
  return (
    <>
      <SectionTitle
        eyebrow="LEARNING PATH"
        title="Your transition roadmap"
        description="Four connected phases. Start publishing while you learn."
      />
      <div className="roadmap-grid">
        {PHASES.map((phase, i) => (
          <section className="panel roadmap-phase" key={phase.id}>
            <div className="panel-heading">
              <span className="phase-number">0{i + 1}</span>
              <span className="badge">
                {Math.round(phaseProgress(data, phase.id))}% complete
              </span>
            </div>
            <h2>{phase.title}</h2>
            <p className="muted">{phase.description}</p>
            <Progress
              value={phaseProgress(data, phase.id)}
              label={phase.title}
            />
            <div className="tasks">
              {phase.tasks.map((title, j) => {
                const task = data.tasks.find(
                  (t) => t.id === `${phase.id}-${j}`,
                )!;
                return (
                  <div
                    className={`task ${focusTask === task.id ? "highlight" : ""}`}
                    id={task.id}
                    key={task.id}
                  >
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={task.progress === 100}
                        onChange={(e) =>
                          patch(task.id, {
                            progress: e.target.checked ? 100 : 0,
                          })
                        }
                      />
                      <span>{title}</span>
                      {task.progress === 100 && (
                        <Check size={15} className="green" />
                      )}
                    </label>
                    <div className="task-progress">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        aria-label={`${title} progress`}
                        value={task.progress}
                        onChange={(e) =>
                          patch(task.id, { progress: Number(e.target.value) })
                        }
                      />
                      <span>{task.progress}%</span>
                    </div>
                    <div className="spread">
                      <small className="muted">
                        {task.progress === 100
                          ? "Completed"
                          : task.progress
                            ? "In progress"
                            : "Not started"}
                      </small>
                      <details>
                        <summary>
                          Notes <ChevronDown size={12} />
                        </summary>
                        <label className="sr-only" htmlFor={`${task.id}-notes`}>
                          {title} notes
                        </label>
                        <textarea
                          id={`${task.id}-notes`}
                          maxLength={20000}
                          placeholder="Queries practiced, insights, next steps…"
                          value={task.notes}
                          onChange={(e) =>
                            patch(task.id, { notes: e.target.value })
                          }
                        />
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
export function Skills({ data }: { data: HubState }) {
  function patch(name: string, values: Partial<HubState["skills"][number]>) {
    update((s) => ({
      ...s,
      skills: s.skills.map((skill) =>
        skill.name === name ? { ...skill, ...values } : skill,
      ),
    }));
  }
  return (
    <>
      <SectionTitle
        eyebrow="TRANSFERABLE STRENGTHS"
        title="Skill gap analysis"
        description="Build on your analytical background. Focus learning where the gap matters."
      />
      <div className="notice">
        Starting levels are editable estimates based on your background, not
        verified assessments. Technical skills start at 0 until you assess them.
        Levels: 0 = unassessed, 1 = beginner, 5 = expert.
      </div>
      <section className="panel">
        <div className="skill-table">
          <div className="skill-row skill-header">
            <span>Skill</span>
            <span>Current / 5</span>
            <span>Target / 5</span>
            <span>Priority</span>
            <span>Gap to target</span>
          </div>
          {data.skills.map((skill) => (
            <div className="skill-row" key={skill.name}>
              <strong>{skill.name}</strong>
              <label>
                <span className="mobile-label">Current / 5</span>
                <input
                  aria-label={`${skill.name} current level`}
                  type="number"
                  min="0"
                  max="5"
                  value={skill.current}
                  onChange={(e) =>
                    patch(skill.name, {
                      current: Math.min(
                        5,
                        Math.max(0, Math.round(Number(e.target.value))),
                      ),
                    })
                  }
                />
              </label>
              <label>
                <span className="mobile-label">Target / 5</span>
                <input
                  aria-label={`${skill.name} target level`}
                  type="number"
                  min="1"
                  max="5"
                  value={skill.target}
                  onChange={(e) =>
                    patch(skill.name, {
                      target: Math.min(
                        5,
                        Math.max(1, Math.round(Number(e.target.value))),
                      ),
                    })
                  }
                />
              </label>
              <label>
                <span className="mobile-label">Priority</span>
                <select
                  aria-label={`${skill.name} priority`}
                  value={skill.priority}
                  onChange={(e) =>
                    patch(skill.name, {
                      priority: e.target.value as typeof skill.priority,
                    })
                  }
                >
                  {["Critical", "High", "Medium", "Low"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <div>
                <div className="spread">
                  <small className="muted">
                    {Math.max(0, skill.target - skill.current)} levels to go
                  </small>
                  <small>
                    {Math.round(
                      Math.min(100, (skill.current / skill.target) * 100),
                    )}
                    %
                  </small>
                </div>
                <Progress
                  value={Math.min(100, (skill.current / skill.target) * 100)}
                  label={`${skill.name} target attainment`}
                  color={skill.current >= skill.target ? "green" : "purple"}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="strength-note">
        <h3>Your existing advantage</h3>
        <p>
          Reliability assessment, operational risk, performance metrics and
          decision-support reporting transfer directly into protocol research,
          ecosystem analysis and governance. Use SQL, Dune and Python to make
          that judgement visible.
        </p>
      </div>
    </>
  );
}
