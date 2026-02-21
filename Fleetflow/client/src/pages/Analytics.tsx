import { useState, useEffect } from 'react';
import api from '../api/client';

interface AnalyticsSummary {
  totalFuelCost: number;
  fleetROI: number;
  utilizationRate: number;
  topVehicles: Array<{ name: string; license_plate: string; trips: number; distance_km: number; revenue: number }>;
  monthlyFinancials: Array<{ month: string; revenue: number; fuel_cost: number; maintenance_cost: number; net_profit: number }>;
}

const fmt = (n: number) =>
  n?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? '—';

const fmtUSD = (n: number) =>
  n !== undefined ? `$${fmt(n)}` : '—';

export default function Analytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const r = await api.get('/analytics');
      setData(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return <div className="ff-loading"><div className="ff-spinner" />Loading</div>;
  }

  const financials = data?.monthlyFinancials ?? [];
  const topVehicles = data?.topVehicles ?? [];

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <h1 className="ff-page-title">Analytics & Reports</h1>
        <p className="ff-page-subtitle">Operational insights and financial performance</p>
      </div>

      {/* Top KPIs */}
      <div className="ff-kpi-grid">
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Total Fuel Cost</div>
          <div className="ff-kpi-value">{fmtUSD(data?.totalFuelCost ?? 0)}</div>
        </div>
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Fleet ROI</div>
          <div className="ff-kpi-value" style={{ color: (data?.fleetROI ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {data?.fleetROI ?? 0}%
          </div>
        </div>
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Utilization Rate</div>
          <div className="ff-kpi-value">{data?.utilizationRate ?? 0}%</div>
        </div>
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Active Vehicles</div>
          <div className="ff-kpi-value">{topVehicles.length}</div>
          <div className="ff-kpi-meta">in top performers</div>
        </div>
      </div>

      {/* Top Vehicles */}
      <div className="ff-card" style={{ marginBottom: 20 }}>
        <div className="ff-card-header">
          <span className="ff-card-title">Top Performing Vehicles</span>
        </div>
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Trips</th>
                <th>Distance</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topVehicles.map((v, i) => (
                <tr key={v.license_plate}>
                  <td>
                    <div className="ff-flex ff-gap-2" style={{ alignItems: 'center' }}>
                      <span
                        className="ff-mono"
                        style={{
                          fontSize: '0.7rem',
                          color: i === 0 ? 'var(--yellow)' : 'var(--text-muted)',
                          fontWeight: 600,
                          width: 16,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <div className="cell-primary">{v.name}</div>
                        <div className="cell-secondary ff-mono">{v.license_plate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="ff-mono ff-text-secondary">{v.trips}</td>
                  <td className="ff-mono ff-text-secondary">{fmt(v.distance_km)} km</td>
                  <td className="ff-mono" style={{ fontWeight: 500 }}>{fmtUSD(v.revenue)}</td>
                </tr>
              ))}
              {topVehicles.length === 0 && (
                <tr><td colSpan={4} className="ff-empty">No vehicle data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Financials */}
      <div className="ff-card">
        <div className="ff-card-header">
          <span className="ff-card-title">Monthly Financial Summary</span>
        </div>
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Fuel Cost</th>
                <th>Maintenance</th>
                <th>Net Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {financials.map((row) => {
                const margin = row.revenue > 0 ? ((row.net_profit / row.revenue) * 100).toFixed(1) : '—';
                const profitable = row.net_profit >= 0;
                return (
                  <tr key={row.month}>
                    <td className="ff-font-medium">{row.month}</td>
                    <td className="ff-mono ff-text-secondary">{fmtUSD(row.revenue)}</td>
                    <td className="ff-mono ff-text-secondary">{fmtUSD(row.fuel_cost)}</td>
                    <td className="ff-mono ff-text-secondary">{fmtUSD(row.maintenance_cost)}</td>
                    <td className="ff-mono" style={{ fontWeight: 500, color: profitable ? 'var(--green)' : 'var(--red)' }}>
                      {fmtUSD(row.net_profit)}
                    </td>
                    <td className="ff-mono ff-text-secondary">{margin !== '—' ? `${margin}%` : '—'}</td>
                  </tr>
                );
              })}
              {financials.length === 0 && (
                <tr><td colSpan={6} className="ff-empty">No financial data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
