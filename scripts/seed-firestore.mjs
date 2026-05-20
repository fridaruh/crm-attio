import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAd9DGL2-sI5kKR7kxjZgDNwh0BWcd4NmU',
  authDomain: 'personal-crm-2e587.firebaseapp.com',
  projectId: 'personal-crm-2e587',
  storageBucket: 'personal-crm-2e587.firebasestorage.app',
  messagingSenderId: '705752871232',
  appId: '1:705752871232:web:3bde6b2d3b70e103cb4aa5',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

function parseCSV(path) {
  const content = readFileSync(path, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true });
}

function cleanDoc(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

async function seedCollection(colName, items) {
  let count = 0;
  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(db);
    items.slice(i, i + 400).forEach(item => {
      batch.set(doc(collection(db, colName), String(item.id)), cleanDoc(item));
    });
    await batch.commit();
    count += Math.min(400, items.length - i);
    process.stdout.write(`\r  ${colName}: ${count}/${items.length}`);
  }
  console.log();
}

// ── Normalizers ────────────────────────────────────────────────────────────

function normalizeDeals(rows) {
  return rows.filter(r => r['Record']?.trim()).map((row, i) => ({
    id:         row['Record ID'] || `deal-${i}`,
    name:       row['Record'] || '',
    stage:      row['Deal stage'] || 'Lead',
    date:       row['"Deal stage" Changed At'] || '',
    owner:      row['Deal owner'] || 'Frida Ruh',
    value:      row['Deal value'] ? parseFloat(String(row['Deal value']).replace(/,/g, '')) : 0,
    company_id: null,
    contact_id: null,
    notes_text: '',
    created_at: (row['"Deal stage" Changed At'] || '').split('T')[0],
    close_date: '',
    currency:   'MXN',
    archived:   false,
  }));
}

function normalizeContacts(rows) {
  return rows.filter(r => r['Record']?.trim()).map((row, i) => ({
    id:                  row['Record ID'] || `contact-${i}`,
    name:                row['Record'] || '',
    email:               '',
    phone:               '',
    company_id:          null,
    title:               '',
    department:          '',
    connection_strength: row['Connection strength'] || '',
    last_email:          row['Last email interaction > When'] || '',
    last_calendar:       row['Last calendar interaction > When'] || '',
    created_at:          (row['Last email interaction > When'] || '').split('T')[0],
  }));
}

function normalizeCompanies(rows, enrichment) {
  return rows.filter(r => r['Record']?.trim()).map((row, i) => {
    const base = {
      id:                  row['Record ID'] || `company-${i}`,
      name:                row['Record'] || '',
      domain:              row['Domains'] || '',
      location:            row['Primary location > Country'] || '',
      industry:            row['Categories'] || '',
      employees:           null,
      founded:             row['Foundation date'] || '',
      description:         row['Description'] || '',
      connection_strength: row['Connection strength'] || '',
      last_interaction:    row['Last interaction > When'] || '',
      twitter_count:       row['Twitter follower count'] ? parseInt(String(row['Twitter follower count']).replace(/,/g, ''), 10) || 0 : 0,
      twitter:             row['Twitter'] || '',
      linkedin:            row['LinkedIn'] || '',
    };
    const domain = base.domain;
    if (domain && enrichment[domain]) {
      return { ...base, ...enrichment[domain], _enriched: true };
    }
    return base;
  });
}

function generateInitialActivities(deals) {
  return deals.map(d => ({
    id:          `act-init-${d.id}`,
    deal_id:     d.id,
    actor:       d.owner || 'Frida Ruh',
    type:        'created',
    description: 'was created',
    changes:     [],
    created_at:  d.date || new Date().toISOString(),
  }));
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const base = new URL('../public/data', import.meta.url).pathname;

  console.log('Leyendo archivos...');
  const rawDeals     = normalizeDeals(parseCSV(`${base}/imported_data/Deals - Pipeline.csv`));
  const rawContacts  = normalizeContacts(parseCSV(`${base}/imported_data/People - Recently Contacted People.csv`));
  const enrichment   = JSON.parse(readFileSync(`${base}/company_enrichment.json`, 'utf-8'));
  const rawCompanies = normalizeCompanies(parseCSV(`${base}/imported_data/Companies - All Companies.csv`), enrichment);
  const activities   = generateInitialActivities(rawDeals);

  console.log(`\nSubiendo a Firestore:`);
  console.log(`  deals: ${rawDeals.length} | contacts: ${rawContacts.length} | companies: ${rawCompanies.length} | enriched: ${rawCompanies.filter(c => c._enriched).length}`);
  console.log();

  await seedCollection('deals', rawDeals);
  await seedCollection('contacts', rawContacts);
  await seedCollection('companies', rawCompanies);
  await seedCollection('activities', activities);

  console.log('\nListo. Firestore actualizado.');
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
