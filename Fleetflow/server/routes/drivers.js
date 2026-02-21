import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const drivers = await db.prepare(query).all(...params);
    
    // Check license expiry
    const today = new Date().toISOString().split('T')[0];
    const driversWithExpiry = drivers.map(driver => ({
      ...driver,
      license_expired: driver.license_expiry < today
    }));

    res.json(driversWithExpiry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single driver
router.get('/:id', async (req, res) => {
  try {
    const driver = await db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    res.json({
      ...driver,
      license_expired: driver.license_expiry < today
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create driver
router.post('/', requireRole('Manager', 'SafetyOfficer'), async (req, res) => {
  try {
    const { name, email, phone, license_number, license_category, license_expiry } = req.body;

    const result = await db.prepare(`
      INSERT INTO drivers (name, email, phone, license_number, license_category, license_expiry)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, license_number, license_category, license_expiry);

    const driver = await db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(driver);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'License number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update driver
router.put('/:id', requireRole('Manager', 'SafetyOfficer'), async (req, res) => {
  try {
    const { name, email, phone, license_number, license_category, license_expiry, status, safety_score } = req.body;

    await db.prepare(`
      UPDATE drivers
      SET name = ?, email = ?, phone = ?, license_number = ?, license_category = ?,
          license_expiry = ?, status = ?, safety_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, email, phone, license_number, license_category, license_expiry, status, safety_score, req.params.id);

    const driver = await db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update driver safety score
router.patch('/:id/safety-score', requireRole('SafetyOfficer'), async (req, res) => {
  try {
    const { safety_score } = req.body;
    await db.prepare('UPDATE drivers SET safety_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(safety_score, req.params.id);
    
    const driver = await db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

