import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET ,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user =await db.prepare('SELECT id, email, role, name FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register (for testing - in production, this should be admin-only)
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name } = req.body;

    const existingUser =await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result =await db.prepare(`
      INSERT INTO users (email, password, role, name)
      VALUES (?, ?, ?, ?)
    `).run(email, hashedPassword, role, name);

    res.status(201).json({ id: result.lastInsertRowid, email, role, name });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;

