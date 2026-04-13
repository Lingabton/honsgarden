/**
 * Hönsguiden Price Scraper
 *
 * Cloudflare Worker som:
 * 1. Scrapar priser från svenska butiker varje måndag
 * 2. Sparar prishistorik i KV
 * 3. Har lösenordsskyddad admin-dashboard
 *
 * Endpoints:
 *   GET /admin/prices?key=XXX     — se alla priser
 *   GET /admin/history?key=XXX    — prishistorik per produkt
 *   POST /admin/scrape?key=XXX    — manuell scrape
 *   (Cron trigger varje måndag)
 */

// Produkter att scrapa — URL + CSS-selector/regex för pris
const PRODUCTS = [
  // LUCKÖPPNARE
  {
    id: "kerbl-luckoppnare",
    name: "Kerbl Automatisk Hönslucka 430x400",
    url: "https://www.granngarden.se/honslucka-kerbl-med-automatisk-luckoppnare-430x400mm",
    store: "Granngården",
    category: "luckoppnare"
  },
  {
    id: "chickenguard-pro-bole",
    name: "ChickenGuard Pro + Dörrkit",
    url: "https://www.bole.se/automatisk-luckoppnare-chicken-guard-pro-och-dorrkit",
    store: "Bole.se",
    category: "luckoppnare"
  },
  // FODERAUTOMATER
  {
    id: "kerbl-foder-galv-18",
    name: "Kerbl Foderautomat Galvaniserad 18kg",
    url: "https://www.granngarden.se/foderautomat-kerbl-hons-galvaniserad-18kg",
    store: "Granngården",
    category: "foderautomater"
  },
  {
    id: "kerbl-foder-plast-8",
    name: "Kerbl Foderautomat Plast 8kg",
    url: "https://www.granngarden.se/foderautomat-kerbl-inkl-ben-hons-plast-gron-8kg",
    store: "Granngården",
    category: "foderautomater"
  },
  {
    id: "kerbl-foder-plast-15l",
    name: "Kerbl Foderautomat Plast 15L",
    url: "https://www.granngarden.se/foderautomat-kerbl-hons-plast-rodsvart-15l",
    store: "Granngården",
    category: "foderautomater"
  },
  // HÖNSHUS
  {
    id: "kerbl-eco-barney",
    name: "Kerbl Eco Barney Hönshus",
    url: "https://www.granngarden.se/honshus-kerbl-eco-barney-gravit-137x73x83cm",
    store: "Granngården",
    category: "honshus"
  },
  {
    id: "kerbl-hobby-tra",
    name: "Kerbl Hobby Hönshus Trä",
    url: "https://www.granngarden.se/honshuskaninhus-kerbl-hobby-tra-105x100x108cm",
    store: "Granngården",
    category: "honshus"
  },
  // VÄRMEPLATTOR
  {
    id: "brinsea-ecoglow-1200",
    name: "Brinsea EcoGlow Safety 1200",
    url: "https://www.arctichen.se/store/p/0/v%C3%A4rmetak-ecoglow-safety-1200-861820",
    store: "Arctic Hen",
    category: "varmeplattor"
  },
];

export default {
  // HTTP requests
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key !== env.ADMIN_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (url.pathname === "/admin/prices") {
      return handlePrices(env);
    }
    if (url.pathname === "/admin/history") {
      return handleHistory(env, url.searchParams.get("product"));
    }
    if (url.pathname === "/admin/scrape" && request.method === "POST") {
      const results = await scrapeAll(env);
      return new Response(JSON.stringify(results, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname === "/admin/export") {
      return handleExport(env);
    }

    return new Response("Endpoints: /admin/prices, /admin/history?product=ID, POST /admin/scrape, /admin/export", {
      headers: { "Content-Type": "text/plain" },
    });
  },

  // Cron trigger — varje måndag
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scrapeAll(env));
  },
};

// --- Scraping ---

async function scrapeAll(env) {
  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const product of PRODUCTS) {
    try {
      const price = await scrapePrice(product);
      if (price) {
        // Spara dagens pris
        await env.PRICES.put(
          `price:${product.id}:${today}`,
          JSON.stringify({
            price,
            store: product.store,
            url: product.url,
            scraped_at: new Date().toISOString(),
          })
        );

        // Spara senaste pris (snabb lookup)
        await env.PRICES.put(
          `latest:${product.id}`,
          JSON.stringify({
            price,
            store: product.store,
            url: product.url,
            date: today,
            name: product.name,
            category: product.category,
          })
        );

        results.push({ id: product.id, name: product.name, price, status: "ok" });
      } else {
        results.push({ id: product.id, name: product.name, price: null, status: "no_price_found" });
      }
    } catch (e) {
      results.push({ id: product.id, name: product.name, error: e.message, status: "error" });
    }

    // Rate limit: 2s mellan requests
    await sleep(2000);
  }

  // Spara scrape-logg
  await env.PRICES.put(`scrape:${today}`, JSON.stringify({
    date: today,
    results,
    total: results.length,
    success: results.filter(r => r.status === "ok").length,
  }));

  return results;
}

async function scrapePrice(product) {
  const resp = await fetch(product.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HonsguidenBot/1.0; +https://honsguiden.se)",
      "Accept": "text/html",
      "Accept-Language": "sv-SE,sv",
    },
  });

  if (!resp.ok) return null;
  const html = await resp.text();

  // Strategi 1: Granngården — pris i meta/og eller vanlig HTML
  // Deras priser syns ofta i plain text som "X XXX kr" eller "X XXX:-"
  let price = null;

  // Sök efter pris-mönster i HTML
  // Typiska format: "1 899 kr", "1899:-", "1 899,00", "1899.00 SEK"
  const patterns = [
    // "1 234 kr" or "1234 kr"
    /(\d[\d\s]*\d)\s*kr/gi,
    // "1 234:-"
    /(\d[\d\s]*\d)\s*:-/gi,
    // meta property="product:price:amount" content="1899"
    /product:price:amount[^>]*content="(\d+[\d.,]*)"/i,
    // "price":"1899" (JSON-LD)
    /"price"\s*:\s*"?(\d+[\d.,]*)"?/gi,
    // itemprop="price" content="1899"
    /itemprop="price"[^>]*content="(\d+[\d.,]*)"/i,
  ];

  for (const pattern of patterns) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length > 0) {
      // Ta det första rimliga priset (100-50000 kr)
      for (const match of matches) {
        const raw = match[1].replace(/\s/g, "").replace(",", ".");
        const num = parseFloat(raw);
        if (num >= 50 && num <= 50000) {
          price = Math.round(num);
          break;
        }
      }
      if (price) break;
    }
  }

  return price;
}

// --- Dashboard ---

async function handlePrices(env) {
  const list = await env.PRICES.list({ prefix: "latest:" });
  const prices = [];

  for (const key of list.keys) {
    const data = JSON.parse(await env.PRICES.get(key.name));
    prices.push(data);
  }

  prices.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hönsguiden — Priser (privat)</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #888; font-size: 0.85rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.5rem; border-bottom: 2px solid #ddd; font-size: 0.8rem; text-transform: uppercase; color: #888; }
    td { padding: 0.5rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
    td:nth-child(3) { font-weight: 700; }
    a { color: #b5482a; }
    .cat { background: #f5f5f5; font-weight: 600; }
    .btn { display: inline-block; padding: 0.5rem 1rem; background: #222; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; margin-top: 1rem; text-decoration: none; }
  </style>
</head>
<body>
  <h1>Priser — scraper dashboard</h1>
  <p class="meta">${prices.length} produkter spårade. <a href="/admin/export?key=${encodeURIComponent(env.ADMIN_KEY)}">Exportera JSON</a></p>
  <form method="POST" action="/admin/scrape?key=${encodeURIComponent(env.ADMIN_KEY)}" style="margin-bottom:1rem;">
    <button type="submit" class="btn">Scrapa nu</button>
  </form>
  <table>
    <thead><tr><th>Produkt</th><th>Butik</th><th>Pris</th><th>Uppdaterad</th><th>Historik</th></tr></thead>
    <tbody>
    ${prices.map(p => `<tr>
      <td><a href="${esc(p.url)}" target="_blank">${esc(p.name)}</a></td>
      <td>${esc(p.store)}</td>
      <td>${p.price ? p.price + " kr" : "—"}</td>
      <td>${p.date || "—"}</td>
      <td><a href="/admin/history?key=${encodeURIComponent(env.ADMIN_KEY)}&product=${encodeURIComponent(p.name ? p.name.replace(/\s+/g, "-").toLowerCase().slice(0,30) : "")}">📈</a></td>
    </tr>`).join("")}
    </tbody>
  </table>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handleHistory(env, productQuery) {
  if (!productQuery) {
    return new Response("Ange ?product=ID", { status: 400 });
  }

  // Hitta alla prispunkter för produkten
  const allKeys = await env.PRICES.list({ prefix: "price:" });
  const history = [];

  for (const key of allKeys.keys) {
    // key format: price:{id}:{date}
    if (key.name.includes(productQuery)) {
      const data = JSON.parse(await env.PRICES.get(key.name));
      const parts = key.name.split(":");
      history.push({
        date: parts[2],
        price: data.price,
        store: data.store,
      });
    }
  }

  history.sort((a, b) => a.date.localeCompare(b.date));

  const html = `<!DOCTYPE html>
<html lang="sv"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prishistorik — ${esc(productQuery)}</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.3rem; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.4rem; border-bottom: 2px solid #ddd; font-size: 0.8rem; color: #888; }
    td { padding: 0.4rem; border-bottom: 1px solid #eee; }
    .change-up { color: #bc4749; }
    .change-down { color: #2d6a4f; }
    a { color: #b5482a; }
  </style>
</head><body>
  <a href="/admin/prices?key=${encodeURIComponent(env.ADMIN_KEY)}">&larr; Tillbaka</a>
  <h1>Prishistorik: ${esc(productQuery)}</h1>
  ${history.length === 0 ? "<p>Ingen data ännu. Kör en scrape först.</p>" : ""}
  <table>
    <thead><tr><th>Datum</th><th>Pris</th><th>Förändring</th></tr></thead>
    <tbody>
    ${history.map((h, i) => {
      const prev = i > 0 ? history[i-1].price : null;
      const change = prev ? h.price - prev : 0;
      const changeStr = change > 0 ? `<span class="change-up">+${change} kr</span>`
                       : change < 0 ? `<span class="change-down">${change} kr</span>`
                       : "—";
      return `<tr><td>${h.date}</td><td><strong>${h.price} kr</strong></td><td>${changeStr}</td></tr>`;
    }).join("")}
    </tbody>
  </table>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handleExport(env) {
  const list = await env.PRICES.list({ prefix: "latest:" });
  const data = {};

  for (const key of list.keys) {
    const val = JSON.parse(await env.PRICES.get(key.name));
    data[key.name.replace("latest:", "")] = val;
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=honsguiden-prices.json",
    },
  });
}

// --- Helpers ---
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
