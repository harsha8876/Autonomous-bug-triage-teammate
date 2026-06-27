import { HoverButton, HoverDiv, FocusInput } from './Interactive';
import { sourceStyle, statusStyle } from './styles';

const statusLabel = { pending: 'Pending', triaged: 'Triaged', duplicate: 'Duplicate' };

function summarizeText(text) {
  const clean = text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/---/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  const sentence = clean.split(/\.\s/)[0];
  return sentence.length > 120 ? sentence.slice(0, 120).trim() + '…' : sentence;
}

const GitHubMark = ({ size = 13 }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const SourceBadge = ({ source }) => {
  if (source !== 'manual' && source !== 'github') return null;
  return (
    <span style={{ ...sourceStyle(), display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {source === 'github' && <GitHubMark size={11} />}
      {source}
    </span>
  );
};

export default function Inbox({ accent, shadow, feedback, composerText, onComposer, runTriage, openTriage }) {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '28px 22px 90px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#2F2C20' }}>Inbox</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: '#7C795F' }}>Incoming feedback waiting to be triaged.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <HoverDiv
          onClick={() => document.getElementById('bug-composer')?.focus()}
          baseStyle={{ flex: 1, cursor: 'pointer', background: '#FEFAE0', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 11, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: shadow, transition: 'border-color .15s, transform .15s' }}
          hoverStyle={{ borderColor: 'rgba(212,163,115,0.75)', transform: 'translateY(-1px)' }}
        >
          <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>✏️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#46442F', marginBottom: 2 }}>Manual entry</div>
            <div style={{ fontSize: 11, color: '#9A876C' }}>Paste a report below</div>
          </div>
        </HoverDiv>
        <HoverDiv
          baseStyle={{ flex: 1, cursor: 'default', background: '#FEFAE0', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 11, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: shadow, transition: 'border-color .15s' }}
          hoverStyle={{ borderColor: 'rgba(61,58,46,0.22)' }}
        >
          <span style={{ flexShrink: 0, color: '#46442F' }}><GitHubMark size={18} /></span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#46442F', marginBottom: 2 }}>GitHub Issues</div>
            <div style={{ fontSize: 11, color: '#9A876C' }}>Auto-triaged via webhook</div>
          </div>
        </HoverDiv>
      </div>

      <div style={{ background: '#FEFAE0', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 14, padding: 18, boxShadow: shadow, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#46442F' }}>New report</span>
          <span style={{ fontSize: 11, color: '#9A876C', fontFamily: "'Geist Mono', monospace" }}>manual entry</span>
        </div>
        <FocusInput
          as="textarea"
          id="bug-composer"
          value={composerText}
          onChange={onComposer}
          placeholder="Paste a bug report…"
          rows={4}
          baseStyle={{ width: '100%', resize: 'vertical', background: '#FAEDCD', border: '1px solid rgba(61,58,46,0.1)', borderRadius: 10, padding: '13px 14px', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.55, color: '#3A3528', outline: 'none', transition: 'border-color .15s' }}
          focusStyle={{ borderColor: 'rgba(212,163,115,0.85)' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#9A876C', lineHeight: 1.4 }}>The agent classifies severity &amp; component, then checks for duplicates.</span>
          <HoverButton
            onClick={runTriage}
            baseStyle={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: accent, color: '#3A2A14', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(61,58,46,0.14)', transition: 'filter .15s' }}
            hoverStyle={{ filter: 'brightness(0.95)' }}
          >
            Triage <span style={{ fontSize: 15, lineHeight: 1 }}>→</span>
          </HoverButton>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '28px 4px 14px' }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#46442F' }}>Recent reports</h2>
        <span style={{ fontSize: 12, color: '#9A876C', fontFamily: "'Geist Mono', monospace" }}>{feedback.length} items</span>
      </div>

      {feedback.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feedback.map((item) => (
            <HoverDiv
              key={item.id}
              onClick={item.status === 'triaged' || item.status === 'duplicate' ? undefined : () => openTriage(item.text, item.id)}
              baseStyle={{ cursor: item.status === 'triaged' || item.status === 'duplicate' ? 'default' : 'pointer', background: '#E9EDC9', border: '1px solid rgba(61,58,46,0.1)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: shadow, transition: 'border-color .15s, transform .15s', opacity: item.status === 'triaged' || item.status === 'duplicate' ? 0.72 : 1 }}
              hoverStyle={item.status === 'triaged' || item.status === 'duplicate' ? {} : { borderColor: 'rgba(212,163,115,0.75)', transform: 'translateY(-1px)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SourceBadge source={item.source} />
                <span style={statusStyle(item.status)}>{statusLabel[item.status]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9A876C', fontFamily: "'Geist Mono', monospace" }}>{item.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#46442F' }}>{summarizeText(item.text)}</p>
            </HoverDiv>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '60px 20px', textAlign: 'center', background: '#FEFAE0', border: '1px dashed rgba(61,58,46,0.2)', borderRadius: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(212,163,115,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(212,163,115,0.55)' }} />
          </div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#46442F' }}>No bug reports yet</p>
          <p style={{ margin: 0, fontSize: 13, color: '#9A876C' }}>Paste one above to get started.</p>
        </div>
      )}
    </main>
  );
}
