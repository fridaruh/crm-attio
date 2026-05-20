import { useState, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { resolveCompanyFromEmail } from '../utils/linking';
import { db } from '../firebase';
import { collection, getDocs, setDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';

async function loadCSV(path) {
  const res = await fetch(path);
  const text = await res.text();
  return Papa.parse(text, { header: true, dynamicTyping: false, skipEmptyLines: true }).data;
}

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

function normalizeCompanies(rows) {
  return rows.filter(r => r['Record']?.trim()).map((row, i) => ({
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
  }));
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

// Strips undefined values so Firestore doesn't reject them
function clean(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

async function loadCollection(colName) {
  const snap = await getDocs(collection(db, colName));
  return snap.docs.map(d => d.data());
}

async function seedCollection(colName, items) {
  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(db);
    items.slice(i, i + 400).forEach(item => {
      batch.set(doc(db, colName, String(item.id)), clean(item));
    });
    await batch.commit();
  }
}

const FIELD_LABELS = {
  name: 'Deal name', stage: 'Deal stage', value: 'Deal value',
  owner: 'Deal owner', close_date: 'Close date', notes_text: 'Notes',
  company_id: 'Company', contact_id: 'Contact',
};

function actDescription(changedFields, changes, old) {
  if (changedFields.includes('stage'))
    return `changed Deal stage to ${changes.stage}`;
  if (changedFields.includes('company_id') && changes.company_id)
    return 'linked a company';
  if (changedFields.includes('contact_id') && changes.contact_id)
    return 'linked a person';
  if (changedFields.length === 1)
    return `changed ${FIELD_LABELS[changedFields[0]] || changedFields[0]}`;
  return `changed ${changedFields.length} attributes`;
}

export function useData() {
  const [deals,      setDeals]      = useState([]);
  const [contacts,   setContacts]   = useState([]);
  const [companies,  setCompanies]  = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [notes,      setNotes]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  const companiesRef = useRef([]);
  const dealsRef     = useRef([]);
  useEffect(() => { companiesRef.current = companies; }, [companies]);
  useEffect(() => { dealsRef.current = deals; }, [deals]);

  useEffect(() => {
    async function init() {
      try {
        const [fsDeals, fsContacts, fsCompanies, fsActivities, fsTasks, fsNotes] = await Promise.all([
          loadCollection('deals'),
          loadCollection('contacts'),
          loadCollection('companies'),
          loadCollection('activities'),
          loadCollection('tasks'),
          loadCollection('notes'),
        ]);

        if (fsDeals.length === 0) {
          // First run: prefer localStorage (existing user data) over CSVs
          const LS = {
            deals:      'attio-deals-v2',
            contacts:   'attio-contacts-v2',
            companies:  'attio-companies-v3',
            activities: 'attio-activities-v2',
            tasks:      'attio-tasks-v2',
            notes:      'attio-notes-v2',
          };
          const lsDeals = localStorage.getItem(LS.deals);

          let rawDeals, rawContacts, rawCompanies, initialActivities, rawTasks, rawNotes;

          if (lsDeals) {
            // Migrate from localStorage
            rawDeals      = JSON.parse(localStorage.getItem(LS.deals)      || '[]');
            rawContacts   = JSON.parse(localStorage.getItem(LS.contacts)   || '[]');
            rawCompanies  = JSON.parse(localStorage.getItem(LS.companies)  || '[]');
            initialActivities = JSON.parse(localStorage.getItem(LS.activities) || '[]');
            rawTasks      = JSON.parse(localStorage.getItem(LS.tasks)      || '[]');
            rawNotes      = JSON.parse(localStorage.getItem(LS.notes)      || '[]');
          } else {
            // Fresh install: seed from CSVs
            const [csvDeals, csvContacts, csvCompanies, enrichment] = await Promise.all([
              loadCSV('/data/imported_data/Deals - Pipeline.csv').then(normalizeDeals),
              loadCSV('/data/imported_data/People - Recently Contacted People.csv').then(normalizeContacts),
              loadCSV('/data/imported_data/Companies - All Companies.csv').then(normalizeCompanies),
              fetch('/data/company_enrichment.json').then(r => r.json()).catch(() => ({})),
            ]);
            rawDeals     = csvDeals;
            rawContacts  = csvContacts;
            rawCompanies = csvCompanies.map(c => {
              if (c._enriched || !c.domain) return c;
              const data = enrichment[c.domain];
              return data ? { ...c, ...data } : c;
            });
            initialActivities = generateInitialActivities(rawDeals);
            rawTasks = [];
            rawNotes = [];
          }

          await Promise.all([
            seedCollection('deals', rawDeals),
            seedCollection('contacts', rawContacts),
            seedCollection('companies', rawCompanies),
            seedCollection('activities', initialActivities),
            seedCollection('tasks', rawTasks),
            seedCollection('notes', rawNotes),
          ]);

          // Clear localStorage after successful migration
          Object.values(LS).forEach(k => localStorage.removeItem(k));

          setDeals(rawDeals);
          setContacts(rawContacts);
          setCompanies(rawCompanies);
          setActivities(initialActivities);
          setTasks(rawTasks);
          setNotes(rawNotes);
        } else {
          setDeals(fsDeals);
          setContacts(fsContacts);
          setCompanies(fsCompanies);
          setActivities(fsActivities);
          setTasks(fsTasks);
          setNotes(fsNotes);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ── internal activity logger ──────────────────────────────────────────────
  const pushActivity = useCallback((entry) => {
    setDoc(doc(db, 'activities', entry.id), clean(entry)).catch(console.error);
    setActivities(prev => [entry, ...prev]);
  }, []);

  // ── Deals ─────────────────────────────────────────────────────────────────
  const addDeal = useCallback((deal) => {
    const newDeal = {
      ...deal,
      id:         `deal-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
      date:       new Date().toISOString(),
      currency:   'MXN',
    };
    setDoc(doc(db, 'deals', newDeal.id), clean(newDeal)).catch(console.error);
    setDeals(prev => [newDeal, ...prev]);
    pushActivity({
      id: `act-${Date.now()}`, deal_id: newDeal.id,
      actor: newDeal.owner || 'Frida Ruh', type: 'created',
      description: 'was created', changes: [],
      created_at: new Date().toISOString(),
    });
  }, [pushActivity]);

  const updateDeal = useCallback((id, changes) => {
    setDeals(prev => {
      const old = prev.find(d => String(d.id) === String(id));
      const updated = prev.map(d => String(d.id) === String(id) ? { ...d, ...changes } : d);
      const merged  = updated.find(d => String(d.id) === String(id));
      if (merged) setDoc(doc(db, 'deals', String(id)), clean(merged)).catch(console.error);

      if (old) {
        const changedFields = Object.keys(changes).filter(k =>
          k !== 'id' && JSON.stringify(changes[k]) !== JSON.stringify(old[k])
        );
        if (changedFields.length) {
          const actor = changes.owner || old.owner || 'Frida Ruh';
          pushActivity({
            id:          `act-${Date.now()}`,
            deal_id:     id,
            actor,
            type:        changedFields.includes('stage') ? 'stage_changed' : 'updated',
            description: actDescription(changedFields, changes, old),
            changes:     changedFields.map(f => ({ field: f, from: old[f], to: changes[f] })),
            created_at:  new Date().toISOString(),
          });
        }
      }
      return updated;
    });
  }, [pushActivity]);

  const archiveDeal = useCallback((id, archive = true) => {
    setDeals(prev => {
      const old     = prev.find(d => String(d.id) === String(id));
      const updated = prev.map(d => String(d.id) === String(id) ? { ...d, archived: archive } : d);
      const merged  = updated.find(d => String(d.id) === String(id));
      if (merged) setDoc(doc(db, 'deals', String(id)), clean(merged)).catch(console.error);
      if (old) {
        pushActivity({
          id:          `act-${Date.now()}`,
          deal_id:     id,
          actor:       old.owner || 'Frida Ruh',
          type:        archive ? 'archived' : 'unarchived',
          description: archive ? 'archivó este deal' : 'desarchivó este deal',
          changes:     [],
          created_at:  new Date().toISOString(),
        });
      }
      return updated;
    });
  }, [pushActivity]);

  const moveDeal = useCallback((dealId, newStage) => {
    setDeals(prev => {
      const old     = prev.find(d => String(d.id) === String(dealId));
      const updated = prev.map(d => String(d.id) === String(dealId) ? { ...d, stage: newStage } : d);
      const merged  = updated.find(d => String(d.id) === String(dealId));
      if (merged) setDoc(doc(db, 'deals', String(dealId)), clean(merged)).catch(console.error);
      if (old && old.stage !== newStage) {
        pushActivity({
          id:          `act-${Date.now()}`,
          deal_id:     dealId,
          actor:       old.owner || 'Frida Ruh',
          type:        'stage_changed',
          description: `changed Deal stage to ${newStage}`,
          changes:     [{ field: 'stage', from: old.stage, to: newStage }],
          created_at:  new Date().toISOString(),
        });
      }
      return updated;
    });
  }, [pushActivity]);

  const deleteDeal = useCallback((id) => {
    deleteDoc(doc(db, 'deals', String(id))).catch(console.error);
    setDeals(prev => prev.filter(d => String(d.id) !== String(id)));
  }, []);

  // ── Contacts ──────────────────────────────────────────────────────────────
  const addContact = useCallback((contact) => {
    const company = resolveCompanyFromEmail(contact.email, companiesRef.current);
    const newContact = {
      ...contact,
      id:                  `contact-${Date.now()}`,
      company_id:          contact.company_id || company?.id || null,
      connection_strength: '',
      last_email:          '',
      last_calendar:       '',
      created_at:          new Date().toISOString().split('T')[0],
    };
    setDoc(doc(db, 'contacts', newContact.id), clean(newContact)).catch(console.error);
    setContacts(prev => [newContact, ...prev]);
  }, []);

  const updateContact = useCallback((id, changes) => {
    setContacts(prev => {
      const updated = prev.map(c => {
        if (String(c.id) !== String(id)) return c;
        let next = { ...c, ...changes };
        if ('email' in changes && !('company_id' in changes)) {
          const company = resolveCompanyFromEmail(changes.email, companiesRef.current);
          if (company) next.company_id = company.id;
        }
        return next;
      });
      const merged = updated.find(c => String(c.id) === String(id));
      if (merged) setDoc(doc(db, 'contacts', String(id)), clean(merged)).catch(console.error);
      return updated;
    });
  }, []);

  // ── Companies ─────────────────────────────────────────────────────────────
  const addCompany = useCallback((company) => {
    const newCompany = {
      ...company,
      id:                  `company-${Date.now()}`,
      created_at:          new Date().toISOString().split('T')[0],
      connection_strength: '',
      last_interaction:    '',
    };
    setDoc(doc(db, 'companies', newCompany.id), clean(newCompany)).catch(console.error);
    setCompanies(prev => [newCompany, ...prev]);
  }, []);

  const updateCompany = useCallback((id, changes) => {
    setCompanies(prev => {
      const updated = prev.map(c => String(c.id) === String(id) ? { ...c, ...changes } : c);
      const merged  = updated.find(c => String(c.id) === String(id));
      if (merged) setDoc(doc(db, 'companies', String(id)), clean(merged)).catch(console.error);
      return updated;
    });
  }, []);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const addTask = useCallback((task) => {
    const newTask = { ...task, id: `task-${Date.now()}`, completed: false, status: 'todo', created_at: new Date().toISOString() };
    setDoc(doc(db, 'tasks', newTask.id), clean(newTask)).catch(console.error);
    setTasks(prev => [newTask, ...prev]);
    if (task.deal_id) {
      pushActivity({
        id:          `act-${Date.now()}`,
        deal_id:     task.deal_id,
        actor:       task.created_by || 'Frida Ruh',
        type:        'task_added',
        description: `added a task: ${task.title}`,
        changes:     [],
        created_at:  new Date().toISOString(),
      });
    }
  }, [pushActivity]);

  const toggleTask = useCallback((taskId) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (String(t.id) !== String(taskId)) return t;
        const completed = !t.completed;
        return { ...t, completed, status: completed ? 'done' : 'todo' };
      });
      const merged = updated.find(t => String(t.id) === String(taskId));
      if (merged) setDoc(doc(db, 'tasks', String(taskId)), clean(merged)).catch(console.error);
      return updated;
    });
  }, []);

  const updateTask = useCallback((taskId, changes) => {
    setTasks(prev => {
      const updated = prev.map(t =>
        String(t.id) === String(taskId) ? { ...t, ...changes } : t
      );
      const merged = updated.find(t => String(t.id) === String(taskId));
      if (merged) setDoc(doc(db, 'tasks', String(taskId)), clean(merged)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((taskId) => {
    deleteDoc(doc(db, 'tasks', String(taskId))).catch(console.error);
    setTasks(prev => prev.filter(t => String(t.id) !== String(taskId)));
  }, []);

  // ── Notes ─────────────────────────────────────────────────────────────────
  const addNote = useCallback((note) => {
    const newNote = { ...note, id: `note-${Date.now()}`, created_at: new Date().toISOString() };
    setDoc(doc(db, 'notes', newNote.id), clean(newNote)).catch(console.error);
    setNotes(prev => [newNote, ...prev]);
    if (note.deal_id) {
      pushActivity({
        id:          `act-${Date.now()}`,
        deal_id:     note.deal_id,
        actor:       note.created_by || 'Frida Ruh',
        type:        'note_added',
        description: 'added a note',
        changes:     [],
        created_at:  new Date().toISOString(),
      });
    }
  }, [pushActivity]);

  const deleteNote = useCallback((noteId) => {
    deleteDoc(doc(db, 'notes', String(noteId))).catch(console.error);
    setNotes(prev => prev.filter(n => String(n.id) !== String(noteId)));
  }, []);

  // ── Lookups ───────────────────────────────────────────────────────────────
  const getCompany = useCallback((id) =>
    id ? companies.find(c => String(c.id) === String(id)) || null : null,
  [companies]);

  const getContact = useCallback((id) =>
    id ? contacts.find(c => String(c.id) === String(id)) || null : null,
  [contacts]);

  const resetData = useCallback(async () => {
    const colNames = ['deals', 'contacts', 'companies', 'activities', 'tasks', 'notes'];
    for (const colName of colNames) {
      const snap = await getDocs(collection(db, colName));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    window.location.reload();
  }, []);

  return {
    deals, contacts, companies, activities, tasks, notes, loading,
    addDeal, updateDeal, moveDeal, deleteDeal, archiveDeal,
    addContact, updateContact,
    addCompany, updateCompany,
    addTask, toggleTask, updateTask, deleteTask,
    addNote, deleteNote,
    getCompany, getContact,
    resetData,
  };
}
