import { useState } from 'react';
import { X } from 'lucide-react';

const STAGES = [
  { value: 'Lead', label: 'Lead' },
  { value: 'Por realizarse', label: 'Por realizarse' },
  { value: 'Por facturar', label: 'Por facturar' },
  { value: 'Por recibir pago', label: 'Por recibir pago' },
  { value: 'Pagado', label: 'Pagado' },
];

export default function AddDealModal({ defaultStage, companies, contacts, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    company_id: '',
    contact_id: '',
    value: '',
    stage: defaultStage || 'qualification',
    owner: '',
    close_date: '',
    notes: '',
  });

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
                <select value={form.company_id} onChange={set('company_id')}>
                  <option value="">— Select company —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Contact</label>
                <select value={form.contact_id} onChange={set('contact_id')}>
                  <option value="">— Select contact —</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Value (USD)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.value}
                  onChange={set('value')}
                  min="0"
                />
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
