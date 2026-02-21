import { useState, useEffect } from 'react';
import api from '../api/client';

interface Driver {
  id: number; name: string; license_number: string;
  license_category: string; license_expiry: string;
  completion_rate: number; safety_score: number;
  complaints: number; duty_status: string;
}

const EMPTY = {
  name: '', license_number: '', license_category: 'B',
  license_expiry: '', duty_status: 'On Duty',
};

function dutyBadge(s: string) {
  const m: Record<string, string> = {
    'On Duty': 'ff-badge ff-badge-green',
    'Taking a Break': 'ff-badge ff-badge-yellow',
    'Suspended': 'ff-badge ff-badge-red',
  };
  return m[s] ?? 'ff-badge ff-badge-gray';
}

function expiringSoon(d: string) {
  if (!d) return false;
  return (new Date(d).getTime() - Date.now()) / 86400000 < 60;
}

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function DriverProfiles() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm]       = useState({ ...EMPTY });

  useEffect(() => { load(); }, []);

  async function load() {
    try { const r = await api.get('/drivers'); setDrivers(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      editing ? await api.put(`/drivers/${editing.id}`, form)
              : await api.post('/drivers', form);
      close(); load();
    } catch (ex: any) { alert(ex.response?.data?.error ?? 'Failed to save driver'); }
  }

  function openEdit(d: Driver) {
    setEditing(d);
    setForm({
      name: d.name, license_number: d.license_number,
      license_category: d.license_category,
      license_expiry: d.license_expiry?.split('T')[0] ?? '',
      duty_status: d.duty_status,
    });
    setOpen(true);
  }

  async function remove(id: number) {
    if (!confirm('Remove this driver?')) return;
    try { await api.delete(`/drivers/${id}`); load(); }
    catch { alert('Failed to remove driver'); }
  }

  function close() { setOpen(false); setEditing(null); setForm({ ...EMPTY }); }
  const f = (k: string) => (e: React.ChangeEvent<any>) => setForm({ ...form, [k]: e.target.value });

  if (loading) return <div className="ff-loading"><div className="ff-spinner"/>Loading</div>;

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div>
          <h1 className="ff-page-title">Driver Profiles</h1>
          <p className="ff-page-sub">Performance, licensing, and safety oversight</p>
        </div>
        <button className="ff-btn ff-btn-primary" onClick={() => { close(); setOpen(true); }}>
          Add Driver
        </button>
      </div>

      <div className="ff-card">
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Driver</th><th>License</th><th>Expiry</th>
                <th>Completion</th><th>Safety Score</th><th>Status</th><th/>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => {
                const expiring = expiringSoon(d.license_expiry);
                const scoreColor = d.safety_score >= 80 ? 'var(--green)'
                  : d.safety_score >= 60 ? 'var(--yellow)' : 'var(--red)';
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="t-primary">{d.name}</div>
                      <div className="t-secondary">{d.complaints} complaints</div>
                    </td>
                    <td>
                      <span className="t-mono" style={{ color: 'var(--text-2)' }}>{d.license_number}</span>
                      <span style={{ marginLeft: 6, fontSize: '.73rem', color: 'var(--text-3)' }}>
                        ({d.license_category})
                      </span>
                    </td>
                    <td>
                      <span className="t-mono" style={{ fontSize: '.8rem', color: expiring ? 'var(--red)' : 'var(--text-2)' }}>
                        {fmtDate(d.license_expiry)}
                        {expiring && <span style={{ marginLeft: 5, fontSize: '.68rem' }}>expiring</span>}
                      </span>
                    </td>
                    <td className="t-mono" style={{ color: 'var(--text-2)' }}>
                      {d.completion_rate != null ? `${d.completion_rate}%` : '—'}
                    </td>
                    <td>
                      <span className="t-mono" style={{ fontWeight: 500, color: scoreColor }}>
                        {d.safety_score ?? '—'}
                      </span>
                    </td>
                    <td><span className={dutyBadge(d.duty_status)}>{d.duty_status}</span></td>
                    <td>
                      <div className="ff-row-actions">
                        <button className="ff-btn ff-btn-ghost ff-btn-sm" onClick={() => openEdit(d)}>Edit</button>
                        <button className="ff-btn ff-btn-danger ff-btn-sm" onClick={() => remove(d.id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!drivers.length && <tr><td colSpan={7} className="ff-empty">No drivers registered</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="ff-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="ff-modal">
            <div className="ff-modal-head">
              <div className="ff-modal-title">{editing ? 'Edit Driver' : 'Add Driver'}</div>
            </div>
            <form onSubmit={submit}>
              <div className="ff-modal-body">
                <div className="ff-form-group">
                  <label className="ff-label">Full Name</label>
                  <input required className="ff-input" value={form.name} onChange={f('name')}/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">License Number</label>
                  <input required className="ff-input t-mono" value={form.license_number} onChange={f('license_number')}/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">License Category</label>
                  <select className="ff-select" value={form.license_category} onChange={f('license_category')}>
                    <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
                  </select>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">License Expiry</label>
                  <input required type="date" className="ff-input" value={form.license_expiry} onChange={f('license_expiry')}/>
                </div>
                {editing && (
                  <div className="ff-form-group">
                    <label className="ff-label">Duty Status</label>
                    <select className="ff-select" value={form.duty_status} onChange={f('duty_status')}>
                      <option>On Duty</option>
                      <option>Taking a Break</option>
                      <option>Suspended</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="ff-modal-foot">
                <button type="button" className="ff-btn ff-btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="ff-btn ff-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}