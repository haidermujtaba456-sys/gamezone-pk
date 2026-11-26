# GameZone PK — AdSense Fix v5: Upload Steps

This zip (`gamezone-adsense-fix-v5.zip`) replaces ALL earlier zips. Do not upload any
older zip with it. It contains the full updated site: the cleaned homepage and all
pages, 12 new long articles (6 reviews, 3 news, 3 guides), the security-updated
backend, the paste-ready admin posts file (`gamezone-adsense-long-posts.md`), and
this steps file.

## English

### Step 1 — Upload to GitHub (repo: gamezone-pk)
1. Open https://github.com/haidermujtaba456-sys/gamezone-pk in your browser.
2. Unzip `gamezone-adsense-fix-v5.zip` on your computer first.
3. Upload the unzipped files into the repo, replacing the old ones:
   - `README.md` (repo root)
   - everything inside `gaming-website/` (all pages, CSS, JS, favicon)
   - everything inside `backend/` (server.js, seed-data.json, admin.html, .env.example)
   - `gamezone-adsense-long-posts.md` and `UPLOAD-STEPS-v5.md` (repo root, for reference)
4. Do NOT upload `node_modules`, any `.db` file, or any `.env` file.
   (They are not in this zip.)
5. Commit with the message: `AdSense fix v5: titles, real content, security update`.

### Step 2 — Deploy on Render
1. Open your Render dashboard and open the `gamezone-pk-backend` service.
2. Click **Manual Deploy** → **Deploy latest commit**.
3. Wait until the status shows **Live** (about 1–2 minutes).
4. Open https://gamezone-pk.onrender.com and check the homepage loads.

### Step 3 — Add the new articles to the admin panel (optional, recommended)
1. Open https://gamezone-pk.onrender.com/admin and log in.
2. Open `gamezone-adsense-long-posts.md` and copy each article (title, category,
   excerpt, body) into the matching News / Reviews / Guides form, then Save.
3. This makes the same articles appear on the dynamic News / Reviews / Guides
   listing pages too. The static pages work even without this step.

### Step 4 — After the site is live (do this later, not now)
1. In Google Search Console, resubmit the sitemap:
   `https://gamezone-pk.onrender.com/sitemap.xml`
2. Wait a few days, then open Google AdSense and press **Request review** for
   gamezone-pk.onrender.com — only after you have checked the live site yourself.

## Roman Urdu

### Step 1 — GitHub par upload karein (repo: gamezone-pk)
1. Browser mein https://github.com/haidermujtaba456-sys/gamezone-pk kholein.
2. Pehle `gamezone-adsense-fix-v5.zip` ko unzip karein.
3. Unzip ki hui files ko repo mein upload karein, purani files ko replace kar ke:
   - `README.md`
   - `gaming-website/` ke andar ki sab files
   - `backend/` ke andar ki sab files
   - `gamezone-adsense-long-posts.md` aur `UPLOAD-STEPS-v5.md`
4. `node_modules`, `.db` file, ya `.env` file upload NA karein (ye zip mein hain hi nahi).
5. Commit message likhein: `AdSense fix v5: titles, real content, security update`.

### Step 2 — Render par deploy karein
1. Render dashboard kholein aur `gamezone-pk-backend` service kholein.
2. **Manual Deploy** → **Deploy latest commit** dabayein.
3. **Live** honay ka wait karein (1–2 minute).
4. https://gamezone-pk.onrender.com khol kar check karein ke homepage khul raha hai.

### Step 3 — Admin panel mein naye articles add karein (optional, recommended)
1. https://gamezone-pk.onrender.com/admin kholein aur login karein.
2. `gamezone-adsense-long-posts.md` se har article copy kar ke News / Reviews /
   Guides form mein paste karein aur Save karein.
3. Is se wohi articles dynamic listing pages par bhi aa jayenge. Static pages
   is step ke baghair bhi kaam karte hain.

### Step 4 — Site live honay ke baad (abhi nahi, kuch din baad)
1. Google Search Console mein sitemap dobara submit karein:
   `https://gamezone-pk.onrender.com/sitemap.xml`
2. Kuch din wait karein, phir Google AdSense khol kar **Request review** dabayein —
   sirf tab jab aap ne live site khud check kar li ho.
