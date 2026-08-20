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

app.get("/health", (req, res) => {
  const cache = getCache();
  res.json({
    ok: true,
    lastUpdated: cache.lastUpdated,
    lastError: cache.lastError,
  });
});

// Keep the process alive even if a scrape throws something unexpected —
// otherwise one bad cycle could kill auto-refresh entirely.
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection] auto-refresh kept alive:", err);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException] auto-refresh kept alive:", err);
});

let refreshInFlight = false;
async function safeRefresh() {
  if (refreshInFlight) {
    console.log("[scraper] previous refresh still running, skipping this tick");
    return;
  }
  refreshInFlight = true;
  try {
    await refreshCache();
  } catch (err) {
    // refreshCache already catches its own errors into cache.lastError,
    // this is just a final safety net so the cron job itself never dies.
    console.error("[scraper] unexpected error during refresh:", err);
  } finally {
    refreshInFlight = false;
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await safeRefresh(); // populate cache immediately on boot
  cron.schedule(REFRESH_CRON, safeRefresh);
  console.log(`Auto-refresh scheduled: "${REFRESH_CRON}" (every 5 minutes by default)`);
});

