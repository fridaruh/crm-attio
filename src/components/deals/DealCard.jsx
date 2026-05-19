import { useState } from 'react';
import { User, DollarSign, CheckSquare, FileText, MessageSquare, Clock, Plus } from 'lucide-react';
import Avatar from '../shared/Avatar';

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
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const n = Math.floor((Date.now() - d.getTime()) / 86400000);
  return n >= 0 ? n : null;
}

function CompanyAvatar({ name }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
      background: '#E5E7EB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#4B5563',
    }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
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

function TaskRow({ deal, tasks, onAddTask }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle]  = useState('');

  const pending = tasks.filter(t => String(t.deal_id) === String(deal.id) && !t.completed);
  const first   = pending[0];

  function handleAdd() {
    if (!title.trim()) return;
    onAddTask({ title: title.trim(), deal_id: deal.id, due_date: null, assignee: 'Frida Ruh' });
    setTitle('');
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0',
          background: 'none',
        }}
      >
        <span style={{ color: '#9CA3AF', display: 'flex', width: 16, flexShrink: 0, justifyContent: 'center' }}>
          <CheckSquare size={14} />
        </span>
        <span style={{
          fontSize: 13, flex: 1, textAlign: 'left',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: first ? 'var(--text)' : '#9CA3AF',
        }}>
          {first ? first.title : 'Add task…'}
        </span>
        {pending.length > 1 && (
          <span style={{
            fontSize: 10.5, fontWeight: 600, flexShrink: 0,
            color: 'var(--purple)', background: 'var(--purple-light)',
            padding: '1px 5px', borderRadius: 10,
          }}>
            +{pending.length - 1}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 60,
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: 10,
          }}
        >
          {pending.length > 0 && (
            <div style={{ marginBottom: 8, maxHeight: 80, overflowY: 'auto' }}>
              {pending.map(t => (
                <div key={t.id} style={{
                  fontSize: 12, color: 'var(--text-secondary)',
                  padding: '2px 0', display: 'flex', alignItems: 'center', gap: 5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  <CheckSquare size={11} color="var(--purple)" />
                  {t.title}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 5 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setOpen(false);
              }}
              placeholder="New task…"
              autoFocus
              style={{
                flex: 1, fontSize: 12.5, padding: '5px 8px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                outline: 'none', fontFamily: 'inherit', color: 'var(--text)',
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                fontSize: 12, padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--purple)', color: 'white', fontWeight: 600,
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealCard({ deal, company, tasks = [], onAddTask, onClick, isDragging }) {
  const days = daysSince(deal.date);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: isDragging
          ? '0 10px 30px rgba(0,0,0,0.15)'
          : '0 1px 2px rgba(0,0,0,0.04)',
        transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        <CompanyAvatar name={company?.name || deal.name} />
        <span style={{
          fontWeight: 600, fontSize: 13.5, color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
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

      {/* Task */}
      <TaskRow deal={deal} tasks={tasks} onAddTask={onAddTask} />

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 11, paddingTop: 10, borderTop: '1px solid #F3F4F6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText   size={13} color="#9CA3AF" />
          <CheckSquare size={13} color="#9CA3AF" />
          <MessageSquare size={13} color="#9CA3AF" />
        </div>
        {days !== null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#9CA3AF' }}>
            <Clock size={12} />
            {days}d
          </span>
        )}
      </div>
    </div>
  );
}
