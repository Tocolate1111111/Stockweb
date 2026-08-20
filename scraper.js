const axios = require("axios");
const cheerio = require("cheerio");

const SOURCE_URL = "https://fruityblox.com/stock";

// In-memory cache. This is what the /api/stock endpoint serves.
// It gets refreshed on a timer (see server.js) so the page you host
// never has to hit fruityblox.com itself, and never gets rate limited.
let cache = {
  normal: [],
  mirage: [],
  lastUpdated: null,
  lastError: null,
};

/**
 * Turns the squished-together text of one fruit "card" anchor into
 * structured data. fruityblox.com renders each fruit as a single <a>
 * that (once you strip tags) reads like:
 *   "RocketRocketNatural5,000R 50"
 * i.e. [name][name again, e.g. from an image alt][type][beli]R [robux]
 */
function parseCardText(rawText) {
  const text = rawText.replace(/\s+/g, " ").trim();

  const typeMatch = text.match(/(Natural|Elemental|Beast|Legendary|Mythical)/i);
  if (!typeMatch) return null;

  const type = typeMatch[1];
  const namePart = text.slice(0, typeMatch.index).trim();
  const afterType = text.slice(typeMatch.index + type.length).trim();

  const beliMatch = afterType.match(/^([\d,]+)/);
  const robuxMatch = afterType.match(/R\s*([\d,]+)/i);

  // Name is usually duplicated back-to-back (once from an <img alt>,
  // once from a text node). Split it in half when that's the case.
  let name = namePart;
  const half = namePart.length / 2;
  if (
    namePart.length % 2 === 0 &&
    namePart.slice(0, half) === namePart.slice(half)
  ) {
    name = namePart.slice(0, half);
  }

  if (!name) return null;

  return {
    name,
    type,
    beli: beliMatch ? beliMatch[1] : null,
    robux: robuxMatch ? robuxMatch[1] : null,
  };
}

async function scrapeStock() {
  const { data: html } = await axios.get(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; StockMirrorBot/1.0; +https://example.com/bot)",
      Accept: "text/html",
    },
    timeout: 15000,
  });

  const $ = cheerio.load(html);

  const sections = { normal: [], mirage: [] };
  let currentSection = null;

  // Walk the document in order. Whenever we pass a heading that says
  // "Normal" or "Mirage" we switch buckets; whenever we see a link to
  // an item page (/items/<slug>) we parse it into that bucket.
  $("body")
    .find("h1, h2, h3, a")
    .each((_, el) => {
      const $el = $(el);
      const tag = el.tagName ? el.tagName.toLowerCase() : "";

      if (tag === "h1" || tag === "h2" || tag === "h3") {
        const headingText = $el.text().trim().toLowerCase();
        if (headingText.includes("normal")) currentSection = "normal";
        else if (headingText.includes("mirage")) currentSection = "mirage";
        return;
      }

      if (tag === "a") {
        const href = $el.attr("href") || "";
        if (!href.includes("/items/")) return;
        if (!currentSection) return;

        const parsed = parseCardText($el.text());
        if (!parsed) return;

        const slug = href.split("/items/")[1]?.replace(/\/$/, "");
        sections[currentSection].push({
          slug,
          url: href.startsWith("http") ? href : `https://fruityblox.com${href}`,
          ...parsed,
        });
      }
    });

  // De-dupe in case the same anchor structure got walked twice.
  for (const key of ["normal", "mirage"]) {
    const seen = new Set();
    sections[key] = sections[key].filter((item) => {
      const k = `${item.slug}-${item.beli}-${item.robux}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  return sections;
}

async function refreshCache() {
  try {
    const sections = await scrapeStock();

    // Only overwrite the cache if we actually found something —
    // protects the site from going blank if fruityblox.com changes
    // its markup and the scraper needs an update.
    if (sections.normal.length > 0 || sections.mirage.length > 0) {
      cache = {
        normal: sections.normal,
        mirage: sections.mirage,
        lastUpdated: new Date().toISOString(),
        lastError: null,
      };
      console.log(
        `[scraper] refreshed ok — normal:${sections.normal.length} mirage:${sections.mirage.length}`
      );
    } else {
      cache.lastError =
        "Scrape returned 0 items — fruityblox.com markup may have changed.";
      console.warn(`[scraper] ${cache.lastError}`);
    }
  } catch (err) {
    cache.lastError = err.message;
    console.error("[scraper] failed:", err.message);
  }
}

function getCache() {
  return cache;
}

module.exports = { refreshCache, getCache, scrapeStock };
