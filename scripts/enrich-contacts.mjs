/**
 * Enriches contacts in Firestore with:
 *   - email (from people.csv, matched by Person ID = contact doc ID)
 *   - company_id (from company-roles.csv, matched by Person ID)
 *
 * Only updates fields that are currently empty/null — never overwrites.
 * Run: node scripts/enrich-contacts.mjs
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, doc, writeBatch,
} from 'firebase/firestore';

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
  return parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
}

async function batchWrite(updates) {
  const entries = Object.entries(updates);
  let written = 0;
  for (let i = 0; i < entries.length; i += 400) {
    const batch = writeBatch(db);
    entries.slice(i, i + 400).forEach(([id, patch]) => {
      batch.update(doc(db, 'contacts', id), patch);
    });
    await batch.commit();
    written += Math.min(400, entries.length - i);
    process.stdout.write(`\r  Escribiendo... ${written}/${entries.length}`);
  }
  console.log();
}

async function main() {
  const base = new URL('../public/data/imported_data', import.meta.url).pathname;

  console.log('Leyendo CSVs...');
  const peopleRows = parseCSV(`${base}/people.csv`);
  const rolesRows  = parseCSV(`${base}/company-roles.csv`);

  // Build email map: Person ID → email
  const emailMap = {};
  for (const row of peopleRows) {
    const pid   = row['Person ID'];
    const email = row['Email Addresses'].trim();
    if (pid && email) emailMap[pid] = email;
  }

  // Build company map: Person ID → Company ID (first active role wins)
  const companyMap = {};
  for (const row of rolesRows) {
    const pid = row['Person ID'];
    const cid = row['Company ID'];
    const end = row['End Date'].trim();
    if (pid && cid && !end && !(pid in companyMap)) {
      companyMap[pid] = cid;
    }
  }

  console.log(`  → ${Object.keys(emailMap).length} personas con email`);
  console.log(`  → ${Object.keys(companyMap).length} personas con empresa`);

  // Load contacts from Firestore
  console.log('\nCargando contactos de Firestore...');
  const snap = await getDocs(collection(db, 'contacts'));
  const contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`  → ${contacts.length} contactos cargados`);

  // Compute patches — only fill missing fields
  const patches = {};
  let emailCount   = 0;
  let companyCount = 0;

  for (const contact of contacts) {
    const patch = {};
    const id    = String(contact.id);

    if (!contact.email && emailMap[id]) {
      patch.email = emailMap[id];
      emailCount++;
    }

    if (!contact.company_id && companyMap[id]) {
      patch.company_id = companyMap[id];
      companyCount++;
    }

    if (Object.keys(patch).length > 0) {
      patches[id] = patch;
    }
  }

  console.log(`\nContactos a actualizar: ${Object.keys(patches).length}`);
  console.log(`  → Emails nuevos:    ${emailCount}`);
  console.log(`  → Empresas nuevas:  ${companyCount}`);

  if (Object.keys(patches).length === 0) {
    console.log('\nNada que actualizar. Todo ya está enriquecido.');
    process.exit(0);
  }

  console.log('\nEscribiendo en Firestore...');
  await batchWrite(patches);

  console.log('\nListo. Contactos enriquecidos con éxito.');
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
