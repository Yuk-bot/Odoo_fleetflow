# FleetFlow Setup Instructions

## Step-by-Step Setup Guide

### Step 1: Open Project in VSCode
1. Open VSCode
2. File → Open Folder
3. Navigate to: `C:\Users\Tanvi Modi\OneDrive\Desktop\t\cursor`
4. Click "Select Folder"

### Step 2: Install Dependencies

Open the **Terminal** in VSCode (Terminal → New Terminal) and run these commands **one at a time**:

#### 2a. Install Root Dependencies
```bash
npm install
```

#### 2b. Install Server Dependencies
```bash
cd server
npm install
cd ..
```

#### 2c. Install Client Dependencies
```bash
cd client
npm install
cd ..
```

**Note:** If you see any warnings, that's okay. The important thing is that it completes without errors.

### Step 3: Verify Installation

Check that these folders exist with `node_modules`:
- `node_modules/` (root)
- `server/node_modules/`
- `client/node_modules/`

### Step 4: Start the Application

You have two options:

#### Option A: Run Both Server and Client Together (Recommended)
```bash
npm run dev
```

This will start:
- Server on: http://localhost:3001
- Client on: http://localhost:3000

#### Option B: Run Separately (in two terminals)

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### Step 5: Access the Application

1. Open your web browser
2. Go to: **http://localhost:3000**
3. You should see the FleetFlow login page

### Step 6: Login

**Default Credentials:**
- Email: `admin@fleetflow.com`
- Password: `admin123`

---

## Database Information

The database file (`fleetflow.db`) will be automatically created in the `server/` folder when you first run the application.

### Viewing the Database in VSCode (Optional)

1. Install the **SQLite Viewer** extension in VSCode:
   - Open Extensions (Ctrl+Shift+X)
   - Search for "SQLite Viewer" or "SQLite"
   - Install one (e.g., "SQLite Viewer" by qwtel)

2. To view the database:
   - Right-click on `server/fleetflow.db` (after it's created)
   - Select "Open Database" or "Open with SQLite Viewer"

---

## Troubleshooting

### If npm install fails:
1. Make sure you have Node.js installed (version 16 or higher)
2. Try deleting `node_modules` folders and `package-lock.json` files, then reinstall:
   ```bash
   # In root directory
   rm -rf node_modules package-lock.json
   rm -rf server/node_modules server/package-lock.json
   rm -rf client/node_modules client/package-lock.json
   
   # Then reinstall
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

### If the server won't start:
- Check that port 3001 is not already in use
- Make sure you're in the correct directory

### If the client won't start:
- Check that port 3000 is not already in use
- Make sure Vite is installed in client/node_modules

---

## Project Structure

```
cursor/
├── server/          # Backend (Node.js + Express)
│   ├── database.js  # SQLite database setup
│   ├── routes/     # API routes
│   └── fleetflow.db # Database file (created automatically)
├── client/          # Frontend (React + TypeScript)
│   └── src/
│       ├── pages/   # All 8 pages
│       └── components/
└── package.json     # Root package.json
```

---

## Next Steps After Setup

Once everything is running:
1. ✅ Login with admin credentials
2. ✅ Add vehicles in "Vehicle Registry"
3. ✅ Add drivers in "Driver Profiles"
4. ✅ Create trips in "Trip Dispatcher"
5. ✅ Log maintenance and expenses
6. ✅ View analytics and reports

Enjoy using FleetFlow! 🚛

