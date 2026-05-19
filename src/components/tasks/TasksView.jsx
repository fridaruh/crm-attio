import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Calendar, User, ArrowUpRight, CheckSquare,
  ChevronDown, ChevronRight, Trash2, X, Building2, Users, TrendingUp,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function parseDateLocal(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d) ? null : d;
}

function formatDueDateLabel(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = parseDateLocal(dateStr);
  if (!d) return null;
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: 'Today', overdue: false };
  if (diff === 1) return { label: 'Tomorrow', overdue: false };
  if (diff < 7)  return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), overdue: false };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
}

function groupTasks(tasks) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const active    = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t =>  t.completed);
  const overdue   = active.filter(t => t.due_date && parseDateLocal(t.due_date) < today);
  const todayList = active.filter(t => { const d = parseDateLocal(t.due_date); return d && d.getTime() === today.getTime(); });
  const upcoming  = active.filter(t => { const d = parseDateLocal(t.due_date); return d && d > today; });
  const noDue     = active.filter(t => !t.due_date);
  return { overdue, today: todayList, upcoming, noDue, completed };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TaskCheckbox({ checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: checked ? 'none' : '1.5px solid var(--border)',
        background: checked ? 'var(--purple)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

const RECORD_ICONS = { deal: TrendingUp, contact: Users, company: Building2 };
const RECORD_COLORS = { deal: '#8B5CF6', contact: '#3B82F6', company: '#10B981' };

function RecordChip({ type, label }) {
  const Icon = RECORD_ICONS[type] || TrendingUp;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, color: RECORD_COLORS[type] || 'var(--text-muted)',
      background: `${RECORD_COLORS[type]}18`,
      padding: '2px 7px', borderRadius: 20, fontWeight: 500,
    }}>
      <Icon size={10} />
      {label}
    </span>
  );
}

function TaskRow({ task, onToggle, onDelete, getRecordLabel }) {
  const [hovered, setHovered] = useState(false);
  const due = formatDueDateLabel(task.due_date);
  const recordLabel = task.record_id ? getRecordLabel(task.record_id, task.record_type) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 20px',
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--bg-secondary)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <TaskCheckbox checked={task.completed} onToggle={() => onToggle(task.id)} />

      <span style={{
        flex: 1, fontSize: 13.5, fontWeight: 400,
        color: task.completed ? 'var(--text-muted)' : 'var(--text)',
        textDecoration: task.completed ? 'line-through' : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {task.title}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {recordLabel && (
          <RecordChip type={task.record_type} label={recordLabel} />
        )}
        {due && (
          <span style={{
            fontSize: 11.5, fontWeight: 500,
            color: due.overdue ? '#EF4444' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Calendar size={11} />
            {due.label}
          </span>
        )}
        <span style={{
          fontSize: 11, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <User size={11} />
          {task.assignee || 'Frida Ruh'}
        </span>
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 2 }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, count, overdue, expanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        width: '100%', padding: '8px 20px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        textAlign: 'left',
      }}
    >
      {expanded ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: overdue ? '#EF4444' : 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.4px',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 500,
        color: overdue ? '#EF4444' : 'var(--text-muted)',
        background: overdue ? '#FEF2F2' : 'var(--border)',
        padding: '1px 6px', borderRadius: 20,
      }}>
        {count}
      </span>
    </button>
  );
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────

function AddRecordPopover({ contacts, companies, deals, onSelect, onClose }) {
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
          style={{
            width: '100%', fontSize: 13, border: 'none', outline: 'none',
            background: 'transparent', color: 'var(--text)',
          }}
        />
      </div>
      {results.length === 0 && q.length > 0 && (
        <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--text-muted)' }}>No results</div>
      )}
      {results.length === 0 && q.length === 0 && (
        <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--text-muted)' }}>Type to search records…</div>
      )}
      {results.map(r => {
        const Icon = RECORD_ICONS[r.type];
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 12px', textAlign: 'left',
              fontSize: 13, color: 'var(--text)',
            }}
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

function CreateTaskModal({ contacts, companies, deals, onSave, onClose }) {
  const [title, setTitle]             = useState('');
  const [dueDate, setDueDate]         = useState(todayStr());
  const [createMore, setCreateMore]   = useState(false);
  const [linkedRecord, setLinkedRecord] = useState(null);
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
      title: title.trim(),
      due_date: dueDate || null,
      assignee: 'Frida Ruh',
      record_id:   linkedRecord?.id   || null,
      record_type: linkedRecord?.type || null,
      deal_id: linkedRecord?.type === 'deal' ? linkedRecord.id : null,
    });
    if (createMore) {
      setTitle('');
      setLinkedRecord(null);
      inputRef.current?.focus();
    } else {
      onClose();
    }
  }

  function dueDateLabel() {
    if (!dueDate) return 'No date';
    const lbl = formatDueDateLabel(dueDate);
    return lbl ? lbl.label : dueDate;
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.18)',
        }}
      />
      {/* card */}
      <div style={{
        position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
        zIndex: 101, width: 640, background: 'var(--bg)',
        borderRadius: 'var(--radius-lg)', boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        border: '1px solid var(--border)',
        overflow: 'visible',
      }}>
        {/* title bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 18px 10px',
          borderBottom: '1px solid var(--border)',
        }}>
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
            style={{
              width: '100%', fontSize: 15, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--text)',
              fontWeight: 400,
            }}
          />
        </div>

        {/* bottom toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 14px 14px', flexWrap: 'wrap',
        }}>
          {/* Date */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 500,
                color: 'var(--text-secondary)', background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Calendar size={12} />
              {dueDateLabel()}
            </button>
            <input
              ref={dateRef}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
            />
          </div>

          {/* Assignee */}
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 500,
              color: 'var(--text-secondary)', background: 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <User size={12} />
            Assigned to You
          </button>

          {/* Add record */}
          <div style={{ position: 'relative' }}>
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
              {linkedRecord ? linkedRecord.label : 'Add record'}
              {linkedRecord && (
                <span
                  onClick={e => { e.stopPropagation(); setLinkedRecord(null); }}
                  style={{ marginLeft: 2, display: 'flex', alignItems: 'center' }}
                >
                  <X size={11} />
                </span>
              )}
            </button>
            {showRecordPop && (
              <AddRecordPopover
                contacts={contacts}
                companies={companies}
                deals={deals}
                onSelect={r => { setLinkedRecord(r); setShowRecordPop(false); }}
                onClose={() => setShowRecordPop(false)}
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

// ─── Main View ─────────────────────────────────────────────────────────────────

export default function TasksView({ tasks, contacts, companies, deals, onAddTask, onToggleTask, onDeleteTask }) {
  const [showCreate, setShowCreate]   = useState(false);
  const [collapsed, setCollapsed]     = useState({ completed: true });
  const [showCompleted, setShowCompleted] = useState(false);

  const groups = groupTasks(tasks);

  function toggleSection(key) {
    if (key === 'completed') { setShowCompleted(p => !p); return; }
    setCollapsed(p => ({ ...p, [key]: !p[key] }));
  }

  function getRecordLabel(id, type) {
    if (type === 'deal')    return deals.find(d => d.id === id)?.name    || id;
    if (type === 'contact') return contacts.find(c => c.id === id)?.name || id;
    if (type === 'company') return companies.find(c => c.id === id)?.name || id;
    return id;
  }

  const sections = [
    { key: 'overdue',  label: 'Overdue',      items: groups.overdue,  overdue: true  },
    { key: 'today',    label: 'Today',         items: groups.today,    overdue: false },
    { key: 'upcoming', label: 'Upcoming',      items: groups.upcoming, overdue: false },
    { key: 'noDue',    label: 'No due date',   items: groups.noDue,    overdue: false },
  ].filter(s => s.items.length > 0);

  const totalActive = groups.overdue.length + groups.today.length + groups.upcoming.length + groups.noDue.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="view-header-title">Tasks</span>
            {totalActive > 0 && (
              <span style={{
                fontSize: 12, color: 'var(--text-muted)',
                background: 'var(--bg-secondary)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)', fontWeight: 500,
              }}>
                {totalActive} pending
              </span>
            )}
          </div>
        </div>
        <div className="view-header-right">
          <button className="btn-secondary">
            View settings
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            New task
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="view-content" style={{ overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 16, paddingBottom: 60,
          }}>
            <div style={{ opacity: 0.25 }}>
              <CheckSquare size={56} strokeWidth={1} color="var(--text-muted)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Tasks</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                No tasks yet! Create your first task<br />to get started.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 'var(--radius)',
                background: 'var(--purple)', color: 'white',
                fontSize: 13.5, fontWeight: 600,
              }}
            >
              <Plus size={15} />
              New task
            </button>
          </div>
        ) : (
          /* Task groups */
          <div>
            {sections.map(section => (
              <div key={section.key}>
                <SectionHeader
                  label={section.label}
                  count={section.items.length}
                  overdue={section.overdue}
                  expanded={!collapsed[section.key]}
                  onToggle={() => toggleSection(section.key)}
                />
                {!collapsed[section.key] && section.items.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    getRecordLabel={getRecordLabel}
                  />
                ))}
              </div>
            ))}

            {/* Completed section */}
            {groups.completed.length > 0 && (
              <div>
                <SectionHeader
                  label="Completed"
                  count={groups.completed.length}
                  overdue={false}
                  expanded={showCompleted}
                  onToggle={() => setShowCompleted(p => !p)}
                />
                {showCompleted && groups.completed.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    getRecordLabel={getRecordLabel}
                  />
                ))}
              </div>
            )}

            {/* Footer count */}
            <div style={{
              padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
            }}>
              {tasks.length.toLocaleString()} task{tasks.length !== 1 ? 's' : ''} total
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTaskModal
          contacts={contacts}
          companies={companies}
          deals={deals}
          onSave={onAddTask}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
