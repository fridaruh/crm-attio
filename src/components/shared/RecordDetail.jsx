import { useState, useEffect } from 'react';
import { X, Mail, Phone, Globe, Building2, TrendingUp, Users, Calendar, MapPin, Briefcase } from 'lucide-react';
import Avatar, { getColor } from './Avatar';
import { STAGE_CONFIG, formatCurrency } from '../deals/DealCard';
import { enrichCompanyByDomain, getApiKey, isEnriched } from '../../utils/enrichCompany';

export default function RecordDetail({ record, type, getCompany, getContact, deals, contacts, onClose, onUpdateCompany }) {
  if (!record) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <RecordContent
          record={record}
          type={type}
          getCompany={getCompany}
          getContact={getContact}
          deals={deals}
          contacts={contacts}
          onClose={onClose}
          onUpdateCompany={onUpdateCompany}
        />
      </div>
    </>
  );
}

function RecordContent({ record, type, getCompany, getContact, deals, contacts, onClose, onUpdateCompany }) {
  if (type === 'deal') return <DealDetail deal={record} getCompany={getCompany} getContact={getContact} onClose={onClose} />;
  if (type === 'contact') return <ContactDetail contact={record} getCompany={getCompany} deals={deals} onClose={onClose} />;
  if (type === 'company') return <CompanyDetail company={record} contacts={contacts} deals={deals} onClose={onClose} onUpdateCompany={onUpdateCompany} />;
  return null;
}

function CompanyFavicon({ name, domain, size = 40 }) {
  const [err, setErr] = useState(false);
  const clean = (domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();

  if (clean && !err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 8, overflow: 'hidden',
        background: '#F3F4F6', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${clean}&sz=64`}
          alt={name}
          width={size}
          height={size}
          onError={() => setErr(true)}
          style={{ display: 'block', width: size, height: size, objectFit: 'contain' }}
        />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: getColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'white',
    }}>
      {name.charAt(0)}
    </div>
  );
}

function DrawerHeader({ title, subtitle, avatarName, avatarSize = 'lg', color, domain, onClose }) {
  return (
    <div style={{
      padding: '20px 24px 16px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {avatarName && (
            domain
              ? <CompanyFavicon name={avatarName} domain={domain} size={40} />
              : (
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: color ? 8 : '50%',
                  background: color || getColor(avatarName),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {avatarName.charAt(0)}
                </div>
              )
          )}
          <div>
            <h2 style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.2px',
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            transition: 'all var(--transition)',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, purple, href }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '8px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        width: 130,
        flexShrink: 0,
      }}>
        {Icon && <Icon size={13} color="var(--text-muted)" />}
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 450 }}>{label}</span>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            color: 'var(--purple)',
            flex: 1,
            wordBreak: 'break-all',
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {value}
        </a>
      ) : (
        <span style={{
          fontSize: 13,
          color: purple ? 'var(--purple)' : 'var(--text)',
          flex: 1,
          wordBreak: 'break-word',
        }}>
          {value}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '16px 0 8px',
    }}>
      {children}
    </div>
  );
}

function DealDetail({ deal, getCompany, getContact, onClose }) {
  const company = getCompany(deal.company_id);
  const contact = getContact(deal.contact_id);
  const stage = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.qualification;

  return (
    <>
      <DrawerHeader
        title={deal.name}
        subtitle={company?.name}
        avatarName={deal.name}
        onClose={onClose}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        <SectionTitle>Deal details</SectionTitle>
        <DetailRow icon={TrendingUp} label="Value" value={formatCurrency(deal.value)} />
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '8px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 130, flexShrink: 0 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 450 }}>Stage</span>
          </div>
          <span className="stage-badge" style={{ color: stage.color, background: stage.bg }}>
            {stage.label}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '8px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 130, flexShrink: 0 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 450 }}>Owner</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Avatar name={deal.owner} size="sm" />
            <span style={{ fontSize: 13 }}>{deal.owner}</span>
          </div>
        </div>
        <DetailRow icon={Calendar} label="Close date" value={deal.close_date} />
        <DetailRow icon={Calendar} label="Created" value={deal.created_at} />

        {company && (
          <>
            <SectionTitle>Company</SectionTitle>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: getColor(company.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}>
                {company.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{company.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{company.domain}</div>
              </div>
            </div>
          </>
        )}

        {contact && (
          <>
            <SectionTitle>Contact</SectionTitle>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              <Avatar name={contact.name} size="lg" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{contact.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.title}</div>
              </div>
            </div>
          </>
        )}

        {deal.notes && (
          <>
            <SectionTitle>Notes</SectionTitle>
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}>
              {deal.notes}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function ContactDetail({ contact, getCompany, deals, onClose }) {
  const company = getCompany(contact.company_id);
  const contactDeals = deals.filter(d => String(d.contact_id) === String(contact.id));

  function fmtDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d) ? null : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const subtitle = contact.title
    ? contact.title + (company ? ` at ${company.name}` : '')
    : contact.connection_strength || '';

  return (
    <>
      <DrawerHeader
        title={contact.name}
        subtitle={subtitle}
        avatarName={contact.name}
        onClose={onClose}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        <SectionTitle>Contact info</SectionTitle>
        <DetailRow icon={Mail} label="Email" value={contact.email} purple />
        <DetailRow icon={Phone} label="Phone" value={contact.phone} />
        <DetailRow icon={Briefcase} label="Title" value={contact.title} />
        <DetailRow icon={Users} label="Department" value={contact.department} />
        <DetailRow icon={Calendar} label="Último email" value={fmtDate(contact.last_email)} />
        <DetailRow icon={Calendar} label="Última reunión" value={fmtDate(contact.last_calendar)} />

        {company && (
          <>
            <SectionTitle>Company</SectionTitle>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: getColor(company.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}>
                {company.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{company.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{company.domain}</div>
              </div>
            </div>
          </>
        )}

        {contactDeals.length > 0 && (
          <>
            <SectionTitle>Deals ({contactDeals.length})</SectionTitle>
            {contactDeals.map(deal => {
              const stage = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.qualification;
              return (
                <div key={deal.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  marginBottom: 6,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{deal.name}</div>
                    <span className="stage-badge" style={{ color: stage.color, background: stage.bg, marginTop: 4 }}>
                      {stage.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(deal.value)}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

function CompanyDetail({ company, contacts, deals, onClose, onUpdateCompany }) {
  const [enriching, setEnriching] = useState(false);

  const companyContacts = contacts.filter(c => String(c.company_id) === String(company.id));
  const companyDeals    = deals.filter(d => String(d.company_id) === String(company.id));
  const totalValue      = companyDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  // Auto-enrich on open if not yet enriched
  useEffect(() => {
    if (isEnriched(company) || !company.domain || !onUpdateCompany) return;
    const key = getApiKey();
    if (!key) return;
    setEnriching(true);
    enrichCompanyByDomain(company.domain, key).then(data => {
      if (data) onUpdateCompany(company.id, data);
      setEnriching(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const subtitle = [company.industry, company.location].filter(Boolean).join(' · ');

  return (
    <>
      <DrawerHeader
        title={company.name}
        subtitle={subtitle}
        avatarName={company.name}
        color={getColor(company.name)}
        domain={company.domain}
        onClose={onClose}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {/* Description */}
        {company.description && (
          <div style={{ padding: '12px 0 4px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {company.description}
          </div>
        )}


        <SectionTitle>Company info</SectionTitle>
        <DetailRow icon={Globe}    label="Domain"    value={company.domain}   href={company.domain ? `https://${company.domain.replace(/^https?:\/\//, '')}` : null} />
        <DetailRow icon={MapPin}   label="Location"  value={company.location} />
        <DetailRow icon={Briefcase} label="Industry" value={company.industry} />
        <DetailRow icon={Users}    label="Employees" value={company.employees != null ? String(company.employees) : null} />
        <DetailRow icon={Calendar} label="Founded"   value={company.founded ? String(company.founded) : null} />
        <DetailRow icon={Globe}    label="LinkedIn"  value={company.linkedin} href={company.linkedin ? (company.linkedin.startsWith('http') ? company.linkedin : `https://linkedin.com/company/${company.linkedin}`) : null} />
        <DetailRow icon={Globe}    label="Twitter"   value={company.twitter}  href={company.twitter  ? (company.twitter.startsWith('http')  ? company.twitter  : `https://twitter.com/${company.twitter.replace(/^@/, '')}`) : null} />

        {companyContacts.length > 0 && (
          <>
            <SectionTitle>People ({companyContacts.length})</SectionTitle>
            {companyContacts.map(contact => (
              <div key={contact.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', marginBottom: 6,
              }}>
                <Avatar name={contact.name} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{contact.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contact.title}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {companyDeals.length > 0 && (
          <>
            <SectionTitle>Deals ({companyDeals.length}) · {formatCurrency(totalValue)}</SectionTitle>
            {companyDeals.map(deal => {
              const stage = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.Lead;
              return (
                <div key={deal.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', marginBottom: 6,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{deal.name}</div>
                    <span className="stage-badge" style={{ color: stage.color, background: stage.bg, marginTop: 4, display: 'inline-flex' }}>
                      {stage.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(deal.value)}</span>
                </div>
              );
            })}
          </>
        )}
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
