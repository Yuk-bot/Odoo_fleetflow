import { useState, useEffect } from 'react';
import api from '../api/client';

interface Maintenance {
  id: number; vehicle_id: number; service_type: string;
  description: string; cost: number; service_date: string;
  next_service_date: string; vehicle_name: string; license_plate: string;
}
interface Vehicle { id: number; name: string; license_plate: string; }

const EMPTY = {
  vehicle_id: '', service_type: '', description: '', cost: '',
  service_date: new Date().toISOString().split('T')[0], next_service_date: '',
};

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function MaintenanceLogs() {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState({ ...EMPTY });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [m, v] = await Promise.all([api.get('/maintenance'), api.get('/vehicles')]);
      setRecords(m.data); setVehicles(v.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/maintenance', {
        ...form, vehicle_id: +form.vehicle_id, cost: +form.cost,
      });
      close(); loadAll();
    } catch (ex: any) { alert(ex.response?.data?.error ?? 'Failed to save record'); }
  }

  async function complete(id: number) {
    try { await api.patch(`/maintenance/${id}/complete`); loadAll(); }
    catch { alert('Failed to complete maintenance'); }
  }

  function close() { setOpen(false); setForm({ ...EMPTY }); }
  const f = (k: string) => (e: React.ChangeEvent<any>) => setForm({ ...form, [k]: e.target.value });

  if (loading) return <div className="ff-loading"><div className="ff-spinner"/>Loading</div>;

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div>
          <h1 className="ff-page-title">Maintenance Logs</h1>
          <p className="ff-page-sub">Track vehicle service history and upcoming maintenance</p>
        </div>
        <button className="ff-btn ff-btn-primary" onClick={() => { close(); setOpen(true); }}>
          Log Maintenance
        </button>
      </div>

      <div className="ff-card">
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Service</th><th>Date</th>
                <th>Next Service</th><th>Cost</th><th/>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="t-primary">{r.vehicle_name}</div>
                    <div className="t-mono t-secondary">{r.license_plate}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '.875rem' }}>{r.service_type}</div>
                    {r.description && <div className="t-secondary">{r.description}</div>}
                  </td>
                  <td className="t-mono" style={{ color: 'var(--text-2)' }}>{fmtDate(r.service_date)}</td>
                  <td className="t-mono" style={{ color: 'var(--text-2)' }}>{fmtDate(r.next_service_date)}</td>
                  <td className="t-mono" style={{ color: 'var(--text-2)' }}>${r.cost.toFixed(2)}</td>
                  <td>
                    <div className="ff-row-actions">
                      <button className="ff-btn ff-btn-success ff-btn-sm" onClick={() => complete(r.id)}>
                        Mark complete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!records.length && <tr><td colSpan={6} className="ff-empty">No maintenance records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="ff-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="ff-modal">
            <div className="ff-modal-head">
              <div className="ff-modal-title">Log Maintenance</div>
            </div>
            <form onSubmit={submit}>
              <div className="ff-modal-body">
                <div className="ff-form-group">
                  <label className="ff-label">Vehicle</label>
                  <select required className="ff-select" value={form.vehicle_id} onChange={f('vehicle_id')}>
                    <option value="">Select a vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
                    ))}
                  </select>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Service Type</label>
                  <input required className="ff-input" value={form.service_type} onChange={f('service_type')}
                    placeholder="e.g. Oil change, Tire replacement"/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Description <span>(optional)</span></label>
                  <textarea className="ff-textarea" value={form.description} onChange={f('description')}
                    placeholder="Additional notes…"/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Cost</label>
                  <input required type="number" step=".01" className="ff-input t-mono"
                    value={form.cost} onChange={f('cost')} placeholder="0.00"/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Service Date</label>
                  <input required type="date" className="ff-input" value={form.service_date} onChange={f('service_date')}/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Next Service Date <span>(optional)</span></label>
                  <input type="date" className="ff-input" value={form.next_service_date} onChange={f('next_service_date')}/>
                </div>
              </div>
              <div className="ff-modal-foot">
                <button type="button" className="ff-btn ff-btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="ff-btn ff-btn-primary">Log Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}