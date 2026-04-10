#!/usr/bin/env python3
"""
Hönsgården — static HTML generator
Reads docs/data/products.json and outputs HTML fragments.
Used to pre-render JS-dependent sections so Google can index them.

Usage: python3 build/build_site.py
Then copy-paste the output into the relevant HTML files (or wire up later).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
PRODUCTS_JSON = ROOT / "docs" / "data" / "products.json"

BADGE_LABELS = {
    "best-overall": "Bäst totalt",
    "best-budget": "Bäst pris",
    "best-winter": "Bäst vinter",
    "best-smart": "Bäst smart",
    "best-value": "Bäst värde",
}


def score_class(score):
    if score >= 8.5:
        return "excellent"
    if score >= 7:
        return "good"
    if score >= 5:
        return "ok"
    return "poor"


def fmt_price(sek):
    return f"{sek:,}".replace(",", " ") + " kr"


def key_specs(p):
    specs = []
    if p["power"] == "solar":
        specs.append("Solar")
    if p["wifi"]:
        specs.append("WiFi")
    if p["anti_pinch"]:
        specs.append("Anti-pinch")
    if p["door_included"]:
        specs.append("Lucka ingår")
    return specs


def render_buy_buttons(p):
    buttons = []
    for link in p.get("buy_urls", []):
        rel = "sponsored nofollow noopener noreferrer" if link.get("affiliate") else "noopener noreferrer"
        cls = "btn btn-primary btn-buy" if link.get("affiliate") else "btn btn-secondary btn-buy"
        label = f"Köp hos {link['store']}" if link.get("affiliate") else f"Se hos {link['store']}"
        net = link.get("network")
        net_html = f' <small class="btn-network">({net})</small>' if link.get("affiliate") and net else ""
        buttons.append(
            f'<a href="{link["url"]}" class="{cls}" rel="{rel}" target="_blank">{label}{net_html}</a>'
        )
    if not buttons:
        return ""
    return '<div class="buy-buttons">' + "".join(buttons) + "</div>"


def render_featured_card(p):
    sc = score_class(p["score"])
    specs = key_specs(p)
    specs_html = "".join(f'<span class="tag">{s}</span>' for s in specs)
    buy_html = render_buy_buttons(p)
    badge_html = f'<span class="award-badge product-card-badge">{BADGE_LABELS[p["badge"]]}</span>' if p.get("badge") else ""
    return f'''<div class="product-card product-card--featured">
      {badge_html}
      <div class="featured-score-area">
        <div class="score-badge score-badge--{sc} score-badge--large">{p["score"]}</div>
        <h3 class="product-card-name">{p["name"]}</h3>
        <div class="product-card-meta">{p["brand"]}</div>
        <div class="product-card-specs">{specs_html}</div>
        <div class="product-card-price">{fmt_price(p["price_sek"])}</div>
        <p class="featured-summary">{p["summary"]}</p>
        {buy_html}
      </div>
    </div>'''


def render_pick_card(p):
    sc = score_class(p["score"])
    badge = BADGE_LABELS.get(p.get("badge"), "")
    return f'''<div class="product-card pick-card">
      <span class="award-badge">{badge}</span>
      <div class="score-badge score-badge--{sc}">{p["score"]}</div>
      <div class="product-card-name">{p["name"]}</div>
      <div class="product-card-price">{fmt_price(p["price_sek"])}</div>
    </div>'''


def render_editors_picks(products):
    picks = [p for p in products if p.get("badge")]
    picks.sort(key=lambda p: (0 if p["badge"] == "best-overall" else 1, -p["score"]))
    main = next((p for p in picks if p["badge"] == "best-overall"), None)
    others = [p for p in picks if p["badge"] != "best-overall"]

    html = ""
    if main:
        html += render_featured_card(main)
    if others:
        html += '<div class="cover-grid editors-picks-secondary">'
        for p in others:
            html += render_pick_card(p)
        html += "</div>"
    return html


def render_table_row(p):
    sc = score_class(p["score"])
    power_label = "Solar" if p["power"] == "solar" else "Batteri"
    badge_html = f'<span class="award-badge award-badge--small">{BADGE_LABELS[p["badge"]]}</span>' if p.get("badge") else ""
    return f'''<tr data-power="{p["power"]}" data-wifi="{str(p["wifi"]).lower()}" data-price="{p["price_sek"]}">
      <td>{p["name"]}{badge_html}</td>
      <td data-value="{p["score"]}"><span class="score-badge score-badge--{sc} score-badge--sm">{p["score"]}</span></td>
      <td data-value="{p["price_sek"]}">{fmt_price(p["price_sek"])}</td>
      <td>{power_label}</td>
      <td class="{'cell-check' if p['wifi'] else 'cell-cross'}"></td>
      <td class="{'cell-check' if p['anti_pinch'] else 'cell-cross'}"></td>
      <td data-value="{p["min_temp_c"]}">{p["min_temp_c"]}°C</td>
      <td class="{'cell-check' if p['door_included'] else 'cell-cross'}"></td>
      <td data-value="{p["warranty_years"]}">{p["warranty_years"]} år</td>
    </tr>'''


def render_table_body(products):
    sorted_p = sorted(products, key=lambda p: -p["score"])
    return "\n".join(render_table_row(p) for p in sorted_p)


def render_popular(products):
    top3 = sorted(products, key=lambda p: -p["score"])[:3]
    cards = []
    for p in top3:
        sc = score_class(p["score"])
        specs = key_specs(p)
        specs_html = "".join(f'<span class="tag">{s}</span>' for s in specs)
        badge_html = f'<span class="award-badge award-badge--small">{BADGE_LABELS[p["badge"]]}</span> ' if p.get("badge") else ""
        cards.append(f'''<a href="luckoppnare.html" class="product-card">
          <div class="score-badge score-badge--{sc}">{p["score"]}</div>
          <div class="product-card-info">
            <div class="product-card-name">{badge_html}{p["name"]}</div>
            <div class="product-card-meta">{p["brand"]}</div>
            <div class="product-card-specs">{specs_html}</div>
          </div>
          <div class="product-card-price">{fmt_price(p["price_sek"])}</div>
        </a>''')
    return '<div class="product-list">' + "".join(cards) + "</div>"


def main():
    products = json.loads(PRODUCTS_JSON.read_text())

    print("=== EDITORS PICKS (luckoppnare.html → #editors-picks) ===\n")
    print(render_editors_picks(products))
    print("\n\n=== TABLE BODY (luckoppnare.html → #table-body) ===\n")
    print(render_table_body(products))
    print("\n\n=== POPULAR PRODUCTS (index.html → #popular-products) ===\n")
    print(render_popular(products))


if __name__ == "__main__":
    main()
