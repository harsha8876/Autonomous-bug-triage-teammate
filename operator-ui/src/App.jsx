import { useState, useRef, useEffect, useCallback } from 'react';
import { lemmaClient } from './lemmaClient';
import { navStyle } from './styles';
import { useBreakpoint } from './useBreakpoint';
import Inbox from './Inbox';
import Board from './Board';
import Activity from './Activity';
import TriagePanel from './TriagePanel';

const ACCENT = '#D4A373';
const FLAT_SHADOWS = false;
const DEFAULT_PAGE = 'inbox';

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

const EMPTY_BOARD = { triage: [], approved: [], inProgress: [], done: [] };

const STATUS_TO_COL = {
  triage: 'triage',
  approved: 'approved',
  in_progress: 'inProgress',
  done: 'done',
  rejected: 'done',
  duplicate: 'done',
};

const COL_TO_STATUS = {
  triage: 'triage',
  approved: 'approved',
  inProgress: 'in_progress',
  done: 'done',
};

const RUN_ACTION_SEV = {
  github_issue_created: 'P0',
  triaged: 'P1',
  approved: 'P1',
  duplicate_found: 'P2',
  release_notes_drafted: 'P2',
  rejected: 'P3',
};

const ACTION_LABEL = {
  triaged: 'Triaged',
  approved: 'Approved',
  rejected: 'Rejected',
  duplicate_found: 'Flagged duplicate',
  github_issue_created: 'Created issue',
  release_notes_drafted: 'Drafted release notes',
};

const formatRunAction = (action, detail) => {
  const label = ACTION_LABEL[action] ?? action;
  return detail ? `${label} — ${detail}` : label;
};

const issueToCard = (r) => ({
  id: String(r.id),
  title: String(r.title || ''),
  severity: String(r.severity || 'P3'),
  component: String(r.component || ''),
  confidence: Math.round((Number(r.confidence) || 0) * 100),
  time: relativeTime(r.created_at),
});

const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p.map(String) : []; }
    catch { return []; }
  }
  return [];
};

const simulateTriage = (text) => {
  const t = text.toLowerCase();
  const sev =
    /payment|checkout|purchase|stripe|crash|data.loss|outage/.test(t) ? 'P0' :
    /auth|login|sign.?in|oauth|session|token|upload|500|error/.test(t) ? 'P1' :
    /export|import|pagination|search|slow|broken|missing/.test(t) ? 'P2' : 'P3';
  const comp =
    /checkout|cart|payment|stripe|promo/.test(t) ? 'Payments' :
    /auth|login|oauth|session|token/.test(t) ? 'Auth' :
    /upload|file|storage|s3/.test(t) ? 'Uploads' :
    /search|pagination|filter/.test(t) ? 'Search' :
    /export|csv|import/.test(t) ? 'Export' :
    /dark.?mode|theme|tooltip|avatar|ui|layout/.test(t) ? 'UI' : 'Core';
  const title = deriveTitle(text);
  return {
    title,
    severity: sev,
    component: comp,
    confidence: 72,
    reasoning: `Based on the report, this appears to be a ${sev === 'P0' ? 'critical' : sev === 'P1' ? 'high-severity' : sev === 'P2' ? 'medium' : 'low'} issue in the ${comp} area. Confidence is moderate because this is a simulated triage (agent quota exceeded).`,
    repro: [
      'Reproduce the environment described in the report',
      text.trim().slice(0, 120),
      'Verify the issue is consistently reproducible',
    ],
    labels: [comp.toLowerCase(), sev.toLowerCase(), 'bug'],
    duplicate: null,
  };
};

export default function App() {
  const isMobile = useBreakpoint();
  const accent = ACCENT;
  const shadow = FLAT_SHADOWS ? 'none' : '0 1px 2px rgba(61,58,46,0.05), 0 1px 3px rgba(61,58,46,0.04)';

  const [page, setPage] = useState(DEFAULT_PAGE);
  const [composerText, setComposerText] = useState('');
  const [triageOpen, setTriageOpen] = useState(false);
  const [triageRunning, setTriageRunning] = useState(false);
  const [triage, setTriage] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const [feedback, setFeedback] = useState([]);
  const [activity, setActivity] = useState([]);
  const [board, setBoard] = useState(EMPTY_BOARD);

  const [ghPopover, setGhPopover] = useState(false);
  const [copied, setCopied] = useState(false);

  const toastTimer = useRef(null);
  const dragRef = useRef(null);
  const pollingActive = useRef(false);
  const currentRunRef = useRef({ runId: null, approvalNodeId: null });
  const ghRef = useRef(null);

  useEffect(() => {
    lemmaClient.records.list('feedback', {
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit: 50,
    }).then((res) => {
      const items = res.items || res || [];
      if (items.length) {
        setFeedback(items.map((r) => ({
          id: String(r.id),
          source: String(r.source || 'manual'),
          time: relativeTime(r.created_at),
          status: String(r.status || 'pending'),
          text: String(r.raw_text || ''),
        })));
      }
    }).catch(() => {});

    lemmaClient.records.list('issues', {
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit: 200,
    }).then((res) => {
      const items = res.items || res || [];
      if (!items.length) return;
      const b = { triage: [], approved: [], inProgress: [], done: [] };
      for (const r of items) {
        const col = STATUS_TO_COL[r.status] ?? 'triage';
        b[col].push(issueToCard(r));
      }
      setBoard(b);
    }).catch(() => {});

    refreshActivity();

    return () => { clearTimeout(toastTimer.current); };
  }, []);

  useEffect(() => {
    if (!ghPopover) return;
    const onDown = (e) => { if (ghRef.current && !ghRef.current.contains(e.target)) setGhPopover(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ghPopover]);

  const WEBHOOK_URL = 'https://conform-reassign-retiring.ngrok-free.dev/github';

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };

  const refreshActivity = () => {
    lemmaClient.records.list('operator_runs', {
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit: 100,
    }).then((res) => {
      const items = res.items || res || [];
      if (!items.length) return;
      setActivity(items.map((r) => ({
        id: String(r.id),
        action: formatRunAction(String(r.action || ''), String(r.detail || '')),
        severity: RUN_ACTION_SEV[r.action] ?? 'P3',
        time: relativeTime(r.created_at),
      })));
    }).catch(() => {});
  };

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

  const runTriageWorkflow = async (text, existingFeedbackId = null) => {
    if (!text.trim()) return;

    setTriageOpen(true);
    setTriageRunning(true);
    setTriage(null);
    pollingActive.current = true;
    currentRunRef.current = { runId: null, approvalNodeId: null };

    let feedbackId = existingFeedbackId;

    try {
      // 1. Route through bug_ingest function — fires DATASTORE_EVENT on the triage workflow
      if (!feedbackId) {
        const fb = await lemmaClient.functions.runs.create('bug_ingest', {
          input: { raw_text: text.trim(), source: 'manual' },
        });
        feedbackId = String(fb.output?.feedback_id || fb.id);
        setFeedback((prev) => [{
          id: feedbackId,
          source: 'manual',
          time: '0m',
          status: 'new',
          text: text.trim(),
        }, ...prev]);
      }

      // 2. Poll the issues table for the triage result (up to 2 min, every 3s)
      let issue = null;
      const deadline = Date.now() + 120_000;
      while (pollingActive.current && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await lemmaClient.records.list('issues', {
          sort: [{ field: 'created_at', direction: 'desc' }],
          limit: 20,
        });
        const items = res.items || res || [];
        issue = items.find((r) => String(r.feedback_id) === feedbackId && r.status !== 'duplicate');
        if (issue) break;
      }

      if (!pollingActive.current) return;

      if (!issue) {
        // Timeout — fall back to simulated triage
        const sim = simulateTriage(text);
        setTriage({ ...sim, _id: null, _feedbackId: feedbackId });
        setTriageRunning(false);
        return;
      }

      // 3. Map to TriagePanel shape
      setTriage({
        _id: String(issue.id),
        _feedbackId: feedbackId,
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
      });
      setTriageRunning(false);
      refreshActivity();
    } catch {
      if (!pollingActive.current) return;
      const sim = simulateTriage(text);
      setTriage({ ...sim, _id: null, _feedbackId: feedbackId || null });
      setTriageRunning(false);
    }
  };

  const runTriage = () => { runTriageWorkflow(composerText); setComposerText(''); };

  const openTriage = (text, feedbackId) => runTriageWorkflow(text, feedbackId);

  const approve = async () => {
    const t = triage;
    const { runId, approvalNodeId } = currentRunRef.current;

    if (runId && approvalNodeId) {
      try {
        await lemmaClient.workflows.runs.submitForm(runId, {
          node_id: approvalNodeId,
          inputs: { decision: 'approve' },
        });
      } catch { /* non-fatal */ }
    }

    // Persist approved status to DB; get a stable ID for the board card
    let cardId = 'n' + Date.now();
    try {
      if (t._id) {
        await lemmaClient.records.update('issues', t._id, { status: 'approved' });
        cardId = t._id;
      } else {
        const created = await lemmaClient.records.create('issues', {
          title: t.title,
          severity: t.severity,
          component: t.component || '',
          status: 'approved',
          confidence: t.confidence / 100,
          reasoning: t.reasoning || '',
          repro_steps: t.repro || [],
          labels: t.labels || [],
        });
        cardId = String(created.id);
      }
    } catch { /* non-fatal — keep temp ID */ }

    setBoard((b) => {
      const card = { id: cardId, title: t.title, severity: t.severity, component: t.component, confidence: t.confidence, time: 'now' };
      return { ...b, approved: [card, ...b.approved] };
    });
    setTriageOpen(false);
    pollingActive.current = false;
    currentRunRef.current = { runId: null, approvalNodeId: null };
    flashToast('ok', 'GitHub issue created · ' + t.title);
    const approveEntry = { action: 'approved', detail: t.title };
    if (cardId.includes('-')) approveEntry.issue_id = cardId;
    lemmaClient.records.create('operator_runs', approveEntry).then(refreshActivity).catch(() => {});
    if (t._feedbackId) {
      setFeedback((fb) => fb.map((f) => f.id === t._feedbackId ? { ...f, status: 'triaged' } : f));
      lemmaClient.records.update('feedback', t._feedbackId, { status: 'triaged' }).catch(() => {});
    }
  };

  const reject = async () => {
    const { runId, approvalNodeId } = currentRunRef.current;
    if (runId && approvalNodeId) {
      try {
        await lemmaClient.workflows.runs.submitForm(runId, {
          node_id: approvalNodeId,
          inputs: { decision: 'reject' },
        });
      } catch { /* non-fatal */ }
    }
    setTriageOpen(false);
    pollingActive.current = false;
    currentRunRef.current = { runId: null, approvalNodeId: null };
    flashToast('no', 'Triage rejected');
    lemmaClient.records.create('operator_runs', { action: 'rejected', detail: triage?.title || '' })
      .then(refreshActivity).catch(() => {});
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
    // Persist status change for real DB records (UUIDs contain hyphens)
    const newStatus = COL_TO_STATUS[key];
    if (newStatus && d.id.includes('-')) {
      lemmaClient.records.update('issues', d.id, { status: newStatus }).catch(() => {});
    }
  };

  const dragHandlers = { onDragStart, onDragOver, onDragEnter, onDragEnd, onDrop };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Geist', sans-serif", color: '#3A3528' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? 6 : 16, padding: isMobile ? '10px 14px' : '13px 24px', background: 'rgba(204,213,174,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(61,58,46,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#FEFAE0' }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em', color: '#2F2C20' }}>Operator</span>
        </div>
        <div ref={ghRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setGhPopover((o) => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: "'Geist Mono', monospace", background: ghPopover ? 'rgba(61,58,46,0.14)' : 'rgba(61,58,46,0.08)', borderRadius: 20, padding: '4px 10px', color: '#46442F', userSelect: 'none', border: 'none', cursor: 'pointer', transition: 'background .15s' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8FA76A', flexShrink: 0, display: 'inline-block' }} />
            ⬡ GitHub
          </button>
          {ghPopover && (
            <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', width: 360, background: '#FEFAE0', border: '1px solid rgba(61,58,46,0.15)', borderRadius: 14, boxShadow: '0 4px 24px rgba(61,58,46,0.13)', padding: 18, zIndex: 100 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2F2C20' }}>Connect GitHub</span>
                <button onClick={() => setGhPopover(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9A876C', lineHeight: 1, padding: '0 2px' }}>×</button>
              </div>

              {/* Step 1: start the webhook server */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7C6F4F', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>1 · Start the webhook server</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAEDCD', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 8, padding: '8px 10px' }}>
                  <span style={{ flex: 1, fontSize: 12, fontFamily: "'Geist Mono', monospace", color: '#46442F' }}>node webhook-server/index.js</span>
                  <button
                    onClick={() => navigator.clipboard.writeText('node webhook-server/index.js').catch(() => {})}
                    style={{ flexShrink: 0, background: 'rgba(61,58,46,0.08)', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontFamily: "'Geist Mono', monospace", cursor: 'pointer', color: '#46442F', whiteSpace: 'nowrap' }}
                  >
                    copy
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7C6F4F', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>2 · Webhook URL for GitHub</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAEDCD', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 8, padding: '8px 10px' }}>
                  <span style={{ flex: 1, fontSize: 11.5, fontFamily: "'Geist Mono', monospace", color: '#46442F', wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {WEBHOOK_URL}
                  </span>
                  <button
                    onClick={copyWebhook}
                    style={{ flexShrink: 0, background: copied ? 'rgba(143,167,106,0.22)' : 'rgba(61,58,46,0.08)', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontFamily: "'Geist Mono', monospace", cursor: 'pointer', color: copied ? '#4A6A20' : '#46442F', transition: 'background .15s, color .15s', whiteSpace: 'nowrap' }}
                  >
                    {copied ? '✓ copied' : 'copy'}
                  </button>
                </div>
              </div>

              {/* GitHub setup steps */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7C6F4F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>3 · Add webhook in GitHub</div>
                <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Repo → Settings → Webhooks → Add webhook',
                    'Paste the URL above as Payload URL',
                    'Set Content type to application/json',
                    "Select 'Issues' under events",
                    'Click Save',
                  ].map((step, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: '#46442F', lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
              </div>

              <button
                onClick={() => setGhPopover(false)}
                style={{ width: '100%', background: 'rgba(61,58,46,0.07)', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 8, padding: '8px 0', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', color: '#46442F', fontWeight: 500, transition: 'background .15s' }}
              >
                Done
              </button>
            </div>
          )}
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 3, ...(isMobile && { order: 3, flex: '0 0 100%', justifyContent: 'center' }) }}>
          <button onClick={() => navTo('inbox')} style={navStyle(page === 'inbox', isMobile)}>Inbox</button>
          <button onClick={() => navTo('board')} style={navStyle(page === 'board', isMobile)}>Board</button>
          <button onClick={() => navTo('activity')} style={navStyle(page === 'activity', isMobile)}>Activity</button>
        </nav>
      </header>

      {page === 'inbox' && (
        <Inbox
          accent={accent} shadow={shadow} feedback={feedback} isMobile={isMobile}
          composerText={composerText}
          onComposer={(e) => setComposerText(e.target.value)}
          runTriage={runTriage} openTriage={openTriage}
        />
      )}
      {page === 'board' && (
        <Board accent={accent} shadow={shadow} board={board} dragOver={dragOver} handlers={dragHandlers} isMobile={isMobile} />
      )}
      {page === 'activity' && (
        <Activity accent={accent} shadow={shadow} activity={activity} isMobile={isMobile} />
      )}

      <TriagePanel
        accent={accent} open={triageOpen} running={triageRunning} triage={triage} isMobile={isMobile}
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
