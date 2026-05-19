import { useState, useRef, useEffect } from 'react';
import { CheckSquare, X, Calendar, ArrowUpRight, TrendingUp, Users, Building2 } from 'lucide-react';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDueDateLabel(dateStr) {
  if (!dateStr) return 'No date';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff < 7)  return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const RECORD_ICONS  = { deal: TrendingUp, contact: Users, company: Building2 };
const RECORD_COLORS = { deal: '#8B5CF6', contact: '#3B82F6', company: '#10B981' };

function AddRecordPopover({ contacts, companies, deals, onSelect }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const lq = q.toLowerCase();
  const results = q.length < 1 ? [] : [
    ...deals.filter(d => d.name?.toLowerCase().includes(lq)).slice(0, 4).map(d => ({ id: d.id, type: 'deal', label: d.name })),
    ...contacts.filter(c => c.name?.toLowerCase().includes(lq)).slice(0, 4).map(c => ({ id: c.id, type: 'contact', label: c.name })),
    ...companies.filter(c => c.name?.toLowerCase().includes(lq)).slice(0, 4).map(c => ({ id: c.id, type: 'company', label: c.name })),
  ].slice(0, 8);

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 200,
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      width: 280, marginTop: 4,
    }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search deals, people, companies…"
          style={{ width: '100%', fontSize: 13, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)' }}
        />
      </div>
      {results.length === 0 && (
        <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--text-muted)' }}>
          {q.length === 0 ? 'Type to search records…' : 'No results'}
        </div>
      )}
      {results.map(r => {
        const Icon = RECORD_ICONS[r.type];
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: 13, color: 'var(--text)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon size={13} color={RECORD_COLORS[r.type]} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{r.type}</span>
          </button>
        );
      })}
    </div>
  );
}

// defaultRecord: { id, type, label } — pre-links a record and locks it (no search popover)
export default function CreateTaskModal({
  defaultRecord = null,
  contacts = [], companies = [], deals = [],
  onSave, onClose,
}) {
  const [title, setTitle]           = useState('');
  const [dueDate, setDueDate]       = useState(todayStr());
  const [createMore, setCreateMore] = useState(false);
  const [linkedRecord, setLinkedRecord] = useState(defaultRecord);
  const [showRecordPop, setShowRecordPop] = useState(false);
  const inputRef = useRef(null);
  const dateRef  = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title:       title.trim(),
      due_date:    dueDate || null,
      assignee:    'Frida Ruh',
      record_id:   linkedRecord?.id   || null,
      record_type: linkedRecord?.type || null,
      deal_id:     linkedRecord?.type === 'deal' ? linkedRecord.id : null,
    });
    if (createMore) {
      setTitle('');
      if (!defaultRecord) setLinkedRecord(null);
      inputRef.current?.focus();
    } else {
      onClose();
    }
  }

  const isLocked = Boolean(defaultRecord);

  return (
    <>
      {/* backdrop — stopPropagation prevents card click-through */}
      <div
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.18)' }}
      />

      {/* card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 101, width: 640, background: 'var(--bg)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          border: '1px solid var(--border)', overflow: 'visible',
        }}
      >
        {/* title bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 10px', borderBottom: '1px solid var(--border)' }}>
          <CheckSquare size={15} color="var(--purple)" />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Create task</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>

        {/* input */}
        <div style={{ padding: '18px 18px 12px' }}>
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Add a task…"
            style={{ width: '100%', fontSize: 15, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontWeight: 400 }}
          />
        </div>

        {/* bottom toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px 14px', flexWrap: 'wrap' }}>

          {/* Date */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 500,
                color: 'var(--text-secondary)', background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Calendar size={12} />
              {formatDueDateLabel(dueDate)}
            </button>
            <input
              ref={dateRef}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
            />
          </div>

          {/* Record link */}
          <div style={{ position: 'relative' }}>
            {isLocked ? (
              /* pre-linked, non-removable */
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--purple)',
                fontSize: 12.5, fontWeight: 500,
                color: 'var(--purple)', background: 'var(--purple-light)',
              }}>
                <ArrowUpRight size={12} />
                1 linked record
              </span>
            ) : (
              <button
                onClick={() => setShowRecordPop(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${linkedRecord ? 'var(--purple)' : 'var(--border)'}`,
                  fontSize: 12.5, fontWeight: 500,
                  color: linkedRecord ? 'var(--purple)' : 'var(--text-secondary)',
                  background: linkedRecord ? 'var(--purple-light)' : 'transparent',
                }}
                onMouseEnter={e => { if (!linkedRecord) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { if (!linkedRecord) e.currentTarget.style.background = 'transparent'; }}
              >
                <ArrowUpRight size={12} />
                {linkedRecord ? `${linkedRecord.label}` : 'Add record'}
                {linkedRecord && (
                  <span onClick={e => { e.stopPropagation(); setLinkedRecord(null); }} style={{ marginLeft: 2, display: 'flex' }}>
                    <X size={11} />
                  </span>
                )}
              </button>
            )}
            {showRecordPop && !isLocked && (
              <AddRecordPopover
                contacts={contacts} companies={companies} deals={deals}
                onSelect={r => { setLinkedRecord(r); setShowRecordPop(false); }}
              />
            )}
          </div>

          {/* Create more toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Create more</span>
            <button
              onClick={() => setCreateMore(p => !p)}
              style={{
                width: 32, height: 18, borderRadius: 9,
                background: createMore ? 'var(--purple)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: createMore ? 16 : 2,
                width: 14, height: 14, borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Cancel + Save */}
          <button
            onClick={onClose}
            style={{
              padding: '5px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 12.5,
              color: 'var(--text-secondary)', background: 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>ESC</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 'var(--radius-sm)',
              background: title.trim() ? 'var(--purple)' : 'var(--border)',
              color: title.trim() ? 'white' : 'var(--text-muted)',
              fontSize: 12.5, fontWeight: 600,
              cursor: title.trim() ? 'pointer' : 'default',
            }}
          >
            Save <span style={{ fontSize: 11, opacity: 0.75 }}>⌘↵</span>
          </button>
        </div>
      </div>
    </>
  );
}
