import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get fuel efficiency metrics
router.get('/fuel-efficiency', async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        v.id as vehicle_id,
        v.name as vehicle_name,
        v.license_plate,
        SUM(t.distance_km) as total_distance_km,
        SUM(e.liters) as total_liters,
        CASE 
          WHEN SUM(e.liters) > 0 THEN SUM(t.distance_km) / SUM(e.liters)
          ELSE 0
        END as km_per_liter
      FROM vehicles v
      LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'Completed'
      LEFT JOIN expenses e ON v.id = e.vehicle_id AND e.expense_type = 'Fuel' AND e.trip_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (vehicle_id) {
      query += ' AND v.id = ?';
      params.push(vehicle_id);
    }

    if (start_date) {
      query += ' AND t.completed_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND t.completed_at <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY v.id, v.name, v.license_plate HAVING total_distance_km > 0';
    
    const metrics = await db.prepare(query).all(...params);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vehicle ROI
router.get('/vehicle-roi', async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        v.id,
        v.name,
        v.license_plate,
        v.acquisition_cost,
        COALESCE(SUM(e.total_cost), 0) as total_expenses,
        COALESCE(SUM(m.cost), 0) as total_maintenance,
        (COALESCE(SUM(e.total_cost), 0) + COALESCE(SUM(m.cost), 0)) as total_operational_cost
      FROM vehicles v
      LEFT JOIN expenses e ON v.id = e.vehicle_id
      LEFT JOIN maintenance m ON v.id = m.vehicle_id
      WHERE 1=1
    `;
    const params = [];

    if (vehicle_id) {
      query += ' AND v.id = ?';
      params.push(vehicle_id);
    }

    if (start_date) {
      query += ' AND (e.expense_date >= ? OR m.service_date >= ?)';
      params.push(start_date, start_date);
    }
    if (end_date) {
      query += ' AND (e.expense_date <= ? OR m.service_date <= ?)';
      params.push(end_date, end_date);
    }

    query += ' GROUP BY v.id, v.name, v.license_plate, v.acquisition_cost';
    
    const vehicles = await db.prepare(query).all(...params);
    
    // Calculate ROI (assuming revenue from trips - simplified)
    const vehiclesWithROI = vehicles.map(v => {
      const revenue = 0; // In a real system, this would come from trip revenue
      const roi = v.acquisition_cost > 0 
        ? ((revenue - v.total_operational_cost) / v.acquisition_cost) * 100 
        : 0;
      return {
        ...v,
        revenue,
        roi: roi.toFixed(2)
      };
    });

    res.json(vehiclesWithROI);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver performance
router.get('/driver-performance', async (req, res) => {
  try {
    const drivers = await db.prepare(`
      SELECT 
        d.id,
        d.name,
        d.trips_completed,
        d.safety_score,
        COUNT(t.id) as total_trips,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_trips,
        CASE 
          WHEN COUNT(t.id) > 0 THEN (SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id))
          ELSE 0
        END as completion_rate
      FROM drivers d
      LEFT JOIN trips t ON d.id = t.driver_id
      GROUP BY d.id, d.name, d.trips_completed, d.safety_score
      ORDER BY d.trips_completed DESC
    `).all();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

