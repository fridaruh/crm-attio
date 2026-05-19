import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddCompanyModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    domain: '',
    location: '',
    industry: '',
    employees: '',
    description: '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      employees: form.employees ? Number(form.employees) : null,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>New company</h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)', transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Company name *</label>
              <input
                autoFocus
                placeholder="e.g. Acme Corporation"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Domain</label>
                <input
                  placeholder="acme.com"
                  value={form.domain}
                  onChange={set('domain')}
                />
              </div>
              <div className="form-field">
                <label>Location</label>
                <input
                  placeholder="Mexico City, MX"
                  value={form.location}
                  onChange={set('location')}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Industry</label>
                <input
                  placeholder="e.g. Technology"
                  value={form.industry}
                  onChange={set('industry')}
                />
              </div>
              <div className="form-field">
                <label>Employees</label>
                <input
                  type="number"
                  placeholder="50"
                  value={form.employees}
                  onChange={set('employees')}
                  min="1"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                placeholder="What does this company do?"
                value={form.description}
                onChange={set('description')}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create company</button>
          </div>
        </form>
      </div>
    </div>
  );
}
