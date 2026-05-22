import { useState, useRef, useEffect } from 'react';
import {
  X, Calendar, ArrowUpRight, TrendingUp, Users, Building2,
  CheckSquare, FileText,
} from 'lucide-react';

const RECORD_ICONS  = { deal: TrendingUp, contact: Users, company: Building2 };
const RECORD_COLORS = { deal: '#8B5CF6', contact: '#3B82F6', company: '#10B981' };

const STATUSES = [
  { id: 'todo',        label: 'To Do',       color: '#6B7280', bg: '#F3F4F6' },
  { id: 'in_progress', label: 'In Progress',  color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'done',        label: 'Done',         color: '#10B981', bg: '#D1FAE5' },
];

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

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 130, flexShrink: 0, fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', paddingTop: 4 }}>
        {label}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export default function TaskDetailModal({
  task,
  contacts = [], companies = [], deals = [],
  onSave, onClose,
}) {
  const [title, setTitle]             = useState(task.title || '');
  const [status, setStatus]           = useState(task.status || (task.completed ? 'done' : 'todo'));
  const [dueDate, setDueDate]         = useState(task.due_date || '');
  const [notes, setNotes]             = useState(task.notes || '');
  const [linkedRecord, setLinkedRecord] = useState(
    task.record_id
      ? {
          id:    task.record_id,
          type:  task.record_type,
          label: null, // resolved below via prop lookup
        }
      : null
  );
  const [showRecordPop, setShowRecordPop] = useState(false);
  const [showStatusPop, setShowStatusPop] = useState(false);
  const dateRef  = useRef(null);
  const titleRef = useRef(null);

  // Resolve linked record label from props
  useEffect(() => {
    if (!task.record_id || !task.record_type) return;
    const map = { deal: deals, contact: contacts, company: companies };
    const list = map[task.record_type] || [];
    const found = list.find(r => String(r.id) === String(task.record_id));
    if (found) {
      setLinkedRecord({ id: task.record_id, type: task.record_type, label: found.name });
    }
  }, [task, deals, contacts, companies]);

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
    onSave(task.id, {
      title:       title.trim(),
      status,
      completed:   status === 'done',
      due_date:    dueDate || null,
      notes,
      record_id:   linkedRecord?.id   || null,
      record_type: linkedRecord?.type || null,
      deal_id:     linkedRecord?.type === 'deal' ? linkedRecord.id : null,
    });
    onClose();
  }

  const currentStatus = STATUSES.find(s => s.id === status) || STATUSES[0];

  return (
    <>
      <div
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.18)' }}
      />

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 101, width: 580,
          background: 'var(--bg)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          border: '1px solid var(--border)', overflow: 'visible',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <CheckSquare size={15} color="var(--purple)" />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Edit task</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 20px 20px' }}>

          {/* Title */}
          <div style={{ padding: '16px 0 12px' }}>
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title…"
              style={{
                width: '100%', fontSize: 17, fontWeight: 600,
                border: 'none', outline: 'none', background: 'transparent',
                color: 'var(--text)', lineHeight: 1.3,
              }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }}>

            {/* Status */}
            <Field label="Status">
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowStatusPop(p => !p)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: 12.5, fontWeight: 500,
                    color: currentStatus.color,
                    background: currentStatus.bg,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: currentStatus.color, flexShrink: 0 }} />
                  {currentStatus.label}
                </button>
                {showStatusPop && (
                  <>
                    <div onClick={() => setShowStatusPop(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                      overflow: 'hidden', minWidth: 150,
                    }}>
                      {STATUSES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setStatus(s.id); setShowStatusPop(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '8px 12px', textAlign: 'left',
                            fontSize: 13,
                            color: s.id === status ? s.color : 'var(--text)',
                            background: s.id === status ? s.bg : 'transparent',
                          }}
                          onMouseEnter={e => { if (s.id !== status) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                          onMouseLeave={e => { if (s.id !== status) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Field>

            {/* Due date */}
            <Field label="Due date">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.click()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 500,
                    color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Calendar size={12} />
                  {dueDate || 'No date'}
                </button>
                {dueDate && (
                  <button
                    onClick={() => setDueDate('')}
                    style={{ marginLeft: 4, color: 'var(--text-muted)', verticalAlign: 'middle', display: 'inline-flex' }}
                  >
                    <X size={12} />
                  </button>
                )}
                <input
                  ref={dateRef}
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
                />
              </div>
            </Field>

            {/* Linked record */}
            <Field label="Linked to">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={() => setShowRecordPop(p => !p)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${linkedRecord ? 'var(--purple)' : 'var(--border)'}`,
                    fontSize: 12.5, fontWeight: 500,
                    color: linkedRecord ? 'var(--purple)' : 'var(--text-secondary)',
                    background: linkedRecord ? 'var(--purple-light)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!linkedRecord) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (!linkedRecord) e.currentTarget.style.background = linkedRecord ? 'var(--purple-light)' : 'transparent'; }}
                >
                  {linkedRecord ? (() => { const Icon = RECORD_ICONS[linkedRecord.type]; return Icon ? <Icon size={12} /> : null; })() : <ArrowUpRight size={12} />}
                  {linkedRecord ? (linkedRecord.label || 'Linked record') : 'Add record'}
                  {linkedRecord && (
                    <span
                      onClick={e => { e.stopPropagation(); setLinkedRecord(null); }}
                      style={{ marginLeft: 2, display: 'inline-flex' }}
                    >
                      <X size={11} />
                    </span>
                  )}
                </button>
                {showRecordPop && (
                  <>
                    <div onClick={() => setShowRecordPop(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                    <div style={{ position: 'relative', zIndex: 200 }}>
                      <AddRecordPopover
                        contacts={contacts} companies={companies} deals={deals}
                        onSelect={r => { setLinkedRecord(r); setShowRecordPop(false); }}
                      />
                    </div>
                  </>
                )}
              </div>
            </Field>

            {/* Assignee (read-only) */}
            <Field label="Assignee">
              <span style={{ fontSize: 13, color: 'var(--text)', paddingTop: 2, display: 'inline-block' }}>
                Frida Ruh
              </span>
            </Field>

          </div>

          {/* Notes section */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FileText size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Additional notes
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes, context, or details about this task…"
              rows={5}
              style={{
                width: '100%', fontSize: 13.5, lineHeight: 1.6,
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                padding: '10px 12px', resize: 'vertical',
                background: 'var(--bg-secondary)', color: 'var(--text)',
                outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 13,
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
              padding: '6px 16px', borderRadius: 'var(--radius-sm)',
              background: title.trim() ? 'var(--purple)' : 'var(--border)',
              color: title.trim() ? 'white' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 600,
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
