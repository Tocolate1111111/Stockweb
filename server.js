const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { refreshCache, getCache } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 3000;
// Webhook functionality removed — simplify server configuration

// Refresh every 5 seconds for faster updates during testing / quick monitoring.
const REFRESH_CRON = process.env.REFRESH_CRON || "*/5 * * * * *";


// All webhook/account persistence and sending logic removed.

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/stock", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/discord", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "discord.html"));
});

// webhook page removed from routing

app.get("/api/stock", async (req, res) => {
  // Fast path: return current cache immediately so UI isn't blocked by
  // an external scrape. If cache is empty (first boot) we block and wait
  // for a refresh so clients see data. Otherwise, trigger a background
  // refresh when the cache is older than a short threshold.
  const cache = getCache() || { normal: [], mirage: [], lastUpdated: null };

  // If we have no data yet, wait for a refresh so the caller gets something.
  if ((cache.normal.length === 0 && cache.mirage.length === 0)) {
    try {
      await refreshCache();
    } catch (e) {}
    const fresh = getCache();
    const { lastUpdated, lastError, ...payload } = fresh || {};
    return res.json(payload);
  }

  // Otherwise immediately return the cached payload (no lastUpdated/lastError)
  const { lastUpdated, lastError, ...payload } = cache;
  res.json(payload);

  // Trigger a non-blocking refresh if the cache is stale.
  const staleThresholdMs = 5000; // refresh in background if older than 5s
  const last = cache.lastUpdated ? Date.parse(cache.lastUpdated) : 0;
  if (!refreshInFlight && Date.now() - last > staleThresholdMs) {
    safeRefresh();
  }
});

// Manual trigger, useful for testing / a "refresh now" button.
app.post("/api/stock/refresh", async (req, res) => {
  try {
    await refreshCache();
  } catch (e) {}
  const cache = getCache();
  const { lastUpdated, lastError, ...payload } = cache || {};
  res.json(payload);
});

// webhook API endpoints removed

app.get("/health", (req, res) => {
  const cache = getCache();
  res.json({
    ok: true,
    lastUpdated: cache.lastUpdated,
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
  console.log(`Auto-refresh scheduled: "${REFRESH_CRON}" (every 5 seconds by default)`);
});

