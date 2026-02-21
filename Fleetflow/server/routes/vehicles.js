import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const { type, status, region } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND vehicle_type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }

    query += ' ORDER BY created_at DESC';
    const vehicles = await db.prepare(query).all(...params);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single vehicle
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vehicle
router.post('/', requireRole('Manager'), async (req, res) => {
  try {
    const { name, model, license_plate, vehicle_type, max_capacity_kg, region, acquisition_cost } = req.body;

    const result = await db.prepare(`
      INSERT INTO vehicles (name, model, license_plate, vehicle_type, max_capacity_kg, region, acquisition_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, model, license_plate, vehicle_type, max_capacity_kg, region, acquisition_cost);

    const vehicle = await db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'License plate already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle
router.put('/:id', requireRole('Manager'), async (req, res) => {
  try {
    const { name, model, license_plate, vehicle_type, max_capacity_kg, odometer, status, region, acquisition_cost } = req.body;

    await db.prepare(`
      UPDATE vehicles
      SET name = ?, model = ?, license_plate = ?, vehicle_type = ?, max_capacity_kg = ?,
          odometer = ?, status = ?, region = ?, acquisition_cost = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, model, license_plate, vehicle_type, max_capacity_kg, odometer, status, region, acquisition_cost, req.params.id);

    const vehicle = await db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vehicle (soft delete - set to Out of Service)
router.delete('/:id', requireRole('Manager'), async (req, res) => {
  try {
    await db.prepare('UPDATE vehicles SET status = "Out of Service" WHERE id = ?').run(req.params.id);
    res.json({ message: 'Vehicle retired' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

