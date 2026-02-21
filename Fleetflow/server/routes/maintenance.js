import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);


router.get('/', async (req, res) => {
  try {
    const { vehicle_id } = req.query;

    let query = `
      SELECT m.*, v.name as vehicle_name, v.license_plate
      FROM maintenance m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;

    const params = [];

    if (vehicle_id) {
      query += ' AND m.vehicle_id = ?';
      params.push(vehicle_id);
    }

    query += ' ORDER BY m.service_date DESC';

    const records = await db.prepare(query).all(...params);
    res.json(records);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});



router.post('/', requireRole('Manager'), async (req, res) => {
  try {
    const {
      vehicle_id,
      service_type,
      description,
      cost,
      service_date,
      next_service_date
    } = req.body;

   
    const vehicle = await db
      .prepare('SELECT id FROM vehicles WHERE id = ?')
      .get(vehicle_id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

  
    const result = await db.prepare(`
      INSERT INTO maintenance 
      (vehicle_id, service_type, description, cost, service_date, next_service_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      vehicle_id,
      service_type,
      description,
      cost,
      service_date,
      next_service_date,
      req.user.id
    );

    
    await db
      .prepare('UPDATE vehicles SET status = "In Shop" WHERE id = ?')
      .run(vehicle_id);

   
    const record = await db.prepare(`
      SELECT m.*, v.name as vehicle_name, v.license_plate
      FROM maintenance m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(record);

  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});


router.patch('/:id/complete', requireRole('Manager'), async (req, res) => {
  try {
    const maintenance = await db
      .prepare('SELECT vehicle_id FROM maintenance WHERE id = ?')
      .get(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    await db
      .prepare('UPDATE vehicles SET status = "Available" WHERE id = ?')
      .run(maintenance.vehicle_id);

    res.json({ message: 'Vehicle returned to Available status' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;