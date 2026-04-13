# Hönsguiden — Affiliate-strategi

Privat dokument. Ligger i repo-roten men publiceras inte på sajten.

---

## TL;DR — De tre du ska börja med

1. **Adtraction** (svenskt nätverk) — Granngården, VetZoo, Hornbach, Plantagen
2. **Awin** — Omlet, Zooplus
3. **Amazon Associates Sweden** (amazon.se) — ChickenGuard, Run Chicken T50, ChickCozy, VEVOR

Dessa tre täcker ~90% av produkterna du jämför.

---

## 1. Adtraction (primärt nätverk för Sverige)

**Sajt:** https://adtraction.com/se
**Grundat:** 2007, Stockholm
**Typ:** Nordens största affiliate-nätverk

### Relevanta annonsörer för Hönsguiden
| Merchant | Kategori | Sannolikt intressant för |
|----------|----------|--------------------------|
| **Granngården** | Lantbruk/djur | ChickenGuard, hönshus, foder, allt |
| **VetZoo** | Djur online | Tillbehör, foder, strö |
| **Hornbach** | Bygg | DIY hönshus, trä, nät |
| **Plantagen** | Trädgård | Trädgårdsrelaterat, växter |
| **Bonden.se** | Lantbruk | Kerbl-produkter |
| **Bygghemma** | Bygg/hem | Hönshus-kit |

### Så funkar det tekniskt
- **Tracking:** 1st-party cookies via Adtraction-domän + JS-pixel fallback
- **Länkformat:** `https://track.adtraction.com/t/t?a=XXX&as=YYY&t=2&tk=1&url=...`
- **Reporting:** Realtids-dashboard med klick, konverteringar, intäkter
- **Utbetalning:** Månadsvis, minimum ~500 kr, SEK till svenskt bankkonto

### Ansökan
1. Skapa publisher-konto: https://adtraction.com/se/logga-in
2. Beskriv sajten (domän, trafikuppskattning, innehållstyp)
3. Granskning tar normalt 1-3 dagar
4. När godkänd: ansök till enskilda program (Granngården, VetZoo etc.) separat
5. Varje annonsör godkänner själv

### Trafikkrav
- Adtraction har **inget hårt minimum**, men: tomma sajter godkänns sällan
- **Recept för godkännande:** minst 10 sidor publicerat innehåll + rimlig design (du är klar med detta)
- Vissa annonsörer (Granngården) kan vara striktare — ha trafik innan du ansöker

---

## 2. Awin (globalt + Omlet & Zooplus)

**Sajt:** https://www.awin.com
**Typ:** Global, men viktig för europeiska PET-varumärken

### Relevanta annonsörer
| Merchant | Provision | Cookie | Noter |
|----------|-----------|--------|-------|
| **Omlet (UK/US)** | 5% bas, förhandlingsbart | 60 dagar | AOV ~$300 — hög värde |
| **Zooplus.se** | 4-6% (djurtillbehör) | 30 dagar | Finns separat .se-program |
| **Hobbyhallen** | ~5% | 30 dagar | Trädgårdsredskap |

### Så funkar det
- **Avgift:** 5 USD depositum vid registrering (återbetalas efter godkännande)
- **Länkformat:** `https://www.awin1.com/cread.php?awinmid=XXXX&awinaffid=YYYY&ued=...`
- **Minimum payout:** £20 / ~260 kr
- **Utbetalning:** Månadsvis, Wise/SEPA

### Omlet-programmet specifikt
- 60 dagars cookie (mycket långt!)
- Basprovision 5%, men du kan förhandla upp till 8-10% om du driver volym
- Kontakta **marketing@omlet.com** efter godkännande för höjning
- Medel-ordervärde: $300 = ~3 300 kr → ~165 kr per konvertering på 5%

---

## 3. Amazon Associates Sweden

**Sajt:** https://affiliate-program.amazon.se
**Lanserad i Sverige:** november 2020
**Bäst för:** Run Chicken T50, VEVOR, ChickCozy, ChickenGuard (säljs på Amazon)

### Provision
- **Upp till 12%** på vissa kategorier (djurtillbehör hamnar vanligtvis på 3-6%)
- **Fast bounty:** 50 SEK per Amazon Prime-registrering via din länk
- **Utbetalning:** i EUR (inte SEK)

### Cookie
- **24 timmar** (kort, men: allt i varukorgen räknas, inte bara den länkade produkten)
- Om personen lägger i varukorg inom 24h men köper inom 89 dagar → du får provision

### Så funkar det
- Länkformat: `https://www.amazon.se/dp/XXXXXXXXXX?tag=honsgarden-21`
- Använd **SiteStripe** i webbläsaren för att generera länkar
- Måste ha **3 kvalificerade försäljningar inom 180 dagar** annars stängs kontot
- **Viktigt:** Amazon är strikta med att du måste ha disclosure på sajten ("Som Amazon Associate tjänar jag på kvalificerade köp")

### Begränsningar
- Kan inte använda länkar i email eller PDF
- Kan inte använda länkar i stängda grupper (Facebook-grupper etc.)
- Får inte bjuda för klick ("Klicka här!")
- Måste visa pris som reservation ("Pris kan variera")

---

## 4. Adrecord (sekundärt svenskt nätverk)

**Sajt:** https://www.adrecord.com/sv
**Typ:** Mindre svenskt nätverk, kompletterar Adtraction

### Relevanta kategorier
- **Djur:** 9 aktiva program (apr 2026)
- **Bygg & trädgård:** 11 aktiva program
- Mindre överlapp med Adtraction — värt att ha båda

### Bra att kombinera
Vissa annonsörer kör exklusivt på Adrecord (inte Adtraction), så det lönar sig att ha båda för att nå full täckning.

---

## 5. Direkta affiliate-program (utanför nätverk)

### Omlet Direct
https://www.omlet.us/misc/become-an-affiliate
- Kan sökas direkt men Awin är enklare

### ChickenGuard
- Ingen officiell affiliate-program i Sverige just nu (apr 2026)
- De säljs dock på Amazon.se → använd Amazon Associates

### ChickCozy
- Har partnerprogram via sin egen sajt (chickcozy.com/pages/affiliate)
- Kontakta direkt för Sverige-specifika villkor

---

## Praktisk implementation på Hönsguiden

### Steg 1: Skapa konton (i denna ordning)
1. **Adtraction** — primärt nätverk
2. **Awin** — för Omlet
3. **Amazon Associates SE** — för Amazon-produkter
4. *(senare)* **Adrecord** — för kompletterande täckning

### Steg 2: Länk-struktur i products.json
Uppdatera `buy_urls` i `docs/data/products.json` från platshållare till riktiga affiliate-länkar:

```json
"buy_urls": [
  {
    "store": "Granngården",
    "url": "https://track.adtraction.com/t/t?a=XXX&url=https://www.granngarden.se/...",
    "affiliate": true,
    "network": "adtraction"
  },
  {
    "store": "Amazon.se",
    "url": "https://www.amazon.se/dp/XXXXX?tag=honsgarden-21",
    "affiliate": true,
    "network": "amazon"
  }
]
```

### Steg 3: Disclosure (obligatoriskt)
- Finns redan i footer: "Vi kan få provision via länkar på denna sida"
- **Lägg även till vid första rekommendationen på varje sida** (krävs av Konsumentverket + Amazon ToS):

```html
<p class="affiliate-disclosure">
  <small>Hönsguiden är läsarfinansierat. När du köper via länkar på vår sida kan vi få provision utan extra kostnad för dig. Det påverkar aldrig våra rekommendationer.</small>
</p>
```

### Steg 4: Rel-attribut
Alla affiliate-länkar ska ha:
```html
<a href="..." rel="sponsored nofollow noopener" target="_blank">
```
Detta är Google-krav (annars riskerar du manual penalty) och förhindrar att affiliate-länkar påverkar SEO negativt.

### Steg 5: UTM-tagging för spårning
Lägg alltid till UTM-parametrar så du kan analysera i Google Analytics vilken sida driver mest konverteringar:
```
?utm_source=honsgarden&utm_medium=affiliate&utm_campaign=luckoppnare
```

---

## Prognos-exempel (första 12 månaderna)

**Antaganden:**
- 5 000 månatliga besökare efter 6 månader
- 3% klickar på affiliate-länk (industristandard för jämförelsesajter)
- 8% konverterar till köp (högt men realistiskt för köpintent-trafik)
- Genomsnittlig provision per sale: 80 kr (mix av 5-8% av 1 000-2 500 kr)

**Räkning:**
5 000 × 3% = 150 klick/månad × 8% = 12 sales × 80 kr = **960 kr/månad** efter 6 månader

**Skalning:**
- 20 000 månatliga besökare efter 12 månader → **~3 800 kr/månad**
- Med mer innehåll (hönshus-jämförelse, foder-guide, etc.) → **~8 000-15 000 kr/månad** efter 18 månader

Detta är en konservativ modell. Höns-nischen har hög köpintent och låg konkurrens.

---

## Vad du behöver göra NU

- [ ] Skapa Adtraction-konto och ansök till Granngården + VetZoo
- [ ] Skapa Awin-konto och ansök till Omlet
- [ ] Skapa Amazon Associates SE-konto
- [ ] När godkänd: uppdatera alla `buy_urls` i products.json
- [ ] Lägg till affiliate-disclosure på luckoppnare.html överst
- [ ] Lägg till `rel="sponsored nofollow noopener"` på alla affiliate-länkar
- [ ] Sätt upp Google Analytics + Google Search Console
- [ ] Skicka in sitemap.xml till GSC

---

## Viktiga juridiska krav (Sverige + EU)

1. **Konsumentverket / Marknadsföringslagen:** affiliate-länkar måste tydligt markeras som reklam
2. **GDPR:** om du använder cookies för tracking måste du ha cookie-banner (eller inga tracking-cookies)
3. **Amazon ToS:** måste ha Amazon Associates disclosure
4. **Transparens:** Sverige är strikt med sponsrat innehåll — "i samarbete med" eller liknande ska synas

---

## Källor

- Adtraction: https://adtraction.com/se
- Awin: https://www.awin.com
- Amazon Associates SE: https://affiliate-program.amazon.se
- Adrecord: https://www.adrecord.com/sv
- Omlet Affiliate (via Awin): https://ui.awin.com/merchant-profile/76702
- Zooplus Sverige affiliate info: https://www.zooplus.se/info/about/affiliate-program
- Granngården affiliate: https://www.granngarden.se/affiliate
