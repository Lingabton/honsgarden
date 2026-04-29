# Handoff till Claude Code

Den här mappen innehåller allt du behöver för att flytta Field Journal-stilen
in i ditt riktiga repo. Det är ren HTML/CSS, inget ramverk, inget byggsteg.

## Så här gör du

### 1. Kopiera över filerna

Från `claude-code-handoff/` till ditt `docs/` i `honsguiden`-repot:

```
claude-code-handoff/CLAUDE.md         →  honsguiden/CLAUDE.md         (i repo-roten, INTE i docs/)
claude-code-handoff/css/style.css     →  honsguiden/docs/css/style.css
claude-code-handoff/js/main.js        →  honsguiden/docs/js/main.js
claude-code-handoff/index.html        →  honsguiden/docs/index.html
claude-code-handoff/luckoppnare.html  →  honsguiden/docs/luckoppnare.html
claude-code-handoff/luckoppnare/      →  honsguiden/docs/luckoppnare/
claude-code-handoff/img/photos/       →  honsguiden/docs/img/photos/
```

`CLAUDE.md` ska ligga i repo-roten (samma nivå som `docs/`). Då läser Claude
Code den automatiskt varje gång du kör `claude` i mappen.

### 2. Kolla att det funkar lokalt

Cd:a till `docs/` och kör vad du brukar för lokal preview. Om du inte har något
sedan tidigare:

```
cd docs
python3 -m http.server 8000
# öppna http://localhost:8000
```

Tre sidor är redan klara:
- `index.html` — hemsidan
- `luckoppnare.html` — kategori-listan
- `luckoppnare/okkobi-solar.html` — produktdetalj

### 3. Be Claude Code bygga resten

I repo-roten: `claude` — sen klistra in den här prompten:

```
Läs CLAUDE.md. Skriv sen honshus.html i samma stil som luckoppnare.html.

Innan du skriver HTML: skriv om bara textinnehållet på sidan,
i min röst, som ett kort blogginlägg. Vänta på att jag säger "ok"
innan du gör något med layout eller HTML.

Fokus: jag byggde mitt eget hönshus förra sommaren (tractor på hjul,
plats för 4–6 höns). Det är #1 — "mitt val". Resten av jämförelsen
är Eglu Cube, Hornbach DIY-paket, Kerbl. Jag har bara sett mitt eget
i verkligheten — det ska synas i texten.

Foton från mitt bygge ligger i img/photos/:
- 01-stomme.jpg (stommen, helg 1)
- 03-malning.jpg (dottern målar)
- 06-monterat.jpg (klart med lucköppnare)
- 10-hjul.jpg (hjulen)

Använd dem i en polaroid-rad högst upp på sidan.
```

### 4. Arbetsflöde framöver

För varje ny sida, samma mönster:
1. Be Claude skriva texten först.
2. När du säger "ok", be om HTML.
3. Återanvänd klasser från `style.css`. Lägg inte till nya färger eller fonter.

Sidor som väntar:
- `honshus.html`
- `foder.html`
- `vatten.html`
- `varme.html`
- `om-mig.html` (en riktig om-sida med din story — Örebro, forskning, lånade kycklingar)
- Produktdetaljer för Omlet, ChickenGuard, etc.

### 5. Sista checken innan du pushar

- [ ] Inga emoji någonstans
- [ ] Inga score-badges (8.8 / 8.5)
- [ ] Footer på varje sida med datum
- [ ] Affiliate-disclosure i körtexten, inte gömd i fotnoten
- [ ] Minst en passage på varje sida där du säger "jag har inte testat" eller "jag är osäker"

## Filer i den här mappen

- `CLAUDE.md` — projektkontext, läses av Claude Code automatiskt
- `css/style.css` — Field Journal-stilen, vanilla CSS
- `js/main.js` — minimal, behövs egentligen inte
- `index.html`, `luckoppnare.html`, `luckoppnare/okkobi-solar.html` — tre färdiga sidor
- `img/photos/` — dina egna foton från bygget
- `README-handoff.md` — den här filen
