import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const rows = await db.prepare(`
      SELECT 
        e.trip_id,
        e.status,
        e.expense_type,
        e.total_cost,
        t.origin,
        t.destination,
        t.distance_km,
        d.name as driver_name
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY e.created_at DESC
    `).all();

    const grouped = {};

    rows.forEach(row => {
      if (!grouped[row.trip_id]) {
        grouped[row.trip_id] = {
          trip_id: row.trip_id,
          origin: row.origin,
          destination: row.destination,
          driver_name: row.driver_name,
          distance_km: row.distance_km,
          fuel_expense: 0,
          misc_expense: 0,
          status: row.status
        };
      }

      if (row.expense_type === 'Fuel') {
        grouped[row.trip_id].fuel_expense += Number(row.total_cost);
      } else {
        grouped[row.trip_id].misc_expense += Number(row.total_cost);
      }
    });

    res.json(Object.values(grouped));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', requireRole('Manager', 'FinancialAnalyst'), async (req, res) => {
  try {
    const { vehicle_id, trip_id, expense_type, liters, cost_per_liter, total_cost, expense_date, description } = req.body;

    // Calculate total_cost if not provided
    let finalCost = total_cost;
    if (expense_type === 'Fuel' && liters && cost_per_liter) {
      finalCost = liters * cost_per_liter;
    }

    const result = await db.prepare(`
      INSERT INTO expenses (vehicle_id, trip_id, expense_type, liters, cost_per_liter, total_cost, expense_date, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vehicle_id, trip_id, expense_type, liters, cost_per_liter, finalCost, expense_date, description, req.user.id);

    const expense = await db.prepare(`
      SELECT e.*, v.name as vehicle_name, v.license_plate
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expenses summary by vehicle
router.get('/summary/vehicle/:id', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT 
        SUM(CASE WHEN expense_type = 'Fuel' THEN total_cost ELSE 0 END) as total_fuel_cost,
        SUM(CASE WHEN expense_type = 'Fuel' THEN liters ELSE 0 END) as total_liters,
        SUM(total_cost) as total_operational_cost
      FROM expenses
      WHERE vehicle_id = ?
    `;
    const params = [req.params.id];

    if (start_date) {
      query += ' AND expense_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND expense_date <= ?';
      params.push(end_date);
    }

    const summary = await db.prepare(query).get(...params);
    
    // Get maintenance costs
    let maintQuery = 'SELECT SUM(cost) as total_maintenance_cost FROM maintenance WHERE vehicle_id = ?';
    const maintParams = [req.params.id];
    if (start_date) {
      maintQuery += ' AND service_date >= ?';
      maintParams.push(start_date);
    }
    if (end_date) {
      maintQuery += ' AND service_date <= ?';
      maintParams.push(end_date);
    }
    const maintenance = await db.prepare(maintQuery).get(...maintParams);

    res.json({
      ...summary,
      total_maintenance_cost: maintenance.total_maintenance_cost || 0,
      total_operational_cost: (summary.total_operational_cost || 0) + (maintenance.total_maintenance_cost || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

