# Deploying the FX Journal Cloudflare Workers

Two workers, two folders: `coach-worker/` (AI Coach, uses Claude) and `extract-worker/` (chart-screenshot extraction, uses Grok).

## 1. Create a Cloudflare account
https://dash.cloudflare.com/sign-up — email only, no card needed for Workers' free tier (100k requests/day).

## 2. Install Wrangler (Cloudflare's CLI)
```bash
npm install -g wrangler
wrangler login
```
This opens a browser tab to authorize Wrangler against your Cloudflare account.

## 3. Deploy the Coach worker
```bash
cd coach-worker
wrangler secret put ANTHROPIC_API_KEY
# paste your Anthropic API key when prompted (get one at console.anthropic.com → API Keys)
wrangler deploy
```
Wrangler will print a URL like:
```
https://fxj-coach.YOUR-SUBDOMAIN.workers.dev
```
Copy that.

## 4. Deploy the Extract worker
```bash
cd ../extract-worker
wrangler secret put XAI_API_KEY
# paste your xAI (Grok) API key when prompted
wrangler deploy
```
Copy the resulting URL, e.g.:
```
https://fxj-extract.YOUR-SUBDOMAIN.workers.dev
```

## 5. Wire the URLs into the app
Open `public/index.html` in your fx-journal repo, find these two lines near the top of the `<script type="module">` block:
```js
const COACH_WORKER_URL = "";
const EXTRACT_WORKER_URL = "";
```
Fill them in with the two URLs from steps 3 and 4:
```js
const COACH_WORKER_URL = "https://fxj-coach.YOUR-SUBDOMAIN.workers.dev";
const EXTRACT_WORKER_URL = "https://fxj-extract.YOUR-SUBDOMAIN.workers.dev";
```
Commit and push — Vercel/Railway will auto-redeploy.

## 6. (Recommended) Lock down CORS
Both workers currently allow requests from any origin (`ALLOWED_ORIGIN = "*"`). Once your site has a stable URL, open each worker's `index.js` and change:
```js
const ALLOWED_ORIGIN = "*";
```
to:
```js
const ALLOWED_ORIGIN = "https://your-deployed-domain.vercel.app";
```
Then `wrangler deploy` again in that folder. This stops anyone else from calling your Workers (and burning your API credits) from a different website.

## Notes
- `grok-2-vision-1212` is used as the model name in the extract worker — xAI occasionally renames/updates their vision models, so if you get a "model not found" error, check https://docs.x.ai for the current vision-capable model name and swap it in.
- Both workers are stateless — they don't touch Firestore, they just proxy a single request/response.
