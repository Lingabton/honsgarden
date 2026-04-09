# HÖNSGÅRDEN — Claude Code Implementation Brief

## CONTEXT FOR CLAUDE CODE

Du bygger en svensk content-first jämförelsesajt för hönsutrustning — tänk Wirecutter/The Strategist fast för svenska hönsägare. Sajten ska kännas som att en skandinavisk designbyrå med editorial-erfarenhet byggde den. INTE som en tech-startup, INTE som en generisk Tailwind-template, INTE som AI-generated slop.

Sajten ska göra EN sak exceptionellt bra: hjälpa svenska hönsägare att hitta rätt utrustning genom kurerade, rankade jämförelser med tydlig pris/prestanda-logik.

---

## ART DIRECTION & MOODBOARD

### Tonen: "Scandinavian Homestead Editorial"
Tänk korsningen mellan:
- **Kinfolk Magazine** — editorial layout, luft, typografi-driven
- **Wirecutter** — funktionell, trovärdig, data-driven jämförelser
- **Granit (butiken)** — varm skandinavisk minimalism, naturliga material-känsla
- **Patagonia** — outdoor-autenticitet, inga stockfoton, ärlig ton

### Vad det INTE ska vara:
- Inte "tech startup" (inga gradient-CTAs, inga "Get Started Free"-knappar)
- Inte generisk e-handel (inga product grids med add-to-cart överallt)
- Inte lanthandel-retro (inga höns-clipart, inga Comic Sans-vibbar)
- Inte mörkt tema (målgruppen är 35-60-åriga trädgårdsmänniskor, inte gamers)

### Differentiator
Det ska kännas som att öppna ett väldesignat livsstilsmagasin som *råkar* ha den bästa produktjämförelsen. Content-first, inte commerce-first.

---

## DESIGN TOKENS

### Typografi
- **Display/Rubriker:** Fraunces (Google Fonts) — serif med optisk storlek, mjukt, organiskt, lite "wonky" karaktär. Perfekt för editorial höns-content. Använd `font-variation-settings` för soft-axis.
- **Brödtext/UI:** Instrument Sans (Google Fonts) — ren, modern sans-serif, god läsbarhet, skandinavisk känsla.
- **Accenter/Labels:** Instrument Sans i versaler med generös letter-spacing för badges och kategorier.

### Färgpalett
```css
:root {
  /* Bas */
  --bg-primary: #FDFBF7;          /* Varm off-white, som äggskalet */
  --bg-secondary: #F5F0E8;         /* Varm sand */
  --bg-card: #FFFFFF;
  
  /* Text */
  --text-primary: #2C2416;         /* Mörk varm brun, inte svart */
  --text-secondary: #6B5D4F;       /* Mellanbrun */
  --text-tertiary: #9C8E7E;        /* Ljus brun */
  
  /* Accent */
  --accent-primary: #C4653A;       /* Terracotta/rostig orange — hönshus-färg */
  --accent-secondary: #4A6741;     /* Mossgrön — trädgård */
  --accent-highlight: #D4A84B;     /* Varm guld — äggula, premium-badge */
  
  /* Functional */
  --border: #E8E0D4;
  --border-strong: #D4C8B8;
  --shadow-soft: 0 2px 8px rgba(44, 36, 22, 0.06);
  --shadow-card: 0 4px 20px rgba(44, 36, 22, 0.08);
  --shadow-hover: 0 8px 30px rgba(44, 36, 22, 0.12);
  
  /* Rating */
  --score-excellent: #4A6741;
  --score-good: #7A8F3A;
  --score-ok: #D4A84B;
  --score-poor: #C4653A;
}
```

### Inga stockfoton
Använd istället:
- Solid färgblock med typografi som hero-element
- Enkla, handritade SVG-illustrationer av höns/hönshus (line drawings, 1-2px stroke, --text-tertiary färg)
- Geometriska former som dekorativa element
- Om bilder behövs: använd CSS-shapes eller placeholders med text "Bild från test" — vi lägger in egna foton senare

---

## SAJT-STRUKTUR

### Sida 1: Startsida (/)
**Layout: Editorial magazine cover**

```
┌─────────────────────────────────────┐
│ [Logo]              [Meny: enkel]   │
├─────────────────────────────────────┤
│                                     │
│  HÖNSGÅRDEN                         │
│  Sveriges smartaste guide till      │
│  hönsutrustning                     │
│                                     │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ BÄSTA       │  │ NYBÖRJAR-    │  │
│  │ LUCKÖPPNARE │  │ GUIDEN       │  │
│  │ 2026        │  │              │  │
│  │ [terracotta │  │ [grön        │  │
│  │  block]     │  │  block]      │  │
│  └─────────────┘  └──────────────┘  │
│                                     │
│  ── POPULÄRA JÄMFÖRELSER ────────── │
│                                     │
│  ChickenGuard vs Kerbl vs Omlet     │
│  → compact card, editorial style    │
│                                     │
│  ── SENASTE ─────────────────────── │
│  [article cards, 3-column grid]     │
│                                     │
│  ── NYHETSBREV ──────────────────── │
│  "Få veckans bästa tips"            │
│  [email input + knapp]              │
│                                     │
└─────────────────────────────────────┘
```

- Hero: INTE en stor bild. Typografi-driven. Fraunces i stort med en subtil bakgrundsform.
- Inga karuseller. Editorial grid med 2-3 "cover stories".
- Animate-in on scroll — stagger med 100ms delay per element, translateY(20px) → 0, opacity. Subtilt.

### Sida 2: Produktjämförelse (/luckoppnare)
**Layout: Data-editorial hybrid**

```
┌─────────────────────────────────────┐
│                                     │
│  Bästa automatiska lucköppnare      │
│  för höns 2026                      │
│                                     │
│  Uppdaterad april 2026 · 8 modeller │
│  jämförda                           │
│                                     │
│  ── REDAKTIONENS VAL ────────────── │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  🏆 BÄST TOTALT                ││
│  │  [Produktnamn]                  ││
│  │  ★★★★★ 9.2/10                 ││
│  │  Solar · WiFi · Anti-pinch     ││
│  │  1 699 kr                      ││
│  │  → Läs mer / Köp              ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌───────────────┐ ┌──────────────┐ │
│  │ 💰 BÄST PRIS │ │ 🌡️ BÄST     │ │
│  │ [Produkt]     │ │ VINTER      │ │
│  │ 899 kr        │ │ -30°C       │ │
│  └───────────────┘ └──────────────┘ │
│                                     │
│  ── ALLA MODELLER ───────────────── │
│                                     │
│  [Jämförelsetabell — se spec]       │
│                                     │
│  ── SÅ TESTADE VI ──────────────── │
│  [Editorial sektion om metodik]     │
│                                     │
└─────────────────────────────────────┘
```

**Jämförelsetabellen** — detta är kärnan. Den ska vara:
- Horisontellt scrollbar på mobil (sticky första kolumnen med produktnamn)
- Specs: Strömkälla, WiFi, Anti-pinch, Min-temp, Batteri mAh, Pris, Betyg
- Celler med visuella indikatorer (check/kryss-ikoner, färgkodade badges)
- "Bäst i kategori" highlighted per rad
- Sticky header vid scroll
- Smooth hover-effekt på rader

### Sida 3: Guide-artikel (/guide/skaffa-hons)
**Layout: Long-form editorial**

- Ren läsupplevelse. Max 680px content-bredd.
- Pull quotes i accent-färg
- Inline-rekommendationer med produktkort
- Table of contents (sticky sidebar på desktop, collapsed på mobil)
- Estimated reading time
- Uppdateringsdatum tydligt

### Sida 4: Enskild produkt (/produkt/chickenguard-aio-solar)
- Specs-tabell
- Pris-historik (om tillgängligt)
- Pros/cons-lista
- Score-breakdown (radar chart eller horisontella bars)
- "Var kan du köpa?" med affiliatelänkar
- "Jämför med..." sektion

---

## KOMPONENTER ATT BYGGA

### 1. Poängsystem-badge (ScoreBadge)
Cirkel med poäng 1-10, färgkodad:
- 8.5-10: --score-excellent (mossgrön)
- 7-8.4: --score-good (olivgrön)
- 5-6.9: --score-ok (guld)
- Under 5: --score-poor (terracotta)
Fraunces siffror, bold. Subtil ring runt.

### 2. Produktkort (ProductCard)
Två varianter:
- **Compact:** Horisontell, för listor. Namn + score + pris + 3 key specs som tags + CTA
- **Featured:** Vertikal, större, för "redaktionens val". Med badge ("Bäst totalt", "Bäst pris" etc)

### 3. Jämförelsetabell (ComparisonTable)
- Data-driven från JSON
- Responsive: tabell på desktop, stacked cards på mobil
- Sortbar per kolumn
- Filter: prisintervall, strömkälla, WiFi ja/nej
- Highlight bäst-i-kolumn automatiskt

### 4. Navigation
- Enkel, varm. Logo vänster, 3-4 liens höger.
- Mobile: hamburger med fullscreen overlay, mjuk slide-in
- Aktiv sida markerad med terracotta underline (2px, slightly offset)

### 5. Nyhetsbrev-signup
- Enkel: en rad med email-input + knapp
- Knappen i --accent-primary (terracotta)
- Microcopy: "Inga spam. Bara höns-tips en gång i veckan."
- Connects to (placeholder) — vi kopplar Substack/Mailchimp senare

### 6. Footer
- Minimal. "Hönsgården drivs av Olav Innovation AB"
- Kolumner: Jämförelser, Guider, Om oss
- Disclaimer: "Vi kan få provision via länkar på denna sida"

---

## TEKNISK IMPLEMENTATION

### Stack
- **Statisk HTML/CSS/JS** — ingen React, ingen build-step (samma som Smakfynd)
- **Vanilla JS** för interaktivitet (tabell-sortering, filter, scroll-animationer)
- **CSS Custom Properties** för tema
- **Google Fonts** via `<link>` (Fraunces + Instrument Sans)
- **GitHub Pages** deployment

### Filstruktur
```
honsgarden/
├── docs/                    # GitHub Pages serves from here
│   ├── index.html           # Startsida
│   ├── luckoppnare.html     # Jämförelsesida
│   ├── guide/
│   │   └── skaffa-hons.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   ├── data/
│   │   └── products.json    # Produktdata
│   └── img/
│       └── icons/           # SVG-ikoner
├── build/
│   └── build_site.py        # Genererar HTML från JSON+templates
├── data/
│   └── products_raw.json    # Source data
└── CLAUDE.md
```

### Produktdata (products.json)
```json
[
  {
    "id": "chickenguard-aio-solar",
    "name": "ChickenGuard All-in-One Solar",
    "brand": "ChickenGuard",
    "score": 8.5,
    "price_sek": 2080,
    "power": "solar",
    "wifi": false,
    "app_control": false,
    "anti_pinch": true,
    "min_temp_c": -20,
    "battery_mah": null,
    "material": "Återvunnen plast",
    "door_included": false,
    "door_type": "vertikal",
    "weight_g": 800,
    "warranty_years": 3,
    "buy_urls": [
      {"store": "Djursajten", "url": "...", "affiliate": true}
    ],
    "pros": ["Hållbart material", "Solcell", "3 års garanti"],
    "cons": ["Lucka säljs separat", "Ingen WiFi"],
    "badge": null,
    "review_urls": ["url1", "url2"]
  }
]
```

---

## ANIMATION & MICRO-INTERACTIONS

### Page load
- Staggered fade-in: header → hero text → hero cards (100ms delay each)
- `transform: translateY(16px)` → `translateY(0)`, `opacity: 0 → 1`
- `transition: 0.5s cubic-bezier(0.22, 1, 0.36, 1)`

### Scroll
- Intersection Observer: fade-in sections as they enter viewport
- Jämförelsetabell: subtle row highlight on scroll-into-view

### Hover
- Produktkort: `box-shadow` transition + subtle `translateY(-2px)`
- Knappar: bakgrundsfärg darkens 10%, 200ms ease
- Tabellrader: bakgrund → --bg-secondary, smooth

### INGA:
- Parallax (känns 2019)
- Particle effects
- Loading spinners (statisk sajt, inget laddar)
- Cursor-followers
- Scroll-jacking

---

## SEO & CONTENT

### Meta för startsidan
```html
<title>Hönsgården — Sveriges smartaste guide till hönsutrustning</title>
<meta name="description" content="Oberoende jämförelser och guider för höns i trädgården. Automatiska lucköppnare, hönshus och tillbehör — rankade och testade.">
```

### Meta för jämförelsesidan
```html
<title>Bästa automatiska lucköppnare för höns 2026 — Hönsgården</title>
<meta name="description" content="Vi jämför 8 automatiska lucköppnare för hönshus. ChickenGuard, Kerbl, Omlet och fler — rankade på pris, prestanda och säkerhet.">
```

### Structured data
- Product schema på produktsidor
- Article schema på guider
- BreadcrumbList på alla sidor
- FAQ schema där relevant

---

## COPY & TON

### Röst: Kunnig granne, inte expert-auktoritet
- Skriv som en vän som har haft höns i 5 år och gärna delar med sig
- Undvik: "vi på Hönsgården anser..." — skriv istället "den här lucköppnaren klarar svenska vintrar bättre än..."
- Tillåtet att vara lite personlig: "Vi har testat den i -15° i Örebro och den funkar felfritt"
- Aldrig: marknadsförings-jargong, "revolutionerande", "game-changer"

### Exempel på ton i headings:
- ✅ "Bästa lucköppnaren om du inte vill frysa ihjäl klockan 6 på morgonen"
- ✅ "Kerbl vs ChickenGuard — vilken är värd pengarna?"
- ❌ "Upptäck den ultimata lösningen för ditt hönshus!"
- ❌ "Top 10 Amazing Chicken Door Openers"

---

## MOBILE-FIRST KRAV

70%+ av trafiken kommer vara mobil (folk googlar i butiken eller i trädgården).

- Touch targets minst 44px
- Jämförelsetabellen: horisontell scroll med sticky första kolumn, INTE stacked cards (folk vill jämföra sida vid sida)
- Snabb — inga stora bilder, inga externa scripts förutom Google Fonts
- Font-display: swap på alla fonts
- Inga modals/popups
- CTA-knappar: full bredd på mobil

---

## CHECKLISTA INNAN LEVERANS

- [ ] Lighthouse score > 95 på Performance, Accessibility, SEO
- [ ] Fungerar utan JavaScript (progressiv förbättring)
- [ ] Alla färger möter WCAG AA kontrast
- [ ] Jämförelsetabell scrollar smooth på iPhone Safari
- [ ] Samtliga sidor validerar i W3C validator
- [ ] Alla links har descriptive text (inte "klicka här")
- [ ] Open Graph-taggar på alla sidor
- [ ] Favicon (använd 🐔 som emoji-favicon ELLER skapa enkel SVG)
- [ ] 404-sida med charm

---

## PRIORITERING

Bygg i denna ordning:
1. CSS-grund (tokens, typografi, layout-system)
2. Startsida med placeholder-content
3. Jämförelsesida med produktdata från JSON
4. En guide-artikel
5. Animationer och micro-interactions
6. SEO och structured data

Starta med `index.html` och `style.css`. Bygg komponenterna inline först, refaktorera till build-pipeline senare.
