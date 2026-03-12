const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 4000;

// ─── DB Setup ───────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'db.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    name TEXT NOT NULL DEFAULT '',
    lastname TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Add name/lastname columns if they don't exist (migration for existing DBs)
try { db.exec("ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''"); } catch { }
try { db.exec("ALTER TABLE users ADD COLUMN lastname TEXT NOT NULL DEFAULT ''"); } catch { }

// Seed default admin
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@admin.com');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin', 10);
  db.prepare('INSERT INTO users (id, email, password_hash, role, name, lastname) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(), 'admin@admin.com', hash, 'admin', 'Admin', 'Sistema'
  );
  console.log('✅ Admin user seeded: admin@admin.com / admin');
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth')(db));
app.use('/api/users', require('./routes/users')(db));
app.use('/api/canvases', require('./routes/canvases')(db));

app.get('/', (req, res) => res.json({ status: 'Algoritmos API running' }));

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
