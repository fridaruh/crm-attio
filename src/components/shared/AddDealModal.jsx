import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { dedupeAndSort } from '../../utils/dedupe';

const STAGES = [
  { value: 'Lead',             label: 'Lead' },
  { value: 'Clases',           label: 'Clases' },
  { value: 'Por realizarse',   label: 'Por realizarse' },
  { value: 'Por facturar',     label: 'Por facturar' },
  { value: 'Por recibir pago', label: 'Por recibir pago' },
  { value: 'Pagado',           label: 'Pagado' },
];

function CreatableSelect({ items, value, onChange, onCreate, placeholder, newLabel, newPlaceholder }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  function handleSelect(e) {
    if (e.target.value === '__new__') {
      setCreating(true);
      setNewName('');
      return;
    }
    onChange(e.target.value);
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const created = onCreate({ name });
    onChange(created.id);
    setCreating(false);
    setNewName('');
  }

  if (creating) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          autoFocus
          placeholder={newPlaceholder}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
            if (e.key === 'Escape') { e.preventDefault(); setCreating(false); }
          }}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleCreate}>
          Add
        </button>
      </div>
    );
  }

  return (
    <select value={value} onChange={handleSelect}>
      <option value="">{placeholder}</option>
      <option value="__new__">{newLabel}</option>
      {items.map(item => (
        <option key={item.id} value={item.id}>{item.name}</option>
      ))}
    </select>
  );
}

export default function AddDealModal({ defaultStage, companies, contacts, onSave, onAddCompany, onAddContact, onClose }) {
  const [form, setForm] = useState({
    name: '',
    company_id: '',
    contact_id: '',
    value: '',
    currency: 'MXN',
    stage: defaultStage || 'Lead',
    owner: '',
    realizacion_date: '',
    close_date: '',
    notes: '',
  });

  const sortedCompanies = useMemo(() => dedupeAndSort(companies), [companies]);
  const sortedContacts  = useMemo(() => dedupeAndSort(contacts), [contacts]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      value: form.value ? Number(form.value) : 0,
      company_id: form.company_id ? Number(form.company_id) : null,
      contact_id: form.contact_id ? Number(form.contact_id) : null,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>New deal</h2>
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
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Deal name *</label>
              <input
                autoFocus
                placeholder="e.g. Enterprise License Q3"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Company</label>
                <CreatableSelect
                  items={sortedCompanies}
                  value={form.company_id}
                  onChange={id => setForm(prev => ({ ...prev, company_id: id }))}
                  onCreate={onAddCompany}
                  placeholder="— Select company —"
                  newLabel="+ Create new company…"
                  newPlaceholder="New company name"
                />
              </div>

              <div className="form-field">
                <label>Contact</label>
                <CreatableSelect
                  items={sortedContacts}
                  value={form.contact_id}
                  onChange={id => setForm(prev => ({ ...prev, contact_id: id }))}
                  onCreate={onAddContact}
                  placeholder="— Select contact —"
                  newLabel="+ Create new contact…"
                  newPlaceholder="New contact name"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Valor</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={form.currency}
                    onChange={set('currency')}
                    style={{
                      width: 76, flexShrink: 0,
                      padding: '0 6px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13, fontWeight: 600,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="MXN">$ MXN</option>
                    <option value="USD">$ USD</option>
                  </select>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.value}
                    onChange={set('value')}
                    min="0"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Stage</label>
                <select value={form.stage} onChange={set('stage')}>
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Owner</label>
                <input
                  placeholder="Assignee name"
                  value={form.owner}
                  onChange={set('owner')}
                />
              </div>

              <div className="form-field">
                <label>Fecha de realización</label>
                <input
                  type="date"
                  value={form.realizacion_date}
                  onChange={set('realizacion_date')}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Close date</label>
                <input
                  type="date"
                  value={form.close_date}
                  onChange={set('close_date')}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Notes</label>
              <textarea
                placeholder="Add notes about this deal…"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
