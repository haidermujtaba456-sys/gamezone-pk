// GameZone PK — real Node.js backend
// Express + built-in node:sqlite (Node >= 22). Serves the static frontend,
// stores contact messages, newsletter subscribers and game scores in SQLite,
// and powers the admin panel at /admin.
//
// Run:  npm install && cp .env.example .env  (change ADMIN_PASSWORD + JWT_SECRET) && npm start
// Then open http://localhost:3000  and  http://localhost:3000/admin
"use strict";

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { DatabaseSync } = require("node:sqlite");

// ---------------------------------------------------------------- config
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "gamezone.db");

// JWT secret: required in production; in dev a random ephemeral secret is
// generated (tokens stop working on restart) and a warning is logged.
let JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
  if (NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET is not set. Set JWT_SECRET in the environment and restart.");
    process.exit(1);
  }
  JWT_SECRET = crypto.randomBytes(32).toString("hex");
  console.warn("[warn] JWT_SECRET not set — using a random ephemeral secret (admin logins will not survive a restart). Set JWT_SECRET in .env for real use.");
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const USING_DEFAULT_ADMIN_PASSWORD = !process.env.ADMIN_PASSWORD;

// ---------------------------------------------------------------- database
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
CREATE TABLE IF NOT EXISTS games (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
  cat_label TEXT NOT NULL, description TEXT NOT NULL, long_desc TEXT NOT NULL,
  rating REAL NOT NULL DEFAULT 4.5, plays TEXT NOT NULL DEFAULT '0',
  added TEXT NOT NULL DEFAULT '', difficulty TEXT NOT NULL DEFAULT 'Medium',
  devices TEXT NOT NULL DEFAULT 'Desktop, Mobile, Tablet',
  icon TEXT NOT NULL DEFAULT '🎮', color TEXT NOT NULL DEFAULT '#7C3AED',
  featured INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY, label TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS news (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '', author TEXT NOT NULL DEFAULT 'GameZone PK Editorial Team',
  published_at TEXT NOT NULL DEFAULT '2026-11-08'
);
CREATE TABLE IF NOT EXISTS reviews (
  slug TEXT PRIMARY KEY, game_slug TEXT NOT NULL DEFAULT '', title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '', rating REAL NOT NULL DEFAULT 4.5,
  verdict TEXT NOT NULL DEFAULT '', author TEXT NOT NULL DEFAULT 'GameZone PK Editorial Team'
);
CREATE TABLE IF NOT EXISTS guides (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'guide', author TEXT NOT NULL DEFAULT 'GameZone PK Editorial Team'
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL,
  subject TEXT NOT NULL, message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), is_read INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT, game_slug TEXT NOT NULL,
  player_name TEXT NOT NULL DEFAULT 'Guest', score INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Seed from the real frontend content (seed-data.json, extracted from the
// site's own pages) the first time the database is empty.
function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM games").get().n;
  if (count > 0) return;
  const seedPath = path.join(__dirname, "seed-data.json");
  if (!fs.existsSync(seedPath)) { console.warn("[warn] seed-data.json not found — database starts empty."); return; }
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const insGame = db.prepare(`INSERT INTO games (slug,title,category,cat_label,description,long_desc,rating,plays,added,difficulty,devices,icon,color,featured)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  seed.games.forEach((g, i) => insGame.run(g.slug, g.title, g.cat, g.cat_label, g.desc, g.long, g.rating, g.plays, g.added, g.diff, g.devices, g.icon, g.color, i < 3 ? 1 : 0));
  const insCat = db.prepare("INSERT OR IGNORE INTO categories (slug,label) VALUES (?,?)");
  seed.categories.forEach((c) => insCat.run(c.slug, c.label));
  const insNews = db.prepare("INSERT INTO news (slug,title,excerpt,body,author,published_at) VALUES (?,?,?,?,?,?)");
  seed.news.forEach((n) => insNews.run(n.slug, n.title, n.excerpt, n.body, n.author, n.published_at));
  const insRev = db.prepare("INSERT INTO reviews (slug,game_slug,title,body,rating,verdict,author) VALUES (?,?,?,?,?,?,?)");
  seed.reviews.forEach((r) => insRev.run(r.slug, r.game_slug, r.title, r.body, r.rating, r.verdict, r.author));
  const insGuide = db.prepare("INSERT INTO guides (slug,title,body,category,author) VALUES (?,?,?,?,?)");
  seed.guides.forEach((g) => insGuide.run(g.slug, g.title, g.body, g.category, g.author));
  console.log(`[seed] Seeded ${seed.games.length} games, ${seed.categories.length} categories, ${seed.news.length} news, ${seed.reviews.length} reviews, ${seed.guides.length} guides.`);
}
seedIfEmpty();

// Default admin account (created once). Change the password before deploying!
(function ensureAdmin() {
  const row = db.prepare("SELECT id FROM admins WHERE username = 'admin'").get();
  if (!row) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    db.prepare("INSERT INTO admins (username, password_hash) VALUES ('admin', ?)").run(hash);
    console.log("[admin] Default admin account created (username: admin).");
  }
  if (USING_DEFAULT_ADMIN_PASSWORD) {
    console.warn("⚠️  WARNING: using the DEFAULT admin password (admin123). Change ADMIN_PASSWORD in .env before deploying this server anywhere public!");
  }
})();

// ---------------------------------------------------------------- helpers
function gameOut(r) {
  return { slug: r.slug, title: r.title, cat: r.category, cat_label: r.cat_label, rating: r.rating, plays: r.plays, added: r.added, diff: r.difficulty, devices: r.devices, icon: r.icon, color: r.color, desc: r.description, long: r.long_desc, featured: !!r.featured };
}
function isEmail(v) { return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
function cleanStr(v, max) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > max) return null;
  return s;
}
function slugify(v) {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function authMiddleware(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// ---------------------------------------------------------------- app
const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false })); // CSP off: site uses inline scripts
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "100kb" }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests — please try again later." } });
const contactLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: "Too many messages — please wait a minute and try again." } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: "Too many login attempts — please try again later." } });
app.use("/api/", apiLimiter);

// ---------------------------------------------------------------- public API
app.get("/api/health", (req, res) => {
  const n = db.prepare("SELECT COUNT(*) AS n FROM games").get().n;
  res.json({ status: "ok", site: "GameZone PK", time: new Date().toISOString(), database: "connected", games: n });
});

app.get("/api/games", (req, res) => {
  const rows = db.prepare("SELECT * FROM games ORDER BY CAST(REPLACE(plays, ',', '') AS INTEGER) DESC").all();
  res.json(rows.map(gameOut));
});
app.get("/api/games/:slug", (req, res) => {
  const r = db.prepare("SELECT * FROM games WHERE slug = ?").get(req.params.slug);
  if (!r) return res.status(404).json({ error: "Game not found." });
  res.json(gameOut(r));
});
app.get("/api/categories", (req, res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY label").all());
});
app.get("/api/news", (req, res) => {
  res.json(db.prepare("SELECT * FROM news ORDER BY published_at DESC").all());
});
app.get("/api/news/:slug", (req, res) => {
  const r = db.prepare("SELECT * FROM news WHERE slug = ?").get(req.params.slug);
  if (!r) return res.status(404).json({ error: "Article not found." });
  res.json(r);
});
app.get("/api/reviews", (req, res) => {
  res.json(db.prepare("SELECT * FROM reviews ORDER BY rating DESC").all());
});
app.get("/api/reviews/:slug", (req, res) => {
  const r = db.prepare("SELECT * FROM reviews WHERE slug = ?").get(req.params.slug);
  if (!r) return res.status(404).json({ error: "Review not found." });
  res.json(r);
});
app.get("/api/guides", (req, res) => {
  res.json(db.prepare("SELECT * FROM guides ORDER BY title").all());
});
app.get("/api/guides/:slug", (req, res) => {
  const r = db.prepare("SELECT * FROM guides WHERE slug = ?").get(req.params.slug);
  if (!r) return res.status(404).json({ error: "Guide not found." });
  res.json(r);
});

app.post("/api/contact", contactLimiter, (req, res) => {
  const name = cleanStr(req.body && req.body.name, 100);
  const email = (req.body && req.body.email || "").trim();
  const subject = cleanStr(req.body && req.body.subject, 150) || "General question";
  const message = cleanStr(req.body && req.body.message, 5000);
  if (!name) return res.status(400).json({ error: "Please enter your name." });
  if (!isEmail(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!message) return res.status(400).json({ error: "Please write a message." });
  const info = db.prepare("INSERT INTO contacts (name, email, subject, message) VALUES (?,?,?,?)").run(name, email, subject, message);
  res.status(201).json({ ok: true, id: Number(info.lastInsertRowid), message: "Thank you! Your message has been saved." });
});

app.post("/api/newsletter", contactLimiter, (req, res) => {
  const email = (req.body && req.body.email || "").trim().toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  const exists = db.prepare("SELECT id FROM subscribers WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "This email is already subscribed." });
  db.prepare("INSERT INTO subscribers (email) VALUES (?)").run(email);
  res.status(201).json({ ok: true, message: "Thank you! You are subscribed." });
});

app.post("/api/scores", (req, res) => {
  const gameSlug = cleanStr(req.body && req.body.game_slug, 80);
  const player = cleanStr(req.body && req.body.player_name, 30) || "Guest";
  const score = req.body && req.body.score;
  if (!gameSlug) return res.status(400).json({ error: "game_slug is required." });
  const game = db.prepare("SELECT slug FROM games WHERE slug = ?").get(gameSlug);
  if (!game) return res.status(404).json({ error: "Game not found." });
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 99999999) {
    return res.status(400).json({ error: "score must be a number between 0 and 99999999." });
  }
  const info = db.prepare("INSERT INTO scores (game_slug, player_name, score) VALUES (?,?,?)").run(gameSlug, player, Math.floor(score));
  res.status(201).json({ ok: true, id: Number(info.lastInsertRowid) });
});
app.get("/api/scores/:game_slug", (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10) || 10, 1), 50);
  const game = db.prepare("SELECT slug FROM games WHERE slug = ?").get(req.params.game_slug);
  if (!game) return res.status(404).json({ error: "Game not found." });
  const rows = db.prepare("SELECT player_name, score, created_at FROM scores WHERE game_slug = ? ORDER BY score DESC, created_at ASC LIMIT ?").all(req.params.game_slug, limit);
  res.json(rows);
});

// ---------------------------------------------------------------- admin auth
app.post("/api/admin/login", authLimiter, (req, res) => {
  const username = cleanStr(req.body && req.body.username, 50);
  const password = typeof req.body && typeof req.body.password === "string" ? req.body.password : "";
  if (!username || !password) return res.status(400).json({ error: "Username and password are required." });
  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const token = jwt.sign({ username: admin.username }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ ok: true, token });
});

// ---------------------------------------------------------------- admin API (JWT protected)
app.get("/api/admin/contacts", authMiddleware, (req, res) => {
  res.json(db.prepare("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 500").all());
});
app.patch("/api/admin/contacts/:id/read", authMiddleware, (req, res) => {
  const info = db.prepare("UPDATE contacts SET is_read = 1 WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Message not found." });
  res.json({ ok: true });
});
app.delete("/api/admin/contacts/:id", authMiddleware, (req, res) => {
  const info = db.prepare("DELETE FROM contacts WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Message not found." });
  res.json({ ok: true });
});
app.get("/api/admin/subscribers", authMiddleware, (req, res) => {
  res.json(db.prepare("SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 1000").all());
});
app.delete("/api/admin/subscribers/:id", authMiddleware, (req, res) => {
  const info = db.prepare("DELETE FROM subscribers WHERE id = ?").run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: "Subscriber not found." });
  res.json({ ok: true });
});
app.get("/api/admin/scores", authMiddleware, (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || "100", 10) || 100, 1), 500);
  res.json(db.prepare("SELECT s.*, g.title AS game_title FROM scores s LEFT JOIN games g ON g.slug = s.game_slug ORDER BY s.score DESC LIMIT ?").all(limit));
});

// Generic admin CRUD for games / news / reviews / guides.
function adminCrud(table, fields, keyField) {
  const base = "/api/admin/" + table;
  app.post(base, authMiddleware, (req, res) => {
    const data = {};
    for (const f of fields) {
      const v = req.body && req.body[f];
      if (f === "rating") { const n = Number(v); if (!Number.isFinite(n) || n < 0 || n > 5) return res.status(400).json({ error: "rating must be 0–5." }); data[f] = n; continue; }
      const s = cleanStr(v, f === "body" || f === "long_desc" ? 200000 : 500);
      if ((f === "title" || f === "slug") && !s) return res.status(400).json({ error: f + " is required." });
      data[f] = s || "";
    }
    if (!data.slug) data.slug = slugify(data.title);
    if (!data.slug) return res.status(400).json({ error: "slug is required." });
    const exists = db.prepare(`SELECT ${keyField} FROM ${table} WHERE ${keyField} = ?`).get(data.slug);
    if (exists) return res.status(409).json({ error: "An item with this slug already exists." });
    const cols = Object.keys(data), ph = cols.map(() => "?").join(",");
    try {
      db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${ph})`).run(...cols.map((c) => data[c]));
    } catch (e) { return res.status(400).json({ error: "Could not save: " + e.message }); }
    res.status(201).json({ ok: true, slug: data.slug });
  });
  app.put(base + "/:slug", authMiddleware, (req, res) => {
    const row = db.prepare(`SELECT ${keyField} FROM ${table} WHERE ${keyField} = ?`).get(req.params.slug);
    if (!row) return res.status(404).json({ error: "Item not found." });
    const sets = [], vals = [];
    for (const f of fields) {
      if (f === "slug") continue;
      if (req.body && req.body[f] !== undefined) {
        if (f === "rating") { const n = Number(req.body[f]); if (!Number.isFinite(n) || n < 0 || n > 5) return res.status(400).json({ error: "rating must be 0–5." }); sets.push("rating = ?"); vals.push(n); continue; }
        const s = cleanStr(req.body[f], f === "body" || f === "long_desc" ? 200000 : 500);
        if (s === null) return res.status(400).json({ error: f + " is too long." });
        sets.push(f + " = ?"); vals.push(s);
      }
    }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update." });
    vals.push(req.params.slug);
    db.prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE ${keyField} = ?`).run(...vals);
    res.json({ ok: true });
  });
  app.delete(base + "/:slug", authMiddleware, (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE ${keyField} = ?`).run(req.params.slug);
    if (!info.changes) return res.status(404).json({ error: "Item not found." });
    res.json({ ok: true });
  });
}
adminCrud("games", ["slug", "title", "category", "cat_label", "description", "long_desc", "rating", "plays", "added", "difficulty", "devices", "icon", "color"], "slug");
adminCrud("news", ["slug", "title", "excerpt", "body", "author", "published_at"], "slug");
adminCrud("reviews", ["slug", "game_slug", "title", "body", "rating", "verdict", "author"], "slug");
adminCrud("guides", ["slug", "title", "body", "category", "author"], "slug");

// ---------------------------------------------------------------- frontend + admin panel
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.use(express.static(FRONTEND_DIR));
app.get("/api/*", (req, res) => res.status(404).json({ error: "API route not found." }));
app.use((err, req, res, next) => {
  console.error("[error]", err && err.message);
  res.status(500).json({ error: "Server error." });
});

app.listen(PORT, () => {
  console.log(`GameZone PK backend running at http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}/   Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Database: ${DB_PATH}`);
});
