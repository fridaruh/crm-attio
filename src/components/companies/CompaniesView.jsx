import { useState, useRef, useEffect } from 'react';
import { Plus, Search, SlidersHorizontal, ChevronUp, ChevronDown, X, Check } from 'lucide-react';
import { getColor } from '../shared/Avatar';

// ── Company favicon with letter fallback ─────────────────────────────────────
function CompanyLogo({ name, domain }) {
  const [err, setErr] = useState(false);
  const color = getColor(name);
  const clean = (domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();

  if (clean && !err) {
    return (
      <div style={{ width: 24, height: 24, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${clean}&sz=32`}
          alt={name}
          width={24}
          height={24}
          onError={() => setErr(true)}
          style={{ display: 'block', width: 24, height: 24 }}
        />
      </div>
    );
  }
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 5, flexShrink: 0,
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: 'white',
    }}>
      {name.charAt(0)}
    </div>
  );
}

// ── Strength config ───────────────────────────────────────────────────────────
const STRENGTH_CONFIG = {
  'Very strong': { color: '#10B981', order: 5 },
  'Strong':      { color: '#3B82F6', order: 4 },
  'Good':        { color: '#8B5CF6', order: 3 },
  'Weak':        { color: '#F59E0B', order: 2 },
  'Very weak':   { color: '#9CA3AF', order: 1 },
};

const STRENGTHS = ['Very strong', 'Strong', 'Good', 'Weak', 'Very weak'];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Sort header cell ──────────────────────────────────────────────────────────
function SortTh({ label, colKey, sortKey, sortDir, onSort, style = {} }) {
  const active = sortKey === colKey;
  return (
    <th
      onClick={() => onSort(colKey)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: style.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
        <span style={{ color: active ? 'var(--purple)' : undefined }}>{label}</span>
        <span style={{ opacity: active ? 1 : 0.25, color: active ? 'var(--purple)' : 'var(--text-muted)', display: 'flex' }}>
          {active && sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </span>
      </div>
    </th>
  );
}

// ── Filter popover ────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, onClear, anchorRef }) {
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onChange(null); // close signal — handled in parent
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onChange, anchorRef]);

  const activeCount = (filters.strengths.length > 0 ? 1 : 0) +
    (filters.hasDeals ? 1 : 0) + (filters.hasPeople ? 1 : 0);

  function toggleStrength(s) {
    const next = filters.strengths.includes(s)
      ? filters.strengths.filter(x => x !== s)
      : [...filters.strengths, s];
    onChange({ ...filters, strengths: next });
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        width: 260,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        padding: '12px 0',
        animation: 'scaleIn 120ms ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
          Filters {activeCount > 0 && <span style={{ color: 'var(--purple)' }}>({activeCount})</span>}
        </span>
        {activeCount > 0 && (
          <button onClick={onClear} style={{ fontSize: 12, color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Connection strength */}
      <div style={{ padding: '10px 14px 6px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Connection strength
        </div>
        {STRENGTHS.map(s => {
          const cfg = STRENGTH_CONFIG[s];
          const checked = filters.strengths.includes(s);
          return (
            <label
              key={s}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}
            >
              <div
                onClick={() => toggleStrength(s)}
                style={{
                  width: 15, height: 15, borderRadius: 3,
                  border: `1.5px solid ${checked ? 'var(--purple)' : 'var(--border-dark)'}`,
                  background: checked ? 'var(--purple)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, cursor: 'pointer', transition: 'all var(--transition)',
                }}
              >
                {checked && <Check size={9} color="white" strokeWidth={3} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => toggleStrength(s)}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s}</span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Record filters */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Records
        </div>
        {[
          { key: 'hasDeals',  label: 'Has deals' },
          { key: 'hasPeople', label: 'Has people' },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
            <div
              onClick={() => onChange({ ...filters, [key]: !filters[key] })}
              style={{
                width: 15, height: 15, borderRadius: 3,
                border: `1.5px solid ${filters[key] ? 'var(--purple)' : 'var(--border-dark)'}`,
                background: filters[key] ? 'var(--purple)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all var(--transition)',
              }}
            >
              {filters[key] && <Check size={9} color="white" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }} onClick={() => onChange({ ...filters, [key]: !filters[key] })}>
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Sort comparator ───────────────────────────────────────────────────────────
function sortRows(rows, key, dir, contactCounts, dealCounts) {
  return [...rows].sort((a, b) => {
    let av, bv;
    if (key === 'people') { av = contactCounts[a.id] || 0; bv = contactCounts[b.id] || 0; }
    else if (key === 'deals') { av = dealCounts[a.id] || 0; bv = dealCounts[b.id] || 0; }
    else if (key === 'connection_strength') {
      av = STRENGTH_CONFIG[a.connection_strength]?.order ?? 0;
      bv = STRENGTH_CONFIG[b.connection_strength]?.order ?? 0;
    }
    else if (key === 'last_interaction') {
      av = a.last_interaction ? new Date(a.last_interaction).getTime() : 0;
      bv = b.last_interaction ? new Date(b.last_interaction).getTime() : 0;
    }
    else {
      av = String(a[key] || '').toLowerCase();
      bv = String(b[key] || '').toLowerCase();
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return dir === 'asc' ? av - bv : bv - av;
  });
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function CompaniesView({ companies, contacts, deals, onSelectCompany, onAddCompany }) {
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState('last_interaction');
  const [sortDir, setSortDir]     = useState('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters]     = useState({ strengths: [], hasDeals: false, hasPeople: false });
  const filterBtnRef = useRef(null);

  // Pre-compute counts once
  const contactCounts = {};
  const dealCounts    = {};
  contacts.forEach(c => { if (c.company_id) contactCounts[c.company_id] = (contactCounts[c.company_id] || 0) + 1; });
  deals.forEach(d => { if (d.company_id) dealCounts[d.company_id] = (dealCounts[d.company_id] || 0) + 1; });

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  // Filter
  const activeFilterCount = (filters.strengths.length > 0 ? 1 : 0) +
    (filters.hasDeals ? 1 : 0) + (filters.hasPeople ? 1 : 0);

  const filtered = companies.filter(c => {
    const search_l = search.toLowerCase();
    if (search && !(
      c.name?.toLowerCase().includes(search_l) ||
      c.domain?.toLowerCase().includes(search_l) ||
      c.location?.toLowerCase().includes(search_l) ||
      c.description?.toLowerCase().includes(search_l)
    )) return false;
    if (filters.strengths.length && !filters.strengths.includes(c.connection_strength)) return false;
    if (filters.hasDeals  && !dealCounts[c.id])    return false;
    if (filters.hasPeople && !contactCounts[c.id]) return false;
    return true;
  });

  const sorted = sortRows(filtered, sortKey, sortDir, contactCounts, dealCounts);
  const visible = sorted.slice(0, 500);

  // Available sort columns (add/remove based on enrichment coverage)
  const columns = [
    { key: 'name',                label: 'Company',          style: { minWidth: 200 } },
    { key: 'domain',              label: 'Domain',           style: { minWidth: 150 } },
    { key: 'location',            label: 'Country',          style: { minWidth: 120 } },
    { key: 'industry',            label: 'Industry',         style: { minWidth: 130 } },
    { key: 'founded',             label: 'Founded',          style: { minWidth: 80 } },
    { key: 'employees',           label: 'Employees',        style: { minWidth: 100 } },
    { key: 'connection_strength', label: 'Connection',       style: { minWidth: 130 } },
    { key: 'last_interaction',    label: 'Last interaction', style: { minWidth: 130 } },
    { key: 'people',              label: 'People',           style: { minWidth: 60, textAlign: 'right' } },
    { key: 'deals',               label: 'Deals',            style: { minWidth: 60, textAlign: 'right' } },
  ];

  const thProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="view-header-title">Companies</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>
              {filtered.length.toLocaleString()} companies
            </span>
          </div>
          <div className="view-header-tabs">
            <button className="view-tab active">All companies</button>
          </div>
        </div>
        <div className="view-header-right">
          <div className="search-input">
            <Search size={13} color="var(--text-muted)" />
            <input placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Filter button */}
          <div style={{ position: 'relative' }}>
            <button
              ref={filterBtnRef}
              className="btn-secondary"
              onClick={() => setShowFilter(v => !v)}
              style={activeFilterCount > 0 ? { borderColor: 'var(--purple)', color: 'var(--purple)', background: 'var(--purple-light)' } : {}}
            >
              <SlidersHorizontal size={13} />
              Filter
              {activeFilterCount > 0 && (
                <span style={{ background: 'var(--purple)', color: 'white', borderRadius: 'var(--radius-full)', fontSize: 10.5, fontWeight: 600, padding: '0 5px', minWidth: 16, textAlign: 'center' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilter && (
              <FilterPanel
                filters={filters}
                anchorRef={filterBtnRef}
                onChange={(next) => {
                  if (next === null) { setShowFilter(false); return; }
                  setFilters(next);
                }}
                onClear={() => setFilters({ strengths: [], hasDeals: false, hasPeople: false })}
              />
            )}
          </div>

          <button className="btn-primary" onClick={onAddCompany}>
            <Plus size={14} />
            New company
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="view-content" style={{ overflowY: 'auto', overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <SortTh key={col.key} label={col.label} colKey={col.key} style={col.style} {...thProps} />
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(company => {
              const cfg = STRENGTH_CONFIG[company.connection_strength];
              const cc  = contactCounts[company.id] || 0;
              const dc  = dealCounts[company.id]    || 0;

              return (
                <tr key={company.id} onClick={() => onSelectCompany(company)}>
                  {/* Company name */}
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CompanyLogo name={company.name} domain={company.domain} />
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {company.name}
                      </span>
                    </div>
                  </td>

                  {/* Domain */}
                  <td>
                    {company.domain ? (
                      <span
                        onClick={e => { e.stopPropagation(); window.open(`https://${company.domain}`, '_blank'); }}
                        style={{ color: 'var(--purple)', fontSize: 12.5, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {company.domain}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Country */}
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    {company.location || '—'}
                  </td>

                  {/* Industry */}
                  <td>
                    {company.industry ? (
                      <span style={{
                        fontSize: 11.5, padding: '2px 7px', borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontWeight: 450,
                        whiteSpace: 'nowrap',
                      }}>
                        {company.industry}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>

                  {/* Founded */}
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
                    {company.founded || '—'}
                  </td>

                  {/* Employees */}
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    {company.employees || '—'}
                  </td>

                  {/* Connection strength */}
                  <td>
                    {cfg ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{company.connection_strength}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>

                  {/* Last interaction */}
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    {formatDate(company.last_interaction)}
                  </td>

                  {/* People */}
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12.5, fontWeight: cc > 0 ? 500 : 400, color: cc > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                      {cc || '—'}
                    </span>
                  </td>

                  {/* Deals */}
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12.5, fontWeight: dc > 0 ? 500 : 400, color: dc > 0 ? 'var(--purple)' : 'var(--text-muted)' }}>
                      {dc || '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">
            <h3>No companies found</h3>
            <p>{activeFilterCount > 0 ? 'Try adjusting the filters.' : 'Try adjusting your search or add a new company.'}</p>
          </div>
        )}

        {sorted.length > 500 && (
          <div style={{ padding: '10px 20px', fontSize: 12.5, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            Showing first 500 of {sorted.length.toLocaleString()} — use search or filters to narrow down
          </div>
        )}

        {/* Footer count */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
          fontSize: 12,
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          {filtered.length.toLocaleString()} count
        </div>
      </div>
    </div>
  );
}
