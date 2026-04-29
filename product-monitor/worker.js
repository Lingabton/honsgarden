/**
 * Hönsguiden Product Monitor v3
 *
 * Daglig check: lagerstatus, pris, och länkstatus.
 * Cron: varje dag kl 06:00 UTC
 * Email om: trasiga länkar, slut i lager, eller prisändring >15%.
 */

const PRODUCTS = [
  // LUCKÖPPNARE
  { name: "Omlet Smart Door", page: "luckoppnare", url: "https://www.omlet.se/smart-automatisk-d%C3%B6rr%C3%B6ppnare-h%C3%B6nshus/", expectedPrice: 2399 },
  { name: "ChickenGuard Solar", page: "luckoppnare", url: "https://www.amazon.se/dp/B0C5N925YT", expectedPrice: 2080, type: "amazon" },
  { name: "ChickenGuard EU", page: "luckoppnare", url: "https://chickenguard.eu/product/all-in-one-solar/", expectedPrice: 2080 },
  { name: "ChickenGuard Premium", page: "luckoppnare", url: "https://www.amazon.se/dp/B0C5N8CP21", expectedPrice: 1780, type: "amazon" },
  { name: "Okköbi Solar", page: "luckoppnare", url: "https://www.amazon.se/dp/B0DCFTN57J", expectedPrice: 780, type: "amazon" },
  { name: "Kerbl Lucköppnare (GG)", page: "luckoppnare", url: "https://www.granngarden.se/honslucka-kerbl-med-automatisk-luckoppnare-430x400mm", expectedPrice: 1899 },
  { name: "Kerbl Lucköppnare (Bonden)", page: "luckoppnare", url: "https://www.bonden.se/luckoppnare/72195-honslucka-automatisk-komplett-till-honshus-7389512094121.html", expectedPrice: 1899 },
  { name: "Brinsea ChickSafe", page: "luckoppnare", url: "https://www.honshuset.se/produkt/brinsea-chicksafe-advance-automatisk-luckoppnare/", expectedPrice: 2259 },

  // HÖNSHUS
  { name: "Omlet Eglu Cube", page: "honshus", url: "https://www.omlet.se/shop/att_ha_hons/eglu-cube-isolerat-honshus/", expectedPrice: 9449 },
  { name: "Omlet Eglu Go", page: "honshus", url: "https://www.omlet.se/shop/att_ha_hons/eglu_go/", expectedPrice: 4999 },
  { name: "Bonden Isolerat", page: "honshus", url: "https://www.bonden.se/honshus/72168-honshus-isolerat-med-varme-och-rede-kerbl-7389512063127.html", expectedPrice: 6999 },
  { name: "Kerbl Eco Barney (GG)", page: "honshus", url: "https://www.granngarden.se/honshus-kerbl-eco-barney-gravit-137x73x83cm", expectedPrice: 3490 },
  { name: "Kerbl Eco Barney (Bole)", page: "honshus", url: "https://www.bole.se/honshus-kerbl-barney", expectedPrice: 3196 },
  { name: "Kerbl Hobby (GG)", page: "honshus", url: "https://www.granngarden.se/honshuskaninhus-kerbl-hobby-tra-105x100x108cm", expectedPrice: 2290 },
  { name: "Hornbach Vivid", page: "honshus", url: "https://www.hornbach.se/p/honshus-146x74x85cm/10469138/", expectedPrice: 1999 },

  // FODERAUTOMATER
  { name: "Grandpa's Feeder", page: "foderautomater", url: "https://www.amazon.se/dp/B00TXW0UQK", expectedPrice: 2290, type: "amazon" },
  { name: "Kerbl Galv 18kg (GG)", page: "foderautomater", url: "https://www.granngarden.se/foderautomat-kerbl-hons-galvaniserad-18kg", expectedPrice: 799 },

  // VATTENAUTOMATER
  { name: "NoFrost (LK)", page: "vattenautomater", url: "https://www.lantkompaniet.se/eluppvaermd-vattenautomat-nofrost-frostfri-vattenautomat-foer-kanin-kyckling-fagel-330-ml.html", expectedPrice: 399 },
  { name: "Kerbl 5L (GG)", page: "vattenautomater", url: "https://www.granngarden.se/vattenautomat-kerbl-inkl-ben-hons-plast-gron-5l", expectedPrice: 229 },

  // VÄRMEPLATTOR
  { name: "CosyHeat (LB)", page: "varmeplattor", url: "https://www.lantbutiken.se/hons-fjaderfa/varmekallor/varmetak/varmeplatta-till-kycklingar-cosyheat", expectedPrice: 661 },
];

const OOS_PATTERNS = [
  "slut i lager", "slutsåld", "out of stock", "inte tillgänglig",
  "ej tillgänglig", "tillfälligt slut", "currently unavailable",
  "för närvarande inte tillgänglig", "webbköp f.n. ej möjligt",
  "sold out", "inte reserverbar", "ej lagerförd", "inga säljare",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/status") return handleStatus(env);
    if (url.pathname === "/run" && url.searchParams.get("pw") === env.PASSWORD) {
      const result = await runChecks(env);
      return new Response(JSON.stringify(result, null, 2), { headers: { "Content-Type": "application/json" } });
    }
    return new Response("Hönsguiden Product Monitor v3. /status för dashboard.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(runChecks(env)); },
};

async function runChecks(env) {
  const results = [];
  const problems = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const product of PRODUCTS) {
    const entry = await checkProduct(product);
    results.push(entry);
    if (!entry.ok || entry.oos || entry.priceAlert) {
      problems.push(entry);
    }
  }

  await env.MONITOR.put("last-run", today);
  await env.MONITOR.put("last-results", JSON.stringify(results));
  await env.MONITOR.put(`run:${today}`, JSON.stringify(results));

  if (problems.length > 0) {
    await sendAlert(env, problems, results.length, today);
  }

  return { date: today, total: results.length, problems: problems.length, results };
}

async function checkProduct(product) {
  const entry = {
    name: product.name,
    page: product.page,
    url: product.url,
    status: 0,
    ok: false,
    oos: false,
    oosReason: null,
    foundPrice: null,
    expectedPrice: product.expectedPrice,
    priceAlert: false,
    priceChange: null,
    error: null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(product.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
    });

    clearTimeout(timeout);
    entry.status = res.status;
    entry.ok = res.status >= 200 && res.status < 400;

    if (!entry.ok) return entry;

    const body = await res.text();
    const bodyLower = body.toLowerCase();

    // 1. Kolla lagerstatus
    for (const pattern of OOS_PATTERNS) {
      if (bodyLower.includes(pattern)) {
        const idx = bodyLower.indexOf(pattern);
        const context = bodyLower.slice(Math.max(0, idx - 200), idx + 200);
        if (context.includes("review") || context.includes("kommentar") || context.includes("recension")) continue;
        entry.oos = true;
        entry.oosReason = pattern;
        break;
      }
    }

    // 2. Extrahera pris
    entry.foundPrice = extractPrice(body, product.type);

    // 3. Jämför med förväntat pris
    if (entry.foundPrice && product.expectedPrice) {
      const diff = Math.abs(entry.foundPrice - product.expectedPrice) / product.expectedPrice;
      if (diff > 0.15) {
        entry.priceAlert = true;
        entry.priceChange = `${product.expectedPrice} → ${entry.foundPrice} kr (${diff > 0 ? "+" : ""}${Math.round((entry.foundPrice - product.expectedPrice) / product.expectedPrice * 100)}%)`;
      }
    }

  } catch (e) {
    entry.error = e.message || "timeout";
  }

  return entry;
}

function extractPrice(html, type) {
  // Metod 1: Schema.org JSON-LD
  const ldMatches = html.match(/"price"\s*:\s*"?(\d[\d\s,.]*)"?/gi);
  if (ldMatches) {
    for (const m of ldMatches) {
      const num = parseSwedishPrice(m.replace(/"price"\s*:\s*/i, ""));
      if (num > 10 && num < 50000) return num;
    }
  }

  // Metod 2: Schema.org meta-tag
  const metaPrice = html.match(/itemprop="price"\s+content="([\d.,]+)"/i);
  if (metaPrice) {
    const num = parseSwedishPrice(metaPrice[1]);
    if (num > 10 && num < 50000) return num;
  }

  // Metod 3: Vanliga prismönster i HTML
  const pricePatterns = [
    /class="[^"]*price[^"]*"[^>]*>\s*(?:<[^>]+>)?\s*([\d\s.,]+)\s*(?:kr|SEK)/gi,
    /(\d[\d\s,.]+)\s*(?:kr|SEK|:-)/g,
  ];

  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const num = parseSwedishPrice(match[1]);
      if (num > 50 && num < 50000) return num;
    }
  }

  // Metod 4: Amazon-specifikt
  if (type === "amazon") {
    const amazonPrice = html.match(/class="a-price-whole">([\d\s,.]+)</i);
    if (amazonPrice) {
      const num = parseSwedishPrice(amazonPrice[1]);
      if (num > 10) return num;
    }
    // Amazon priceToPay
    const priceToPay = html.match(/priceToPay[^>]*>.*?<span[^>]*>([\d\s,.]+)/is);
    if (priceToPay) {
      const num = parseSwedishPrice(priceToPay[1]);
      if (num > 10) return num;
    }
  }

  return null;
}

function parseSwedishPrice(str) {
  if (!str) return null;
  // Ta bort allt utom siffror, komma, punkt
  const cleaned = str.replace(/[^\d.,]/g, "");
  // Svenska: 1.299,00 eller 1 299 eller 1299
  // Testa komma som decimal
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    const whole = parts[0].replace(/\./g, "");
    return parseInt(whole) || null;
  }
  return parseInt(cleaned.replace(/\./g, "")) || null;
}

async function sendAlert(env, problems, total, date) {
  const brokenCount = problems.filter((p) => !p.ok).length;
  const oosCount = problems.filter((p) => p.oos).length;
  const priceCount = problems.filter((p) => p.priceAlert).length;

  const rows = problems.map((p) => {
    let issue = "";
    let color = "#888";
    if (!p.ok) { issue = `🔴 HTTP ${p.status || "ERROR"}`; color = "#bc4749"; }
    else if (p.oos) { issue = `🟡 ${p.oosReason}`; color = "#D4A84B"; }
    if (p.priceAlert) { issue += (issue ? " + " : "") + `💰 ${p.priceChange}`; color = p.ok ? "#2d6a4f" : color; }
    return `<tr><td>${esc(p.name)}</td><td style="color:${color}">${issue}</td><td>${p.foundPrice ? p.foundPrice + " kr" : "?"}</td></tr>`;
  }).join("");

  const subject = [
    brokenCount > 0 ? `🔴 ${brokenCount} trasiga` : "",
    oosCount > 0 ? `🟡 ${oosCount} slut` : "",
    priceCount > 0 ? `💰 ${priceCount} prisändringar` : "",
  ].filter(Boolean).join(", ");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,sans-serif;max-width:600px;margin:20px auto;color:#222}
h1{font-size:1.2rem;color:#C4653A}
table{width:100%;border-collapse:collapse}
td{padding:6px 8px;border-bottom:1px solid #eee;font-size:0.9rem}
td:first-child{font-weight:600}
</style></head><body>
<h1>Hönsguiden produktkontroll</h1>
<p>${date}. ${total} produkter. ${subject}.</p>
<table><tr><th>Produkt</th><th>Problem</th><th>Pris</th></tr>${rows}</table>
</body></html>`;

  try {
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: env.REPORT_EMAIL }] }],
        from: { email: "monitor@honsguiden.se", name: "Hönsguiden Monitor" },
        subject: `Hönsguiden: ${subject}`,
        content: [{ type: "text/html", value: html }],
      }),
    });
  } catch (e) {}
}

async function handleStatus(env) {
  const lastRun = await env.MONITOR.get("last-run");
  const results = JSON.parse((await env.MONITOR.get("last-results")) || "[]");

  const ok = results.filter((r) => r.ok && !r.oos && !r.priceAlert);
  const oos = results.filter((r) => r.ok && r.oos);
  const broken = results.filter((r) => !r.ok);
  const priceAlerts = results.filter((r) => r.priceAlert);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hönsguiden Monitor</title>
<style>
body{font-family:-apple-system,sans-serif;max-width:750px;margin:2rem auto;padding:0 1rem;color:#222}
h1{font-size:1.3rem} h2{font-size:1rem;margin-top:1.5rem}
.cards{display:flex;gap:0.75rem;margin:1rem 0;flex-wrap:wrap}
.card{flex:1;min-width:100px;background:#f5f5f5;border-radius:8px;padding:1rem;text-align:center}
.card-big{font-size:1.8rem;font-weight:700}
.green{color:#2d6a4f} .yellow{color:#D4A84B} .red{color:#bc4749} .blue{color:#2563eb}
table{width:100%;border-collapse:collapse;margin:0.5rem 0}
td,th{padding:6px 8px;border-bottom:1px solid #eee;font-size:0.82rem;text-align:left}
th{font-size:0.7rem;color:#888;text-transform:uppercase}
.muted{color:#888;font-size:0.8rem}
</style></head>
<body>
<h1>🐔 Hönsguiden Product Monitor</h1>
<p class="muted">Senast körd: ${lastRun || "aldrig"}</p>
<div class="cards">
  <div class="card"><div class="card-big green">${ok.length}</div><div class="muted">OK</div></div>
  <div class="card"><div class="card-big yellow">${oos.length}</div><div class="muted">Slut i lager</div></div>
  <div class="card"><div class="card-big red">${broken.length}</div><div class="muted">Trasiga</div></div>
  <div class="card"><div class="card-big blue">${priceAlerts.length}</div><div class="muted">Prisändring</div></div>
</div>
${broken.length > 0 ? `<h2 class="red">🔴 Trasiga länkar</h2><table><tr><th>Produkt</th><th>Status</th><th>Sida</th></tr>${broken.map((b) => `<tr><td>${esc(b.name)}</td><td class="red">${b.status || b.error}</td><td>${esc(b.page)}</td></tr>`).join("")}</table>` : ""}
${oos.length > 0 ? `<h2 class="yellow">🟡 Slut i lager</h2><table><tr><th>Produkt</th><th>Orsak</th><th>Sida</th></tr>${oos.map((o) => `<tr><td>${esc(o.name)}</td><td class="yellow">${esc(o.oosReason)}</td><td>${esc(o.page)}</td></tr>`).join("")}</table>` : ""}
${priceAlerts.length > 0 ? `<h2 class="blue">💰 Prisändringar (>15%)</h2><table><tr><th>Produkt</th><th>Ändring</th><th>Aktuellt</th></tr>${priceAlerts.map((p) => `<tr><td>${esc(p.name)}</td><td class="blue">${esc(p.priceChange)}</td><td>${p.foundPrice} kr</td></tr>`).join("")}</table>` : ""}
<h2>Alla produkter</h2>
<table>
<tr><th>Produkt</th><th>Status</th><th>Lager</th><th>Pris (hittat)</th><th>Pris (sajten)</th></tr>
${results.map((r) => {
    const sc = !r.ok ? "red" : r.oos ? "yellow" : "green";
    const st = !r.ok ? "✗" : r.oos ? "⚠" : "✓";
    const pc = r.priceAlert ? "blue" : "";
    return `<tr><td>${esc(r.name)}</td><td class="${sc}">${st}</td><td class="${r.oos ? "yellow" : ""}">${r.oos ? esc(r.oosReason) : "OK"}</td><td class="${pc}">${r.foundPrice ? r.foundPrice + " kr" : "?"}</td><td>${r.expectedPrice} kr</td></tr>`;
  }).join("")}
</table>
<p class="muted" style="margin-top:2rem">Körs varje morgon 06:00. Email vid problem eller prisändring >15%.</p>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
