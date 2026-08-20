const path = require("path");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { refreshCache, getCache } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 3000;
// How often to re-scrape fruityblox.com. Their Normal stock rotates
// every 4h and Mirage every 2h, so every 5 minutes is more than
// enough to catch a change quickly without hammering their server.
const REFRESH_CRON = process.env.REFRESH_CRON || "*/5 * * * *";

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/stock", (req, res) => {
  const cache = getCache();
  res.json(cache);
});

// Manual trigger, useful for testing / a "refresh now" button.
app.post("/api/stock/refresh", async (req, res) => {
  await refreshCache();
  res.json(getCache());
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await refreshCache(); // populate cache immediately on boot
  cron.schedule(REFRESH_CRON, refreshCache);
  console.log(`Scraper scheduled: "${REFRESH_CRON}"`);
});
