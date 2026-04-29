/**
 * Hönsguiden Product Monitor
 *
 * Daglig check av alla köplänkar och produktsidor.
 * Cron: varje dag kl 06:00 UTC
 * Skickar email om något är trasigt.
 */

const PRODUCTS = [
  // LUCKÖPPNARE
  { name: "Omlet Smart Door", page: "luckoppnare", url: "https://www.omlet.se/smart-automatisk-d%C3%B6rr%C3%B6ppnare-h%C3%B6nshus/", type: "buy" },
  { name: "ChickenGuard Solar (Amazon)", page: "luckoppnare", url: "https://www.amazon.se/dp/B0C5N925YT", type: "buy" },
  { name: "ChickenGuard EU", page: "luckoppnare", url: "https://chickenguard.eu/product/all-in-one-solar/", type: "buy" },
  { name: "ChickenGuard Premium (Amazon)", page: "luckoppnare", url: "https://www.amazon.se/dp/B0C5N8CP21", type: "buy" },
  { name: "Okköbi Solar (Amazon)", page: "luckoppnare", url: "https://www.amazon.se/dp/B0DRFVYSG4", type: "buy" },
  { name: "Kerbl Lucköppnare (Granngården)", page: "luckoppnare", url: "https://www.granngarden.se/honslucka-kerbl-med-automatisk-luckoppnare-430x400mm", type: "buy" },
  { name: "Kerbl Lucköppnare (Bonden)", page: "luckoppnare", url: "https://www.bonden.se/luckoppnare/72195-honslucka-automatisk-komplett-till-honshus-7389512094121.html", type: "buy" },
  { name: "Brinsea ChickSafe (Hönshuset)", page: "luckoppnare", url: "https://www.honshuset.se/produkt/brinsea-chicksafe-advance-automatisk-luckoppnare/", type: "buy" },

  // HÖNSHUS
  { name: "Omlet Eglu Cube", page: "honshus", url: "https://www.omlet.se/shop/att_ha_hons/eglu-cube-isolerat-honshus/", type: "buy" },
  { name: "Omlet Eglu Go", page: "honshus", url: "https://www.omlet.se/shop/att_ha_hons/eglu_go/", type: "buy" },
  { name: "Bonden Isolerat", page: "honshus", url: "https://www.bonden.se/honshus/72168-honshus-isolerat-med-varme-och-rede-kerbl-7389512063127.html", type: "buy" },
  { name: "Kerbl Eco Barney (Granngården)", page: "honshus", url: "https://www.granngarden.se/honshus-kerbl-eco-barney-gravit-137x73x83cm", type: "buy" },
  { name: "Kerbl Eco Barney (Bole)", page: "honshus", url: "https://www.bole.se/honshus-kerbl-barney", type: "buy" },
  { name: "Kerbl Hobby (Granngården)", page: "honshus", url: "https://www.granngarden.se/honshuskaninhus-kerbl-hobby-tra-105x100x108cm", type: "buy" },
  { name: "Hornbach Vivid", page: "honshus", url: "https://www.hornbach.se/p/honshus-146x74x85cm/10469138/", type: "buy" },

  // FODERAUTOMATER
  { name: "Grandpa's Feeder (Amazon)", page: "foderautomater", url: "https://www.amazon.se/dp/B00TXW0UQK", type: "buy" },
  { name: "Kerbl Galv 18kg (Granngården)", page: "foderautomater", url: "https://www.granngarden.se/foderautomat-kerbl-hons-galvaniserad-18kg", type: "buy" },
  { name: "Kerbl Plast 8kg (Granngården)", page: "foderautomater", url: "https://www.granngarden.se/foderautomat-kerbl-inkl-ben-hons-plast-gron-8kg", type: "buy" },
  { name: "Kerbl Plast 15L (Granngården)", page: "foderautomater", url: "https://www.granngarden.se/foderautomat-kerbl-hons-plast-rodsvart-15l", type: "buy" },

  // VATTENAUTOMATER
  { name: "NoFrost (Lantkompaniet)", page: "vattenautomater", url: "https://www.lantkompaniet.se/eluppvaermd-vattenautomat-nofrost-frostfri-vattenautomat-foer-kanin-kyckling-fagel-330-ml.html", type: "buy" },
  { name: "Niplat (Lantkompaniet)", page: "vattenautomater", url: "https://www.lantkompaniet.se/vattenautomat-hink-med-nippel-12-liter.html", type: "buy" },
  { name: "VOSS Värmeplatta (Lantkompaniet)", page: "vattenautomater", url: "https://www.lantkompaniet.se/vaermeplatta-till-vattenautomat-vh20-o-20-cm-22-watt-voss-farming.html", type: "buy" },
  { name: "Kerbl 5L (Granngården)", page: "vattenautomater", url: "https://www.granngarden.se/vattenautomat-kerbl-inkl-ben-hons-plast-gron-5l", type: "buy" },
  { name: "Gaun 10L (Bole)", page: "vattenautomater", url: "https://www.bole.se/vattenautomat-gaun-10-l", type: "buy" },

  // VÄRMEPLATTOR
  { name: "CosyHeat (Lantbutiken)", page: "varmeplattor", url: "https://www.lantbutiken.se/hons-fjaderfa/varmekallor/varmetak/varmeplatta-till-kycklingar-cosyheat", type: "buy" },

  // SAJTEN SJÄLV
  { name: "Startsida", page: "sajt", url: "https://honsguiden.se/", type: "page" },
  { name: "Lucköppnare", page: "sajt", url: "https://honsguiden.se/luckoppnare.html", type: "page" },
  { name: "Om", page: "sajt", url: "https://honsguiden.se/om.html", type: "page" },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      return handleStatus(env);
    }

    if (url.pathname === "/run" && url.searchParams.get("pw") === env.PASSWORD) {
      const result = await runChecks(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Hönsguiden Product Monitor. /status för senaste resultat.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },
};

async function runChecks(env) {
  const results = [];
  const broken = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const product of PRODUCTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(product.url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HonsgudenMonitor/1.0)",
        },
      });

      clearTimeout(timeout);

      const status = res.status;
      const ok = status >= 200 && status < 400;

      const entry = {
        name: product.name,
        page: product.page,
        status,
        ok,
        url: product.url,
      };

      results.push(entry);

      if (!ok) {
        broken.push(entry);
      }
    } catch (e) {
      const entry = {
        name: product.name,
        page: product.page,
        status: 0,
        ok: false,
        error: e.message || "timeout/fetch error",
        url: product.url,
      };
      results.push(entry);
      broken.push(entry);
    }
  }

  // Spara resultat i KV
  await env.MONITOR.put("last-run", today);
  await env.MONITOR.put("last-results", JSON.stringify(results));
  await env.MONITOR.put(`run:${today}`, JSON.stringify(results));

  // Skicka email om något är trasigt
  if (broken.length > 0) {
    await sendAlert(env, broken, results.length, today);
  }

  return { date: today, total: results.length, broken: broken.length, results };
}

async function sendAlert(env, broken, total, date) {
  const rows = broken
    .map((b) => `<tr><td>${esc(b.name)}</td><td>${b.status || "ERROR"}</td><td>${esc(b.page)}</td><td style="font-size:0.8em">${esc(b.url)}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 20px auto; color: #222; }
h1 { font-size: 1.2rem; color: #C4653A; }
table { width: 100%; border-collapse: collapse; }
td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
td:first-child { font-weight: 600; }
.ok { color: #2d6a4f; } .bad { color: #bc4749; }
</style></head>
<body>
<h1>⚠️ Hönsguiden: ${broken.length} trasiga länkar</h1>
<p>${date}. ${total} länkar kontrollerade, <span class="bad">${broken.length} problem</span>.</p>
<table>
<tr><th>Produkt</th><th>Status</th><th>Sida</th><th>URL</th></tr>
${rows}
</table>
<p style="color:#888;font-size:0.8rem;margin-top:2rem">Automatisk kontroll från Hönsguiden Product Monitor</p>
</body></html>`;

  try {
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: env.REPORT_EMAIL }] }],
        from: { email: "monitor@honsguiden.se", name: "Hönsguiden Monitor" },
        subject: `⚠️ ${broken.length} trasiga länkar på honsguiden.se`,
        content: [{ type: "text/html", value: html }],
      }),
    });
  } catch (e) {
    // Email failed silently
  }
}

async function handleStatus(env) {
  const lastRun = await env.MONITOR.get("last-run");
  const results = JSON.parse((await env.MONITOR.get("last-results")) || "[]");

  const ok = results.filter((r) => r.ok);
  const broken = results.filter((r) => !r.ok);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hönsguiden Monitor</title>
<style>
body { font-family: -apple-system, sans-serif; max-width: 700px; margin: 2rem auto; padding: 0 1rem; color: #222; }
h1 { font-size: 1.3rem; }
.cards { display: flex; gap: 1rem; margin: 1rem 0; }
.card { flex: 1; background: #f5f5f5; border-radius: 8px; padding: 1rem; text-align: center; }
.card-big { font-size: 2rem; font-weight: 700; }
.ok { color: #2d6a4f; } .bad { color: #bc4749; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
td, th { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 0.85rem; text-align: left; }
th { font-size: 0.75rem; color: #888; text-transform: uppercase; }
.status-ok { color: #2d6a4f; font-weight: 600; }
.status-bad { color: #bc4749; font-weight: 600; }
.muted { color: #888; font-size: 0.8rem; }
</style></head>
<body>
<h1>🐔 Hönsguiden Product Monitor</h1>
<p class="muted">Senast körd: ${lastRun || "aldrig"}</p>
<div class="cards">
  <div class="card"><div class="card-big ok">${ok.length}</div><div class="muted">OK</div></div>
  <div class="card"><div class="card-big bad">${broken.length}</div><div class="muted">Problem</div></div>
  <div class="card"><div class="card-big">${results.length}</div><div class="muted">Totalt</div></div>
</div>
${broken.length > 0 ? `<h2 style="color:#bc4749">Problem</h2><table><tr><th>Produkt</th><th>Status</th><th>Sida</th></tr>${broken.map((b) => `<tr><td>${esc(b.name)}</td><td class="status-bad">${b.status || b.error || "ERROR"}</td><td>${esc(b.page)}</td></tr>`).join("")}</table>` : ""}
<h2>Alla länkar</h2>
<table>
<tr><th>Produkt</th><th>Status</th><th>Sida</th></tr>
${results.map((r) => `<tr><td>${esc(r.name)}</td><td class="${r.ok ? "status-ok" : "status-bad"}">${r.ok ? "✓ " + r.status : "✗ " + (r.status || r.error)}</td><td>${esc(r.page)}</td></tr>`).join("")}
</table>
<p class="muted">Körs automatiskt varje morgon kl 06:00. Email skickas vid problem.</p>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
