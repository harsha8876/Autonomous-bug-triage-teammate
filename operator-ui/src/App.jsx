import { useState, useRef, useEffect, useCallback } from 'react';
import { LemmaClient, setTestingToken } from 'lemma-sdk';
import { initialFeedback, initialActivity, initialBoard } from './data';
import { navStyle } from './styles';
import Inbox from './Inbox';
import Board from './Board';
import Activity from './Activity';
import TriagePanel from './TriagePanel';

const ACCENT = '#D4A373';
const FLAT_SHADOWS = false;
const DEFAULT_PAGE = 'inbox';
const POD_ID = '019f0891-5981-774f-967b-18209c907826';
const API_URL = 'http://127-0-0-1.sslip.io:8711';
const AUTH_URL = 'http://127-0-0-1.sslip.io:3711/auth';

setTestingToken(import.meta.env.VITE_LEMMA_TOKEN || '');
const podClient = new LemmaClient({ apiUrl: API_URL, authUrl: AUTH_URL, podId: POD_ID });

const deriveTitle = (raw) => {
  const t = raw.replace(/\s+/g, ' ').trim();
  let s = t.split(/\.\s/)[0];
  if (s.length > 72) s = s.slice(0, 72).trim() + '…';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const relativeTime = (isoStr) => {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p.map(String) : []; }
    catch { return []; }
  }
  return [];
};

export default function App() {
  const accent = ACCENT;
  const shadow = FLAT_SHADOWS ? 'none' : '0 1px 2px rgba(61,58,46,0.05), 0 1px 3px rgba(61,58,46,0.04)';

  const [page, setPage] = useState(DEFAULT_PAGE);
  const [composerText, setComposerText] = useState('');
  const [triageOpen, setTriageOpen] = useState(false);
  const [triageRunning, setTriageRunning] = useState(false);
  const [triage, setTriage] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const [feedback, setFeedback] = useState(initialFeedback);
  const [activity] = useState(initialActivity);
  const [board, setBoard] = useState(initialBoard);

  const toastTimer = useRef(null);
  const dragRef = useRef(null);
  const pollingActive = useRef(false);
  const currentRunRef = useRef({ runId: null, approvalNodeId: null });

  useEffect(() => {
    podClient.records.list('feedback', {
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit: 50,
    }).then((res) => {
      if (res.items?.length) {
        setFeedback(res.items.map((r) => ({
          id: String(r.id),
          source: String(r.source || 'manual'),
          time: relativeTime(r.created_at),
          status: String(r.status || 'pending'),
          text: String(r.raw_text || ''),
        })));
      }
    }).catch(() => {});
    return () => { clearTimeout(toastTimer.current); };
  }, []);

  const navTo = (p) => { setPage(p); setTriageOpen(false); };

  const flashToast = (kind, msg) => {
    setToast({ kind, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const closeTriage = () => {
    setTriageOpen(false);
    pollingActive.current = false;
  };

  const editTitle = (e) => setTriage((t) => ({ ...t, title: e.target.value }));

  const runTriageWorkflow = async (text) => {
    if (!text.trim()) return;

    setTriageOpen(true);
    setTriageRunning(true);
    setTriage(null);
    pollingActive.current = true;
    currentRunRef.current = { runId: null, approvalNodeId: null };

    try {
      // 1. Create run — starts WAITING on the intake FORM node
      let run = await podClient.workflows.runs.create('triage');
      const runId = run.id;
      currentRunRef.current.runId = runId;

      // 2. Submit the intake form
      run = await podClient.workflows.runs.submitForm(runId, {
        node_id: 'intake',
        inputs: { raw_text: text.trim(), source: 'manual' },
      });

      // 3. Poll until the run reaches the approval FORM or a terminal state
      while (pollingActive.current) {
        const s = run.status;
        if (s === 'FAILED' || s === 'COMPLETED') break;
        if (s === 'WAITING' && run.active_wait?.node_id === 'approval') break;
        await new Promise((r) => setTimeout(r, 2000));
        run = await podClient.workflows.runs.get(runId);
      }

      if (!pollingActive.current) return;

      if (run.status === 'FAILED') {
        setTriageRunning(false);
        flashToast('no', 'Triage failed: ' + (run.error || 'unknown error'));
        return;
      }

      if (run.active_wait?.node_id === 'approval') {
        currentRunRef.current.approvalNodeId = run.active_wait.node_id;
      }

      // 4. Fetch the issue that the triage agent wrote to the issues table
      const issueRes = await podClient.records.list('issues', {
        sort: [{ field: 'created_at', direction: 'desc' }],
        limit: 1,
      });
      const issue = issueRes.items?.[0];

      if (!issue) {
        setTriageRunning(false);
        flashToast('no', 'No triage result found in issues table');
        return;
      }

      // 5. Map to TriagePanel shape (confidence 0–1 → 0–100)
      const triageResult = {
        title: String(issue.title || deriveTitle(text)),
        severity: String(issue.severity || 'P3'),
        component: String(issue.component || ''),
        confidence: Math.round((Number(issue.confidence) || 0) * 100),
        reasoning: String(issue.reasoning || ''),
        repro: parseJsonArray(issue.repro_steps),
        labels: parseJsonArray(issue.labels),
        duplicate: issue.duplicate_of
          ? {
              similarity: Math.round((Number(issue.similarity_score) || 0) * 100),
              issue: issue.duplicate_of,
              issueTitle: String(issue.duplicate_of),
            }
          : null,
      };

      setTriage(triageResult);
      setTriageRunning(false);
    } catch (err) {
      if (!pollingActive.current) return;
      setTriageRunning(false);
      flashToast('no', 'Triage error: ' + (err?.message || 'unknown'));
    }
  };

  const runTriage = () => runTriageWorkflow(composerText);

  const openTriage = (text) => runTriageWorkflow(text);

  const approve = async () => {
    const t = triage;
    const { runId, approvalNodeId } = currentRunRef.current;

    if (runId && approvalNodeId) {
      try {
        await podClient.workflows.runs.submitForm(runId, {
          node_id: approvalNodeId,
          inputs: { decision: 'approve' },
        });
      } catch { /* non-fatal — UI still updates */ }
    }

    setBoard((b) => {
      const card = {
        id: 'n' + Date.now(),
        title: t.title,
        severity: t.severity,
        component: t.component,
        confidence: t.confidence,
        time: 'now',
      };
      return { ...b, approved: [card, ...b.approved] };
    });
    setTriageOpen(false);
    pollingActive.current = false;
    currentRunRef.current = { runId: null, approvalNodeId: null };
    flashToast('ok', 'GitHub issue created · ' + t.title);
  };

  const reject = async () => {
    const { runId, approvalNodeId } = currentRunRef.current;
    if (runId && approvalNodeId) {
      try {
        await podClient.workflows.runs.submitForm(runId, {
          node_id: approvalNodeId,
          inputs: { decision: 'reject' },
        });
      } catch { /* non-fatal */ }
    }
    setTriageOpen(false);
    pollingActive.current = false;
    currentRunRef.current = { runId: null, approvalNodeId: null };
    flashToast('no', 'Triage rejected');
  };

  const onDragStart = (id, from) => (e) => {
    dragRef.current = { id, from };
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } catch { /* noop */ }
  };
  const onDragOver = useCallback((e) => e.preventDefault(), []);
  const onDragEnter = (key) => (e) => { e.preventDefault(); setDragOver((cur) => (cur !== key ? key : cur)); };
  const onDragEnd = () => setDragOver(null);
  const onDrop = (key) => (e) => {
    e.preventDefault();
    const d = dragRef.current;
    dragRef.current = null;
    setDragOver(null);
    if (!d || d.from === key) return;
    setBoard((b) => {
      const card = b[d.from].find((c) => c.id === d.id);
      if (!card) return b;
      return { ...b, [d.from]: b[d.from].filter((c) => c.id !== d.id), [key]: [card, ...b[key]] };
    });
  };

  const dragHandlers = { onDragStart, onDragOver, onDragEnter, onDragEnd, onDrop };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Geist', sans-serif", color: '#3A3528' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '13px 24px', background: 'rgba(204,213,174,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(61,58,46,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#FEFAE0' }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em', color: '#2F2C20' }}>Operator</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button onClick={() => navTo('inbox')} style={navStyle(page === 'inbox')}>Inbox</button>
          <button onClick={() => navTo('board')} style={navStyle(page === 'board')}>Board</button>
          <button onClick={() => navTo('activity')} style={navStyle(page === 'activity')}>Activity</button>
        </nav>
      </header>

      {page === 'inbox' && (
        <Inbox
          accent={accent} shadow={shadow} feedback={feedback}
          composerText={composerText}
          onComposer={(e) => setComposerText(e.target.value)}
          runTriage={runTriage} openTriage={openTriage}
        />
      )}
      {page === 'board' && (
        <Board accent={accent} shadow={shadow} board={board} dragOver={dragOver} handlers={dragHandlers} />
      )}
      {page === 'activity' && (
        <Activity accent={accent} shadow={shadow} activity={activity} />
      )}

      <TriagePanel
        accent={accent} open={triageOpen} running={triageRunning} triage={triage}
        onClose={closeTriage} onEditTitle={editTitle} onApprove={approve} onReject={reject}
      />

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', alignItems: 'center', gap: 9, background: '#2F2C20', color: '#FEFAE0', padding: '11px 17px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 10px 30px rgba(40,38,28,0.32)', maxWidth: '90vw' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: toast.kind === 'ok' ? '#8FA76A' : '#C97A5E' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
