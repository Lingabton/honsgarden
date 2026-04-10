# Affiliate-länkar — uppdatering när du blir godkänd

När du blir godkänd i nätverken, byt ut placeholders i `docs/data/products.json`.

## Platshållare att ersätta

### Amazon Associates (amazon.se)
**Din tracking ID:** `honsgarden-21` (ändra om Amazon ger dig en annan)

Befintliga Amazon-länkar använder generisk sök:
- `https://www.amazon.se/s?k=PRODUKT&tag=honsgarden-21`

När du hittat den exakta produktsidan på Amazon, ersätt med:
- `https://www.amazon.se/dp/PRODUKT-ID?tag=honsgarden-21`

PRODUKT-ID är ASIN (10 tecken, hittas i URL:en på produktsidan).

---

### Adtraction (svenska butiker)

Alla länkar som börjar med `ADTRACTION_PLACEHOLDER_` behöver ersättas.

**Efter att du blivit godkänd:**
1. Logga in på adtraction.com
2. Gå till den godkända annonsören (t.ex. Granngården)
3. Använd deras "Länkgenerator" med måldestination (produktsidan på Granngården)
4. Kopiera den genererade länken (ser ut så här: `https://track.adtraction.com/t/t?a=XXXXX&url=...`)
5. Ersätt platshållaren i products.json

**Att ersätta:**
| Placeholder | Mål-URL |
|-------------|---------|
| `ADTRACTION_PLACEHOLDER_granngarden_chickenguard_premium` | Sökning "ChickenGuard Premium" på granngarden.se |
| `ADTRACTION_PLACEHOLDER_granngarden_kerbl_komplett` | https://www.granngarden.se/honslucka-kerbl-med-automatisk-luckoppnare-430x400mm |
| `ADTRACTION_PLACEHOLDER_bonden_kerbl_komplett` | https://www.bonden.se/luckoppnare/72195-honslucka-automatisk-komplett-till-honshus-7389512094121.html |

---

### Awin (Omlet)

Alla länkar som börjar med `AWIN_PLACEHOLDER_` behöver ersättas.

**Efter att du blivit godkänd:**
1. Logga in på awin.com
2. Gå till "Publisher > Links & Tools > Link Builder"
3. Välj Omlet som advertiser
4. Klistra in mål-URL:en (t.ex. https://www.omlet.se/shop/kycklingar/dorr-och-port/)
5. Kopiera den genererade länken (ser ut så här: `https://www.awin1.com/cread.php?awinmid=XXXXX&awinaffid=YYYYY&ued=...`)

**Att ersätta:**
| Placeholder | Mål-URL |
|-------------|---------|
| `AWIN_PLACEHOLDER_omlet_autodoor` | Omlet Smart Automatic Chicken Coop Door på omlet.se |

---

## Efter uppdatering

1. Sätt `"placeholder": false` för varje uppdaterad länk (valfritt — bara för din egen tracking)
2. Committa och pusha
3. Testa varje länk i inkognito-läge — kontrollera att spårnings-cookien sätts
4. Kolla dashboarden i respektive nätverk nästa dag för att bekräfta att klick registrerades

## Snabbkontroll-script

Kör detta för att hitta kvarvarande placeholders:

```bash
grep -n "PLACEHOLDER" docs/data/products.json
```

När den returnerar noll träffar är alla länkar live.
