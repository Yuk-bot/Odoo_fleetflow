import { useState, useEffect } from 'react';
import api from '../api/client';

interface Trip {
  id: number; vehicle_id: number; driver_id: number;
  origin: string; destination: string; cargo_weight_kg: number;
  status: string; vehicle_name: string; license_plate: string;
  driver_name: string; start_odometer: number;
  end_odometer: number; distance_km: number;
}
interface Vehicle { id: number; name: string; license_plate: string; vehicle_type: string; max_capacity_kg: number; }
interface Driver  { id: number; name: string; license_category: string; }

const EMPTY = { vehicle_id: '', driver_id: '', origin: '', destination: '', cargo_weight_kg: '' };

function badge(s: string) {
  const m: Record<string, string> = {
    Draft: 'ff-badge ff-badge-gray', Dispatched: 'ff-badge ff-badge-blue',
    Completed: 'ff-badge ff-badge-green', Cancelled: 'ff-badge ff-badge-red',
  };
  return m[s] ?? 'ff-badge ff-badge-gray';
}

export default function TripDispatcher() {
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers]   = useState<Driver[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [form, setForm]         = useState({ ...EMPTY });
  const [err, setErr]           = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [t, v, d] = await Promise.all([
        api.get('/trips'),
        api.get('/dashboard/available-vehicles'),
        api.get('/dashboard/available-drivers'),
      ]);
      setTrips(t.data); setVehicles(v.data); setDrivers(d.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const sel = vehicles.find(v => v.id === +form.vehicle_id);
    if (sel && +form.cargo_weight_kg > sel.max_capacity_kg) {
      setErr(`Cargo (${form.cargo_weight_kg} kg) exceeds capacity (${sel.max_capacity_kg} kg)`);
      return;
    }
    try {
      await api.post('/trips', {
        ...form, vehicle_id: +form.vehicle_id,
        driver_id: +form.driver_id, cargo_weight_kg: +form.cargo_weight_kg,
      });
      close(); loadAll();
    } catch (ex: any) { setErr(ex.response?.data?.error ?? 'Failed to create trip'); }
  }

  async function updateStatus(id: number, status: string, odometer?: number) {
    try {
      await api.patch(`/trips/${id}/status`, {
        status, ...(odometer && { [status === 'Dispatched' ? 'start_odometer' : 'end_odometer']: odometer }),
      });
      loadAll();
    } catch (ex: any) { alert(ex.response?.data?.error ?? 'Failed to update status'); }
  }

  function askOdo(label: string) {
    const v = prompt(`Enter ${label} (km):`);
    return v ? +v : null;
  }

  function close() { setOpen(false); setForm({ ...EMPTY }); setErr(''); }
  const f = (k: string) => (e: React.ChangeEvent<any>) => { setForm({ ...form, [k]: e.target.value }); setErr(''); };

  if (loading) return <div className="ff-loading"><div className="ff-spinner"/>Loading</div>;

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div>
          <h1 className="ff-page-title">Trip Dispatcher</h1>
          <p className="ff-page-sub">Create and manage delivery trips</p>
        </div>
        <button className="ff-btn ff-btn-primary" onClick={() => { close(); setOpen(true); }}>
          Create Trip
        </button>
      </div>

      <div className="ff-card">
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Route</th><th>Vehicle</th><th>Driver</th>
                <th>Cargo</th><th>Distance</th><th>Status</th><th/>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.id}>
                  <td><div className="t-primary">{t.origin} → {t.destination}</div></td>
                  <td>
                    <div style={{ color: 'var(--text-2)' }}>{t.vehicle_name}</div>
                    <div className="t-mono t-secondary">{t.license_plate}</div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{t.driver_name}</td>
                  <td className="t-mono" style={{ color: 'var(--text-2)' }}>{t.cargo_weight_kg} kg</td>
                  <td className="t-mono" style={{ color: 'var(--text-2)' }}>
                    {t.distance_km ? `${t.distance_km.toFixed(1)} km` : '—'}
                  </td>
                  <td><span className={badge(t.status)}>{t.status}</span></td>
                  <td>
                    <div className="ff-row-actions">
                      {t.status === 'Draft' && (<>
                        <button className="ff-btn ff-btn-blue-ghost ff-btn-sm" onClick={() => {
                          const o = askOdo('start odometer'); if (o !== null) updateStatus(t.id, 'Dispatched', o);
                        }}>Dispatch</button>
                        <button className="ff-btn ff-btn-danger ff-btn-sm"
                          onClick={() => updateStatus(t.id, 'Cancelled')}>Cancel</button>
                      </>)}
                      {t.status === 'Dispatched' && (
                        <button className="ff-btn ff-btn-success ff-btn-sm" onClick={() => {
                          const o = askOdo('end odometer'); if (o !== null) updateStatus(t.id, 'Completed', o);
                        }}>Complete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!trips.length && <tr><td colSpan={7} className="ff-empty">No trips yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="ff-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="ff-modal">
            <div className="ff-modal-head">
              <div className="ff-modal-title">Create New Trip</div>
            </div>
            <form onSubmit={submit}>
              <div className="ff-modal-body">
                {err && <div className="ff-alert-error">{err}</div>}
                <div className="ff-form-group">
                  <label className="ff-label">Vehicle</label>
                  <select required className="ff-select" value={form.vehicle_id} onChange={f('vehicle_id')}>
                    <option value="">Select a vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.license_plate}) — {v.max_capacity_kg} kg
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Driver</label>
                  <select required className="ff-select" value={form.driver_id} onChange={f('driver_id')}>
                    <option value="">Select a driver</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.license_category})</option>
                    ))}
                  </select>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Origin</label>
                  <input required className="ff-input" value={form.origin} onChange={f('origin')} placeholder="Departure location"/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Destination</label>
                  <input required className="ff-input" value={form.destination} onChange={f('destination')} placeholder="Arrival location"/>
                </div>
                <div className="ff-form-group">
                  <label className="ff-label">Cargo Weight (kg)</label>
                  <input required type="number" step=".01" className="ff-input t-mono" value={form.cargo_weight_kg} onChange={f('cargo_weight_kg')}/>
                  {form.vehicle_id && (
                    <span className="ff-hint">
                      Max capacity: {vehicles.find(v => v.id === +form.vehicle_id)?.max_capacity_kg ?? 0} kg
                    </span>
                  )}
                </div>
              </div>
              <div className="ff-modal-foot">
                <button type="button" className="ff-btn ff-btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="ff-btn ff-btn-primary">Create Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}