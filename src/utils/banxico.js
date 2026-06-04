const TOKEN    = 'db74732611a4f8f1e701b9278f969bf9cd30b2dba23904a5af0502ed237f8110';
const SERIE    = 'SF43718'; // Tipo de cambio USD/MXN — FIX cierre
const FALLBACK = 17.5;      // Usado si la API no responde
const TTL      = 4 * 60 * 60 * 1000; // 4 horas de caché

let _rate   = null;
let _fetchedAt = 0;

export async function getUsdToMxn() {
  if (_rate && Date.now() - _fetchedAt < TTL) return _rate;

  try {
    const res = await fetch(
      `/banxico-api/SieAPIRest/service/v1/series/${SERIE}/datos/oportuno`,
      { headers: { 'Bmx-Token': TOKEN } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const raw  = json?.bmx?.series?.[0]?.datos?.[0]?.dato;
    const rate = parseFloat(raw);
    if (isNaN(rate) || rate <= 0) throw new Error(`Tasa inválida: ${raw}`);
    _rate      = rate;
    _fetchedAt = Date.now();
    return rate;
  } catch (err) {
    console.warn('[Banxico] Usando tasa de respaldo:', err.message);
    return FALLBACK;
  }
}

export function toMxn(value, currency, rate) {
  const v = Number(value) || 0;
  if (currency === 'USD') return v * (rate ?? FALLBACK);
  return v;
}
