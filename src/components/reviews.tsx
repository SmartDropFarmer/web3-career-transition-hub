"use client";
import { useState, type FormEvent } from "react";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import {
  HubState,
  QUESTIONS,
  Review,
  readiness,
  reviewSchema,
  roadmapProgress,
  weekStart,
} from "@/lib/model";
import { update } from "@/lib/store";
import { Empty, Field, SectionTitle } from "./ui";

export function Reviews({ data }: { data: HubState }) {
  function draft(): Review {
    return {
      id: crypto.randomUUID(),
      week: weekStart(),
      answers: ["", "", "", ""],
      score: 5,
      readiness: readiness(data).score,
      roadmap: Math.round(roadmapProgress(data)),
    };
  }
  const [editor, setEditor] = useState<Review>(draft);
  const [message, setMessage] = useState("");
  const [windowSize, setWindowSize] = useState(8);
  const history = [...data.reviews].sort((a, b) =>
    b.week.localeCompare(a.week),
  );
  const trend = Array.from({ length: windowSize }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (windowSize - 1 - i) * 7);
    const week = weekStart(d);
    return { week, review: history.find((r) => r.week === week) };
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    const week = weekStart(new Date(`${editor.week}T12:00:00`));
    const existing = data.reviews.find((r) => r.week === week);
    if (
      existing &&
      existing.id !== editor.id &&
      !window.confirm(
        "A review exists for this week. Replace it with these answers?",
      )
    )
      return;
    const parsed = reviewSchema.safeParse({
      ...editor,
      week,
      readiness: readiness(data).score,
      roadmap: Math.round(roadmapProgress(data)),
    });
    if (!parsed.success) {
      setMessage("Please complete all fields with a score from 1 to 10.");
      return;
    }
    if (
      update((s) => ({
        ...s,
        reviews: [
          parsed.data,
          ...s.reviews.filter((r) => r.week !== week && r.id !== editor.id),
        ],
      }))
    ) {
      setMessage("Weekly review saved.");
      setEditor(draft());
    }
  }
  return (
    <>
      <SectionTitle
        eyebrow="REFLECT & REFOCUS"
        title="Weekly review"
        description="Recognize your progress and decide what deserves your attention next."
      />
      <div className="review-layout">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <CalendarDays size={19} />{" "}
              {data.reviews.some((r) => r.id === editor.id)
                ? "Edit your review"
                : "Your weekly check-in"}
            </h2>
          </div>
          <form onSubmit={submit}>
            <Field label="Week of (Monday)">
              <input
                required
                type="date"
                value={editor.week}
                max={weekStart()}
                onChange={(e) => setEditor({ ...editor, week: e.target.value })}
              />
            </Field>
            {QUESTIONS.map((question, i) => (
              <Field key={question} label={`${i + 1}. ${question}`}>
                <textarea
                  required
                  maxLength={20000}
                  value={editor.answers[i]}
                  placeholder={
                    [
                      "A concept, a method, a protocol insight…",
                      "A completed milestone or a useful experiment…",
                      "What got in the way, and what could help?",
                      "Choose one concrete next step…",
                    ][i]
                  }
                  onChange={(e) => {
                    const answers = [...editor.answers] as Review["answers"];
                    answers[i] = e.target.value;
                    setEditor({ ...editor, answers });
                  }}
                />
              </Field>
            ))}
            <Field label="5. Career score this week (1–10)">
              <div className="review-score">
                <input
                  aria-label="Career score this week"
                  type="range"
                  min="1"
                  max="10"
                  value={editor.score}
                  onChange={(e) =>
                    setEditor({ ...editor, score: Number(e.target.value) })
                  }
                />
                <strong>
                  {editor.score}
                  <small>/10</small>
                </strong>
              </div>
            </Field>
            <div className="form-actions">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setEditor(draft());
                  setMessage("");
                }}
              >
                Clear form
              </button>
              <button className="btn primary">Save weekly review</button>
            </div>
            {message && (
              <p role="status" className="save-message">
                {message}
              </p>
            )}
          </form>
        </section>
        <div>
          <section className="panel">
            <div className="panel-heading">
              <h2>Career score over time</h2>
              <select
                aria-label="Review chart period"
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
              >
                {[4, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} weeks
                  </option>
                ))}
              </select>
            </div>
            <div
              className="trend-chart"
              role="img"
              aria-label={`Weekly career scores for ${windowSize} weeks: ${trend.map((t) => `${t.week}: ${t.review?.score ?? "no review"}`).join(", ")}`}
            >
              {trend.map((t) => (
                <div key={t.week} className="trend-column">
                  <span>{t.review?.score ?? "—"}</span>
                  <div className="trend-track">
                    <div
                      style={{ height: `${(t.review?.score ?? 0) * 10}%` }}
                    />
                  </div>
                  <small>{t.week.slice(5)}</small>
                </div>
              ))}
            </div>
            <p className="muted small">
              Weeks without a review are shown as gaps.
            </p>
          </section>
          <section className="panel review-history">
            <div className="panel-heading">
              <h2>Review history</h2>
              <span className="badge">{history.length} saved</span>
            </div>
            {!history.length ? (
              <Empty
                title="A little reflection goes a long way"
                description="Your saved reviews and progress snapshots will appear here."
              />
            ) : (
              history.map((review) => (
                <details key={review.id} className="history-item">
                  <summary>
                    <span>Week of {review.week}</span>
                    <strong>{review.score}/10</strong>
                  </summary>
                  <p className="muted small">
                    Snapshot: readiness {review.readiness}/100 · roadmap{" "}
                    {review.roadmap}%
                  </p>
                  {QUESTIONS.map((q, i) => (
                    <div key={q}>
                      <h4>{q}</h4>
                      <p className="preserve">{review.answers[i]}</p>
                    </div>
                  ))}
                  <div className="row-actions">
                    <button
                      className="btn"
                      onClick={() => {
                        setEditor(review);
                        setMessage("");
                      }}
                    >
                      <Pencil size={14} />
                      Edit review
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Delete review ${review.week}`}
                      onClick={() => {
                        if (window.confirm("Delete this weekly review?"))
                          update((s) => ({
                            ...s,
                            reviews: s.reviews.filter(
                              (r) => r.id !== review.id,
                            ),
                          }));
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </details>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}
