const CACHE_KEY   = 'attio-enrich-cache-v1';
const API_KEY_KEY = 'attio-abstract-api-key';

export const getApiKey  = () => localStorage.getItem(API_KEY_KEY) || '';
export const saveApiKey = (k) => localStorage.setItem(API_KEY_KEY, k.trim());

function cleanDomain(raw) {
  return (raw || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
}

function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function setCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

/**
 * Fetches enrichment data from Abstract API for a given domain.
 * Returns a partial company object with the enriched fields, or null on failure.
 * Results are cached in localStorage so each domain is only fetched once.
 */
export async function enrichCompanyByDomain(domain, apiKey) {
  const key = cleanDomain(domain);
  if (!key || !apiKey) return null;

  const cache = getCache();
  if (cache[key]) return cache[key]; // already enriched

  try {
    const url = `https://companyenrichment.abstractapi.com/v1/?api_key=${apiKey}&domain=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    if (d.error) return null;

    const enriched = {
      _enriched:    true,
      description:  d.long_description || d.description || '',
      location:     d.country          || '',
      founded:      d.year_founded     ? String(d.year_founded) : '',
      employees:    d.employees_count  || null,
      industry:     d.industry         || '',
      linkedin:     d.linkedin_url     || '',
      twitter:      d.twitter_url      || '',
    };

    cache[key] = enriched;
    setCache(cache);
    return enriched;
  } catch {
    return null;
  }
}

export function isEnriched(company) {
  return !!company?._enriched;
}
