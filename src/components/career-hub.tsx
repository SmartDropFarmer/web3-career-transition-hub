"use client";
import { useRef, useState, type ChangeEvent } from "react";
import {
  LayoutDashboard,
  Route,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  FolderKanban,
  CalendarCheck2,
  ArrowUpRight,
  Download,
  Upload,
  Hexagon,
  Database,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { initialState, stateSchema } from "@/lib/model";
import { exportData, save, useHub } from "@/lib/store";
import { Dashboard } from "./dashboard";
import { Roadmap, Skills } from "./learning";
import { Jobs, Portfolio } from "./tracking";
import { Reviews } from "./reviews";

const navigation = [
  { title: "Dashboard", icon: LayoutDashboard, short: "Home" },
  { title: "Roadmap", icon: Route, short: "Roadmap" },
  { title: "Skill Gap Analysis", icon: ChartNoAxesCombined, short: "Skills" },
  { title: "Job Tracker", icon: BriefcaseBusiness, short: "Jobs" },
  { title: "Project Portfolio", icon: FolderKanban, short: "Portfolio" },
  { title: "Weekly Review", icon: CalendarCheck2, short: "Review" },
];
export function CareerHub() {
  const { data, ready, error } = useHub();
  const [tab, setTab] = useState("Dashboard");
  const [focusTask, setFocusTask] = useState<string>();
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLElement>(null);
  function navigate(next: string, taskId?: string) {
    setTab(next);
    setFocusTask(taskId);
    setMenu(false);
    requestAnimationFrame(() => {
      content.current?.focus();
      const target = taskId ? document.getElementById(taskId) : null;
      if (target)
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      else window.scrollTo({ top: 0 });
    });
  }
  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setNotice("Choose a backup smaller than 10 MB.");
      return;
    }
    try {
      const imported = stateSchema.parse(JSON.parse(await file.text()));
      if (
        !window.confirm(
          "Replace this browser's saved career data with the selected backup? Export your current data first if you need to keep it.",
        )
      )
        return;
      if (save(imported, true)) setNotice("Backup restored successfully.");
    } catch {
      setNotice(
        "This file is not a valid V1 career hub backup. Nothing was changed.",
      );
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Dashboard");
          }}
        >
          <span className="brand-symbol">
            <Hexagon size={27} />
            <span />
          </span>
          <span>
            Web3 Career<span>TRANSITION HUB</span>
          </span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.title}
              aria-current={tab === item.title ? "page" : undefined}
              className={`nav-item ${tab === item.title ? "active" : ""}`}
              onClick={() => navigate(item.title)}
            >
              <item.icon size={19} />
              <span>{item.title}</span>
              {tab === item.title && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="north-star">
            <span className="eyebrow">
              YOUR NORTH STAR <ArrowUpRight size={14} />
            </span>
            <h3>
              Engineering judgement.
              <br />
              Web3 opportunity.
            </h3>
            <p>
              Research · Analytics
              <br />
              Strategy · Operations
            </p>
          </div>
          <div className="backup-controls">
            <button onClick={exportData} disabled={!ready}>
              <Download size={15} />
              Export backup
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              disabled={!ready}
            >
              <Upload size={15} />
              Restore backup
            </button>
          </div>
          <div className="profile">
            <span className="avatar">A</span>
            <div>
              <strong>Adrian</strong>
              <small>Building the next chapter</small>
            </div>
            <span className="dot" />
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-toggle"
              aria-label={menu ? "Close menu" : "Open menu"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>My workspace</span>
            <span className="slash">/</span>
            <strong>{tab}</strong>
          </div>
          <div className="storage-status">
            <Database size={13} />
            <span>
              {!ready
                ? "Loading…"
                : error
                  ? "Storage needs attention"
                  : "Saved on this device"}
            </span>
            <span className={`dot ${error ? "error-dot" : ""}`} />
          </div>
        </header>
        <main id="main" ref={content} tabIndex={-1} className="main-content">
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                className="icon-button"
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="storage-error" role="alert">
              <p>{error}</p>
              <div className="row-actions">
                <button className="btn" onClick={exportData}>
                  <Download size={14} />
                  Export available data
                </button>
                <button
                  className="btn"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={14} />
                  Restore backup
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Reset all local career data? Existing saved data will be replaced. Export a backup first.",
                      )
                    )
                      save(structuredClone(initialState), true);
                  }}
                >
                  <RotateCcw size={14} />
                  Reset local data
                </button>
              </div>
            </div>
          )}
          {!ready ? (
            <div className="loading">Loading your career workspace…</div>
          ) : (
            <>
              {tab === "Dashboard" && (
                <Dashboard data={data} navigate={navigate} />
              )}
              {tab === "Roadmap" && (
                <Roadmap data={data} focusTask={focusTask} />
              )}
              {tab === "Skill Gap Analysis" && <Skills data={data} />}
              {tab === "Job Tracker" && <Jobs data={data} />}
              {tab === "Project Portfolio" && <Portfolio data={data} />}
              {tab === "Weekly Review" && <Reviews data={data} />}
            </>
          )}
          <footer className="page-footer">
            <span>Web3 Career Transition Hub</span>
            <span>
              Your data stays in this browser. Export a backup to keep it safe.
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <button
            key={item.title}
            aria-label={item.title}
            aria-current={tab === item.title ? "page" : undefined}
            className={tab === item.title ? "active" : ""}
            onClick={() => navigate(item.title)}
          >
            <item.icon size={19} />
            <span>{item.short}</span>
          </button>
        ))}
      </nav>
      <input
        type="file"
        accept="application/json,.json"
        hidden
        ref={fileInput}
        onChange={importData}
        aria-label="Restore career backup"
      />
    </div>
  );
}
