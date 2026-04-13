/**
 * Hönsguiden Scraper v2
 *
 * 1. Scrapar priser från svenska butiker (varje måndag)
 * 2. Samlar in reviews/omnämnanden från webb
 * 3. Sparar prishistorik + reviews i KV
 * 4. Lösenordsskyddad admin-dashboard
 *
 * Endpoints:
 *   GET  /admin/prices?key=XXX      — alla senaste priser
 *   GET  /admin/history?key=XXX&id= — prishistorik per produkt
 *   GET  /admin/reviews?key=XXX     — alla reviews
 *   POST /admin/scrape?key=XXX      — manuell pris-scrape
 *   POST /admin/scrape-reviews?key= — manuell review-scrape
 *   GET  /admin/export?key=XXX      — exportera allt som JSON
 */

// === PRODUKTKATALOG ===
const PRODUCTS = [
  // LUCKÖPPNARE
  {
    id: "chickenguard-aio-solar",
    name: "ChickenGuard All-in-One Solar",
    category: "luckoppnare",
    stores: [
      { store: "Amazon.se", url: "https://www.amazon.se/dp/B0C5N925YT" },
      { store: "ChickenGuard EU", url: "https://chickenguard.eu/product/all-in-one-solar/" },
    ],
    review_searches: ["ChickenGuard All-in-One Solar recension", "ChickenGuard solar review"],
  },
  {
    id: "chickenguard-premium-eco",
    name: "ChickenGuard Premium Eco",
    category: "luckoppnare",
    stores: [
      { store: "Bole.se", url: "https://www.bole.se/automatisk-luckoppnare-chicken-guard-pro-och-dorrkit" },
      { store: "Amazon.se", url: "https://www.amazon.se/dp/B0C5N8CP21" },
    ],
    review_searches: ["ChickenGuard Premium recension", "ChickenGuard Premium Eco review"],
  },
  {
    id: "kerbl-komplett",
    name: "Kerbl Automatisk Hönslucka Komplett",
    category: "luckoppnare",
    stores: [
      { store: "Granngården", url: "https://www.granngarden.se/honslucka-kerbl-med-automatisk-luckoppnare-430x400mm" },
    ],
    review_searches: ["Kerbl automatisk hönslucka recension", "Kerbl chicken door review"],
  },
  {
    id: "omlet-autodoor",
    name: "Omlet Smart Automatic Door",
    category: "luckoppnare",
    stores: [
      { store: "Omlet.se", url: "https://www.omlet.se/" },
    ],
    review_searches: ["Omlet autodoor recension", "Omlet automatic chicken door review"],
  },
  {
    id: "run-chicken-t50",
    name: "Run Chicken T50",
    category: "luckoppnare",
    stores: [
      { store: "Amazon.se", url: "https://www.amazon.se/dp/B07XHG472H" },
    ],
    review_searches: ["Run Chicken T50 recension", "Run Chicken T50 review"],
  },
  // FODERAUTOMATER
  {
    id: "kerbl-foder-galv-18",
    name: "Kerbl Foderautomat Galvaniserad 18kg",
    category: "foderautomater",
    stores: [
      { store: "Granngården", url: "https://www.granngarden.se/foderautomat-kerbl-hons-galvaniserad-18kg" },
    ],
    review_searches: [],
  },
  {
    id: "kerbl-foder-plast-8",
    name: "Kerbl Foderautomat Plast 8kg",
    category: "foderautomater",
    stores: [
      { store: "Granngården", url: "https://www.granngarden.se/foderautomat-kerbl-inkl-ben-hons-plast-gron-8kg" },
    ],
    review_searches: [],
  },
  // HÖNSHUS
  {
    id: "omlet-eglu-cube",
    name: "Omlet Eglu Cube",
    category: "honshus",
    stores: [
      { store: "Omlet.se", url: "https://www.omlet.se/" },
    ],
    review_searches: ["Omlet Eglu Cube recension", "Eglu Cube review Sverige"],
  },
  {
    id: "kerbl-eco-barney",
    name: "Kerbl Eco Barney",
    category: "honshus",
    stores: [
      { store: "Granngården", url: "https://www.granngarden.se/honshus-kerbl-eco-barney-gravit-137x73x83cm" },
    ],
    review_searches: [],
  },
  // VÄRMEPLATTOR
  {
    id: "brinsea-ecoglow-1200",
    name: "Brinsea EcoGlow Safety 1200",
    category: "varmeplattor",
    stores: [
      { store: "Arctic Hen", url: "https://www.arctichen.se/store/p/0/v%C3%A4rmetak-ecoglow-safety-1200-861820" },
    ],
    review_searches: ["Brinsea EcoGlow 1200 recension", "Brinsea EcoGlow review"],
  },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key !== env.ADMIN_KEY) {
      return json({ error: "Unauthorized" }, 401);
    }

    switch (url.pathname) {
      case "/admin/prices": return handlePrices(env);
      case "/admin/history": return handleHistory(env, url.searchParams.get("id"));
      case "/admin/reviews": return handleReviews(env);
      case "/admin/export": return handleExport(env);
      case "/admin/scrape":
        if (request.method === "POST") return json(await scrapeAllPrices(env));
        break;
      case "/admin/scrape-reviews":
        if (request.method === "POST") return json(await scrapeAllReviews(env));
        break;
    }

    return new Response("Hönsguiden Scraper v2\nEndpoints: /admin/prices, /admin/history?id=, /admin/reviews, /admin/export, POST /admin/scrape, POST /admin/scrape-reviews", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(scrapeAllPrices(env));
    // Reviews scrapes mindre ofta — bara om cron-expression matchar
    // (Vi kan trigga manuellt vid behov)
  },
};

// === PRIS-SCRAPING ===

async function scrapeAllPrices(env) {
  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const product of PRODUCTS) {
    for (const store of product.stores) {
      try {
        const price = await scrapePrice(store.url, store.store);
        if (price && price >= 50 && price <= 50000) {
          await env.PRICES.put(
            `price:${product.id}:${store.store}:${today}`,
            JSON.stringify({ price, url: store.url, scraped_at: new Date().toISOString() })
          );
          await env.PRICES.put(
            `latest:${product.id}:${store.store}`,
            JSON.stringify({
              price, url: store.url, date: today,
              name: product.name, category: product.category, store: store.store,
            })
          );
          results.push({ id: product.id, store: store.store, price, status: "ok" });
        } else {
          results.push({ id: product.id, store: store.store, price, status: "no_price" });
        }
      } catch (e) {
        results.push({ id: product.id, store: store.store, error: e.message, status: "error" });
      }
      await sleep(2500);
    }
  }

  await env.PRICES.put(`scrape-log:${today}`, JSON.stringify({ date: today, results }));
  return results;
}

async function scrapePrice(url, storeName) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HonsguidenBot/2.0; +https://honsguiden.se)",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "sv-SE,sv;q=0.9",
    },
    redirect: "follow",
  });
  if (!resp.ok) return null;
  const html = await resp.text();

  // Store-specifika strategier
  if (storeName === "Granngården") {
    // Granngården har ofta pris i og:product:price eller JSON-LD
    const ogMatch = html.match(/product:price:amount[^>]*content="([\d.,]+)"/i);
    if (ogMatch) {
      const p = parsePrice(ogMatch[1]);
      if (p >= 50 && p <= 50000) return p;
    }

    // Fallback: JSON-LD price
    const jsonLdMatch = html.match(/"price"\s*:\s*"?([\d.,]+)"?/i);
    if (jsonLdMatch) {
      const p = parsePrice(jsonLdMatch[1]);
      if (p >= 50 && p <= 50000) return p;
    }
  }

  // Generisk strategi — leta efter pris-mönster
  const patterns = [
    /itemprop="price"[^>]*content="([\d.,]+)"/gi,
    /"price"\s*:\s*"?([\d.,]+)"?/gi,
    /class="[^"]*price[^"]*"[^>]*>([\d\s.,]+)\s*(?:kr|SEK)/gi,
    /([\d\s]{3,8})\s*kr(?:\s|<|$)/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const price = parsePrice(match[1]);
      if (price >= 50 && price <= 50000) return price;
    }
  }

  return null;
}

function parsePrice(str) {
  return Math.round(parseFloat(str.replace(/\s/g, "").replace(",", ".")));
}

// === REVIEW-SCRAPING ===

async function scrapeAllReviews(env) {
  const results = [];

  for (const product of PRODUCTS) {
    if (!product.review_searches || product.review_searches.length === 0) continue;

    const reviews = [];

    // Scrapa Omlet-recensioner om det är Omlet-produkt
    if (product.id.startsWith("omlet")) {
      const omletReviews = await scrapeOmletReviews(product);
      reviews.push(...omletReviews);
    }

    // Scrapa djursajten.se om relevant
    if (product.category === "luckoppnare") {
      const djursajten = await scrapeDjursajten(product);
      if (djursajten) reviews.push(djursajten);
    }

    // Scrapa Amazon-recensioner (svårt men vi försöker med ratings)
    for (const store of product.stores) {
      if (store.url.includes("amazon.se")) {
        const amazonReview = await scrapeAmazonRating(store.url);
        if (amazonReview) reviews.push(amazonReview);
      }
    }

    if (reviews.length > 0) {
      await env.PRICES.put(
        `reviews:${product.id}`,
        JSON.stringify({
          product_id: product.id,
          name: product.name,
          reviews,
          updated: new Date().toISOString(),
        })
      );
    }

    results.push({ id: product.id, reviews_found: reviews.length });
    await sleep(3000);
  }

  return results;
}

async function scrapeDjursajten(product) {
  try {
    const resp = await fetch("https://djursajten.se/automatisk-honslucka/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HonsguidenBot/2.0)" },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Sök efter produktnamnet i texten
    const name = product.name.split(" ")[0]; // "ChickenGuard", "Kerbl", etc
    const idx = html.toLowerCase().indexOf(name.toLowerCase());
    if (idx === -1) return null;

    // Extrahera ett stycke runt omnämnandet
    const snippet = html.substring(Math.max(0, idx - 200), idx + 300)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 200);

    if (snippet.length < 30) return null;

    return {
      source: "Djursajten.se",
      source_url: "https://djursajten.se/automatisk-honslucka/",
      snippet: snippet + "…",
      type: "mention",
      scraped_at: new Date().toISOString(),
    };
  } catch (e) {
    return null;
  }
}

async function scrapeOmletReviews(product) {
  try {
    const resp = await fetch("https://www.omlet.se/reviews/eglu-cube-isolerat-h%C3%B6nshus-med-h%C3%B6nsg%C3%A5rd/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HonsguidenBot/2.0)" },
    });
    if (!resp.ok) return [];
    const html = await resp.text();

    // Extrahera review-snippets
    const reviews = [];
    const reviewMatches = html.matchAll(/<p[^>]*class="[^"]*review[^"]*"[^>]*>(.*?)<\/p>/gi);
    for (const match of reviewMatches) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text.length > 30 && text.length < 300) {
        reviews.push({
          source: "Omlet.se (kundrecension)",
          source_url: "https://www.omlet.se/reviews/eglu-cube-isolerat-h%C3%B6nshus-med-h%C3%B6nsg%C3%A5rd/",
          snippet: text.substring(0, 150) + (text.length > 150 ? "…" : ""),
          type: "customer_review",
          scraped_at: new Date().toISOString(),
        });
      }
      if (reviews.length >= 3) break;
    }
    return reviews;
  } catch (e) {
    return [];
  }
}

async function scrapeAmazonRating(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "sv-SE,sv;q=0.9",
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Extrahera betyg
    const ratingMatch = html.match(/(\d[.,]\d)\s*(?:av|of|out of)\s*5/i);
    const countMatch = html.match(/([\d,]+)\s*(?:betyg|ratings|recension)/i);

    if (ratingMatch) {
      const rating = ratingMatch[1].replace(",", ".");
      const count = countMatch ? countMatch[1].replace(/,/g, "") : "?";
      return {
        source: "Amazon.se",
        source_url: url,
        snippet: `${rating}/5 (${count} betyg på Amazon)`,
        type: "rating",
        scraped_at: new Date().toISOString(),
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// === DASHBOARD ===

async function handlePrices(env) {
  const list = await env.PRICES.list({ prefix: "latest:" });
  const prices = [];
  for (const key of list.keys) {
    prices.push(JSON.parse(await env.PRICES.get(key.name)));
  }
  prices.sort((a, b) => (a.category || "").localeCompare(b.category || "") || (a.name || "").localeCompare(b.name || ""));

  return new Response(renderPricesDashboard(prices, env.ADMIN_KEY), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handleHistory(env, productId) {
  if (!productId) return new Response("?id= required", { status: 400 });

  const list = await env.PRICES.list({ prefix: `price:${productId}:` });
  const history = [];
  for (const key of list.keys) {
    const data = JSON.parse(await env.PRICES.get(key.name));
    const parts = key.name.split(":");
    history.push({ date: parts[3], store: parts[2], price: data.price });
  }
  history.sort((a, b) => a.date.localeCompare(b.date));

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="robots" content="noindex">
<title>Prishistorik — ${esc(productId)}</title>
<style>body{font-family:system-ui;max-width:600px;margin:2rem auto;padding:0 1rem}table{width:100%;border-collapse:collapse}th,td{padding:0.4rem;border-bottom:1px solid #eee;text-align:left}th{color:#888;font-size:0.8rem}.up{color:#bc4749}.down{color:#2d6a4f}a{color:#b5482a}</style></head>
<body><a href="/admin/prices?key=${encodeURIComponent(env.ADMIN_KEY)}">&larr; Tillbaka</a>
<h1>${esc(productId)}</h1>
<table><thead><tr><th>Datum</th><th>Butik</th><th>Pris</th><th>Ändring</th></tr></thead><tbody>
${history.map((h, i) => {
  const prev = i > 0 ? history[i-1].price : null;
  const d = prev ? h.price - prev : 0;
  const cls = d > 0 ? "up" : d < 0 ? "down" : "";
  const ds = d !== 0 ? `<span class="${cls}">${d > 0 ? "+" : ""}${d} kr</span>` : "—";
  return `<tr><td>${h.date}</td><td>${esc(h.store)}</td><td><strong>${h.price} kr</strong></td><td>${ds}</td></tr>`;
}).join("")}
</tbody></table></body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handleReviews(env) {
  const list = await env.PRICES.list({ prefix: "reviews:" });
  const allReviews = [];
  for (const key of list.keys) {
    allReviews.push(JSON.parse(await env.PRICES.get(key.name)));
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="robots" content="noindex">
<title>Reviews — Hönsguiden</title>
<style>body{font-family:system-ui;max-width:700px;margin:2rem auto;padding:0 1rem}h2{margin-top:2rem;font-size:1.1rem}blockquote{border-left:2px solid #ddd;padding-left:1rem;margin:0.5rem 0;color:#555;font-style:italic}.source{font-size:0.8rem;color:#888}a{color:#b5482a}</style></head>
<body>
<a href="/admin/prices?key=${encodeURIComponent(env.ADMIN_KEY)}">&larr; Tillbaka</a>
<h1>Reviews & omnämnanden</h1>
<form method="POST" action="/admin/scrape-reviews?key=${encodeURIComponent(env.ADMIN_KEY)}"><button style="padding:0.5rem 1rem;background:#222;color:#fff;border:none;border-radius:4px;cursor:pointer">Scrapa reviews nu</button></form>
${allReviews.map(p => `
<h2>${esc(p.name)}</h2>
${p.reviews.map(r => `
<blockquote>${esc(r.snippet)}</blockquote>
<p class="source">— <a href="${esc(r.source_url)}" target="_blank">${esc(r.source)}</a> (${r.type})</p>
`).join("")}
`).join("")}
${allReviews.length === 0 ? "<p>Inga reviews ännu. Klicka knappen ovan.</p>" : ""}
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handleExport(env) {
  const data = { prices: {}, reviews: {}, scraped: new Date().toISOString() };

  const priceList = await env.PRICES.list({ prefix: "latest:" });
  for (const key of priceList.keys) {
    data.prices[key.name.replace("latest:", "")] = JSON.parse(await env.PRICES.get(key.name));
  }

  const reviewList = await env.PRICES.list({ prefix: "reviews:" });
  for (const key of reviewList.keys) {
    data.reviews[key.name.replace("reviews:", "")] = JSON.parse(await env.PRICES.get(key.name));
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=honsguiden-data.json",
    },
  });
}

function renderPricesDashboard(prices, adminKey) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="robots" content="noindex">
<title>Hönsguiden — Priser</title>
<style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem;color:#222}h1{font-size:1.5rem}table{width:100%;border-collapse:collapse;margin:1rem 0}th{text-align:left;padding:0.5rem;border-bottom:2px solid #ddd;font-size:0.8rem;color:#888}td{padding:0.5rem;border-bottom:1px solid #eee}a{color:#b5482a}.btn{display:inline-block;padding:0.5rem 1rem;background:#222;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.85rem;margin:0.25rem}.meta{color:#888;font-size:0.85rem}</style></head>
<body>
<h1>Hönsguiden — priser & reviews</h1>
<p class="meta">${prices.length} prispunkter.
<a href="/admin/reviews?key=${encodeURIComponent(adminKey)}">Se reviews</a> ·
<a href="/admin/export?key=${encodeURIComponent(adminKey)}">Exportera JSON</a></p>
<form method="POST" action="/admin/scrape?key=${encodeURIComponent(adminKey)}" style="display:inline"><button class="btn">Scrapa priser</button></form>
<form method="POST" action="/admin/scrape-reviews?key=${encodeURIComponent(adminKey)}" style="display:inline"><button class="btn">Scrapa reviews</button></form>
<table><thead><tr><th>Produkt</th><th>Butik</th><th>Pris</th><th>Datum</th><th>Historik</th></tr></thead>
<tbody>${prices.map(p => `<tr>
<td><a href="${esc(p.url)}" target="_blank">${esc(p.name)}</a></td>
<td>${esc(p.store)}</td>
<td><strong>${p.price ? p.price + " kr" : "—"}</strong></td>
<td>${p.date || "—"}</td>
<td><a href="/admin/history?key=${encodeURIComponent(adminKey)}&id=${encodeURIComponent(p.name?.replace(/\s/g,"-").toLowerCase().slice(0,40) || "")}">📈</a></td>
</tr>`).join("")}</tbody></table>
</body></html>`;
}

// === HELPERS ===
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
