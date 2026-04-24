/**
 * Hönsguiden Analytics Worker
 *
 * Cookiefri trafikanalys via Cloudflare Worker + KV.
 * Två delar:
 *   1. /api/hit — tar emot page views från sajten (POST)
 *   2. /stats  — enkel dashboard (lösenordsskyddad)
 *
 * Ingen persondata sparas. Ingen cookie sätts.
 * Aggregerad data per dag: sida, referrer, land, enhet.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers för att sajten ska kunna posta hits
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://honsguiden.se",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/hit — logga sidvisning
    if (url.pathname === "/api/hit" && request.method === "POST") {
      // Enkel rate limiting: max 100 req/min per IP
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateKey = `rate:${ip}:${Math.floor(Date.now() / 60000)}`;
      const reqCount = parseInt((await env.STATS.get(rateKey)) || "0", 10);
      if (reqCount > 100) {
        return new Response('{"ok":false,"error":"rate_limited"}', {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      await env.STATS.put(rateKey, String(reqCount + 1), { expirationTtl: 120 });
      return handleHit(request, env, corsHeaders);
    }

    // GET /stats — dashboard
    if (url.pathname === "/stats") {
      return handleDashboard(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleHit(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const rawPage = sanitize(body.page || "/");
    const rawReferrer = sanitize(body.referrer || "direct");
    const page = isValidPage(rawPage) ? rawPage : "/";
    const referrer = isValidReferrer(rawReferrer) ? rawReferrer : "other";
    const country = request.cf?.country || "??";
    const device = parseDevice(request.headers.get("User-Agent") || "");
    const today = new Date().toISOString().slice(0, 10); // 2026-04-13

    // Increment dagliga räknare
    await increment(env.STATS, `day:${today}:views`);
    await increment(env.STATS, `day:${today}:page:${page}`);
    await increment(env.STATS, `day:${today}:ref:${referrer}`);
    await increment(env.STATS, `day:${today}:country:${country}`);
    await increment(env.STATS, `day:${today}:device:${device}`);

    // Totala räknare
    await increment(env.STATS, `total:views`);
    await increment(env.STATS, `total:page:${page}`);

    return new Response('{"ok":true}', {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response('{"ok":false}', {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function handleDashboard(request, env) {
  // Enkel lösenordskontroll via query param
  const url = new URL(request.url);
  const pw = url.searchParams.get("pw");
  if (pw !== env.DASHBOARD_PASSWORD) {
    return new Response("Ange ?pw=lösenord", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Hämta data
  const [totalViews, todayViews, yesterdayViews] = await Promise.all([
    getVal(env.STATS, "total:views"),
    getVal(env.STATS, `day:${today}:views`),
    getVal(env.STATS, `day:${yesterday}:views`),
  ]);

  // Hämta top pages (totalt)
  const topPages = await getTopKeys(env.STATS, "total:page:", 10);

  // Hämta dagens top pages, referrers, länder
  const [todayPages, todayRefs, todayCountries, todayDevices] =
    await Promise.all([
      getTopKeys(env.STATS, `day:${today}:page:`, 10),
      getTopKeys(env.STATS, `day:${today}:ref:`, 10),
      getTopKeys(env.STATS, `day:${today}:country:`, 10),
      getTopKeys(env.STATS, `day:${today}:device:`, 5),
    ]);

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hönsguiden — Trafik</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 700px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; color: #555; }
    .big { font-size: 2.5rem; font-weight: 700; }
    .row { display: flex; gap: 1.5rem; margin-bottom: 1rem; }
    .stat { flex: 1; }
    .stat-label { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    td { padding: 0.4rem 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
    td:last-child { text-align: right; font-weight: 600; }
    .muted { color: #888; }
  </style>
</head>
<body>
  <h1>📊 Hönsguiden — trafik</h1>

  <div class="row">
    <div class="stat">
      <div class="stat-label">Totalt</div>
      <div class="big">${totalViews}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Idag (${today})</div>
      <div class="big">${todayViews}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Igår</div>
      <div class="big">${yesterdayViews}</div>
    </div>
  </div>

  <h2>Populäraste sidorna (totalt)</h2>
  <table>${renderTable(topPages)}</table>

  <h2>Idag — sidor</h2>
  <table>${renderTable(todayPages)}</table>

  <h2>Idag — referrers</h2>
  <table>${renderTable(todayRefs)}</table>

  <h2>Idag — länder</h2>
  <table>${renderTable(todayCountries)}</table>

  <h2>Idag — enheter</h2>
  <table>${renderTable(todayDevices)}</table>

  <p class="muted" style="margin-top:2rem; font-size:0.8rem;">Uppdateras i realtid. Ingen cookie, ingen persondata.</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// --- Helpers ---

async function increment(kv, key) {
  const current = parseInt((await kv.get(key)) || "0", 10);
  await kv.put(key, String(current + 1));
}

async function getVal(kv, key) {
  return (await kv.get(key)) || "0";
}

async function getTopKeys(kv, prefix, limit = 10) {
  const list = await kv.list({ prefix, limit: 100 });
  const entries = await Promise.all(
    list.keys.map(async (k) => ({
      name: k.name.replace(prefix, ""),
      count: parseInt((await kv.get(k.name)) || "0", 10),
    }))
  );
  entries.sort((a, b) => b.count - a.count);
  return entries.slice(0, limit);
}

function renderTable(entries) {
  if (!entries.length) return '<tr><td class="muted" colspan="2">Ingen data ännu</td></tr>';
  return entries
    .map((e) => `<tr><td>${escapeHtml(e.name)}</td><td>${e.count}</td></tr>`)
    .join("");
}

function parseDevice(ua) {
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobil";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function sanitize(str) {
  return str.slice(0, 200).replace(/[<>"'&;(){}[\]\\]/g, "").replace(/\s+/g, " ").trim();
}

function isValidPage(str) {
  return /^\/[a-zA-Z0-9\-_./]*$/.test(str);
}

function isValidReferrer(str) {
  return str === "direct" || /^[a-zA-Z0-9.\-]+$/.test(str);
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
