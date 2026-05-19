import { useState } from 'react';
import {
  ArrowLeft, ChevronRight, Mail, List, Copy, Link2,
  Plus, Check, Trash2, X, Calendar, Users, Archive, ArchiveRestore,
} from 'lucide-react';
import Avatar, { getColor } from '../shared/Avatar';
import { STAGE_CONFIG, formatCurrency } from './DealCard';

const STAGES = ['Lead', 'Por realizarse', 'Por facturar', 'Por recibir pago', 'Pagado'];

function relativeTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  if (isNaN(diff)) return '';
  if (diff < 60_000) return 'hace un momento';
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `hace ${Math.floor(diff / 86_400_000)}d`;
  return new Date(isoStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ deal, deals, onBack, onArchive }) {
  const stageDeals = deals.filter(d => d.stage === deal.stage && !d.archived);
  const idx = stageDeals.findIndex(d => String(d.id) === String(deal.id));
  const counter = !deal.archived && idx >= 0 ? `${idx + 1} of ${stageDeals.length} in ${deal.stage}` : '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      flexShrink: 0,
    }}>
      <button onClick={onBack} className="btn-ghost" style={{ padding: '4px 8px' }}>
        <ArrowLeft size={14} />
        Deals
      </button>
      <ChevronRight size={13} color="var(--text-muted)" />
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {deal.name}
      </span>
      {counter && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
          {counter}
        </span>
      )}
      {deal.archived ? (
        <button
          onClick={() => onArchive(deal.id, false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, padding: '5px 12px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
        >
          <ArchiveRestore size={13} />
          Unarchive
        </button>
      ) : (
        <button
          onClick={() => onArchive(deal.id, true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, padding: '5px 12px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', background: 'transparent',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Archive size={13} />
          Archive
        </button>
      )}
    </div>
  );
}

// ── FieldRow (left panel) ─────────────────────────────────────────────────────
function FieldRow({ label, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '7px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        width: 90,
        flexShrink: 0,
        paddingTop: 2,
        fontWeight: 450,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

// ── LeftPanel ─────────────────────────────────────────────────────────────────
function LeftPanel({ deal, contacts, companies, updateDeal }) {
  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue] = useState('');

  const company = companies.find(c => String(c.id) === String(deal.company_id));
  const contact = contacts.find(c => String(c.id) === String(deal.contact_id));
  const stage = STAGE_CONFIG[deal.stage] || STAGE_CONFIG['Lead'];

  function startEdit(field, value) {
    setEditingField(field);
    setFieldValue(value ?? '');
  }

  function commitEdit(field) {
    const current = String(deal[field] ?? '');
    if (fieldValue !== current) {
      updateDeal(deal.id, { [field]: fieldValue });
    }
    setEditingField(null);
  }

  function handleKey(e, field) {
    if (e.key === 'Enter') commitEdit(field);
    if (e.key === 'Escape') setEditingField(null);
  }

  const inputStyle = {
    width: '100%',
    padding: '3px 7px',
    border: '1px solid var(--purple)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    background: 'var(--bg)',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(124,92,252,0.12)',
    fontFamily: 'inherit',
  };

  const clickableValue = {
    fontSize: 13,
    color: 'var(--text)',
    cursor: 'text',
    borderRadius: 'var(--radius-sm)',
    padding: '2px 4px',
    margin: '-2px -4px',
    display: 'inline-block',
    transition: 'background var(--transition)',
  };

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      padding: '20px 20px 40px',
    }}>
      {/* Deal name */}
      {editingField === 'name' ? (
        <input
          autoFocus
          value={fieldValue}
          onChange={e => setFieldValue(e.target.value)}
          onBlur={() => commitEdit('name')}
          onKeyDown={e => handleKey(e, 'name')}
          style={{ ...inputStyle, fontSize: 15, fontWeight: 600, marginBottom: 14, padding: '4px 7px' }}
        />
      ) : (
        <h1
          onClick={() => startEdit('name', deal.name)}
          title="Click to edit"
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.2px',
            color: 'var(--text)',
            marginBottom: 14,
            cursor: 'text',
            lineHeight: 1.35,
          }}
        >
          {deal.name}
        </h1>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {[{ icon: Mail, label: 'Email' }, { icon: List, label: 'List' }, { icon: Copy, label: 'Copy' }, { icon: Link2, label: 'Link' }].map(({ icon: Icon, label }) => (
          <button key={label} className="btn-secondary" style={{ padding: '3px 9px', fontSize: 12 }}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        Record details
      </div>

      {/* Stage */}
      <FieldRow label="Stage">
        {editingField === 'stage' ? (
          <select
            autoFocus
            value={fieldValue}
            onChange={e => { updateDeal(deal.id, { stage: e.target.value }); setEditingField(null); }}
            onBlur={() => setEditingField(null)}
            style={{ ...inputStyle }}
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <span
            className="stage-badge"
            onClick={() => startEdit('stage', deal.stage)}
            style={{ color: stage.color, background: stage.bg, cursor: 'pointer' }}
          >
            {stage.label}
          </span>
        )}
      </FieldRow>

      {/* Owner */}
      <FieldRow label="Owner">
        {editingField === 'owner' ? (
          <input
            autoFocus value={fieldValue}
            onChange={e => setFieldValue(e.target.value)}
            onBlur={() => commitEdit('owner')}
            onKeyDown={e => handleKey(e, 'owner')}
            style={inputStyle}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => startEdit('owner', deal.owner)}>
            <Avatar name={deal.owner} size="sm" />
            <span style={{ fontSize: 13 }}>{deal.owner || '—'}</span>
          </div>
        )}
      </FieldRow>

      {/* Value */}
      <FieldRow label="Value">
        {editingField === 'value' ? (
          <input
            autoFocus type="number" value={fieldValue}
            onChange={e => setFieldValue(e.target.value)}
            onBlur={() => { updateDeal(deal.id, { value: parseFloat(fieldValue) || 0 }); setEditingField(null); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingField(null); }}
            style={inputStyle}
          />
        ) : (
          <span
            style={clickableValue}
            onClick={() => startEdit('value', deal.value)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {deal.value ? formatCurrency(deal.value) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
          </span>
        )}
      </FieldRow>

      {/* Close date */}
      <FieldRow label="Close date">
        {editingField === 'close_date' ? (
          <input
            autoFocus type="date" value={fieldValue}
            onChange={e => setFieldValue(e.target.value)}
            onBlur={() => commitEdit('close_date')}
            onKeyDown={e => handleKey(e, 'close_date')}
            style={inputStyle}
          />
        ) : (
          <span
            style={clickableValue}
            onClick={() => startEdit('close_date', deal.close_date)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {deal.close_date || <span style={{ color: 'var(--text-muted)' }}>Add date</span>}
          </span>
        )}
      </FieldRow>

      {/* Company */}
      <FieldRow label="Company">
        {editingField === 'company_id' ? (
          <>
            <input
              autoFocus
              list="dp-company-list"
              value={fieldValue}
              placeholder="Search company…"
              onChange={e => {
                setFieldValue(e.target.value);
                const match = companies.find(c => c.name === e.target.value);
                if (match) { updateDeal(deal.id, { company_id: match.id }); setEditingField(null); }
              }}
              onBlur={() => setEditingField(null)}
              style={inputStyle}
            />
            <datalist id="dp-company-list">
              {companies.slice(0, 300).map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </>
        ) : (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => startEdit('company_id', company?.name || '')}
          >
            {company ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: 3,
                  background: getColor(company.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {company.name.charAt(0)}
                </div>
                <span style={{ fontSize: 13 }}>{company.name}</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add company</span>
            )}
          </div>
        )}
      </FieldRow>

      {/* Contact */}
      <FieldRow label="Contact">
        {editingField === 'contact_id' ? (
          <>
            <input
              autoFocus
              list="dp-contact-list"
              value={fieldValue}
              placeholder="Search person…"
              onChange={e => {
                setFieldValue(e.target.value);
                const match = contacts.find(c => c.name === e.target.value);
                if (match) { updateDeal(deal.id, { contact_id: match.id }); setEditingField(null); }
              }}
              onBlur={() => setEditingField(null)}
              style={inputStyle}
            />
            <datalist id="dp-contact-list">
              {contacts.slice(0, 300).map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </>
        ) : (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => startEdit('contact_id', contact?.name || '')}
          >
            {contact ? (
              <>
                <Avatar name={contact.name} size="sm" />
                <span style={{ fontSize: 13 }}>{contact.name}</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add person</span>
            )}
          </div>
        )}
      </FieldRow>

      {/* Notes text */}
      <FieldRow label="Notes">
        {editingField === 'notes_text' ? (
          <textarea
            autoFocus rows={3} value={fieldValue}
            onChange={e => setFieldValue(e.target.value)}
            onBlur={() => commitEdit('notes_text')}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        ) : (
          <span
            style={{
              ...clickableValue,
              display: 'block',
              lineHeight: 1.5,
              color: deal.notes_text ? 'var(--text)' : 'var(--text-muted)',
              whiteSpace: 'pre-wrap',
            }}
            onClick={() => startEdit('notes_text', deal.notes_text || '')}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {deal.notes_text || 'Add notes…'}
          </span>
        )}
      </FieldRow>

      {/* Created */}
      <FieldRow label="Created">
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{deal.created_at || '—'}</span>
      </FieldRow>
    </div>
  );
}

// ── ActivityList ──────────────────────────────────────────────────────────────
const ACT_CFG = {
  created:       { symbol: '✦', color: '#7C5CFC' },
  stage_changed: { symbol: '→', color: '#3B82F6' },
  updated:       { symbol: '✎', color: '#6B7280' },
  task_added:    { symbol: '☐', color: '#F59E0B' },
  note_added:    { symbol: '✉', color: '#10B981' },
};

function ActivityList({ activities }) {
  if (!activities.length) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 20 }}>No hay actividad aún.</p>;
  }
  return (
    <div>
      {activities.map(act => {
        const cfg = ACT_CFG[act.type] || ACT_CFG.updated;
        return (
          <div key={act.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: cfg.color + '1A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: cfg.color, flexShrink: 0, fontWeight: 600,
            }}>
              {cfg.symbol}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                <Avatar name={act.actor} size="sm" />
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{act.actor}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{act.description}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relativeTime(act.created_at)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── OverviewTab ───────────────────────────────────────────────────────────────
function OverviewTab({ deal, activities, tasks }) {
  const stageIdx = STAGES.indexOf(deal.stage);
  const progress = stageIdx >= 0 ? ((stageIdx + 1) / STAGES.length) * 100 : 0;
  const stage = STAGE_CONFIG[deal.stage] || STAGE_CONFIG['Lead'];
  const dealActivities = activities.filter(a => String(a.deal_id) === String(deal.id));
  const nextTask = tasks.filter(t => String(t.deal_id) === String(deal.id) && !t.completed)[0];

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        Highlights
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {/* Stage card */}
        <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, fontWeight: 500 }}>Deal stage</div>
          <span className="stage-badge" style={{ color: stage.color, background: stage.bg }}>{stage.label}</span>
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: stage.color, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{STAGES[0]}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{STAGES[STAGES.length - 1]}</span>
            </div>
          </div>
        </div>

        {/* Value card */}
        <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, fontWeight: 500 }}>Deal value</div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {formatCurrency(deal.value)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{deal.currency || 'MXN'}</div>
        </div>

        {/* Owner card */}
        <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Owner</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Avatar name={deal.owner} size="sm" />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{deal.owner || '—'}</span>
          </div>
        </div>

        {/* Next task card */}
        <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Next task</div>
          {nextTask ? (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.4 }}>{nextTask.title}</div>
              {nextTask.due_date && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Calendar size={10} />{nextTask.due_date}
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No pending tasks</span>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        Recent activity
      </div>
      <ActivityList activities={dealActivities.slice(0, 6)} />
    </div>
  );
}

// ── ActivityTab ───────────────────────────────────────────────────────────────
function ActivityTab({ deal, activities }) {
  const dealActivities = activities.filter(a => String(a.deal_id) === String(deal.id));
  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <ActivityList activities={dealActivities} />
    </div>
  );
}

// ── NotesTab ──────────────────────────────────────────────────────────────────
function NotesTab({ deal, notes, addNote, deleteNote }) {
  const [text, setText] = useState('');
  const dealNotes = notes.filter(n => String(n.deal_id) === String(deal.id));

  function handleAdd() {
    if (!text.trim()) return;
    addNote({ deal_id: deal.id, content: text.trim(), created_by: deal.owner || 'Frida Ruh' });
    setText('');
  }

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          style={{
            width: '100%', padding: 12, border: 'none', resize: 'none',
            fontSize: 13, outline: 'none', fontFamily: 'inherit',
            lineHeight: 1.5, background: 'var(--bg)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button
            onClick={handleAdd}
            className="btn-primary"
            style={{ padding: '4px 12px', fontSize: 12, opacity: text.trim() ? 1 : 0.45 }}
            disabled={!text.trim()}
          >
            Save note
          </button>
        </div>
      </div>

      {dealNotes.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notes yet.</p>
      )}

      {dealNotes.map(note => (
        <div key={note.id} style={{
          padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
          marginBottom: 10, background: 'var(--bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Avatar name={note.created_by} size="sm" />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{note.created_by}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relativeTime(note.created_at)}</span>
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', transition: 'all var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {note.content}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── TasksTab ──────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '8px 10px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)', marginBottom: 6,
        background: 'var(--bg)', transition: 'background var(--transition)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
    >
      <button
        onClick={() => onToggle(task.id)}
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
          border: `2px solid ${task.completed ? 'var(--purple)' : 'var(--border-dark)'}`,
          background: task.completed ? 'var(--purple)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--transition)',
        }}
      >
        {task.completed && <Check size={10} color="white" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, lineHeight: 1.4,
          color: task.completed ? 'var(--text-muted)' : 'var(--text)',
          textDecoration: task.completed ? 'line-through' : 'none',
        }}>
          {task.title}
        </div>
        {task.due_date && !task.completed && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Calendar size={10} />{task.due_date}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        style={{ color: 'transparent', padding: 3, borderRadius: 4, display: 'flex', transition: 'all var(--transition)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function TasksTab({ deal, tasks, addTask, toggleTask, deleteTask }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const dealTasks = tasks.filter(t => String(t.deal_id) === String(deal.id));
  const pending = dealTasks.filter(t => !t.completed);
  const done = dealTasks.filter(t => t.completed);

  function handleAdd() {
    if (!title.trim()) return;
    addTask({ deal_id: deal.id, title: title.trim(), due_date: dueDate || null, created_by: deal.owner || 'Frida Ruh' });
    setTitle('');
    setDueDate('');
  }

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20,
        padding: '9px 12px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', background: 'var(--bg)',
      }}>
        <Plus size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task…"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent' }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '2px 7px', fontSize: 12, background: 'var(--bg-secondary)',
            outline: 'none', color: 'var(--text-secondary)',
          }}
        />
        <button
          onClick={handleAdd}
          className="btn-primary"
          style={{ padding: '4px 10px', fontSize: 12, opacity: title.trim() ? 1 : 0.4, flexShrink: 0 }}
          disabled={!title.trim()}
        >
          Add
        </button>
      </div>

      {dealTasks.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No tasks yet.</p>
      )}

      {pending.map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '16px 0 8px' }}>
            Completed ({done.length})
          </div>
          {done.map(t => <TaskItem key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
        </>
      )}
    </div>
  );
}

// ── PeopleTab ─────────────────────────────────────────────────────────────────
function PeopleTab({ deal, contacts, companies, updateDeal }) {
  const [search, setSearch] = useState('');
  const contact = contacts.find(c => String(c.id) === String(deal.contact_id));

  const filtered = search.length > 1
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      {contact ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Associated people (1)
          </div>
          {(() => {
            const co = companies.find(c => String(c.id) === String(contact.company_id));
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', marginBottom: 16,
              }}>
                <Avatar name={contact.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{contact.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {contact.title ? `${contact.title}${co ? ' · ' + co.name : ''}` : (co?.name || contact.email || '')}
                  </div>
                </div>
                <button
                  onClick={() => updateDeal(deal.id, { contact_id: null })}
                  style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', transition: 'all var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })()}
        </>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>No people associated yet.</p>
      )}

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
        {contact ? 'Change person' : 'Add person'}
      </div>
      <div className="search-input" style={{ marginBottom: 6 }}>
        <Users size={13} color="var(--text-muted)" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts…"
        />
      </div>
      {filtered.map(c => (
        <div
          key={c.id}
          onClick={() => { updateDeal(deal.id, { contact_id: c.id }); setSearch(''); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', transition: 'background var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Avatar name={c.name} size="sm" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
            {c.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>}
          </div>
        </div>
      ))}
      {search.length > 1 && filtered.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 10px' }}>No contacts found.</p>
      )}
    </div>
  );
}

// ── DealDetailPage ─────────────────────────────────────────────────────────────
export default function DealDetailPage({
  dealId, deals, contacts, companies,
  activities, tasks, notes,
  updateDeal, archiveDeal, addTask, toggleTask, deleteTask, addNote, deleteNote,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const deal = deals.find(d => String(d.id) === String(dealId));

  if (!deal) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Deal not found.
      </div>
    );
  }

  const dealActivities = activities.filter(a => String(a.deal_id) === String(deal.id));
  const dealTasks = tasks.filter(t => String(t.deal_id) === String(deal.id));
  const dealNotes = notes.filter(n => String(n.deal_id) === String(deal.id));
  const pendingCount = dealTasks.filter(t => !t.completed).length;

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'activity',  label: 'Activity',  count: dealActivities.length },
    { id: 'notes',     label: 'Notes',     count: dealNotes.length },
    { id: 'tasks',     label: 'Tasks',     count: pendingCount },
    { id: 'people',    label: 'People',    count: deal.contact_id ? 1 : 0 },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <TopBar deal={deal} deals={deals} onBack={onBack} onArchive={archiveDeal} />

      {deal.archived && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 20px',
          background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
          fontSize: 12.5, color: '#92400E', flexShrink: 0,
        }}>
          <Archive size={13} />
          This deal is archived and won't appear in the active pipeline.
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftPanel
          deal={deal}
          contacts={contacts}
          companies={companies}
          updateDeal={updateDeal}
        />

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            padding: '0 24px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg)',
            flexShrink: 0,
            overflowX: 'auto',
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`view-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    background: activeTab === tab.id ? 'var(--purple-light)' : 'var(--bg-secondary)',
                    color: activeTab === tab.id ? 'var(--purple)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0px 5px',
                    minWidth: 16,
                    textAlign: 'center',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'overview' && <OverviewTab deal={deal} activities={activities} tasks={tasks} />}
            {activeTab === 'activity' && <ActivityTab deal={deal} activities={activities} />}
            {activeTab === 'notes'    && <NotesTab deal={deal} notes={notes} addNote={addNote} deleteNote={deleteNote} />}
            {activeTab === 'tasks'    && <TasksTab deal={deal} tasks={tasks} addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} />}
            {activeTab === 'people'   && <PeopleTab deal={deal} contacts={contacts} companies={companies} updateDeal={updateDeal} />}
          </div>
        </div>
      </div>
    </div>
  );
}
