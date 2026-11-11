# GameZone PK — Play Free Browser Games, News, Reviews & Guides

A complete, professional, AdSense-ready gaming portal built as static HTML/CSS/JS. No backend required; host it on GitHub Pages, Vercel, Netlify, or any static host.

## Structure
- `index.html` — Home (hero, featured/trending/popular/recent/new/top-rated, categories, news, guides, editor's choice, community, newsletter)
- `games.html` — All Games library (search, category filters, sorting, Load More)
- `categories/` — index + 12 category pages (action, adventure, racing, shooting, puzzle, arcade, sports, strategy, multiplayer, kids, educational, casual)
- `games/` — 12 individual game pages, each with a working game, description, How to Play, controls, tips, FAQ
- `news/` — news index + 6 original articles (500+ words each)
- `reviews/` — reviews index + 6 original reviews of the portal's own games (with rating criteria, pros/cons, verdict)
- `guides/` — guides index + 6 original guides (500+ words each)
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html`, `dmca.html`
- `assets/css/style.css` — single shared stylesheet (dark theme, responsive 1024/768/480px)
- `assets/js/games-data.js` — **content data file: add/edit a game here** (title, category, rating, plays, description) and it appears in the library; game pages are separate HTML files
- `assets/js/main.js` — navigation, search, filters, newsletter/contact (localStorage demo), recently played
- `assets/js/games.js` — all 12 original games (vanilla JS/canvas, no external embeds)
- `sitemap.xml`, `robots.txt`, `ads.txt`

## Games (all original, coded here — no copyrighted art, no embeds, no downloads)
Neon Snake, 2048 Puzzle, Memory Match, Neon Breakout, Neon Space Shooter, Neon Flap, Minesweeper Classic, Tic-Tac-Toe vs AI, Whack-a-Mole, Simon Says, Block Stack, Pong vs AI. Each works with keyboard and, where sensible, mouse/touch. Scores, restart, and game-over states are built in. Recently played games are stored in the visitor's own browser (localStorage).

## AdSense — read before applying
- Ad slots are **empty placeholder divs** (`class="ad-slot"`, labelled "Advertisement"). No live AdSense code is included and no fake ads are shown.
- **Do NOT insert AdSense code until your account and site are approved.** Approval is never guaranteed.
- Recommended order: (1) buy a custom domain (e.g. gamezonepk.com) and point it at the host; (2) publish the site and let real traffic build for a few weeks; (3) apply at adsense.google.com; (4) after approval, replace the placeholder line in `ads.txt` with your real `google.com, pub-XXXXXXXX, DIRECT, ...` line and paste the AdSense code into the ad slots.
- Never click your own ads, never ask visitors to click ads, and never place ads over or near Play buttons or game controls (the slots on this site are placed away from gameplay).
- Forms (contact/newsletter) are **localStorage-only demos**. To receive messages for real, connect them to a form service (e.g. Formspree) or a backend.

## SEO
Unique title + meta description per page, canonical URLs, sitemap.xml, robots.txt, breadcrumbs, JSON-LD WebSite schema on Home and Article schema on news/guide pages, alt text, lazy loading where used, internal linking throughout.

## Real backend (optional — see ../backend/README-BACKEND.md)
A real Node.js + Express + SQLite backend lives in `../backend/`. When it runs,
it serves this whole site at http://localhost:3000, stores contact messages,
newsletter subscribers and game scores in a database, and adds an admin panel
at `/admin`. The frontend tries the backend API first and falls back honestly
(localStorage + a clear note) when no backend is reachable. GitHub Pages /
Vercel static hosting cannot run the backend — deploy it on Render, Railway
or a VPS. To point a separately-hosted frontend at the backend, set
`API_BASE` at the top of `assets/js/main.js` to the backend URL.
