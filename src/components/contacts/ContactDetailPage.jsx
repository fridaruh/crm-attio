import { useState } from 'react';
import {
  ArrowLeft, ChevronRight, Mail, Copy, Link2, Plus,
  Trash2, Check, Calendar, Building2, X, Users,
} from 'lucide-react';
import Avatar, { getColor } from '../shared/Avatar';
import { STAGE_CONFIG, formatCurrency } from '../deals/DealCard';

const STRENGTH_CONFIG = {
  'Very strong': { color: '#10B981' },
  'Strong':      { color: '#3B82F6' },
  'Good':        { color: '#8B5CF6' },
  'Weak':        { color: '#F59E0B' },
  'Very weak':   { color: '#9CA3AF' },
};

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

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? null : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Company favicon ───────────────────────────────────────────────────────────
function CompanyFavicon({ name, domain, size = 20 }) {
  const [err, setErr] = useState(false);
  const clean = (domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
  if (clean && !err) {
    return (
      <div style={{ width: size, height: size, borderRadius: 4, overflow: 'hidden', background: '#F3F4F6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={`https://www.google.com/s2/favicons?domain=${clean}&sz=32`} alt={name} width={size} height={size} onError={() => setErr(true)} style={{ display: 'block' }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 4, background: getColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {name.charAt(0)}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ contact, contacts, onBack }) {
  const idx = contacts.findIndex(c => String(c.id) === String(contact.id));
  const counter = idx >= 0 ? `${idx + 1} of ${contacts.length} in Recently Contacted People` : '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
      <button onClick={onBack} className="btn-ghost" style={{ padding: '4px 8px' }}>
        <ArrowLeft size={14} /> People
      </button>
      <ChevronRight size={13} color="var(--text-muted)" />
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {contact.name}
      </span>
      {counter && <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{counter}</span>}
    </div>
  );
}

// ── FieldRow ──────────────────────────────────────────────────────────────────
function FieldRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 90, flexShrink: 0, paddingTop: 2, fontWeight: 450 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

// ── LeftPanel ─────────────────────────────────────────────────────────────────
function LeftPanel({ contact, companies, updateContact }) {
  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue]     = useState('');

  const company = companies.find(c => String(c.id) === String(contact.company_id));

  const inputStyle = {
    width: '100%', padding: '3px 7px',
    border: '1px solid var(--purple)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, background: 'var(--bg)', outline: 'none',
    boxShadow: '0 0 0 3px rgba(124,92,252,0.12)', fontFamily: 'inherit',
  };

  const clickable = {
    fontSize: 13, color: 'var(--text)', cursor: 'text',
    borderRadius: 'var(--radius-sm)', padding: '2px 4px', margin: '-2px -4px',
    display: 'inline-block', transition: 'background var(--transition)',
  };

  function startEdit(field, value) { setEditingField(field); setFieldValue(value ?? ''); }

  function commitEdit(field) {
    if (fieldValue !== String(contact[field] ?? '')) updateContact(contact.id, { [field]: fieldValue });
    setEditingField(null);
  }

  function handleKey(e, field) {
    if (e.key === 'Enter') commitEdit(field);
    if (e.key === 'Escape') setEditingField(null);
  }

  return (
    <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '20px 20px 40px' }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Avatar name={contact.name} size="xl" />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingField === 'name' ? (
            <input autoFocus value={fieldValue} onChange={e => setFieldValue(e.target.value)}
              onBlur={() => commitEdit('name')} onKeyDown={e => handleKey(e, 'name')}
              style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }} />
          ) : (
            <h1 onClick={() => startEdit('name', contact.name)} title="Click to edit"
              style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px', cursor: 'text', lineHeight: 1.3 }}>
              {contact.name}
            </h1>
          )}
          {contact.title && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{contact.title}</div>}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {[{ icon: Mail, label: 'Email' }, { icon: Copy, label: 'Copy' }, { icon: Link2, label: 'Link' }].map(({ icon: Icon, label }) => (
          <button key={label} className="btn-secondary" style={{ padding: '3px 9px', fontSize: 12 }}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        Record details
      </div>

      {/* Name */}
      <FieldRow label="Name">
        {editingField === 'name' ? null : (
          <span style={clickable} onClick={() => startEdit('name', contact.name)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {contact.name}
          </span>
        )}
      </FieldRow>

      {/* Email */}
      <FieldRow label="Email">
        {editingField === 'email' ? (
          <input autoFocus value={fieldValue} onChange={e => setFieldValue(e.target.value)}
            onBlur={() => commitEdit('email')} onKeyDown={e => handleKey(e, 'email')}
            type="email" style={inputStyle} />
        ) : (
          <span style={{ ...clickable, color: contact.email ? 'var(--purple)' : 'var(--text-muted)' }}
            onClick={() => startEdit('email', contact.email)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {contact.email || 'Add email'}
          </span>
        )}
      </FieldRow>

      {/* Title */}
      <FieldRow label="Job title">
        {editingField === 'title' ? (
          <input autoFocus value={fieldValue} onChange={e => setFieldValue(e.target.value)}
            onBlur={() => commitEdit('title')} onKeyDown={e => handleKey(e, 'title')} style={inputStyle} />
        ) : (
          <span style={{ ...clickable, color: contact.title ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => startEdit('title', contact.title)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {contact.title || 'Add title'}
          </span>
        )}
      </FieldRow>

      {/* Department */}
      <FieldRow label="Department">
        {editingField === 'department' ? (
          <input autoFocus value={fieldValue} onChange={e => setFieldValue(e.target.value)}
            onBlur={() => commitEdit('department')} onKeyDown={e => handleKey(e, 'department')} style={inputStyle} />
        ) : (
          <span style={{ ...clickable, color: contact.department ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => startEdit('department', contact.department)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {contact.department || 'Add department'}
          </span>
        )}
      </FieldRow>

      {/* Company */}
      <FieldRow label="Company">
        {editingField === 'company_id' ? (
          <>
            <input autoFocus list="cdp-company-list" value={fieldValue} placeholder="Search company…"
              onChange={e => {
                setFieldValue(e.target.value);
                const match = companies.find(c => c.name === e.target.value);
                if (match) { updateContact(contact.id, { company_id: match.id }); setEditingField(null); }
              }}
              onBlur={() => setEditingField(null)} style={inputStyle} />
            <datalist id="cdp-company-list">
              {companies.slice(0, 300).map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => startEdit('company_id', company?.name || '')}>
            {company ? (
              <>
                <CompanyFavicon name={company.name} domain={company.domain} size={16} />
                <span style={{ fontSize: 13 }}>{company.name}</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add company</span>
            )}
          </div>
        )}
      </FieldRow>

      {/* Phone */}
      <FieldRow label="Phone">
        {editingField === 'phone' ? (
          <input autoFocus value={fieldValue} onChange={e => setFieldValue(e.target.value)}
            onBlur={() => commitEdit('phone')} onKeyDown={e => handleKey(e, 'phone')}
            type="tel" style={inputStyle} />
        ) : (
          <span style={{ ...clickable, color: contact.phone ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => startEdit('phone', contact.phone)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {contact.phone || 'Add phone'}
          </span>
        )}
      </FieldRow>
    </div>
  );
}

// ── Highlights grid ───────────────────────────────────────────────────────────
function HighlightCard({ label, children }) {
  return (
    <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}

// ── OverviewTab ───────────────────────────────────────────────────────────────
function OverviewTab({ contact, companies, deals, activities }) {
  const company = companies.find(c => String(c.id) === String(contact.company_id));
  const contactDeals = deals.filter(d => String(d.contact_id) === String(contact.id));
  const strength = STRENGTH_CONFIG[contact.connection_strength];

  // Activities from deals linked to this contact
  const relatedActivities = activities.filter(a =>
    contactDeals.some(d => String(d.id) === String(a.deal_id))
  );

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        Highlights
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
        {/* Connection strength */}
        <HighlightCard label="Connection strength">
          {strength ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: strength.color }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{contact.connection_strength}</span>
            </div>
          ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>}
        </HighlightCard>

        {/* Last email */}
        <HighlightCard label="Last email">
          {contact.last_email ? (
            <span style={{ fontSize: 13, fontWeight: 500 }}>{fmtDate(contact.last_email)}</span>
          ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No emails</span>}
        </HighlightCard>

        {/* Company */}
        <HighlightCard label="Company">
          {company ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CompanyFavicon name={company.name} domain={company.domain} size={22} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{company.name}</div>
                {(company.location || company.industry) && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {[company.industry, company.location].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No company linked</span>}
        </HighlightCard>

        {/* Email address */}
        <HighlightCard label="Email address">
          {contact.email ? (
            <a href={`mailto:${contact.email}`} style={{ fontSize: 13, color: 'var(--purple)', textDecoration: 'none', fontWeight: 500, wordBreak: 'break-all' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              {contact.email}
            </a>
          ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No email</span>}
        </HighlightCard>

        {/* Last meeting */}
        <HighlightCard label="Last meeting">
          {contact.last_calendar ? (
            <span style={{ fontSize: 13, fontWeight: 500 }}>{fmtDate(contact.last_calendar)}</span>
          ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No meetings</span>}
        </HighlightCard>

        {/* Deals */}
        <HighlightCard label="Deals">
          {contactDeals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {contactDeals.slice(0, 2).map(d => {
                const stage = STAGE_CONFIG[d.stage] || STAGE_CONFIG['Lead'];
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="stage-badge" style={{ color: stage.color, background: stage.bg, fontSize: 10.5 }}>{stage.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  </div>
                );
              })}
              {contactDeals.length > 2 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{contactDeals.length - 2} more</span>}
            </div>
          ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No deals</span>}
        </HighlightCard>
      </div>

      {/* Activity */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        Activity
      </div>
      <ActivityList activities={relatedActivities.slice(0, 6)} />
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
  if (!activities.length) return (
    <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 16 }}>Sin actividad aún.</p>
  );
  return (
    <div>
      {activities.map(act => {
        const cfg = ACT_CFG[act.type] || ACT_CFG.updated;
        return (
          <div key={act.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: cfg.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: cfg.color, flexShrink: 0, fontWeight: 600 }}>
              {cfg.symbol}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                <Avatar name={act.actor} size="sm" />
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{act.actor}</span>
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

// ── ActivityTab ───────────────────────────────────────────────────────────────
function ActivityTab({ contact, deals, activities }) {
  const contactDeals = deals.filter(d => String(d.contact_id) === String(contact.id));
  const related = activities.filter(a => contactDeals.some(d => String(d.id) === String(a.deal_id)));
  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <ActivityList activities={related} />
    </div>
  );
}

// ── NotesTab ──────────────────────────────────────────────────────────────────
function NotesTab({ contact, notes, addNote, deleteNote }) {
  const [text, setText] = useState('');
  const contactNotes = (notes || []).filter(n => String(n.contact_id) === String(contact.id));

  function handleAdd() {
    if (!text.trim()) return;
    addNote({ contact_id: contact.id, content: text.trim(), created_by: 'Frida Ruh' });
    setText('');
  }

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add a note…" rows={3}
          style={{ width: '100%', padding: 12, border: 'none', resize: 'none', fontSize: 13, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, background: 'var(--bg)' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button onClick={handleAdd} className="btn-primary" style={{ padding: '4px 12px', fontSize: 12, opacity: text.trim() ? 1 : 0.45 }} disabled={!text.trim()}>
            Save note
          </button>
        </div>
      </div>
      {contactNotes.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notes yet.</p>}
      {contactNotes.map(note => (
        <div key={note.id} style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Avatar name={note.created_by} size="sm" />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{note.created_by}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relativeTime(note.created_at)}</span>
            </div>
            <button onClick={() => deleteNote(note.id)} style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', transition: 'all var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
              <Trash2 size={12} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{note.content}</p>
        </div>
      ))}
    </div>
  );
}

// ── CompanyTab ────────────────────────────────────────────────────────────────
function CompanyTab({ contact, companies, updateContact }) {
  const [search, setSearch] = useState('');
  const company = companies.find(c => String(c.id) === String(contact.company_id));
  const filtered = search.length > 1
    ? companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.domain || '').toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      {company ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Linked company
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 20 }}>
            <CompanyFavicon name={company.name} domain={company.domain} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{company.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {[company.industry, company.location].filter(Boolean).join(' · ') || company.domain}
              </div>
            </div>
            <button onClick={() => updateContact(contact.id, { company_id: null })}
              style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', transition: 'all var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
              <X size={14} />
            </button>
          </div>
          {company.description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{company.description}</p>
          )}
          {company.domain && (
            <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--purple)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              {company.domain}
            </a>
          )}
        </>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>No company linked yet.</p>
      )}

      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, marginTop: company ? 24 : 0 }}>
        {company ? 'Change company' : 'Link a company'}
      </div>
      <div className="search-input" style={{ marginBottom: 6 }}>
        <Building2 size={13} color="var(--text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…" />
      </div>
      {filtered.map(c => (
        <div key={c.id} onClick={() => { updateContact(contact.id, { company_id: c.id }); setSearch(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <CompanyFavicon name={c.name} domain={c.domain} size={20} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
            {c.domain && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.domain}</div>}
          </div>
        </div>
      ))}
      {search.length > 1 && filtered.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 10px' }}>No companies found.</p>
      )}
    </div>
  );
}

// ── ContactDetailPage ─────────────────────────────────────────────────────────
export default function ContactDetailPage({
  contactId, contacts, companies, deals, activities, notes,
  updateContact, addNote, deleteNote,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const contact = contacts.find(c => String(c.id) === String(contactId));

  if (!contact) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Contact not found.
    </div>
  );

  const contactNotes   = (notes || []).filter(n => String(n.contact_id) === String(contact.id));
  const contactDeals   = deals.filter(d => String(d.contact_id) === String(contact.id));
  const relatedActs    = activities.filter(a => contactDeals.some(d => String(d.id) === String(a.deal_id)));

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'activity',  label: 'Activity',  count: relatedActs.length },
    { id: 'notes',     label: 'Notes',     count: contactNotes.length },
    { id: 'company',   label: 'Company',   count: contact.company_id ? 1 : 0 },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <TopBar contact={contact} contacts={contacts} onBack={onBack} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftPanel contact={contact} companies={companies} updateContact={updateContact} />

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`view-tab ${activeTab === tab.id ? 'active' : ''}`}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, padding: '0 5px', minWidth: 16, textAlign: 'center',
                    background: activeTab === tab.id ? 'var(--purple-light)' : 'var(--bg-secondary)',
                    color: activeTab === tab.id ? 'var(--purple)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'overview' && <OverviewTab contact={contact} companies={companies} deals={deals} activities={activities} />}
            {activeTab === 'activity' && <ActivityTab contact={contact} deals={deals} activities={activities} />}
            {activeTab === 'notes'    && <NotesTab contact={contact} notes={notes} addNote={addNote} deleteNote={deleteNote} />}
            {activeTab === 'company'  && <CompanyTab contact={contact} companies={companies} updateContact={updateContact} />}
          </div>
        </div>
      </div>
    </div>
  );
}
