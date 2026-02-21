import { useState, useEffect } from 'react';
import api from '../api/client';

interface Vehicle {
  id: number; name: string; model: string; license_plate: string;
  vehicle_type: string; max_capacity_kg: number; odometer: number;
  status: string; region: string; acquisition_cost: number;
}

const EMPTY = {
  name: '', model: '', license_plate: '', vehicle_type: 'Van',
  max_capacity_kg: '', odometer: '', status: 'Available',
  region: '', acquisition_cost: '',
};

function badge(s: string) {
  const m: Record<string, string> = {
    Available: 'ff-badge ff-badge-green', 'On Trip': 'ff-badge ff-badge-blue',
    'In Shop': 'ff-badge ff-badge-yellow', 'Out of Service': 'ff-badge ff-badge-gray',
  };
  return m[s] ?? 'ff-badge ff-badge-gray';
}

export default function VehicleRegistry() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Vehicle | null>(null);
  const [form, setForm]         = useState<typeof EMPTY>({ ...EMPTY });

  useEffect(() => { load(); }, []);

  async function load() {
    try { const r = await api.get('/vehicles'); setVehicles(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = { ...form, max_capacity_kg: +form.max_capacity_kg,
        odometer: +form.odometer || 0,
        acquisition_cost: form.acquisition_cost ? +form.acquisition_cost : null };
      editing ? await api.put(`/vehicles/${editing.id}`, body)
              : await api.post('/vehicles', body);
      close(); load();
    } catch (err: any) { alert(err.response?.data?.error ?? 'Failed to save vehicle'); }
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      name: v.name, model: v.model ?? '', license_plate: v.license_plate,
      vehicle_type: v.vehicle_type, max_capacity_kg: String(v.max_capacity_kg),
      odometer: String(v.odometer), status: v.status,
      region: v.region ?? '', acquisition_cost: String(v.acquisition_cost ?? ''),
    });
    setOpen(true);
  }

  async function retire(id: number) {
    if (!confirm('Retire this vehicle?')) return;
    try { await api.delete(`/vehicles/${id}`); load(); }
    catch { alert('Failed to retire vehicle'); }
  }

  function close() { setOpen(false); setEditing(null); setForm({ ...EMPTY }); }
  const f = (k: string) => (e: React.ChangeEvent<any>) => setForm({ ...form, [k]: e.target.value });

  if (loading) return <div className="ff-loading"><div className="ff-spinner"/>Loading</div>;

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div>
          <h1 className="ff-page-title">Vehicle Registry</h1>
          <p className="ff-page-sub">Manage fleet assets and specifications</p>
        </div>
        <button className="ff-btn ff-btn-primary" onClick={() => { close(); setOpen(true); }}>
          Add Vehicle
        </button>
      </div>

      <div className="ff-card">
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Type</th><th>Capacity</th>
                <th>Odometer</th><th>Status</th><th>Region</th><th/>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td>
                    <div className="t-primary">{v.name}</div>
                    <div className="t-mono t-secondary">{v.license_plate}</div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{v.vehicle_type}</td>
                  <td className="t-mono" style={{ color: 'var(--text-2)' }}>{v.max_capacity_kg} kg</td>
                  <td className="t-mono" style={{ color: 'var(--text-2)' }}>{v.odometer.toLocaleString()} km</td>
                  <td><span className={badge(v.status)}>{v.status}</span></td>
                  <td style={{ color: 'var(--text-2)' }}>{v.region || '—'}</td>
                  <td>
                    <div className="ff-row-actions">
                      <button className="ff-btn ff-btn-ghost ff-btn-sm" onClick={() => openEdit(v)}>Edit</button>
                      <button className="ff-btn ff-btn-danger ff-btn-sm" onClick={() => retire(v.id)}>Retire</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!vehicles.length && <tr><td colSpan={7} className="ff-empty">No vehicles registered</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="ff-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="ff-modal">
            <div className="ff-modal-head">
              <div className="ff-modal-title">{editing ? 'Edit Vehicle' : 'Add Vehicle'}</div>
            </div>
            <form onSubmit={submit}>
              <div className="ff-modal-body">
                <div className="ff-form-group">
                  <label className="ff-label">Name</label>
                  <input required className="ff-input" value={form.name} onChange={f('name')} placeholder="e.g. Truck Alpha"/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Model</label>
                  <input className="ff-input" value={form.model} onChange={f('model')} placeholder="e.g. Ford Transit"/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">License Plate</label>
                  <input required className="ff-input t-mono" value={form.license_plate} onChange={f('license_plate')}/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Vehicle Type</label>
                  <select className="ff-select" value={form.vehicle_type} onChange={f('vehicle_type')}>
                    <option>Truck</option><option>Van</option><option>Bike</option>
                  </select>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Max Capacity (kg)</label>
                  <input required type="number" step=".01" className="ff-input t-mono" value={form.max_capacity_kg} onChange={f('max_capacity_kg')}/>
                </div>
                {editing && (<>
                  <div className="ff-form-group">
                    <label className="ff-label">Odometer (km)</label>
                    <input type="number" className="ff-input t-mono" value={form.odometer} onChange={f('odometer')}/>
                  </div>
                  <div className="ff-form-group">
                    <label className="ff-label">Status</label>
                    <select className="ff-select" value={form.status} onChange={f('status')}>
                      <option>Available</option><option>On Trip</option>
                      <option>In Shop</option><option>Out of Service</option>
                    </select>
                  </div>
                </>)}
                <div className="ff-form-group">
                  <label className="ff-label">Region</label>
                  <input className="ff-input" value={form.region} onChange={f('region')}/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Acquisition Cost <span>(optional)</span></label>
                  <input type="number" step=".01" className="ff-input t-mono" value={form.acquisition_cost} onChange={f('acquisition_cost')}/>
                </div>
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