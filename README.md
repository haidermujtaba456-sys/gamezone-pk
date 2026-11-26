# GameZone PK — Gaming Website + Real Node.js Backend

Two parts:

- `gaming-website/` — the static frontend: 54 pages, 12 original playable
  browser games, news, reviews, guides, About, Contact, Privacy Policy,
  Terms, Disclaimer, DMCA, sitemap.xml, robots.txt, ads.txt.
  Works on its own on any static host (GitHub Pages, Vercel, Netlify) — with
  localStorage fallback when no backend is running.
- `backend/` — the real backend: Node.js + Express + SQLite (built-in
  `node:sqlite`, Node ≥ 22). Serves the whole site, stores contact messages,
  newsletter subscribers and game scores in a database, and adds an admin
  panel at `/admin`. See `backend/README-BACKEND.md` for full instructions.

## Quick start (local, everything together)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set a strong ADMIN_PASSWORD and JWT_SECRET
npm start
# Site: http://localhost:3000
# Admin: http://localhost:3000/admin  (local demo login: admin / admin123 — in production the server refuses to start without a real ADMIN_PASSWORD set in the environment)
```

## Deploy

- **Backend:** Render free web service (see `backend/README-BACKEND.md`).
  GitHub Pages / Vercel static hosting **cannot** run the Node server.
- **Frontend alone:** upload `gaming-website/` contents to GitHub Pages /
  Vercel. If the backend lives elsewhere, set `API_BASE` at the top of
  `gaming-website/assets/js/main.js` to the backend URL and re-deploy.

## What is NOT in this zip

`node_modules/` (run `npm install`), the database file (`backend/data/*.db`,
created on first run), and `.env` (create it from `.env.example`). Nothing
in this zip contains a real password or secret.
