# AI Bug Triage Operator

Built on the [Lemma SDK](https://lemma.work) for the Gappy AI Hackathon.

An autonomous bug triage system that takes incoming reports from multiple channels, checks for duplicates, classifies severity with AI, and routes everything through a human approval step before creating GitHub issues.

**Live app:** https://operator-ui.apps.lemma.work
**Lemma pod:** `019f0eef-2601-70ca-b1f4-df7f3fd0f3dd`

---

## Why

Bug triage is repetitive and inconsistent. Someone has to read every report, check if it's already been filed, decide how severe it is, and tag the right component — and that work varies depending on who's doing it.

This operator automates the repetitive classification work but never takes action without a human approving it first.

---

## Architecture

```
Bug report comes in (Web UI or GitHub webhook)
        │
        ▼
  bug_ingest (function)
   - logs a feedback record
   - starts the triage workflow
        │
        ▼
  dedup_check (agent)
   - scans recent issues for a match
        │
        ▼
  is_dup (decision)
   ┌────┴────┐
   │         │
duplicate   new
   │         │
   ▼         ▼
mark_     triager (agent)
duplicate  - classifies severity,
   │         component, repro steps
   │         │
   │         ▼
   │      approval (human, in UI)
   │         │
   └─────────▼
            end
```

A bug report comes in from the web UI or a GitHub webhook. It hits `bug_ingest`, which writes a feedback record and kicks off a Lemma workflow. The workflow runs a `dedup-confirmer` agent first, checking the report against existing issues. If it's a duplicate, the run is flagged and stops there. If it's new, a `triager` agent classifies severity, component, and repro steps, then the result lands in front of a human in the Operator UI for approval before a GitHub issue is created.

---

## Project Structure

```
operator-ui/          Custom React frontend
  src/App.jsx          State + all Lemma SDK calls
  src/Board.jsx         Kanban board view
  src/TriagePanel.jsx    Slide-out triage review panel
  src/Inbox.jsx          Incoming feedback inbox

workflows/triage/      Lemma workflow graph definition
  triage.json            intake → dedup_check → decision → triager → approval → end

agents/
  dedup-confirmer/       Scans recent issues, returns duplicate match + similarity score
  triager/                Classifies severity, component, repro steps

functions/
  bug_ingest/             Creates feedback record, runs dedup check inline, starts workflow
  mark_duplicate/         Records a duplicate-flagged issue
  slack_notify/           Posts approval notifications to Slack

webhook-server/         Node service bridging GitHub webhook events into the pipeline
```

---

## Key Implementation Notes

**Agent response polling.** Lemma agent conversations don't always expose their final answer through a simple `.output` field — `bug_ingest` polls the conversation until it completes, then reads the agent's structured JSON response directly from the message history. This pattern is reused anywhere a function needs a synchronous answer from an agent.

**Dedup-first ordering.** The workflow checks for duplicates *before* running the full triage classification, so duplicate reports don't burn an unnecessary AI call or create a redundant issue row.

**Human-in-the-loop by design.** No GitHub issue is created and no status changes without a human approving it through the `approval` FORM node in the workflow — the AI only proposes, a person decides.

---

## Running Locally

```bash
cd operator-ui
npm install
```

Create `.env.development`:
```bash
VITE_LEMMA_API_URL=https://api.lemma.work
VITE_LEMMA_POD_ID=019f0eef-2601-70ca-b1f4-df7f3fd0f3dd
```

```bash
npm run dev
```

Auth is handled automatically via the Lemma SDK's `AuthGuard` component — no manual token wiring needed.

### Webhook server (for GitHub intake)

```bash
cd webhook-server
node index.js
```

Expose it with a tunnel (e.g. ngrok) and point a GitHub repo webhook at `<tunnel-url>/github`.

---

## Built With

- [Lemma SDK](https://lemma.work) — agents, workflows, functions, datastore
- React + Vite — custom frontend
- DeepSeek / Groq (OpenAI-compatible) — LLM backends for agent reasoning
- Node.js + Express — GitHub webhook bridge

---

## Hackathon Submission

Gappy AI Hackathon — Bug Triage Operator for solo open-source maintainers.

Built by Harsha.
