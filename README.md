# FX Journal

A personal forex trading + backtest journal, backed by Firebase (Auth + Firestore) and Cloudinary (screenshots).

## Project structure
```
fx-journal/
  public/
    index.html     ← the entire app (HTML+CSS+JS)
  package.json      ← lets Railway run a static server
  vercel.json        ← tells Vercel to serve /public as a static site
```

## Push to GitHub

```bash
cd fx-journal
git init
git add .
git commit -m "Initial commit: FX Journal with Firebase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fx-journal.git
git push -u origin main
```

## Deploy on Vercel

1. Go to https://vercel.com → "Add New" → "Project"
2. Import the GitHub repo you just pushed
3. Framework preset: "Other" (it's static HTML, no build step needed)
4. Click Deploy
5. You'll get a URL like `https://fx-journal-yourname.vercel.app`

## Deploy on Railway (alternative)

1. Go to https://railway.app → "New Project" → "Deploy from GitHub repo"
2. Select the repo
3. Railway auto-detects Node via `package.json` and runs `npm start`, which serves the `public/` folder
4. Once deployed, Railway gives you a public URL under Settings → Domains

## IMPORTANT — after you get your deployed URL

Firebase Auth only works from domains it knows about. Once you have your live URL (Vercel or Railway):

1. Go to Firebase Console → your project → **Authentication → Settings → Authorized domains**
2. Click **Add domain**
3. Paste in your deployed domain (e.g. `fx-journal-yourname.vercel.app`) — no `https://`, just the domain
4. Save

Without this step, login/register will fail on the deployed site with an `auth/unauthorized-domain` error. `localhost` is authorized by default, but a `file://` path opened directly in a browser is not — that's why login wasn't working when you opened the HTML file locally.

## Configuring the AI Coach + chart extraction

Two constants near the top of the `<script type="module">` block in `index.html` are currently empty:

```js
const COACH_WORKER_URL = "";
const EXTRACT_WORKER_URL = "";
```

These will be filled in once the two Cloudflare Workers (Claude coach proxy + Grok chart-extraction proxy) are deployed — see the next message in chat for that.
