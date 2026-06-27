import { HoverButton, HoverDiv, FocusInput } from './Interactive';
import { sourceStyle, statusStyle } from './styles';

const sourceLabel = { manual: 'manual', slack: 'slack', github: 'github' };
const statusLabel = { pending: 'Pending', triaged: 'Triaged', duplicate: 'Duplicate' };

export default function Inbox({ accent, shadow, feedback, composerText, onComposer, runTriage, openTriage }) {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '28px 22px 90px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#2F2C20' }}>Inbox</h1>
        <p style={{ margin: 0, fontSize: 13.5, color: '#7C795F' }}>Incoming feedback waiting to be triaged.</p>
      </div>

      <div style={{ background: '#FEFAE0', border: '1px solid rgba(61,58,46,0.12)', borderRadius: 14, padding: 18, boxShadow: shadow, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#46442F' }}>New report</span>
          <span style={{ fontSize: 11, color: '#9A876C', fontFamily: "'Geist Mono', monospace" }}>manual entry</span>
        </div>
        <FocusInput
          as="textarea"
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
              onClick={() => openTriage(item.text)}
              baseStyle={{ cursor: 'pointer', background: '#E9EDC9', border: '1px solid rgba(61,58,46,0.1)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: shadow, transition: 'border-color .15s, transform .15s' }}
              hoverStyle={{ borderColor: 'rgba(212,163,115,0.75)', transform: 'translateY(-1px)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={sourceStyle(item.source)}>{sourceLabel[item.source] || item.source}</span>
                <span style={statusStyle(item.status)}>{statusLabel[item.status]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9A876C', fontFamily: "'Geist Mono', monospace" }}>{item.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#46442F' }}>{item.text}</p>
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
