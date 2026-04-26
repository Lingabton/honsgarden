# HÖNSGUIDEN — Claude Code Brief

## KONTEXT

Hönsguiden (honsguiden.se) är en svensk jämförelse- och guidesajt för hönsutrustning. Tänk Wirecutter fast för svenska hönsägare. Sajten drivs av en person som faktiskt har höns.

**Stack:** Statisk HTML/CSS/JS → GitHub Pages → Cloudflare DNS
**Analytics:** Cloudflare Worker (honsguiden-analytics.smakfynd.workers.dev) med KV
**Affiliate:** Amazon.se (tag=honsguiden-21) + svenska butiker (Granngården, Bole, Bonden, Lantkompaniet etc.)

---

## SAJT-STRUKTUR (17 sidor)

```
docs/
├── index.html              # Startsida med hero, cover cards, produktkort, FAQ
├── luckoppnare.html        # 8 lucköppnare jämförda (filter, sortering)
├── honshus.html            # 7 hönshus jämförda
├── foderautomater.html     # 8 foderautomater
├── vattenautomater.html    # 7 vattenautomater
├── varmeplattor.html       # 5 värmeplattor
├── guider.html             # Hub-sida för alla guider
├── om.html                 # Om sidan, metodik, affiliate-policy
├── 404.html                # Anpassad 404 med hönsanimation
├── guide/
│   ├── skaffa-hons.html    # Nybörjarguide
│   ├── bygga-honshus.html  # DIY-guide
│   ├── hons-pa-vintern.html
│   ├── skydda-hons-mot-rav.html
│   ├── vad-kostar-hons.html
│   ├── honsraser.html
│   ├── chickenguard-vs-kerbl.html
│   └── run-chicken-t50.html
├── css/
│   ├── style.css           # Minifierad (production)
│   └── style.src.css       # Källa (editera denna, minifiera sedan)
├── js/
│   ├── main.js             # Minifierad (production)
│   ├── main.src.js         # Källa (editera denna)
│   └── comparison.js       # Tabell-fallback för lucköppnare
├── img/photos/             # Egna bilder i WebP
├── sitemap.xml
└── robots.txt
```

### Minifiering
Editera ALLTID `.src.`-filerna, sedan minifiera:
```bash
cd docs
npx clean-css-cli css/style.src.css -o css/style.css
npx terser js/main.src.js -o js/main.js --compress --mangle
```

---

## DESIGN

### Tonen: "Scandinavisk Homestead Editorial"
Kinfolk × Wirecutter × Granit. Varmt, personligt, datadrivet. INTE tech-startup, INTE generisk Tailwind, INTE AI-slop.

### Typografi — extremer
- **Display:** Fraunces 900, clamp(2.4rem→3.8rem), letter-spacing -0.03em
- **Rubriker:** h2 vid 800, h3/h4 vid 700
- **Labels:** Instrument Sans 200, uppercase, 0.14em spacing
- **Brödtext:** Instrument Sans 400, 17px, 1.65 line-height
- **Pull quotes:** Fraunces 300 italic med terracotta border-left
- **Score badges:** Fraunces 900

Kontrasten mellan 200-labels och 900-rubriker är medveten. Inga mellanvikter (500-600) — hoppa mellan tunna och tunga.

### Färg — dominant + skarp
```css
--bg-primary: #FDFBF7;        /* Varm äggskals-vit */
--bg-secondary: #F0EBE3;       /* Sand */
--text-primary: #2C2416;       /* Varm brun, inte svart */
--text-secondary: #5C4F3D;
--text-tertiary: #9C8E7E;
--accent-primary: #C4653A;     /* TERRACOTTA — dominant accent */
--accent-secondary: #2D5A3F;   /* Djup mossgrön */
--accent-highlight: #D4A84B;   /* Guld */
```

INGEN generisk #222/#555. Ingen Inter/Roboto/systemfonter.

### Bakgrunder — gradienter, inte platt
- Hero: `linear-gradient(180deg, --bg-secondary → --bg-primary)`
- Page headers: samma gradient
- Cover cards: fyllda gradienter (terracotta/mossgrön) med vit text
- Newsletter: gradient-block med rundade hörn
- Footer: solid --bg-secondary

### Animation
- Staggered fade-in vid sidladdning (100ms delay, translateY 16px)
- Intersection Observer för scroll-reveal
- Back-to-top-knapp efter 500px scroll
- INGA: parallax, particles, cursor-followers, scroll-jacking

---

## RÖST & TON

### Jag, inte vi
Sajten skrivs i första person singularis. "Jag har testat", "Jag jämför", "Det här hade jag velat veta". ALDRIG "vi på Hönsguiden anser" eller "Hönsguiden-redaktionen rekommenderar".

### Undvik AI-språk
- ❌ "Komplett guide", "Allt du behöver veta", "Upptäck"
- ❌ "Oberoende, datadrivna jämförelser"
- ❌ "Beprövade metoder rangordnade efter effektivitet"
- ❌ "Direkt i inkorgen"
- ✅ "Det här hade jag velat veta"
- ✅ "Vad som faktiskt funkar"
- ✅ "Vad jag faktiskt lade ut"

### Affiliate-disclaimer
Kort och ärlig: "Vissa länkar ger mig provision. Det ändrar inte vilken produkt som hamnar högst."

---

## JÄMFÖRELSESIDOR — MÖNSTER

Varje jämförelsesida har denna struktur (uppifrån och ner):
1. **Breadcrumb** + h1 + datum + affiliate-disclaimer
2. **"Har du bråttom?"** — snabbval med 2 rekommendationer
3. **Jämförelsetabell** — sortbar, filtrerbar (lucköppnare), med "Se pris →"-knappar i sista kolumnen
4. **Produktkort** (product-detail-grid) — bild/SVG, score, specs, reviews, review-links, köpknappar
5. **"Så har jag jämfört"** — metodik
6. **FAQ** — details/summary-element med FAQPage schema
7. **"Läs mer"** — relaterade guider/jämförelser

### Köplänkar
- Amazon.se med `tag=honsguiden-21` där tillgängligt
- Svenska butiker (Granngården, Bole, Bonden, Lantkompaniet, Lantbutiken)
- `rel="sponsored nofollow noopener noreferrer" target="_blank"` på alla affiliate-länkar
- ALDRIG länka till kategorisidor — alltid specifika produktsidor
- Om produkt ej tillgänglig: `<span class="btn btn-secondary" style="opacity:0.5;cursor:default">Ej tillgänglig online</span>`

### Review-links
Varje produkt ska ha en `<div class="review-links">` med externa hands-on-recensioner (expert, blogg, video, forum). Prioritera:
1. Svenska recensioner
2. Dedicerade single-product reviews (Chicken Fans, Poultry Keeper)
3. YouTube-tester
4. Forum (BackYard Chickens, Bukefalos)

---

## SEO

### Titlar
Max 60 tecken. Inkludera år (2026). Unika per sida.

### Structured data (JSON-LD)
- **Alla sidor:** BreadcrumbList
- **Jämförelsesidor:** Article + ItemList (produkter) + FAQPage
- **Guider:** Article + FAQPage
- **Startsida:** WebSite + Organization + FAQPage
- **Om:** AboutPage

### dateModified
Uppdatera `article:modified_time` OG-tag OCH JSON-LD `dateModified` när en sida ändras.

### Breadcrumbs
Guide-sidor: Hönsguiden → Guider → [Guidnamn]
"Guider" pekar på `/guider.html` (INTE `/guide/` som inte finns).

---

## ANALYTICS

### Worker: honsguiden-analytics.smakfynd.workers.dev
- `POST /api/hit` — sidvisning (page, referrer, land, enhet)
- `POST /api/event` — klick (produkt+butik), scroll-djup, tid på sida, FAQ-öppningar
- `GET /stats?pw=...` — live dashboard
- `GET /report?pw=...` — veckorapport
- Cron: måndag 07:00 UTC → veckorapport via email till gabriel.linton@gmail.com

### Frontend-spårning (main.js)
- Sidvisning vid load
- Köpknapp-klick med produkt + butik
- Scroll-djup (25/50/75/100%)
- Tid på sida (sendBeacon vid unload)
- FAQ-öppningar

---

## ACCESSIBILITY

- Skip-link på alla sidor
- `aria-label` på score badges ("Betyg: 8.5 av 10") och check/cross-celler ("Ja"/"Nej")
- Alla bilder har alt-text
- `prefers-reduced-motion` respekteras
- Focus-visible på alla interaktiva element
- Emoji-favicon (🐔) — apple-touch-icon på alla sidor

---

## STRATEGI

Se `STRATEGY.md` för komplett färdplan (Fas 1-3), monetarisering och nyckeltal.
