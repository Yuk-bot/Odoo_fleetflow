import express from 'express';
import db, { transaction } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();


router.use((req, res, next) => {
  try {
    authenticateToken(req, res, next);
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
});


router.get('/', async (req, res) => {
  try {
    const trips = await db.prepare(`
      SELECT t.*, 
             v.name as vehicle_name, v.license_plate, v.vehicle_type,
             d.name as driver_name, d.license_number
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
    `).all();

    res.json(trips);
  } catch (error) {
    console.error("CREATE TRIP ERROR FULL:", error);
    res.status(400).json({ error: error.message });
  }
});


router.post(
  '/',
  requireRole('Dispatcher', 'Manager'),
  async (req, res) => {
    try {
      console.log("Incoming trip data:", req.body);

      const {
        vehicle_id,
        driver_id,
        origin,
        destination,
        cargo_weight_kg
      } = req.body;

      if (!vehicle_id || !driver_id || !origin || !destination) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const parsedVehicleId = parseInt(vehicle_id);
      const parsedDriverId = parseInt(driver_id);
      const parsedWeight = parseFloat(cargo_weight_kg);

      // Check vehicle
      const vehicle = await db.prepare(
        `SELECT * FROM vehicles WHERE id = ?`
      ).get(parsedVehicleId);

      if (!vehicle) throw new Error("Vehicle not found");
      if (vehicle.status !== "Available")
        throw new Error("Vehicle is not available");
      if (parsedWeight > vehicle.max_capacity_kg)
        throw new Error("Cargo exceeds vehicle capacity");

      // Check driver
      const driver = await db.prepare(
        `SELECT * FROM drivers WHERE id = ?`
      ).get(parsedDriverId);

      if (!driver) throw new Error("Driver not found");
      if (driver.status !== "Off Duty")
        throw new Error("Driver is not available");

      // INSERT TRIP 
      const result = await db.prepare(`
        INSERT INTO trips
        (vehicle_id, driver_id, origin, destination, cargo_weight_kg, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        parsedVehicleId,
        parsedDriverId,
        origin,
        destination,
        parsedWeight,
        req.user?.id || null
      );

      const tripId = result.lastInsertRowid;

      const trip = await db.prepare(`
        SELECT t.*, 
               v.name as vehicle_name, v.license_plate,
               d.name as driver_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        WHERE t.id = ?
      `).get(tripId);

      res.status(201).json(trip);

    } catch (error) {
      console.error("CREATE TRIP ERROR:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;