# Web3 Career Transition Hub

A personal workspace for Adrian's transition from 10+ years in RAM/RAMS, quantitative analysis, reliability, KPI monitoring and risk assessment into Web3 research, analytics, strategy and operations.

Built with **Next.js App Router, TypeScript, React and Tailwind CSS**. Responsive dark interface, local persistence and no backend or credentials required. No corporate signature or contact information is included.

## Run locally

Use Node.js 22 LTS or later and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production build:

```sh
npm run build
npm start
```

## Features

- **Dashboard:** readiness breakdown, roadmap progress, target role, six activity metrics, calendar-day learning streak and a next action based on incomplete milestones.
- **Roadmap:** the original four phases (SQL, Dune, Python, Portfolio) and twelve tasks, with checkboxes, partial completion and notes. Checking a task sets it to 100%; unchecking resets it to 0%. Course count covers SQLBolt, Kaggle SQL, Dune 101, Kaggle Python, Pandas and Data Analysis.
- **Skill Gap Analysis:** ten editable current/target/priority assessments. Technical skills start unassessed; transferable strengths are explicitly labeled editable estimates. Skill assessments are separate from the completion-based readiness formula.
- **Job Tracker:** create, edit and delete opportunities; status, date, salary, fit score, notes and application URL; search and status/minimum-fit filters; application, interview, active-opportunity and offer counts. Interview history is retained after rejection. Only entries with a submission date count as sent applications.
- **Project Portfolio:** dashboard, research report, Python project and Web3 tool records with completion, protocol, description and publication URL; create, edit, filter and delete.
- **Weekly Review:** the four original written questions and career score (1–10), one record per Monday-based week, editable history, captured readiness/roadmap snapshots and a 4/8/12-calendar-week chart. Missing weeks remain gaps.
- **Backups:** export JSON and restore validated V1 backups. Restore and delete actions ask before replacing data. Invalid storage is preserved until explicit recovery; save failures are visible.

Jobs, projects, reviews and completion start empty. Dashboard metrics are derived from recorded activity, not sample achievements. Dashboard-type projects represent Dune/onchain dashboards in this V1; other tools can use the Web3 Tool type.

## Readiness calculation

| Component          | Weight | Completion basis                                                   |
| ------------------ | -----: | ------------------------------------------------------------------ |
| SQL                |    20% | Mean completion of the three SQL tasks                             |
| Dune               |    20% | Mean completion of the three Dune tasks                            |
| Python             |    15% | Mean completion of the three Python tasks                          |
| Portfolio maturity |    20% | Sum of project completion percentages divided by 3, capped at 100% |
| Public dashboards  |    15% | Three complete dashboard projects with publication links           |
| Research reports   |    10% | Two complete research reports with publication links               |

Each component is 0–100. Multiply it by its weight, sum, then round once to get the final score. Portfolio maturity uses three completed-project equivalents, so adding a draft does not reduce it. Published items must be 100% complete and have an HTTP(S) URL; the app does not verify the remote publication content or access permissions. Counts above the goals cannot raise the score above 100.

The roadmap progress is the mean of all twelve task percentages. It is separate from readiness. The score is a planning aid, not an assessment of employability or a reason to postpone applications.

Learning streaks count consecutive local calendar days with roadmap/project updates or an explicit learning check-in. Today can be pending if yesterday was active. Merely opening the app does not increase the streak.

## Data and privacy

Data is stored under `web3-career-hub:v1` in browser `localStorage`. Nothing is sent to a database. Data belongs to a browser profile and origin: localhost, preview deployments and production URLs have separate stores. Clearing browser data removes it. Export before switching browsers/devices/URLs; use **Restore backup** on the destination.

There is no login, multi-device sync, job scraping or automatic submission. Anyone with access to the same browser profile can see its local records. Multiple open tabs receive storage updates; simultaneous edits use the most recent save. Backup imports validate structure, field limits and safe HTTP(S) links (10 MB maximum). No personal notes or backups should be committed to GitHub.

## Verify

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The end-to-end suite launches the production server, tests persistence, forms, scores, backups and mobile layout, and takes desktop/mobile screenshots in `test-results/`. On Windows with Edge already installed, use `$env:PLAYWRIGHT_CHANNEL="msedge"` in PowerShell before `npm run test:e2e` instead of installing Chromium.

## Deploy to Vercel

1. Import `SmartDropFarmer/web3-career-transition-hub` in Vercel.
2. Choose the **Next.js** preset, repository root and Node.js 22 or later.
3. Use the default install/build settings (`npm ci` / `npm run build`). No environment variables or database are needed.
4. Deploy. Future pushes to the connected production branch trigger builds.
5. Open the production URL and restore a backup if you have data on localhost or another URL.

Alternatively deploy to any Node host that supports Next.js using `npm ci`, `npm run build` and `npm start`. The application is a single-page workspace at `/`; its six sections use client-side navigation. No hosting deployment is required to run it locally.

## Structure

`src/lib/model.ts` contains schemas, original roadmap content, scoring and metrics. `src/lib/store.ts` handles validated browser persistence and hydration. `src/components/` contains each workspace section. `src/app/globals.css` defines the responsive visual system alongside Tailwind. Tests cover domain logic and real browser workflows.
