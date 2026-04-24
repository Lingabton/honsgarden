/**
 * Hönsguiden Analytics Worker
 *
 * Cookiefri trafikanalys via Cloudflare Worker + KV.
 *
 * Endpoints:
 *   POST /api/hit     — sidvisning
 *   POST /api/event   — klick, scroll, tid
 *   GET  /stats       — dashboard (lösenordsskyddad)
 *   GET  /report      — veckorapport (lösenordsskyddad)
 *
 * Cron trigger (varje måndag 07:00 UTC):
 *   Skickar veckorapport via email.
 *
 * Ingen persondata sparas. Ingen cookie sätts.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://honsguiden.se",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Rate limiting
    if (request.method === "POST") {
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
    }

    if (url.pathname === "/api/hit" && request.method === "POST") {
      return handleHit(request, env, corsHeaders);
    }

    if (url.pathname === "/api/event" && request.method === "POST") {
      return handleEvent(request, env, corsHeaders);
    }

    if (url.pathname === "/stats") {
      return handleDashboard(request, env);
    }

    if (url.pathname === "/report") {
      return handleReport(request, env);
    }

    return new Response("Not found", { status: 404 });
  },

  // Cron trigger — varje måndag 07:00 UTC
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendWeeklyReport(env));
  },
};

// --- Hit handler (sidvisning) ---
async function handleHit(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const rawPage = sanitize(body.page || "/");
    const rawReferrer = sanitize(body.referrer || "direct");
    const page = isValidPage(rawPage) ? rawPage : "/";
    const referrer = isValidReferrer(rawReferrer) ? rawReferrer : "other";
    const country = request.cf?.country || "??";
    const device = parseDevice(request.headers.get("User-Agent") || "");
    const today = todayStr();

    await Promise.all([
      increment(env.STATS, `day:${today}:views`),
      increment(env.STATS, `day:${today}:page:${page}`),
      increment(env.STATS, `day:${today}:ref:${referrer}`),
      increment(env.STATS, `day:${today}:country:${country}`),
      increment(env.STATS, `day:${today}:device:${device}`),
      increment(env.STATS, `total:views`),
      increment(env.STATS, `total:page:${page}`),
    ]);

    return jsonOk(corsHeaders);
  } catch (e) {
    return jsonErr(corsHeaders);
  }
}

// --- Event handler (klick, scroll, tid) ---
async function handleEvent(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const type = sanitize(body.type || "");
    const page = isValidPage(sanitize(body.page || "/")) ? sanitize(body.page) : "/";
    const today = todayStr();

    if (type === "click") {
      // Klick på köplänk: product, store, url
      const product = sanitize(body.product || "unknown").slice(0, 100);
      const store = sanitize(body.store || "unknown").slice(0, 50);
      await Promise.all([
        increment(env.STATS, `day:${today}:clicks`),
        increment(env.STATS, `day:${today}:click:${product}|${store}`),
        increment(env.STATS, `total:clicks`),
        increment(env.STATS, `total:click:${product}|${store}`),
      ]);
    } else if (type === "scroll") {
      // Scroll-djup: 25, 50, 75, 100
      const depth = parseInt(body.depth, 10);
      if ([25, 50, 75, 100].includes(depth)) {
        await increment(env.STATS, `day:${today}:scroll:${page}:${depth}`);
      }
    } else if (type === "time") {
      // Tid på sidan i sekunder (avrundad till närmaste 10s-bucket)
      const seconds = Math.min(parseInt(body.seconds, 10) || 0, 600);
      const bucket = getBucket(seconds);
      await Promise.all([
        increment(env.STATS, `day:${today}:time:${page}:${bucket}`),
        increment(env.STATS, `day:${today}:engaged`),
      ]);
    } else if (type === "faq") {
      // FAQ-klick
      const question = sanitize(body.question || "").slice(0, 100);
      if (question) {
        await increment(env.STATS, `day:${today}:faq:${question}`);
      }
    }

    return jsonOk(corsHeaders);
  } catch (e) {
    return jsonErr(corsHeaders);
  }
}

// --- Dashboard ---
async function handleDashboard(request, env) {
  const url = new URL(request.url);
  const pw = url.searchParams.get("pw");
  if (pw !== env.DASHBOARD_PASSWORD) {
    return new Response("Ange ?pw=lösenord", { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const today = todayStr();
  const yesterday = dayStr(-1);

  const [totalViews, todayViews, yesterdayViews, totalClicks, todayClicks] = await Promise.all([
    getVal(env.STATS, "total:views"),
    getVal(env.STATS, `day:${today}:views`),
    getVal(env.STATS, `day:${yesterday}:views`),
    getVal(env.STATS, "total:clicks"),
    getVal(env.STATS, `day:${today}:clicks`),
  ]);

  const [topPages, todayPages, todayRefs, todayCountries, todayDevices, todayClickDetails, topClicks] =
    await Promise.all([
      getTopKeys(env.STATS, "total:page:", 15),
      getTopKeys(env.STATS, `day:${today}:page:`, 15),
      getTopKeys(env.STATS, `day:${today}:ref:`, 10),
      getTopKeys(env.STATS, `day:${today}:country:`, 10),
      getTopKeys(env.STATS, `day:${today}:device:`, 5),
      getTopKeys(env.STATS, `day:${today}:click:`, 15),
      getTopKeys(env.STATS, `total:click:`, 20),
    ]);

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hönsguiden — Analytics</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #222; background: #fafafa; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1rem; margin: 2rem 0 0.5rem; color: #555; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .card { background: #fff; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card-label { font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    .card-value { font-size: 2rem; font-weight: 700; margin-top: 0.25rem; }
    .card-value.green { color: #2d6a4f; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    th { background: #f5f5f5; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 0.5rem 0.75rem; border-top: 1px solid #f0f0f0; font-size: 0.9rem; }
    td:last-child { text-align: right; font-weight: 600; }
    .muted { color: #888; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>📊 Hönsguiden Analytics</h1>

  <div class="cards">
    <div class="card"><div class="card-label">Totalt sidvisn.</div><div class="card-value">${totalViews}</div></div>
    <div class="card"><div class="card-label">Idag</div><div class="card-value green">${todayViews}</div></div>
    <div class="card"><div class="card-label">Igår</div><div class="card-value">${yesterdayViews}</div></div>
    <div class="card"><div class="card-label">Totalt klick</div><div class="card-value">${totalClicks}</div></div>
    <div class="card"><div class="card-label">Klick idag</div><div class="card-value green">${todayClicks}</div></div>
  </div>

  <h2>Populäraste sidorna (totalt)</h2>
  ${renderTableHtml(topPages, "Sida", "Visningar")}

  <div class="grid-2">
    <div>
      <h2>Idag — sidor</h2>
      ${renderTableHtml(todayPages, "Sida", "Visn.")}
    </div>
    <div>
      <h2>Idag — referrers</h2>
      ${renderTableHtml(todayRefs, "Källa", "Visn.")}
    </div>
  </div>

  <div class="grid-2">
    <div>
      <h2>Idag — länder</h2>
      ${renderTableHtml(todayCountries, "Land", "Visn.")}
    </div>
    <div>
      <h2>Idag — enheter</h2>
      ${renderTableHtml(todayDevices, "Enhet", "Visn.")}
    </div>
  </div>

  <h2>Populäraste köpklick (totalt)</h2>
  ${renderTableHtml(topClicks.map(e => ({ name: e.name.replace("|", " → "), count: e.count })), "Produkt → Butik", "Klick")}

  <h2>Köpklick idag</h2>
  ${renderTableHtml(todayClickDetails.map(e => ({ name: e.name.replace("|", " → "), count: e.count })), "Produkt → Butik", "Klick")}

  <p class="muted" style="margin-top:2rem; font-size:0.8rem;">Realtid · Cookiefri · Ingen persondata</p>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// --- Report (web view + email) ---
async function handleReport(request, env) {
  const url = new URL(request.url);
  const pw = url.searchParams.get("pw");
  if (pw !== env.DASHBOARD_PASSWORD) {
    return new Response("Ange ?pw=lösenord", { status: 401 });
  }
  const report = await buildWeeklyReport(env);
  return new Response(report, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// --- Weekly report builder ---
async function buildWeeklyReport(env) {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const d = dayStr(-i);
    const views = await getVal(env.STATS, `day:${d}:views`);
    const clicks = await getVal(env.STATS, `day:${d}:clicks`);
    days.push({ date: d, views: parseInt(views), clicks: parseInt(clicks) });
  }

  const totalWeekViews = days.reduce((s, d) => s + d.views, 0);
  const totalWeekClicks = days.reduce((s, d) => s + d.clicks, 0);

  // Top pages denna vecka
  const weekPages = {};
  for (const d of days) {
    const keys = await getTopKeys(env.STATS, `day:${d.date}:page:`, 20);
    for (const k of keys) {
      weekPages[k.name] = (weekPages[k.name] || 0) + k.count;
    }
  }
  const topWeekPages = Object.entries(weekPages)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top klick denna vecka
  const weekClicks = {};
  for (const d of days) {
    const keys = await getTopKeys(env.STATS, `day:${d.date}:click:`, 20);
    for (const k of keys) {
      weekClicks[k.name] = (weekClicks[k.name] || 0) + k.count;
    }
  }
  const topWeekClicks = Object.entries(weekClicks)
    .map(([name, count]) => ({ name: name.replace("|", " → "), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top referrers
  const weekRefs = {};
  for (const d of days) {
    const keys = await getTopKeys(env.STATS, `day:${d.date}:ref:`, 20);
    for (const k of keys) {
      weekRefs[k.name] = (weekRefs[k.name] || 0) + k.count;
    }
  }
  const topWeekRefs = Object.entries(weekRefs)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const prevWeekDays = [];
  for (let i = 8; i <= 14; i++) {
    const views = await getVal(env.STATS, `day:${dayStr(-i)}:views`);
    prevWeekDays.push(parseInt(views));
  }
  const prevWeekViews = prevWeekDays.reduce((s, v) => s + v, 0);
  const changePercent = prevWeekViews > 0
    ? Math.round(((totalWeekViews - prevWeekViews) / prevWeekViews) * 100)
    : 0;
  const changeStr = changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #222; background: #fff; }
  h1 { font-size: 1.3rem; color: #b5482a; }
  h2 { font-size: 0.95rem; margin: 1.5rem 0 0.5rem; color: #555; }
  .big { font-size: 2rem; font-weight: 700; display: inline-block; margin-right: 1rem; }
  .change { font-size: 1rem; color: ${changePercent >= 0 ? "#2d6a4f" : "#bc4749"}; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  td:last-child { text-align: right; font-weight: 600; }
  .day-row td:first-child { font-weight: 500; }
  .muted { color: #888; font-size: 0.8rem; }
  hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
</style></head>
<body>
  <h1>🐔 Hönsguiden — Veckorapport</h1>
  <p class="muted">${days[6].date} — ${days[0].date}</p>

  <div style="margin: 1rem 0;">
    <span class="big">${totalWeekViews} visningar</span>
    <span class="change">${changeStr} vs förra veckan</span>
  </div>
  <div style="margin: 0.5rem 0 1.5rem;">
    <span class="big">${totalWeekClicks} köpklick</span>
  </div>

  <h2>Dag för dag</h2>
  <table>${days.reverse().map(d =>
    `<tr class="day-row"><td>${d.date}</td><td>${d.views} visn.</td><td>${d.clicks} klick</td></tr>`
  ).join("")}</table>

  <h2>Populäraste sidorna</h2>
  <table>${topWeekPages.map(e =>
    `<tr><td>${escapeHtml(e.name)}</td><td>${e.count}</td></tr>`
  ).join("") || '<tr><td class="muted" colspan="2">Ingen data</td></tr>'}</table>

  <h2>Köpklick</h2>
  <table>${topWeekClicks.map(e =>
    `<tr><td>${escapeHtml(e.name)}</td><td>${e.count}</td></tr>`
  ).join("") || '<tr><td class="muted" colspan="2">Inga klick</td></tr>'}</table>

  <h2>Trafikkällor</h2>
  <table>${topWeekRefs.map(e =>
    `<tr><td>${escapeHtml(e.name)}</td><td>${e.count}</td></tr>`
  ).join("") || '<tr><td class="muted" colspan="2">Ingen data</td></tr>'}</table>

  <hr>
  <p class="muted">Automatisk rapport från Hönsguiden Analytics. <a href="https://honsguiden-analytics.smakfynd.workers.dev/stats?pw=${escapeHtml(env.DASHBOARD_PASSWORD)}">Öppna live-dashboard →</a></p>
</body></html>`;
}

// --- Send weekly report via MailChannels ---
async function sendWeeklyReport(env) {
  const reportHtml = await buildWeeklyReport(env);
  const today = todayStr();

  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [
        { to: [{ email: env.REPORT_EMAIL, name: "Hönsguiden" }] },
      ],
      from: { email: "analytics@honsguiden.se", name: "Hönsguiden Analytics" },
      subject: `🐔 Veckorapport — ${today}`,
      content: [{ type: "text/html", value: reportHtml }],
    }),
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

function renderTableHtml(entries, col1 = "Namn", col2 = "Antal") {
  if (!entries.length) return `<table><tr><td class="muted" colspan="2">Ingen data ännu</td></tr></table>`;
  return `<table><thead><tr><th>${col1}</th><th style="text-align:right">${col2}</th></tr></thead><tbody>${
    entries.map(e => `<tr><td>${escapeHtml(e.name)}</td><td>${e.count}</td></tr>`).join("")
  }</tbody></table>`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dayStr(offset) {
  return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
}

function parseDevice(ua) {
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobil";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function getBucket(seconds) {
  if (seconds < 10) return "0-10s";
  if (seconds < 30) return "10-30s";
  if (seconds < 60) return "30-60s";
  if (seconds < 180) return "1-3min";
  if (seconds < 300) return "3-5min";
  return "5min+";
}

function sanitize(str) {
  return String(str).slice(0, 200).replace(/[<>"'&;(){}[\]\\]/g, "").replace(/\s+/g, " ").trim();
}

function isValidPage(str) {
  return /^\/[a-zA-Z0-9\-_./]*$/.test(str);
}

function isValidReferrer(str) {
  return str === "direct" || /^[a-zA-Z0-9.\-]+$/.test(str);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function jsonOk(corsHeaders) {
  return new Response('{"ok":true}', { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

function jsonErr(corsHeaders) {
  return new Response('{"ok":false}', { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
}
