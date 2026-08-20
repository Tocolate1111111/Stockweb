# Blox Fruits Stock Mirror

A small backend that scrapes `fruityblox.com/stock` every 5 minutes, caches
the result, and serves it as JSON — plus a frontend that polls that JSON so
what you see is a real live mirror instead of hard-coded data.

## How it works

```
fruityblox.com/stock  --(scraped every 5 min)-->  scraper.js
                                                        |
                                                        v
                                                   in-memory cache
                                                        |
                                                        v
                    server.js  --(GET /api/stock)-->  public/index.html
```

- `scraper.js` fetches the page and parses out each fruit's name, type,
  Beli price, and Robux price.
- `server.js` runs that scrape on startup and then every 5 minutes
  (`node-cron`), and exposes it at `GET /api/stock`.
- `public/index.html` is the page you actually look at. It polls
  `/api/stock` every 30 seconds and re-renders the fruit cards.

## Run it locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Deploy so it's live on the internet

You need somewhere that can run a persistent Node.js process (this can't be
a static host like GitHub Pages, since it needs a server to do the
scraping). Free/cheap options that work well for this:

- **Render** (render.com) — "New +" → "Web Service" → connect your repo →
  build command `npm install`, start command `npm start`.
- **Railway** (railway.app) — similar one-click deploy from a GitHub repo.
- **Fly.io** — `fly launch` in this folder.

After deploying, your live URL will serve the page directly — no changes
needed unless you split frontend/backend onto different domains (see below).

## If you host the frontend separately from the backend

Open `public/index.html` and change:

```js
const API_BASE = "";
```

to your backend's URL, e.g.:

```js
const API_BASE = "https://your-backend.onrender.com";
```

## Important notes

- **This depends on fruityblox.com's HTML structure.** The scraper
  (`parseCardText` in `scraper.js`) parses the page's current markup. If
  fruityblox.com redesigns their site, the scraper may return 0 items —
  when that happens the cache keeps the last good data and `lastError`
  in the API response explains why, instead of the page going blank.
- **Be a good citizen.** The default refresh interval (every 5 minutes) is
  deliberately gentle. Don't lower it aggressively — fruityblox.com is a
  third-party site you don't control, and hammering it can get your
  server's IP blocked.
- This is an **unofficial mirror**, not affiliated with fruityblox.com.
  Consider linking back to them (the frontend already links each fruit
  card to the original `/items/<slug>` page).

## Tuning the refresh rate

Set the `REFRESH_CRON` environment variable (cron syntax) if you want a
different schedule, e.g. every 2 minutes:

```bash
REFRESH_CRON="*/2 * * * *" npm start
```
