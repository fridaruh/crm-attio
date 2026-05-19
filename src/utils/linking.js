/**
 * Given an email address, find a matching company by comparing the email
 * domain against each company's stored domain field.
 *
 * Matching rules (most-to-least specific):
 *  1. Exact match:              user@acme.com   ↔ acme.com
 *  2. Email is a subdomain:     user@mx.acme.com ↔ acme.com
 *
 * Deliberately NOT matching generic providers (gmail, hotmail, outlook, etc.)
 */
const GENERIC_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.com.mx',
  'hotmail.com', 'hotmail.es', 'hotmail.com.mx',
  'outlook.com', 'outlook.es', 'live.com', 'live.com.mx',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
]);

function normalizeDomain(raw) {
  return (raw || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim();
}

export function resolveCompanyFromEmail(email, companies) {
  if (!email || !email.includes('@')) return null;
  const emailDomain = email.split('@')[1]?.toLowerCase().trim();
  if (!emailDomain || GENERIC_DOMAINS.has(emailDomain)) return null;

  return (
    companies.find(c => {
      const cd = normalizeDomain(c.domain);
      if (!cd || cd.length < 3) return false;
      return cd === emailDomain || emailDomain.endsWith('.' + cd);
    }) || null
  );
}

/**
 * Run auto-linking across all contacts: set company_id when email domain matches.
 * Only sets the link if company_id is currently null/undefined.
 */
export function autoLinkContacts(contacts, companies) {
  return contacts.map(c => {
    if (c.company_id || !c.email) return c;
    const company = resolveCompanyFromEmail(c.email, companies);
    return company ? { ...c, company_id: company.id } : c;
  });
}
