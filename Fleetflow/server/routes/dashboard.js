import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get dashboard KPIs
router.get('/kpis', async (req, res) => {
  try {
    // Active Fleet (vehicles On Trip)
    const activeFleet = await db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = "On Trip"').get();

    // Maintenance Alerts (vehicles In Shop)
    const maintenanceAlerts = await db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = "In Shop"').get();

    // Total vehicles
    const totalVehicles = await db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status != "Out of Service"').get();
    const onTripCount = activeFleet.count;
    const utilizationRate = totalVehicles.count > 0 
      ? ((onTripCount / totalVehicles.count) * 100).toFixed(1) 
      : 0;

    // Pending Cargo (trips in Draft status)
    const pendingCargo = await db.prepare('SELECT COUNT(*) as count FROM trips WHERE status = "Draft"').get();

    res.json({
      activeFleet: activeFleet.count,
      maintenanceAlerts: maintenanceAlerts.count,
      utilizationRate: parseFloat(utilizationRate),
      pendingCargo: pendingCargo.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available vehicles for dispatcher
router.get('/available-vehicles', async (req, res) => {
  try {
    const vehicles = await db.prepare(`
      SELECT id, name, license_plate, vehicle_type, max_capacity_kg, status
      FROM vehicles
      WHERE status = 'Available'
      ORDER BY name
    `).all();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available drivers for dispatcher
router.get('/available-drivers', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const drivers = await db.prepare(`
      SELECT id, name, license_category, status, license_expiry
      FROM drivers
      WHERE status IN ('Off Duty', 'On Duty')
        AND license_expiry >= ?
      ORDER BY name
    `).all(today);
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

