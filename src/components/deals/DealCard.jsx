import { useState, useRef } from 'react';
import { User, DollarSign, CheckSquare, FileText, Clock } from 'lucide-react';
import Avatar from '../shared/Avatar';
import CreateTaskModal from '../shared/CreateTaskModal';

export const STAGE_CONFIG = {
  'Lead':              { color: '#6B7280', bg: '#F9FAFB',  label: 'Lead' },
  'Por realizarse':    { color: '#F59E0B', bg: '#FFFBEB',  label: 'Por realizarse' },
  'Por facturar':      { color: '#8B5CF6', bg: '#F5F3FF',  label: 'Por facturar' },
  'Por recibir pago':  { color: '#3B82F6', bg: '#EFF6FF',  label: 'Por recibir pago' },
  'Pagado':            { color: '#10B981', bg: '#ECFDF5',  label: 'Pagado' },
};

export function formatCurrency(value, currency = 'MXN') {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const n = Math.floor((Date.now() - d.getTime()) / 86400000);
  return n >= 0 ? n : null;
}

function Row({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0' }}>
      <span style={{ color: '#9CA3AF', display: 'flex', width: 16, flexShrink: 0, justifyContent: 'center' }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}


// ─── Note popover ──────────────────────────────────────────────────────────────
function NotePopover({ deal, notes, onAddNote, onClose }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const dealNotes = notes.filter(n => String(n.deal_id) === String(deal.id));

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleAdd() {
    if (!text.trim()) return;
    onAddNote({ deal_id: deal.id, content: text.trim(), created_by: 'Frida Ruh' });
    setText('');
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 60,
        width: 230, background: 'white', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: 10,
      }}
    >
      {dealNotes.length > 0 && (
        <div style={{ marginBottom: 8, maxHeight: 80, overflowY: 'auto' }}>
          {dealNotes.slice(0, 3).map(n => (
            <div key={n.id} style={{
              fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {n.content}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd();
        }}
        placeholder="Add a note… (⌘↵ to save)"
        rows={2}
        style={{
          width: '100%', fontSize: 12.5, padding: '5px 8px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          outline: 'none', fontFamily: 'inherit', color: 'var(--text)',
          resize: 'none', boxSizing: 'border-box', marginBottom: 5,
        }}
      />
      <button
        onClick={handleAdd}
        style={{
          width: '100%', fontSize: 12, padding: '5px', borderRadius: 'var(--radius-sm)',
          background: 'var(--purple)', color: 'white', fontWeight: 600,
        }}
      >
        Save note
      </button>
    </div>
  );
}

// ─── Footer icon button ────────────────────────────────────────────────────────
function FooterIcon({ icon: Icon, active, count, onClick }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '2px 4px', borderRadius: 4,
        background: active ? 'var(--purple-light)' : 'transparent',
        color: active ? 'var(--purple)' : '#9CA3AF',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; } }}
    >
      <Icon size={13} />
      {count > 0 && <span style={{ fontSize: 10.5, fontWeight: 600 }}>{count}</span>}
    </button>
  );
}

// ─── Main card ─────────────────────────────────────────────────────────────────
export default function DealCard({
  deal, company,
  tasks = [], onAddTask,
  notes = [], onAddNote,
  onClick, isDragging,
}) {
  const [openPopover, setOpenPopover] = useState(null); // 'task' | 'note' | null
  const days = daysSince(deal.date);

  const pendingTasks = tasks.filter(t => String(t.deal_id) === String(deal.id) && !t.completed);
  const dealNotes    = notes.filter(n => String(n.deal_id) === String(deal.id));

  function togglePopover(name) {
    setOpenPopover(p => p === name ? null : name);
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
        padding: '14px 14px 12px', cursor: 'pointer', userSelect: 'none',
        boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
        transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
    >
      {/* Header */}
      <div style={{ marginBottom: 11 }}>
        <span style={{
          fontWeight: 600, fontSize: 13.5, color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'block',
        }}>
          {deal.name}
        </span>
      </div>

      {/* Owner */}
      <Row icon={<User size={14} />}>
        <Avatar name={deal.owner || 'Frida Ruh'} size="sm" />
        <span style={{ fontSize: 13, color: '#111827' }}>{deal.owner || '—'}</span>
      </Row>

      {/* Value */}
      <Row icon={<DollarSign size={14} />}>
        {deal.value > 0
          ? <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{formatCurrency(deal.value, deal.currency)}</span>
          : <span style={{ fontSize: 13, color: '#9CA3AF' }}>—</span>
        }
      </Row>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 11, paddingTop: 10, borderTop: '1px solid #F3F4F6',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FooterIcon
            icon={FileText}
            active={openPopover === 'note'}
            count={dealNotes.length}
            onClick={() => togglePopover('note')}
          />
          <FooterIcon
            icon={CheckSquare}
            active={openPopover === 'task'}
            count={pendingTasks.length}
            onClick={() => togglePopover('task')}
          />
        </div>

        {days !== null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#9CA3AF' }}>
            <Clock size={12} />
            {days}d
          </span>
        )}

        {openPopover === 'task' && (
          <CreateTaskModal
            defaultRecord={{ id: deal.id, type: 'deal', label: deal.name }}
            onSave={(t) => { onAddTask(t); setOpenPopover(null); }}
            onClose={() => setOpenPopover(null)}
          />
        )}
        {openPopover === 'note' && (
          <NotePopover
            deal={deal}
            notes={notes}
            onAddNote={(n) => { onAddNote(n); }}
            onClose={() => setOpenPopover(null)}
          />
        )}
      </div>
    </div>
  );
}
