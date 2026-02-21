import { useState, useEffect } from 'react';
import api from '../api/client';

interface KPIs {
  activeFleet: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
}

interface Vehicle {
  id: number;
  name: string;
  license_plate: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer: number;
  status: string; 
  region: string;
}

function badge(status: string) {
  const m: Record<string, string> = {
    'Available':      'ff-badge ff-badge-green',
    'On Trip':        'ff-badge ff-badge-blue',
    'In Shop':        'ff-badge ff-badge-yellow',
    'Out of Service': 'ff-badge ff-badge-gray',
  };
  return m[status] ?? 'ff-badge ff-badge-gray';
}

export default function Dashboard() {
  const [kpis, setKpis]         = useState<KPIs | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ vehicleType: '', status: '', region: '' });

  useEffect(() => { fetchKPIs(); fetchVehicles(); }, []);
  useEffect(() => { fetchVehicles(); }, [filters]);

  async function fetchKPIs() {
    try { const r = await api.get('/dashboard/kpis'); setKpis(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchVehicles() {
    try {
      const p: Record<string, string> = {};
      if (filters.vehicleType) p.type   = filters.vehicleType;
      if (filters.status)      p.status = filters.status;
      if (filters.region)      p.region = filters.region;
      const r = await api.get('/vehicles', { params: p });
      setVehicles(r.data);
    } catch (e) { console.error(e); }
  }

  if (loading) return <div className="ff-loading"><div className="ff-spinner" />Loading</div>;

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div>
          <h1 className="ff-page-title">Command Center</h1>
          <p className="ff-page-sub">High-level fleet oversight and monitoring</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="ff-kpi-grid">
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Active Fleet</div>
          <div className="ff-kpi-value">{kpis?.activeFleet ?? 0}</div>
          <div className="ff-kpi-meta">vehicles on road</div>
        </div>
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Maintenance Alerts</div>
          <div className="ff-kpi-value" style={{ color: (kpis?.maintenanceAlerts ?? 0) > 0 ? 'var(--yellow)' : undefined }}>
            {kpis?.maintenanceAlerts ?? 0}
          </div>
          <div className="ff-kpi-meta">require attention</div>
        </div>
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Utilization Rate</div>
          <div className="ff-kpi-value">{kpis?.utilizationRate ?? 0}%</div>
          <div className="ff-kpi-meta">fleet efficiency</div>
        </div>
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Pending Cargo</div>
          <div className="ff-kpi-value">{kpis?.pendingCargo ?? 0}</div>
          <div className="ff-kpi-meta">awaiting dispatch</div>
        </div>
      </div>

      {/* Filters */}
      <div className="ff-filters">
        <div className="ff-form-group">
          <label className="ff-label">Vehicle Type</label>
          <select className="ff-select" value={filters.vehicleType}
            onChange={e => setFilters({ ...filters, vehicleType: e.target.value })}>
            <option value="">All types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bike">Bike</option>
          </select>
        </div>
        <div className="ff-form-group">
          <label className="ff-label">Status</label>
          <select className="ff-select" value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Out of Service">Out of Service</option>
          </select>
        </div>
        <div className="ff-form-group">
          <label className="ff-label">Region</label>
          <input className="ff-input" placeholder="Filter by region…"
            value={filters.region}
            onChange={e => setFilters({ ...filters, region: e.target.value })} />
        </div>
      </div>

      {/* Table */}
      <div className="ff-card">
        <div className="ff-card-header">
          <span className="ff-card-title">Fleet Overview</span>
          {vehicles.length > 0 && (
            <span style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>{vehicles.length} vehicles</span>
          )}
        </div>
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Type</th><th>Capacity</th>
                <th>Odometer</th><th>Status</th><th>Region</th>
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
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={6} className="ff-empty">No vehicles match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}