const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { refreshCache, getCache } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 3000;
// Webhook functionality removed — simplify server configuration

// Refresh at a calmer cadence to avoid hammering the upstream site and
// drifting away from the source web's real update rhythm.
const REFRESH_CRON = process.env.REFRESH_CRON || "*/30 * * * * *";


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
  const forceFresh = String(req.query.fresh || "") === "1";
  const cache = getCache() || { normal: [], mirage: [], lastUpdated: null };

  const buildPayload = (source) => {
    const { lastUpdated, lastError, ...rest } = source || {};
    return { ...rest };
  };

  if (forceFresh || (cache.normal.length === 0 && cache.mirage.length === 0)) {
    try {
      await refreshCache();
    } catch (e) {}
    return res.json(buildPayload(getCache()));
  }

  res.setHeader("Cache-Control", "no-store");
  const payload = buildPayload(cache);
  res.json(payload);

  const staleThresholdMs = 30000;
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
  const { lastUpdated, lastError, ...rest } = cache || {};
  res.json({ ...rest });
});

// webhook API endpoints removed

app.get("/health", (req, res) => {
  const cache = getCache();
  const ageMs = cache && cache.lastUpdated ? Date.now() - Date.parse(cache.lastUpdated) : Number.POSITIVE_INFINITY;
  res.json({
    ok: true,
    hasData: !!(cache && cache.normal && cache.normal.length > 0) || !!(cache && cache.mirage && cache.mirage.length > 0),
    ageMs,
    isStale: !cache || !cache.lastUpdated || ageMs > 60000,
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
  console.log(`Auto-refresh scheduled: "${REFRESH_CRON}" (every 30 seconds by default)`);
});

