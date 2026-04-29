# Hönsguiden — projektkontext för Claude Code

Den här filen läses automatiskt varje gång du startar en chatt i det här
projektet. Håll den uppdaterad. Den är källan till sanning för röst och stil.

## Vem skriver

Gabriel Linton, 40-något, bor i Örebro, villa med tomt. Tre barn (varav minst
ett som hjälper måla). Forskar om småskaligt lantbruk på Örebro universitet.

Har INGA egna höns just nu. Lånade fem kycklingar säsongen 2025. Skaffar sex
egna i maj 2026.

Hönshus byggde Gabriel själv förra sommaren — en flyttbar tractor-modell på
hjul, plats för 4–6 höns. Lucköppnare (Okköbi Solar) monterades samtidigt.

## Sajten

Affiliatesajt för svensk hönsutrustning. Nisch: backyard chickens i Sverige,
vinter, små flockar (4–6 höns), villatomter.

Konkurrenterna är AI-genererade jämförelsesajter med score-badges och bento-grids.
Min vinst är att jag är en person. Allt på sajten ska bevisa det.

Affiliateintäkter förra året: ~1 200 kr. Det räcker till en säck pellets.
Det är en ärlig siffra och bör nämnas rakt ut, inte gömmas i en disclaimer-fotnot.

## Stack

Statisk HTML/CSS/JS i `docs/`. GitHub Pages serverar direkt från mappen.
Cloudflare framför för DNS och HTTPS.

```
docs/
├── index.html
├── luckoppnare.html
├── honshus.html
├── foder.html
├── vatten.html
├── varme.html
├── om-mig.html
├── css/style.css
├── js/main.js          (medvetet minimal — inget ramverk)
├── img/photos/         (egna foton)
└── luckoppnare/
    ├── okkobi-solar.html
    ├── omlet-smart.html
    └── ...
```

**Inga ramverk. Ingen build-pipeline.** Skriv ren HTML som fungerar utan JS.
JS får finnas men ska aldrig vara nödvändigt för att läsa innehållet.

## Röst — gör så här

- Skriv som en person, inte som en publikation. "Jag" och "du", aldrig "vi" eller "man".
- Korta meningar. Och sen längre meningar med komma och eftertanke när det krävs.
- Specifika tal och datum istället för runda. "Monterade i juni 2025" inte "förra året".
- Erkänn det jag inte vet. "Jag har inte testat den" är en giltig och värdefull formulering.
- Visa när jag ändrat mig. "Jag trodde X, sen läste jag Y, nu tror jag Z."
- Ärlig om pengar. Affiliatelänkar nämns rakt ut, gärna i körtexten.
- Svenska som låter talad, inte SEO-svenska. "Tjafsa", "klippet", "småaktigt".
  Engelska låneord får finnas: "tractor coop", "anti-pinch" — använd dem om de
  är så jag faktiskt sa det.
- Aldrig superlativer utan grund. Inte "bäst i test 2026". Hellre "den jag har själv".
- Aldrig emoji.

## Röst — gör INTE så här

- Inga "I dagens snabbrörliga värld..."-intros.
- Inga "Det finns många faktorer att tänka på"-fyllord.
- Inga symmetriska 3-listor när 1 eller 2 punkter räcker.
- Inga generiska expertcitat. Antingen riktiga citat med källa, eller inga.
- Inga emoji-rubriker.
- Inga "ultimativa guider" eller "allt du behöver veta".
- Inga försök att vara rolig eller flörtig — torra konstateranden är funnier.

## Saker jag faktiskt har / vet (uppdatera när det ändras)

- **Lucköppnare:** Okköbi Solar. Monterad juni 2025. Solpanel på sydsidan,
  lucka nere. 780 kr. 5 års garanti. Manualen är på Google-svenska.
- **Hönshus:** byggt själv, juni–augusti 2025. Tractor-modell på hjul.
  4–6 höns, 12 mm plywood, målat gulvitt. Dottern hjälpte måla två sidor.
- **Granne Göran:** villaägare bredvid, INGA egna höns, säger ja mot ägg.
  (Tidigare versioner av sajten påstod fel — kolla alltid om du är osäker.)
- **Foder:** testar Granngården pellets vs Lantmännen helsäd. Oklart vilken vinner.
- **Vatten:** 5L plastdropp. Fryser vid −5 °C. Olöst problem.
- **Webbkamera:** inte än. På gång.
- **Klimat:** Örebro. −5 till −10 vanliga vinterdagar, ibland −20.

## Visuell stil — Field Journal

Vald riktning: anteckningsbok som blivit publik. Marginal-anteckningar,
polaroid-foton, handritade markeringar.

**Färger (CSS-variabler i `css/style.css`):**
- `--paper: #faf6ec` (gräddvit bakgrund)
- `--ruled: #eadfc4` (faint horizontella linjer)
- `--ink: #1c1814` (huvudtext)
- `--faint: #7a7160` (sekundär text)
- `--marker: #bf4a1f` (tegel-orange accent)
- `--green: #365a3a` ("min" / godkänt)

**Typografi:**
- Rubriker: `"GT Sectra", "EB Garamond", Charter, Georgia, serif`
- Brödtext: samma serif
- UI / labels: `"Söhne", "Inter", "Helvetica Neue", sans-serif`
- Hand-anteckningar: `"Caveat", "Patrick Hand", cursive`

**Element som finns i `style.css`:**
- `.paper` — sidbakgrund med faint ruled lines
- `.polaroid` — vit ram, rotation, bildtext under
- `.margin-note` — handskrift, roterad, marker-färg
- `.hand-underline` — SVG-underline
- `.product` — listrad med #-nummer, stjärnor, kropp, pris
- `.status-box` — vit ruta med "vad jag har just nu"

**Foton:** alltid mina egna. En suddig bild från trädgården är värd mer än en
stockbild på en perfekt höna. `img/photos/` har 11 stycken just nu.

## När jag ber om en ny sida

1. **Skriv texten först.** Som ett kort blogginlägg, i min röst. Vänta på att
   jag säger "ok" innan du gör HTML.
2. **Layouten bygger på texten** — inte tvärtom. Ingen tabell innan paragrafen
   som introducerar tabellen.
3. **Återanvänd klasser från `style.css`.** Lägg inte till nya färger eller
   fonter utan att fråga.
4. **Inga ikoner** för varje punkt. Typografin räcker.
5. **Footer på varje sida:** "Gabriel · Örebro · forskar om småskaligt lantbruk"
   och "Skriv till mig: hej@honsguiden.se" och datum för senast uppdaterad.

## När jag ber om ändringar i en befintlig sida

Om jag ber dig ändra något smått: gör bara den ändringen. Återanvänd, expandera
inte. Det här är en personlig sajt, inte en plattform.
