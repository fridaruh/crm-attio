import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STAGE_CONFIG } from './DealCard';

const MONTHS      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_S    = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS        = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

function fmtKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const dow   = (first.getDay() + 6) % 7; // Mon=0
  const cells = [];
  for (let i = dow; i > 0; i--)
    cells.push({ d: new Date(year, month, 1 - i), cur: false });
  for (let d = 1; d <= last.getDate(); d++)
    cells.push({ d: new Date(year, month, d), cur: true });
  let n = 1;
  while (cells.length < 42)
    cells.push({ d: new Date(year, month + 1, n++), cur: false });
  return cells;
}

function heatBg(count) {
  if (count === 0) return null;
  const a = Math.min(0.18 + count * 0.15, 0.88);
  return `rgba(124,92,252,${a.toFixed(2)})`;
}

function NavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: 5, borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </button>
  );
}

export default function DealsCalendar({ deals, onSelectDeal }) {
  const today    = new Date();
  const todayKey = fmtKey(today);

  const [mode,  setMode]  = useState('month');
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const byDate = useMemo(() => {
    const map = {};
    deals.forEach(d => {
      if (!d.realizacion_date) return;
      const k = String(d.realizacion_date).slice(0, 10);
      if (!map[k]) map[k] = [];
      map[k].push(d);
    });
    return map;
  }, [deals]);

  function goPrevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function goNextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const modeToggle = (
    <div style={{ display: 'flex', gap: 2, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
      {[['month','Mensual'],['year','Anual']].map(([m, lbl]) => (
        <button key={m} onClick={() => setMode(m)} style={{
          padding: '4px 12px', fontSize: 12, fontWeight: 500,
          borderRadius: 'var(--radius-sm)',
          background: mode === m ? 'white' : 'transparent',
          color: mode === m ? 'var(--text)' : 'var(--text-muted)',
          boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.1s',
        }}>{lbl}</button>
      ))}
    </div>
  );

  // ─── Monthly view ────────────────────────────────────────────────────────────
  if (mode === 'month') {
    const cells = buildGrid(year, month);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <NavBtn onClick={goPrevMonth}><ChevronLeft size={15} /></NavBtn>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 180, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </span>
            <NavBtn onClick={goNextMonth}><ChevronRight size={15} /></NavBtn>
          </div>
          {modeToggle}
        </div>

        {/* Day name header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', margin: '0 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '3px 0 7px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            overflow: 'hidden', marginTop: 10,
          }}>
            {cells.map(({ d, cur }, i) => {
              const key      = fmtKey(d);
              const dayDeals = byDate[key] || [];
              const isToday  = key === todayKey;
              const notLastC = (i + 1) % 7 !== 0;
              const notLastR = i < cells.length - 7;

              return (
                <div key={i} style={{
                  minHeight: 82, padding: '5px',
                  background: cur ? 'var(--bg)' : 'var(--bg-secondary)',
                  borderRight: notLastC ? '1px solid var(--border)' : 'none',
                  borderBottom: notLastR ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', marginBottom: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: isToday ? 700 : 400,
                    color: isToday ? 'white' : cur ? 'var(--text)' : 'var(--text-muted)',
                    background: isToday ? 'var(--purple)' : 'transparent',
                  }}>
                    {d.getDate()}
                  </div>

                  {dayDeals.slice(0, 2).map(deal => {
                    const cfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.Lead;
                    return (
                      <div
                        key={deal.id}
                        onClick={e => { e.stopPropagation(); onSelectDeal(deal); }}
                        title={deal.name}
                        style={{
                          fontSize: 10.5, fontWeight: 500, padding: '1px 5px',
                          borderRadius: 3, marginBottom: 2, cursor: 'pointer', display: 'block',
                          color: cfg.color, background: cfg.bg,
                          border: `1px solid ${cfg.color}33`,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {deal.name}
                      </div>
                    );
                  })}

                  {dayDeals.length > 2 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 3 }}>
                      +{dayDeals.length - 2} más
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Annual heat map ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <NavBtn onClick={() => setYear(y => y - 1)}><ChevronLeft size={15} /></NavBtn>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 50, textAlign: 'center' }}>{year}</span>
          <NavBtn onClick={() => setYear(y => y + 1)}><ChevronRight size={15} /></NavBtn>
        </div>
        {modeToggle}
      </div>

      {/* 4×3 month grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 8px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, alignContent: 'start' }}>
        {Array.from({ length: 12 }, (_, m) => {
          const cells = buildGrid(year, m);
          return (
            <div key={m}
              onClick={() => { setMonth(m); setMode('month'); }}
              style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginBottom: 5, textAlign: 'center' }}>
                {MONTHS_S[m]}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1px', marginBottom: 2 }}>
                {['L','M','M','J','V','S','D'].map((d, i) => (
                  <div key={i} style={{ fontSize: 7, color: 'var(--text-muted)', textAlign: 'center' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1.5px' }}>
                {cells.map(({ d, cur }, i) => {
                  const key   = fmtKey(d);
                  const count = (byDate[key] || []).length;
                  const isT   = key === todayKey;
                  const bg    = isT ? 'var(--purple)' : (cur ? (heatBg(count) ?? 'var(--border)') : 'transparent');

                  return (
                    <div key={i} style={{ position: 'relative', paddingBottom: '100%' }}>
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 1.5,
                        background: bg,
                        opacity: cur ? 1 : 0,
                      }} title={count > 0 && cur
                        ? `${d.toLocaleDateString('es-MX',{day:'numeric',month:'short'})}: ${count} deal${count>1?'s':''}`
                        : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', padding: '8px 24px 14px', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
        <span>Sin deals</span>
        {[0, 1, 2, 4, 6].map((n, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 1.5, background: heatBg(n) ?? 'var(--border)' }} />
        ))}
        <span>Más deals</span>
      </div>
    </div>
  );
}
