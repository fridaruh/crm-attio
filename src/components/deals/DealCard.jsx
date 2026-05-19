import { Calendar } from 'lucide-react';
import Avatar, { getColor } from '../shared/Avatar';

export const STAGE_CONFIG = {
  'Lead':              { color: '#6B7280', bg: '#F9FAFB',  label: 'Lead' },
  'Por realizarse':    { color: '#F59E0B', bg: '#FFFBEB',  label: 'Por realizarse' },
  'Por facturar':      { color: '#8B5CF6', bg: '#F5F3FF',  label: 'Por facturar' },
  'Por recibir pago':  { color: '#3B82F6', bg: '#EFF6FF',  label: 'Por recibir pago' },
  'Pagado':            { color: '#10B981', bg: '#ECFDF5',  label: 'Pagado' },
};

const FALLBACK_STAGE = { color: '#6B7280', bg: '#F9FAFB', label: '—' };

export function formatCurrency(value, currency = 'MXN') {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

export default function DealCard({ deal, company, onClick, isDragging }) {
  const stage = STAGE_CONFIG[deal.stage] || FALLBACK_STAGE;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        cursor: 'pointer',
        transition: isDragging ? 'none' : 'box-shadow var(--transition)',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.14)' : 'var(--shadow-xs)',
        transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : 'none',
        userSelect: 'none',
        borderLeft: `3px solid ${stage.color}`,
      }}
      onMouseEnter={e => {
        if (!isDragging) e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={e => {
        if (!isDragging) e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
      }}
    >
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text)',
        marginBottom: 6,
        lineHeight: 1.35,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {deal.name}
      </div>

      {company && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 8,
        }}>
          <div style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            background: getColor(company.name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            {company.name.charAt(0)}
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {company.name}
          </span>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {deal.owner && <Avatar name={deal.owner} size="sm" />}
          {deal.date && (
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
              {formatDate(deal.date)}
            </span>
          )}
        </div>
        {deal.value > 0 && (
          <div style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.3px',
          }}>
            {formatCurrency(deal.value)}
          </div>
        )}
      </div>
    </div>
  );
}
