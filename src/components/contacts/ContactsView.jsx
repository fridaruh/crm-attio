import { useState } from 'react';
import { Plus, Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from '../shared/Avatar';

const STRENGTH_CONFIG = {
  'Very strong': { color: '#10B981', label: 'Very strong', order: 5 },
  'Strong':      { color: '#3B82F6', label: 'Strong',      order: 4 },
  'Good':        { color: '#8B5CF6', label: 'Good',        order: 3 },
  'Weak':        { color: '#F59E0B', label: 'Weak',        order: 2 },
  'Very weak':   { color: '#9CA3AF', label: 'Very weak',   order: 1 },
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' });
}

function SortTh({ label, colKey, sortKey, sortDir, onSort, style = {} }) {
  const active = sortKey === colKey;
  return (
    <th onClick={() => onSort(colKey)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: active ? 'var(--purple)' : undefined }}>{label}</span>
        <span style={{ opacity: active ? 1 : 0.25, color: active ? 'var(--purple)' : 'var(--text-muted)', display: 'flex' }}>
          {active && sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </span>
      </div>
    </th>
  );
}

function sortContacts(contacts, key, dir) {
  return [...contacts].sort((a, b) => {
    let av, bv;
    if (key === 'connection_strength') {
      av = STRENGTH_CONFIG[a.connection_strength]?.order ?? 0;
      bv = STRENGTH_CONFIG[b.connection_strength]?.order ?? 0;
      return dir === 'asc' ? av - bv : bv - av;
    }
    if (key === 'last_email' || key === 'last_calendar') {
      av = a[key] ? new Date(a[key]).getTime() : 0;
      bv = b[key] ? new Date(b[key]).getTime() : 0;
      return dir === 'asc' ? av - bv : bv - av;
    }
    av = String(a[key] || '').toLowerCase();
    bv = String(b[key] || '').toLowerCase();
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

export default function ContactsView({ contacts, companies, onSelectContact, onAddContact }) {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('last_email');
  const [sortDir, setSortDir] = useState('desc');

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted  = sortContacts(filtered, sortKey, sortDir);
  const visible = sorted.slice(0, 500);
  const thProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="view-header-title">People</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>
              {filtered.length.toLocaleString()} people
            </span>
          </div>
          <div className="view-header-tabs">
            <button className="view-tab active">Recently contacted</button>
          </div>
        </div>

        <div className="view-header-right">
          <div className="search-input">
            <Search size={13} color="var(--text-muted)" />
            <input placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-secondary">
            <SlidersHorizontal size={13} />
            Filter
          </button>
          <button className="btn-primary" onClick={onAddContact}>
            <Plus size={14} />
            New person
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="view-content" style={{ overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <SortTh label="Name"         colKey="name"                style={{ minWidth: 200 }} {...thProps} />
              <SortTh label="Connection"   colKey="connection_strength" style={{ minWidth: 130 }} {...thProps} />
              <SortTh label="Last email"   colKey="last_email"          style={{ minWidth: 120 }} {...thProps} />
              <SortTh label="Last meeting" colKey="last_calendar"       style={{ minWidth: 120 }} {...thProps} />
            </tr>
          </thead>
          <tbody>
            {visible.map(contact => {
              const strength = STRENGTH_CONFIG[contact.connection_strength];
              return (
                <tr key={contact.id} onClick={() => onSelectContact(contact)}>
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={contact.name} />
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contact.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    {strength ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: strength.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{strength.label}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{formatDate(contact.last_email)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{formatDate(contact.last_calendar)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">
            <h3>No people found</h3>
            <p>Try adjusting your search or add a new person.</p>
          </div>
        )}
        {sorted.length > 500 && (
          <div style={{ padding: '12px 20px', fontSize: 12.5, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            Showing first 500 of {filtered.length.toLocaleString()} — use search to filter
          </div>
        )}
      </div>
    </div>
  );
}
