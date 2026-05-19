import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddPersonModal({ companies, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_id: '',
    title: '',
    department: '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      company_id: form.company_id || null,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>New person</h2>
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
              <label>Full name *</label>
              <input
                autoFocus
                placeholder="e.g. María García"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Company</label>
              <select value={form.company_id} onChange={set('company_id')}>
                <option value="">— Select company —</option>
                {companies.slice(0, 200).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Title</label>
                <input
                  placeholder="e.g. CEO"
                  value={form.title}
                  onChange={set('title')}
                />
              </div>
              <div className="form-field">
                <label>Department</label>
                <input
                  placeholder="e.g. Sales"
                  value={form.department}
                  onChange={set('department')}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create person</button>
          </div>
        </form>
      </div>
    </div>
  );
}
