# GameZone PK — Real Backend (Node.js + Express + SQLite)

This is the **real backend** for the GameZone PK gaming website. It serves the
whole site, stores data in a SQLite database, and powers the admin panel.

## What it does

| Feature | How it works |
|---|---|
| Contact form | `POST /api/contact` — messages are saved in the database and readable in the admin panel |
| Newsletter | `POST /api/newsletter` — subscribers saved (duplicate email → 409) |
| Game scores | `POST /api/scores` + `GET /api/scores/:game` — top-10 leaderboard per game |
| Games / News / Reviews / Guides | Public read APIs (`GET /api/games`, `/api/news`, …) — the Games page tries the API first and falls back to its built-in data |
| Admin panel | `/admin` — login, then manage contact messages, subscribers, scores, games, news, reviews and guides |

## ⚠️ Change the default admin password before deploying

- Default admin login (local demo only): **username `admin`, password `admin123`**
- The server logs a warning on every start while the default password is in use.
- Before any public deploy: set a strong `ADMIN_PASSWORD` and a long random
  `JWT_SECRET` in `.env` (or in your host's environment variables).

## Run it locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set a strong ADMIN_PASSWORD and JWT_SECRET
npm start
```

Then open:

- Site: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin> (login: `admin` / your password)
- Health check: <http://localhost:3000/api/health>

The database file is created on first run at `backend/data/gamezone.db` and
seeded automatically from the site's own content (12 games, 12 categories,
6 news articles, 6 reviews, 6 guides). It is gitignored — never commit it,
and never commit `.env`.

## Deploy it on Render (free)

GitHub Pages and Vercel static hosting **cannot** run this Node.js server —
they only serve static files. The backend needs a real server host.

1. Push this project (the `backend/` folder plus the `gaming-website/` folder)
   to a GitHub repo.
2. In Render: **New → Web Service** → connect the repo.
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. Environment variables (Render → Environment):
   - `NODE_ENV` = `production`
   - `ADMIN_PASSWORD` = a strong password (Render can generate one)
   - `JWT_SECRET` = a long random secret (Render can generate one)
   - `CORS_ORIGIN` = your frontend domain, e.g. `https://gamezonepk.com`
     (leave empty to allow any origin while testing)
7. Deploy. Your backend URL will be something like
   `https://gamezone-pk-backend.onrender.com`.

> **Free-tier note:** Render's free plan puts the service to sleep after
> inactivity. The first load after a sleep can take ~50 seconds while the
> server wakes up. That is normal on the free plan.

A `render.yaml` is included in `backend/` — if your repo root is the project
root, copy it to the repo root so Render picks it up automatically, or create
the service manually with the settings above.

## Connect a separately-hosted frontend to the backend

The frontend and backend are served from the same origin by default
(`API_BASE = ""` in `assets/js/main.js`). If you host the frontend somewhere
else (for example GitHub Pages) and the backend on Render:

1. In `gaming-website/assets/js/main.js`, set
   `const API_BASE = "https://gamezone-pk-backend.onrender.com";`
2. Re-deploy the frontend.
3. Set `CORS_ORIGIN` on the backend to the frontend's domain.

When the API is unreachable (for example the static site with no backend),
the frontend falls back honestly: contact/newsletter forms save to the
visitor's own browser (localStorage) and say so, the leaderboard is hidden,
and the games list uses its built-in data. It never silently pretends a
message reached the server.

## API reference

Public (`/api`):

| Method | Route | Notes |
|---|---|---|
| GET | `/api/health` | Server + database status |
| GET | `/api/games`, `/api/games/:slug` | Game library |
| GET | `/api/categories` | 12 categories |
| GET | `/api/news`, `/api/news/:slug` | News articles |
| GET | `/api/reviews`, `/api/reviews/:slug` | Reviews |
| GET | `/api/guides`, `/api/guides/:slug` | Guides |
| POST | `/api/contact` | `{name, email, subject, message}` → 201 |
| POST | `/api/newsletter` | `{email}` → 201, duplicate → 409 |
| POST | `/api/scores` | `{game_slug, player_name, score}` → 201 |
| GET | `/api/scores/:game_slug?limit=10` | Top scores, highest first |

Admin (all need `Authorization: Bearer <JWT>`):

| Method | Route |
|---|---|
| POST | `/api/admin/login` `{username, password}` → `{token}` (valid 1 day) |
| GET | `/api/admin/contacts`, `/api/admin/subscribers`, `/api/admin/scores` |
| PATCH | `/api/admin/contacts/:id/read` |
| DELETE | `/api/admin/contacts/:id`, `/api/admin/subscribers/:id` |
| POST / PUT / DELETE | `/api/admin/games`, `/api/admin/news`, `/api/admin/reviews`, `/api/admin/guides` (PUT/DELETE use `/:slug`) |

## Known limitations

- **SQLite, single server:** the database lives on the one server that runs
  the backend. It is fine for this site's scale; it is not a multi-server
  setup. Back up `data/gamezone.db` if the messages/scores matter to you.
- **No email sending:** contact messages are *stored*, not emailed. To get
  an email per message, add an email service (e.g. Resend/SendGrid) later.
- **Free-tier sleep:** on Render free, the first request after inactivity
  can take ~50 seconds.
- **Tech note:** this sandbox could not build the native `better-sqlite3`
  module, so the backend uses Node 24's built-in `node:sqlite`
  (`DatabaseSync`) instead — same SQL, no native build step, Node ≥ 22 required.
