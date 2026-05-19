import { useState, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { resolveCompanyFromEmail } from '../utils/linking';

const SK = {
  deals:      'attio-deals-v2',
  contacts:   'attio-contacts-v2',
  companies:  'attio-companies-v3',
  activities: 'attio-activities-v2',
  tasks:      'attio-tasks-v2',
  notes:      'attio-notes-v2',
};

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

function persist(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
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

  // Refs so callbacks always see current state without stale closures
  const companiesRef  = useRef([]);
  const dealsRef      = useRef([]);
  useEffect(() => { companiesRef.current = companies; }, [companies]);
  useEffect(() => { dealsRef.current = deals; }, [deals]);

  useEffect(() => {
    async function init() {
      try {
        const [rawDeals, rawContacts, rawCompanies, enrichment] = await Promise.all([
          localStorage.getItem(SK.deals)
            ? JSON.parse(localStorage.getItem(SK.deals))
            : loadCSV('/data/imported_data/Deals - Pipeline.csv').then(normalizeDeals),
          localStorage.getItem(SK.contacts)
            ? JSON.parse(localStorage.getItem(SK.contacts))
            : loadCSV('/data/imported_data/People - Recently Contacted People.csv').then(normalizeContacts),
          localStorage.getItem(SK.companies)
            ? JSON.parse(localStorage.getItem(SK.companies))
            : loadCSV('/data/imported_data/Companies - All Companies.csv').then(normalizeCompanies),
          fetch('/data/company_enrichment.json').then(r => r.json()).catch(() => ({})),
        ]);

        // Merge pre-built enrichment by domain (never overwrites manual edits already marked _enriched)
        const mergedCompanies = rawCompanies.map(c => {
          if (c._enriched || !c.domain) return c;
          const data = enrichment[c.domain];
          return data ? { ...c, ...data } : c;
        });

        const rawActivities = localStorage.getItem(SK.activities)
          ? JSON.parse(localStorage.getItem(SK.activities))
          : generateInitialActivities(rawDeals);

        const rawTasks = localStorage.getItem(SK.tasks)
          ? JSON.parse(localStorage.getItem(SK.tasks))
          : [];

        const rawNotes = localStorage.getItem(SK.notes)
          ? JSON.parse(localStorage.getItem(SK.notes))
          : [];

        setDeals(rawDeals);
        setContacts(rawContacts);
        setCompanies(mergedCompanies);
        setActivities(rawActivities);
        setTasks(rawTasks);
        setNotes(rawNotes);

        if (!localStorage.getItem(SK.activities)) persist(SK.activities, rawActivities);
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
    setActivities(prev => {
      const updated = [entry, ...prev];
      persist(SK.activities, updated);
      return updated;
    });
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
    setDeals(prev => {
      const updated = [newDeal, ...prev];
      persist(SK.deals, updated);
      return updated;
    });
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
      persist(SK.deals, updated);

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
      const old = prev.find(d => String(d.id) === String(id));
      const updated = prev.map(d => String(d.id) === String(id) ? { ...d, archived: archive } : d);
      persist(SK.deals, updated);
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
      const old = prev.find(d => String(d.id) === String(dealId));
      const updated = prev.map(d =>
        String(d.id) === String(dealId) ? { ...d, stage: newStage } : d
      );
      persist(SK.deals, updated);
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
    setDeals(prev => {
      const updated = prev.filter(d => String(d.id) !== String(id));
      persist(SK.deals, updated);
      return updated;
    });
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
    setContacts(prev => {
      const updated = [newContact, ...prev];
      persist(SK.contacts, updated);
      return updated;
    });
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
      persist(SK.contacts, updated);
      return updated;
    });
  }, []);

  // ── Companies ─────────────────────────────────────────────────────────────
  const addCompany = useCallback((company) => {
    setCompanies(prev => {
      const n = { ...company, id: `company-${Date.now()}`, created_at: new Date().toISOString().split('T')[0], connection_strength: '', last_interaction: '' };
      const updated = [n, ...prev];
      persist(SK.companies, updated);
      return updated;
    });
  }, []);

  const updateCompany = useCallback((id, changes) => {
    setCompanies(prev => {
      const updated = prev.map(c => String(c.id) === String(id) ? { ...c, ...changes } : c);
      persist(SK.companies, updated);
      return updated;
    });
  }, []);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const addTask = useCallback((task) => {
    const newTask = { ...task, id: `task-${Date.now()}`, completed: false, created_at: new Date().toISOString() };
    setTasks(prev => {
      const updated = [newTask, ...prev];
      persist(SK.tasks, updated);
      return updated;
    });
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
      const updated = prev.map(t =>
        String(t.id) === String(taskId) ? { ...t, completed: !t.completed } : t
      );
      persist(SK.tasks, updated);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((taskId) => {
    setTasks(prev => {
      const updated = prev.filter(t => String(t.id) !== String(taskId));
      persist(SK.tasks, updated);
      return updated;
    });
  }, []);

  // ── Notes ─────────────────────────────────────────────────────────────────
  const addNote = useCallback((note) => {
    const newNote = { ...note, id: `note-${Date.now()}`, created_at: new Date().toISOString() };
    setNotes(prev => {
      const updated = [newNote, ...prev];
      persist(SK.notes, updated);
      return updated;
    });
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
    setNotes(prev => {
      const updated = prev.filter(n => String(n.id) !== String(noteId));
      persist(SK.notes, updated);
      return updated;
    });
  }, []);

  // ── Lookups ───────────────────────────────────────────────────────────────
  const getCompany = useCallback((id) =>
    id ? companies.find(c => String(c.id) === String(id)) || null : null,
  [companies]);

  const getContact = useCallback((id) =>
    id ? contacts.find(c => String(c.id) === String(id)) || null : null,
  [contacts]);

  const resetData = useCallback(async () => {
    Object.values(SK).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  return {
    deals, contacts, companies, activities, tasks, notes, loading,
    addDeal, updateDeal, moveDeal, deleteDeal, archiveDeal,
    addContact, updateContact,
    addCompany, updateCompany,
    addTask, toggleTask, deleteTask,
    addNote, deleteNote,
    getCompany, getContact,
    resetData,
  };
}
