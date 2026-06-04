/**
 * inject_deals_firestore.js
 * Inyecta eventos del calendario como Deals en Firestore (personal-crm-2e587)
 * Colección: deals | Valor: 100 USD cada uno
 *
 * No requiere service account — usa la REST API de Firestore con el API key
 * del proyecto (las reglas de seguridad permiten escritura abierta).
 *
 * Uso:
 *   node inject_deals_firestore.js
 */

const PROJECT_ID = "personal-crm-2e587";
const API_KEY    = "AIzaSyAd9DGL2-sI5kKR7kxjZgDNwh0BWcd4NmU";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// --- DEALS A INYECTAR ---
const events = [
  // JULIO 2026
  { date: "2026-07-03", name: "Co23 - Tech Lab: Explora, prueba y decide IBTV1" },
  { date: "2026-07-08", name: "Co23 - M2: Experimentación antes de la inversión IBTV1" },
  { date: "2026-07-10", name: "Co23 - M2: Experimentación antes de la inversión IBTV1" },
  { date: "2026-07-15", name: "Co23 - M2: Experimentación antes de la inversión IBTV1" },
  { date: "2026-07-17", name: "Co23 - M2: Experimentación antes de la inversión IBTV1" },
  { date: "2026-07-22", name: "Co23 - M2: Experimentación antes de la inversión IBTV1" },

  // AGOSTO 2026
  { date: "2026-08-19", name: "Innovation Demo Day: Innovation for Business Transformation V1" },

  // SEPTIEMBRE 2026
  { date: "2026-09-01", name: "Co23 - LAB: Innovation for Business Transformation IBTv2" },
  { date: "2026-09-03", name: "Co23 - M2: Innovation for Business Transformation IBTv2" },
  { date: "2026-09-08", name: "Co23 - M2: Innovation for Business Transformation IBTv2" },
  { date: "2026-09-10", name: "Co23 - M2: Innovation for Business Transformation IBTv2" },
  { date: "2026-09-15", name: "Co23 - M2: Innovation for Business Transformation IBTv2" },
  { date: "2026-09-22", name: "Co23 - M2: Innovation for Business Transformation IBTv2" },

  // OCTUBRE 2026
  { date: "2026-10-15", name: "Jurado Mid Review: Innovation for Business Transformation V2" },
];

// Convierte un objeto JS plano al formato de campos de Firestore REST
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === "boolean") {
      fields[key] = { booleanValue: val };
    } else if (typeof val === "number") {
      fields[key] = { doubleValue: val };
    } else {
      fields[key] = { stringValue: String(val) };
    }
  }
  return fields;
}

async function writeDoc(collection, docId, data) {
  const url = `${BASE_URL}/${collection}/${docId}?key=${API_KEY}`;
  const body = JSON.stringify({ fields: toFirestoreFields(data) });

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  return res.json();
}

async function injectDeals() {
  const now       = new Date();
  const createdAt = now.toISOString().split("T")[0];

  console.log(`\nInyectando ${events.length} deals...\n`);

  for (const event of events) {
    const ts    = new Date(event.date + "T08:00:00.000Z").getTime() + Math.floor(Math.random() * 1000);
    const docId = `deal-${ts}`;

    const deal = {
      id:               docId,
      name:             event.name,
      stage:            "Clases",
      value:            100,
      currency:         "USD",
      owner:            "Frida Ruh",
      company_id:       null,
      contact_id:       null,
      notes_text:       "",
      created_at:       createdAt,
      date:             now.toISOString(),
      close_date:       "",
      realizacion_date: event.date,
      archived:         false,
    };

    await writeDoc("deals", docId, deal);
    console.log(`  ✓ [${event.date}] ${event.name}`);
    console.log(`    → ID: ${docId}`);
  }

  console.log(`\n✅ ${events.length} deals inyectados exitosamente.\n`);
}

injectDeals().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
