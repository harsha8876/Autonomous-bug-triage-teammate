import { sevMeta } from './data';

const MONO = "'Geist Mono', monospace";

const badgePill = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 9px', borderRadius: '6px', fontSize: '11px',
  fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.7,
};

export const sevStyle = (l) => {
  const m = sevMeta(l);
  return { ...badgePill, fontFamily: MONO, color: m.color, background: m.bg, border: '1px solid ' + m.border };
};

export const statusStyle = (s) => {
  const m = {
    pending:   { color: '#7C6F4F', bg: 'rgba(124,111,79,0.14)' },
    triaged:   { color: '#9A6A33', bg: 'rgba(212,163,115,0.26)' },
    duplicate: { color: '#A0432F', bg: 'rgba(176,81,62,0.16)' },
  }[s] || { color: '#7C6F4F', bg: 'rgba(124,111,79,0.14)' };
  return { ...badgePill, fontWeight: 500, color: m.color, background: m.bg };
};

export const sourceStyle = () => ({
  ...badgePill, fontWeight: 500, color: '#6B6A52',
  background: 'rgba(61,58,46,0.06)', border: '1px solid rgba(61,58,46,0.1)', fontFamily: MONO,
});

export const navStyle = (active) => ({
  appearance: 'none', border: 'none', cursor: 'pointer', padding: '7px 13px',
  borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit',
  fontWeight: active ? 600 : 500, color: active ? '#3A3528' : '#7C795F',
  background: active ? 'rgba(212,163,115,0.22)' : 'transparent',
  transition: 'background .15s, color .15s',
});
