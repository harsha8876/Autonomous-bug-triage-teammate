# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a hackathon project called **Operator** — an AI-assisted bug triage dashboard for solo open-source maintainers. It has two layers:

1. **`operator-ui/`** — A React frontend (Vite + JSX, no TypeScript in source files) that lets a human review AI triage results and approve or reject them.
2. **Backend resources** (agents, workflows, tables) — JSON configuration files that define a Lemma/pod-based agentic system. These are declarative configs, not runtime code.

## Frontend commands

All commands run from `operator-ui/`:

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check then build for production
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Architecture

### Frontend (`operator-ui/src/`)

- **`App.jsx`** — Root component. Owns all state: current page, composer text, triage panel open/running state, board columns, toast notifications, and drag-and-drop tracking. All callbacks are defined here and passed down as props.
- **`data.js`** — All seed/mock data. `initialFeedback`, `initialActivity`, `initialBoard` initialize component state. `records` is the canonical set of pre-built triage objects keyed by bug name (e.g. `records.checkout`). `sevMeta()` returns color/label metadata for severity levels (P0–P3).
- **`Inbox.jsx`** — Composer for pasting raw bug reports and a list of recent feedback items. Clicking a feedback row opens the TriagePanel with its pre-built `records` entry.
- **`Board.jsx`** — Kanban board with four columns: `triage → approved → inProgress → done`. Cards are draggable between columns.
- **`Activity.jsx`** — Read-only log of past agent actions.
- **`TriagePanel.jsx`** — Slide-in drawer (fixed, right side). Shows a loading spinner while `running`, then the structured triage result (severity, component, confidence bar, duplicate warning, reasoning, repro steps, labels). Approve adds a card to the board; Reject closes the panel.
- **`styles.js`** — Inline style helpers: `navStyle`, `sevStyle`, `sourceStyle`, `statusStyle`.
- **`Interactive.jsx`** — `HoverButton`, `HoverDiv`, `FocusInput` — thin wrappers that swap between `baseStyle` and `hoverStyle`/`focusStyle` using React state, since all styling is inline (no CSS classes).

The UI is entirely static/simulated — triage "runs" via a `setTimeout` delay and resolves from the pre-built `records` object in `data.js`. No real API calls are made.

### Backend config (`agents/`, `workflows/`, `tables/`)

These are JSON configs for a Lemma pod:

- **`tables/feedback/`** — Inbound bug reports. Columns: `raw_text`, `source` (manual/github/slack/email), `status` (pending/triaged/duplicate/dismissed).
- **`tables/issues/`** — Structured triage output. Columns: `title`, `severity`, `component`, `repro_steps` (JSON), `labels` (JSON), `reasoning`, `confidence`, `status`, `github_issue_number`, `duplicate_of`, `feedback_id`.
- **`tables/operator_runs/`** — Audit log of agent actions (triaged, duplicate_found, approved, rejected, github_issue_created, release_notes_drafted).
- **`agents/triager/`** — Reads from `feedback`, writes structured triage rows to `issues`. Never creates GitHub issues directly.
- **`agents/dedup-confirmer/`** — Read-only: compares a new report to a candidate existing issue and returns `{ is_duplicate, confidence, explanation }`.
- **`workflows/triage/`** — Orchestrates the pipeline: FORM (intake) → AGENT (triager) → AGENT (dedup-confirmer) → FORM (human approval) → END.

### Key data model

A triage record (from `data.js records` or the `issues` table) has: `title`, `severity` (P0–P3), `component`, `confidence` (0–100 in UI / 0–1.0 in backend), `reasoning`, `repro` (array), `labels` (array), `duplicate` (null or `{ similarity, issue, issueTitle }`).

Severity scale: P0 = outage/data loss, P1 = payments/auth/core flow blocked, P2 = degraded UX with workaround, P3 = minor/cosmetic.
