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

// Initialize database
export async function initDatabase() {
  try {
    SQL = await initSqlJs();
    
    // Load existing database or create new one
    let data;
    if (fs.existsSync(DB_PATH)) {
      data = fs.readFileSync(DB_PATH);
      db = new SQL.Database(data);
    } else {
      db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
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
        status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available', 'On Trip', 'In Shop', 'Out of Service')),
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
        status TEXT NOT NULL DEFAULT 'Off Duty' CHECK(status IN ('On Duty', 'Off Duty', 'Suspended')),
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
        status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
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
        trip_id INTEGER,
        expense_type TEXT NOT NULL CHECK(expense_type IN ('Fuel', 'Other')),
        liters REAL,
        cost_per_liter REAL,
        total_cost REAL NOT NULL,
        expense_date DATE NOT NULL,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (trip_id) REFERENCES trips(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id)');

    // Create default admin user
    const adminResult = db.exec("SELECT id FROM users WHERE email = 'admin@fleetflow.com'");
    if (adminResult.length === 0 || adminResult[0].values.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
        ['admin@fleetflow.com', hashedPassword, 'Manager', 'Admin User']
      );
      saveDatabase();
    }

    saveDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper to convert sql.js result to object
function resultToObject(result) {
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  const row = result[0].values[0];
  const columns = result[0].columns;
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj;
}

// Helper to convert sql.js result to array of objects
function resultToArray(result) {
  if (result.length === 0) {
    return [];
  }
  const rows = result[0].values;
  const columns = result[0].columns;
  return rows.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Database instance with promisified methods
const dbInstance = {
  prepare: (sql) => {
    if (!db) throw new Error('Database not initialized');
    
    return {
      run: async (...params) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          stmt.step();
          stmt.free();
          saveDatabase();
          
          // Get last insert rowid
          const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
          const lastId = lastIdResult.length > 0 && lastIdResult[0].values.length > 0 
            ? lastIdResult[0].values[0][0] 
            : null;
          
          return { 
            lastInsertRowid: lastId,
            changes: db.getRowsModified() || 0
          };
        } catch (error) {
          throw error;
        }
      },
      get: async (...params) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const result = [];
          while (stmt.step()) {
            const row = stmt.getAsObject();
            result.push(row);
          }
          stmt.free();
          return result.length > 0 ? result[0] : null;
        } catch (error) {
          throw error;
        }
      },
      all: async (...params) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const result = [];
          while (stmt.step()) {
            const row = stmt.getAsObject();
            result.push(row);
          }
          stmt.free();
          return result;
        } catch (error) {
          throw error;
        }
      }
    };
  },
  exec: async (sql) => {
    if (!db) throw new Error('Database not initialized');
    try {
      db.run(sql);
      saveDatabase();
    } catch (error) {
      throw error;
    }
  }
};

// Transaction helper
export function transaction(fn) {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    try {
      db.run('BEGIN TRANSACTION');
      const result = await fn();
      db.run('COMMIT');
      saveDatabase();
      resolve(result);
    } catch (error) {
      db.run('ROLLBACK');
      reject(error);
    }
  });
}

export default dbInstance;
