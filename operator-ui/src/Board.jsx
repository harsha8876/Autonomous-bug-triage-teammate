import { HoverDiv } from './Interactive';
import { sevStyle } from './styles';

const COL_DEFS = [
  ['triage', 'Triage'],
  ['approved', 'Approved'],
  ['inProgress', 'In Progress'],
  ['done', 'Done'],
];

export default function Board({ accent, shadow, board, dragOver, handlers, isMobile }) {
  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: isMobile ? '20px 14px 80px' : '28px 22px 90px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? 19 : 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#2F2C20' }}>Board</h1>
        <p style={{ margin: 0, fontSize: isMobile ? 13 : 13.5, color: '#7C795F' }}>Drag cards across columns as triage moves to done.</p>
      </div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, alignItems: 'flex-start', WebkitOverflowScrolling: 'touch' }}>
        {COL_DEFS.map(([key, name]) => {
          const isOver = dragOver === key;
          const cards = board[key];
          return (
            <div key={key} style={{ flex: '1 0 220px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#46442F' }}>{name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9A876C', background: 'rgba(61,58,46,0.07)', borderRadius: 20, padding: '1px 8px', fontFamily: "'Geist Mono', monospace" }}>{cards.length}</span>
              </div>
              <div
                onDragOver={handlers.onDragOver}
                onDragEnter={handlers.onDragEnter(key)}
                onDrop={handlers.onDrop(key)}
                style={{
                  minHeight: 90, display: 'flex', flexDirection: 'column', gap: 10, padding: 8, borderRadius: 12,
                  border: '1px dashed ' + (isOver ? 'rgba(212,163,115,0.85)' : 'transparent'),
                  background: isOver ? 'rgba(250,237,205,0.6)' : 'transparent',
                  transition: 'background .15s, border-color .15s',
                }}
              >
                {cards.map((card) => (
                  <HoverDiv
                    key={card.id}
                    draggable
                    onDragStart={handlers.onDragStart(card.id, key)}
                    onDragEnd={handlers.onDragEnd}
                    baseStyle={{ background: '#FEFAE0', border: '1px solid rgba(61,58,46,0.1)', borderRadius: 11, padding: isMobile ? 11 : 13, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'grab', boxShadow: shadow, transition: 'box-shadow .15s, border-color .15s' }}
                    hoverStyle={{ borderColor: 'rgba(212,163,115,0.6)' }}
                  >
                    <p style={{ margin: 0, fontSize: isMobile ? 12.5 : 13.5, fontWeight: 500, lineHeight: 1.45, color: '#3A3528' }}>{card.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={sevStyle(card.severity)}>{card.severity}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#7C795F', background: 'rgba(61,58,46,0.06)', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />{card.component}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#9A876C', fontFamily: "'Geist Mono', monospace" }}>
                      <span>{card.confidence}% conf</span>
                      <span>{card.time}</span>
                    </div>
                  </HoverDiv>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
