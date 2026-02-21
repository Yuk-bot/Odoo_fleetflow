import { useState, useEffect } from 'react';
import api from '../api/client';

interface Expense {
  id: number;
  trip_id: number;
  driver_name: string;
  distance_km?: number | null;
  fuel_expense?: number | null;
  misc_expense?: number | null;
  status: string;
  origin?: string;
  destination?: string;
}

interface Trip {
  id: number;
  origin: string;
  destination: string;
  driver_name: string;
}

const EMPTY = { trip_id: '', fuel_expense: '', misc_expense: '' };

function badge(s: string) {
  const m: Record<string, string> = {
    Pending: 'ff-badge ff-badge-yellow',
    Approved: 'ff-badge ff-badge-green',
    Rejected: 'ff-badge ff-badge-red',
  };
  return m[s] ?? 'ff-badge ff-badge-gray';
}

/* ---------- SAFE MONEY FORMATTER ---------- */
const usd = (value?: number | null) => {
  const num = Number(value ?? 0);
  if (isNaN(num)) return "$0.00";

  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

/* ---------- NORMALIZE API DATA ---------- */
const normalizeExpense = (e: any): Expense => ({
  ...e,
  fuel_expense: Number(e.fuel_expense ?? 0),
  misc_expense: Number(e.misc_expense ?? 0),
  distance_km: Number(e.distance_km ?? 0),
});

export default function ExpenseLogging() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [ex, tr] = await Promise.all([
        api.get('/expenses'),
        api.get('/trips'),
      ]);

      // ✅ normalize numbers here
      setExpenses(ex.data.map(normalizeExpense));
      setTrips(tr.data.filter((t: any) => t.status === 'Completed'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api.post('/expenses', {
        trip_id: Number(form.trip_id),
        fuel_expense: Number(form.fuel_expense) || 0,
        misc_expense: Number(form.misc_expense) || 0,
      });

      close();
      loadAll();
    } catch (ex: any) {
      alert(ex.response?.data?.error ?? 'Failed to log expense');
    }
  }

  async function approve(id: number) {
    try {
      await api.patch(`/expenses/${id}/approve`);
      loadAll();
    } catch {
      alert('Failed to approve');
    }
  }

  function close() {
    setOpen(false);
    setForm({ ...EMPTY });
  }

  const f =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  /* ---------- SAFE TOTALS ---------- */
  const totalFuel = expenses.reduce(
    (s, e) => s + Number(e.fuel_expense ?? 0),
    0
  );

  const totalMisc = expenses.reduce(
    (s, e) => s + Number(e.misc_expense ?? 0),
    0
  );

  if (loading)
    return (
      <div className="ff-loading">
        <div className="ff-spinner" />
        Loading
      </div>
    );

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div>
          <h1 className="ff-page-title">Expense & Fuel Logging</h1>
          <p className="ff-page-sub">Track operational costs per trip</p>
        </div>

        <button
          className="ff-btn ff-btn-primary"
          onClick={() => {
            close();
            setOpen(true);
          }}
        >
          Add Expense
        </button>
      </div>

      {/* KPI */}
      <div className="ff-kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Total Fuel</div>
          <div className="ff-kpi-value">{usd(totalFuel)}</div>
        </div>

        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Misc. Expenses</div>
          <div className="ff-kpi-value">{usd(totalMisc)}</div>
        </div>

        <div className="ff-kpi-card">
          <div className="ff-kpi-label">Total Spend</div>
          <div className="ff-kpi-value">{usd(totalFuel + totalMisc)}</div>
        </div>
      </div>

      <div className="ff-card">
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>Driver</th>
                <th>Distance</th>
                <th>Fuel</th>
                <th>Misc</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {expenses.map((ex) => (
                <tr key={ex.id}>
                  <td>
                    {ex.origin && ex.destination ? (
                      <div>{ex.origin} → {ex.destination}</div>
                    ) : (
                      <div>Trip #{ex.trip_id}</div>
                    )}
                  </td>

                  <td>{ex.driver_name}</td>

                  <td>
                    {ex.distance_km ? `${ex.distance_km} km` : '—'}
                  </td>

                  <td>{usd(ex.fuel_expense)}</td>
                  <td>{usd(ex.misc_expense)}</td>
                  <td>{usd((ex.fuel_expense ?? 0) + (ex.misc_expense ?? 0))}</td>

                  <td>
                    <span className={badge(ex.status)}>
                      {ex.status}
                    </span>
                  </td>

                  <td>
                    {ex.status === 'Pending' && (
                      <button
                        className="ff-btn ff-btn-success ff-btn-sm"
                        onClick={() => approve(ex.id)}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!expenses.length && (
                <tr>
                  <td colSpan={8}>No expenses logged yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal unchanged */}
      {open && (
        <div className="ff-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="ff-modal">
            <form onSubmit={submit}>
              <div className="ff-modal-body">

                <select required value={form.trip_id} onChange={f('trip_id')}>
                  <option value="">Select trip</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} — {t.origin} → {t.destination}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step=".01"
                  value={form.fuel_expense}
                  onChange={f('fuel_expense')}
                  placeholder="Fuel"
                />

                <input
                  type="number"
                  step=".01"
                  value={form.misc_expense}
                  onChange={f('misc_expense')}
                  placeholder="Misc"
                />
              </div>

              <div className="ff-modal-foot">
                <button type="button" onClick={close}>Cancel</button>
                <button type="submit">Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}