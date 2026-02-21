import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'fleetflow.db');

let db = null;
let SQL = null;


export async function initDatabase() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  createTables();
  createIndexes();
  createDefaultAdmin();

  saveDatabase();
  console.log('Database initialized successfully');
}


function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Manager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst')),
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT,
      license_plate TEXT UNIQUE NOT NULL,
      vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('Truck', 'Van', 'Bike')),
      max_capacity_kg REAL NOT NULL,
      odometer REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Available'
        CHECK(status IN ('Available', 'On Trip', 'In Shop', 'Out of Service')),
      region TEXT,
      acquisition_cost REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      license_number TEXT UNIQUE NOT NULL,
      license_category TEXT NOT NULL,
      license_expiry DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Off Duty'
        CHECK(status IN ('On Duty', 'Off Duty', 'Suspended')),
      safety_score REAL DEFAULT 100,
      trips_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      cargo_weight_kg REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft'
        CHECK(status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
      start_odometer REAL,
      end_odometer REAL,
      distance_km REAL,
      created_by INTEGER,
      dispatched_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      service_type TEXT NOT NULL,
      description TEXT,
      cost REAL NOT NULL,
      service_date DATE NOT NULL,
      next_service_date DATE,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    trip_id INTEGER NOT NULL,
    expense_type TEXT NOT NULL CHECK(expense_type IN ('Fuel', 'Other')),
    total_cost REAL NOT NULL,
    expense_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK(status IN ('Pending', 'Approved', 'Rejected')),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);
}

function createIndexes() {
  db.run('CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id)');
}


function createDefaultAdmin() {
  const result = db.exec("SELECT id FROM users WHERE email = 'admin@fleetflow.com'");
  if (result.length === 0 || result[0].values.length === 0) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.run(
      'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
      ['admin@fleetflow.com', hashed, 'Manager', 'Admin User']
    );
  }
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}


const dbInstance = {
  prepare: (sql) => {
    if (!db) throw new Error('Database not initialized');

    return {
      run: async (...params) => {
        const stmt = db.prepare(sql);
        stmt.bind(params.map(p => (p === undefined ? null : p)));
        stmt.step();
        stmt.free();
        saveDatabase();

        const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
        const lastId =
          lastIdResult.length &&
          lastIdResult[0].values.length
            ? lastIdResult[0].values[0][0]
            : null;

        return {
          lastInsertRowid: lastId,
          changes: db.getRowsModified() || 0
        };
      },

      get: async (...params) => {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let row = null;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row;
      },

      all: async (...params) => {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      }
    };
  },

  exec: async (sql) => {
    db.run(sql);
    saveDatabase();
  }
};

/* ===============================
   SAFE TRANSACTION
================================= */
export function transaction(fn) {
  return new Promise(async (resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'));

    let started = false;

    try {
      db.run('BEGIN');
      started = true;

      const result = await fn();

      db.run('COMMIT');
      saveDatabase();

      resolve(result);
    } catch (error) {
      try {
        if (started) db.run('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      reject(error);
    }
  });
}

export default dbInstance;