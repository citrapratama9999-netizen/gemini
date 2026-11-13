'use strict';

const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32 || sessionSecret.includes('replace-with')) {
  console.error('SESSION_SECRET must be set to a unique random value of at least 32 characters. See .env.example.');
  process.exit(1);
}
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12 || process.env.ADMIN_PASSWORD.includes('change-this')) {
  console.error('Set ADMIN_USERNAME and a unique ADMIN_PASSWORD of at least 12 characters in .env.');
  process.exit(1);
}

const db = new Database(path.join(DATA_DIR, 'ruangkepala.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    collection TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS records_collection_idx ON records(collection);
`);

const adminUsername = process.env.ADMIN_USERNAME.trim();
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
if (!existingAdmin) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(adminUsername, hash);
  console.log(`Created initial administrator account: ${adminUsername}`);
} else {
  console.log(`Administrator account already exists: ${adminUsername} (environment password is not reapplied).`);
}

const collections = new Set(['agenda', 'surat', 'gtk', 'program', 'supervisi', 'sarpras', 'tasks']);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', isProduction ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(express.json({ limit: '100kb', strict: true }));
app.use(session({
  name: 'ruangkepala.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: DATA_DIR, concurrentDB: true }),
  cookie: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === '1' || isProduction,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Terlalu banyak percobaan login. Coba lagi beberapa saat.' } });
const csrfLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Silakan login kembali.' });
  next();
}
function issueCsrf(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  return req.session.csrfToken;
}
function requireCsrf(req, res, next) {
  const sent = req.get('x-csrf-token');
  const expected = req.session.csrfToken;
  if (!sent || !expected || sent.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected))) {
    return res.status(403).json({ error: 'Token keamanan tidak valid. Muat ulang halaman dan coba lagi.' });
  }
  next();
}
function safePayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const result = {};
  for (const [key, val] of Object.entries(value)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) return null;
    if (typeof val === 'string' && val.length > 5000) return null;
    if (val !== null && !['string', 'number', 'boolean'].includes(typeof val)) return null;
    result[key] = val;
  }
  return Object.keys(result).length ? result : null;
}
function validCollection(req, res, next) {
  if (!collections.has(req.params.collection)) return res.status(404).json({ error: 'Modul tidak ditemukan.' });
  next();
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/auth/csrf', csrfLimiter, (req, res) => res.json({ csrfToken: issueCsrf(req) }));
app.post('/api/auth/login', loginLimiter, requireCsrf, async (req, res, next) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username);
    const valid = user ? await bcrypt.compare(password, user.password_hash) : await bcrypt.compare(password || 'invalid-password', '$2a$12$C6UzMDM.H6dfI/f/IKcEe.5J4Pr4DTf8IPQ2bA2wJ7gLpoQJ3I1Gm');
    if (!valid || !user) return res.status(401).json({ error: 'Username atau password salah.' });
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = { id: user.id, username: user.username };
      issueCsrf(req);
      req.session.save(saveErr => {
        if (saveErr) return next(saveErr);
        res.json({ user: req.session.user, csrfToken: req.session.csrfToken });
      });
    });
  } catch (error) { next(error); }
});
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.session.user }));
app.post('/api/auth/logout', requireAuth, requireCsrf, (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('ruangkepala.sid', { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === '1' || isProduction });
    res.status(204).end();
  });
});

app.get('/api/data/:collection', requireAuth, validCollection, (req, res) => {
  const rows = db.prepare('SELECT id, payload, created_at, updated_at FROM records WHERE collection = ? ORDER BY created_at DESC, id').all(req.params.collection);
  res.json(rows.map(row => ({ id: row.id, ...JSON.parse(row.payload), createdAt: row.created_at, updatedAt: row.updated_at })));
});
app.post('/api/data/:collection', requireAuth, requireCsrf, validCollection, (req, res) => {
  const payload = safePayload(req.body);
  if (!payload) return res.status(400).json({ error: 'Data tidak valid atau terlalu panjang.' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO records (id, collection, payload) VALUES (?, ?, ?)').run(id, req.params.collection, JSON.stringify(payload));
  res.status(201).json({ id, ...payload });
});
app.put('/api/data/:collection/:id', requireAuth, requireCsrf, validCollection, (req, res) => {
  const payload = safePayload(req.body);
  if (!payload) return res.status(400).json({ error: 'Data tidak valid atau terlalu panjang.' });
  const result = db.prepare('UPDATE records SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND collection = ?').run(JSON.stringify(payload), req.params.id, req.params.collection);
  if (!result.changes) return res.status(404).json({ error: 'Data tidak ditemukan.' });
  res.json({ id: req.params.id, ...payload });
});
app.delete('/api/data/:collection/:id', requireAuth, requireCsrf, validCollection, (req, res) => {
  const result = db.prepare('DELETE FROM records WHERE id = ? AND collection = ?').run(req.params.id, req.params.collection);
  if (!result.changes) return res.status(404).json({ error: 'Data tidak ditemukan.' });
  res.status(204).end();
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint API tidak ditemukan.' }));
app.use(express.static(path.join(ROOT, 'server', 'public'), { extensions: ['html'], maxAge: isProduction ? '1h' : 0 }));
app.get('*', (req, res) => res.sendFile(path.join(ROOT, 'server', 'public', 'index.html'));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Terjadi kesalahan server.' });
});

const server = app.listen(PORT, () => console.log(`RuangKepala server listening on http://localhost:${PORT}`));
function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
