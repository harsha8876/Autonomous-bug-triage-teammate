import { sevStyle } from './styles';

export default function Activity({ accent, shadow, activity, isMobile }) {
  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: isMobile ? '20px 14px 80px' : '28px 22px 90px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? 19 : 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#2F2C20' }}>Activity</h1>
        <p style={{ margin: 0, fontSize: isMobile ? 13 : 13.5, color: '#7C795F' }}>Every run the operator has performed.</p>
      </div>
      <div style={{ background: '#FEFAE0', border: '1px solid rgba(61,58,46,0.1)', borderRadius: 14, overflow: 'hidden', boxShadow: shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 12px' : '11px 16px', borderBottom: '1px solid rgba(61,58,46,0.08)', background: 'rgba(250,237,205,0.55)' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(176,81,62,0.55)' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(193,140,46,0.55)' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(124,123,102,0.45)' }} />
          <span style={{ marginLeft: 6, fontFamily: "'Geist Mono', monospace", fontSize: isMobile ? 11 : 12, color: '#9A876C' }}>operator — activity.log</span>
        </div>
        {activity.map((row) => (
          <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 11, padding: isMobile ? '10px 12px' : '11px 16px', borderBottom: '1px solid rgba(61,58,46,0.06)', fontFamily: "'Geist Mono', monospace", fontSize: isMobile ? 11 : 12.5 }}>
            <span style={{ color: accent, flexShrink: 0, fontWeight: 600 }}>▸</span>
            {!isMobile && <span style={{ color: '#A39E80', flexShrink: 0 }}>[agent]</span>}
            <span style={{ color: '#3A3528', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.action}</span>
            <span style={sevStyle(row.severity)}>{row.severity}</span>
            <span style={{ color: '#A8A488', flexShrink: 0, width: isMobile ? 44 : 64, textAlign: 'right' }}>{row.time}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
