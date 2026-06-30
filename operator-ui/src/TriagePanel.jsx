import { HoverButton, FocusInput } from './Interactive';
import { sevStyle } from './styles';
import { sevMeta as metaFn } from './data';

export default function TriagePanel({ accent, open, running, triage, onClose, onEditTitle, onApprove, onReject, isMobile, isDuplicate, ingestSimilarity, ingestDuplicateId, ingestDuplicateTitle }) {
  const showResults = open && !running && !!triage;
  const meta = triage ? metaFn(triage.severity) : null;
  const pad = isMobile ? 16 : 22;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .25s ease',
      }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(40,38,28,0.34)' }} />
      <div
        style={{
          position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(560px, 100%)',
          background: '#FEFAE0', borderLeft: '1px solid rgba(61,58,46,0.12)',
          boxShadow: '-14px 0 44px rgba(40,38,28,0.18)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .34s cubic-bezier(.22,.61,.36,1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '12px 16px' : '14px 20px', borderBottom: '1px solid rgba(61,58,46,0.1)', flexShrink: 0, background: '#FEFAE0' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#9A876C', textTransform: 'uppercase', fontFamily: "'Geist Mono', monospace" }}>Triage Review</span>
          <HoverButton
            onClick={onClose}
            baseStyle={{ appearance: 'none', border: 'none', background: 'rgba(61,58,46,0.06)', width: isMobile ? 36 : 28, height: isMobile ? 36 : 28, borderRadius: 8, cursor: 'pointer', color: '#7C795F', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
            hoverStyle={{ background: 'rgba(61,58,46,0.12)' }}
          >✕</HoverButton>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
          {running && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: isMobile ? '48px 24px' : '64px 40px', minHeight: 340 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(212,163,115,0.25)', borderTopColor: accent, animation: 'opspin .8s linear infinite' }} />
              <div style={{ fontSize: isMobile ? 13 : 14, color: '#6B6A52', fontWeight: 600 }}>Submitted for triage…</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontFamily: "'Geist Mono', monospace", fontSize: 12, color: '#9A876C', textAlign: 'left' }}>
                {['report logged to feedback table', 'dedup check running', 'triager agent working', 'waiting for result…'].map((line, i) => (
                  <span key={line} style={{ animation: 'opfade .4s ease both', animationDelay: `${i * 0.3}s` }}>› {line}</span>
                ))}
              </div>
            </div>
          )}

          {showResults && (
            <div style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: isMobile ? 18 : 22 }}>
              {isDuplicate && (
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: 'rgba(212,163,115,0.18)', border: '1px solid rgba(212,163,115,0.55)', borderRadius: 11, padding: '13px 15px' }}>
                  <span style={{ fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>⚠️</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#7A5C2E' }}>Possible Duplicate Detected</span>
                    <span style={{ fontSize: 12.5, color: '#8A6A52', lineHeight: 1.4 }}>
                      This report is {ingestSimilarity}% similar to an existing issue.
                    </span>
                    {ingestDuplicateId && (
                      <span style={{ fontSize: 11.5, fontFamily: "'Geist Mono', monospace", color: '#9A876C' }}>
                        Duplicate of: {ingestDuplicateTitle || ingestDuplicateId.slice(0, 8) + '…'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FocusInput
                  value={triage.title}
                  onChange={onEditTitle}
                  baseStyle={{ width: '100%', fontSize: isMobile ? 17 : 19, fontWeight: 600, color: '#2F2C20', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(61,58,46,0.12)', padding: '4px 0', fontFamily: 'inherit', outline: 'none', letterSpacing: '-0.01em', transition: 'border-color .15s' }}
                  focusStyle={{ borderBottomColor: 'rgba(212,163,115,0.85)' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={sevStyle(triage.severity)}>{triage.severity}</span>
                  <span style={{ fontSize: 12, color: '#7C795F' }}>{meta.name}</span>
                  <span style={{ width: 1, height: 13, background: 'rgba(61,58,46,0.15)' }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B6A52', background: 'rgba(61,58,46,0.06)', borderRadius: 7, padding: '3px 9px', fontWeight: 500 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />{triage.component}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7C795F', fontWeight: 500 }}>
                  <span>Confidence</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", color: '#46442F' }}>{triage.confidence}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 20, background: 'rgba(61,58,46,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${triage.confidence}%`, background: accent, borderRadius: 20, transition: 'width .6s ease' }} />
                </div>
              </div>

              {triage.duplicate && (
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: 'rgba(176,81,62,0.1)', border: '1px solid rgba(176,81,62,0.28)', borderRadius: 11, padding: '13px 15px' }}>
                  <span style={{ color: '#A0432F', fontSize: 15, lineHeight: 1.2, flexShrink: 0 }}>⚠</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#9E4433' }}>{triage.duplicate.similarity}% similar to #{triage.duplicate.issue}</span>
                    <span style={{ fontSize: 12.5, color: '#8A6A52', lineHeight: 1.4 }}>{triage.duplicate.issueTitle}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#9A876C', textTransform: 'uppercase' }}>Reasoning</span>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: isMobile ? 13 : 13.5, lineHeight: 1.6, color: '#6B6A52' }}>{triage.reasoning}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#9A876C', textTransform: 'uppercase' }}>Repro steps</span>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {triage.repro.map((step, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, fontSize: isMobile ? 13 : 13.5, lineHeight: 1.5, color: '#46442F' }}>
                      <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: 'rgba(212,163,115,0.2)', color: '#9A6A33', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Geist Mono', monospace" }}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#9A876C', textTransform: 'uppercase' }}>Labels</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {triage.labels.map((label) => (
                    <span key={label} style={{ fontSize: 12, color: '#6B6A52', background: 'rgba(61,58,46,0.06)', border: '1px solid rgba(61,58,46,0.1)', borderRadius: 7, padding: '3px 9px', fontFamily: "'Geist Mono', monospace" }}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {showResults && (
          <div style={{ display: 'flex', gap: 10, padding: isMobile ? '12px 16px' : '15px 20px', borderTop: '1px solid rgba(61,58,46,0.1)', background: 'rgba(250,237,205,0.7)', flexShrink: 0 }}>
            <HoverButton
              onClick={onReject}
              baseStyle={{ appearance: 'none', background: 'transparent', border: '1px solid rgba(176,81,62,0.4)', color: '#A0432F', borderRadius: 9, padding: isMobile ? '13px 16px' : '10px 16px', minHeight: isMobile ? 44 : undefined, fontSize: isMobile ? 13 : 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'background .15s' }}
              hoverStyle={{ background: 'rgba(176,81,62,0.08)' }}
            >Reject</HoverButton>
            <HoverButton
              onClick={onApprove}
              baseStyle={{ flex: 1, appearance: 'none', background: accent, color: '#3A2A14', border: 'none', borderRadius: 9, padding: isMobile ? '13px 16px' : '10px 16px', minHeight: isMobile ? 44 : undefined, fontSize: isMobile ? 13 : 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 1px 2px rgba(61,58,46,0.14)', transition: 'filter .15s' }}
              hoverStyle={{ filter: 'brightness(0.95)' }}
            >Approve &amp; Create GitHub Issue →</HoverButton>
          </div>
        )}
      </div>
    </div>
  );
}
