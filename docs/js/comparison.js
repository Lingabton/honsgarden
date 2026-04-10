/* ========================================
   HÖNSGÅRDEN — Comparison page logic
   Loads products.json → renders table + editor picks
   ======================================== */

(function () {
  'use strict';

  var BADGE_LABELS = {
    'best-overall': 'Bäst totalt',
    'best-budget': 'Bäst pris',
    'best-winter': 'Bäst vinter',
    'best-smart': 'Bäst smart',
    'best-value': 'Bäst värde'
  };

  function init() {
    // Prerendered HTML exists — just enhance with best-in-column highlights
    highlightBestInColumn();

    // Only fetch JSON if tables are empty (fallback, shouldn't happen in prod)
    var tbody = document.getElementById('table-body');
    if (tbody && tbody.children.length === 0) {
      fetch('data/products.json')
        .then(function (res) { return res.json(); })
        .then(function (products) {
          renderEditorsPicks(products);
          renderTable(products);
          highlightBestInColumn();
        })
        .catch(function (err) {
          console.error('Failed to load products:', err);
        });
    }
  }

  // --- Editor's Picks ---
  function renderEditorsPicks(products) {
    var container = document.getElementById('editors-picks');
    if (!container) return;

    var picks = products.filter(function (p) { return p.badge; });
    // Sort: best-overall first, then rest
    picks.sort(function (a, b) {
      if (a.badge === 'best-overall') return -1;
      if (b.badge === 'best-overall') return 1;
      return b.score - a.score;
    });

    var mainPick = picks.find(function (p) { return p.badge === 'best-overall'; });
    var otherPicks = picks.filter(function (p) { return p.badge !== 'best-overall'; });

    var html = '';

    // Main featured card
    if (mainPick) {
      html += renderFeaturedCard(mainPick);
    }

    // Secondary picks in 2-col grid
    if (otherPicks.length) {
      html += '<div class="cover-grid editors-picks-secondary">';
      otherPicks.forEach(function (p) {
        html += renderPickCard(p);
      });
      html += '</div>';
    }

    container.innerHTML = html;
  }

  function renderFeaturedCard(product) {
    var scoreClass = getScoreClass(product.score);
    var specs = getKeySpecs(product);

    return '<div class="product-card product-card--featured">' +
      '<span class="award-badge product-card-badge">' + BADGE_LABELS[product.badge] + '</span>' +
      '<div class="featured-score-area">' +
        '<div class="score-badge score-badge--' + scoreClass + ' score-badge--large">' + product.score + '</div>' +
        '<h3 class="product-card-name">' + product.name + '</h3>' +
        '<div class="product-card-meta">' + product.brand + '</div>' +
        '<div class="product-card-specs">' +
          specs.map(function (s) { return '<span class="tag">' + s + '</span>'; }).join('') +
        '</div>' +
        '<div class="product-card-price">' + formatPrice(product.price_sek) + '</div>' +
        '<p class="featured-summary">' + product.summary + '</p>' +
        renderBuyButtons(product) +
      '</div>' +
    '</div>';
  }

  function renderPickCard(product) {
    var scoreClass = getScoreClass(product.score);
    return '<div class="product-card pick-card">' +
      '<span class="award-badge">' + BADGE_LABELS[product.badge] + '</span>' +
      '<div class="score-badge score-badge--' + scoreClass + '">' + product.score + '</div>' +
      '<div class="product-card-name">' + product.name + '</div>' +
      '<div class="product-card-price">' + formatPrice(product.price_sek) + '</div>' +
    '</div>';
  }

  // --- Buy buttons with proper rel attributes ---
  function renderBuyButtons(product) {
    if (!product.buy_urls || !product.buy_urls.length) return '';

    var buttons = product.buy_urls.map(function (link) {
      var rel = link.affiliate
        ? 'sponsored nofollow noopener noreferrer'
        : 'noopener noreferrer';
      var cls = link.affiliate ? 'btn btn-primary btn-buy' : 'btn btn-secondary btn-buy';
      var label = link.affiliate
        ? 'Köp hos ' + link.store
        : 'Se hos ' + link.store;
      var networkTag = link.affiliate && link.network
        ? ' <small class="btn-network">(' + link.network + ')</small>'
        : '';

      return '<a href="' + link.url + '" class="' + cls + '" rel="' + rel + '" target="_blank">' +
        label + networkTag +
      '</a>';
    }).join('');

    return '<div class="buy-buttons">' + buttons + '</div>';
  }

  // --- Table ---
  function renderTable(products) {
    var tbody = document.getElementById('table-body');
    if (!tbody) return;

    // Sort by score descending by default
    var sorted = products.slice().sort(function (a, b) { return b.score - a.score; });

    var html = sorted.map(function (p) {
      var scoreClass = getScoreClass(p.score);
      var powerLabel = p.power === 'solar' ? 'Solar' : 'Batteri';
      var badgeHtml = p.badge ? '<span class="award-badge" style="font-size:0.65rem; padding:0.2rem 0.5rem; margin-left:0.4rem;">' + BADGE_LABELS[p.badge] + '</span>' : '';

      return '<tr data-power="' + p.power + '" data-wifi="' + p.wifi + '" data-price="' + p.price_sek + '">' +
        '<td>' + p.name + badgeHtml + '</td>' +
        '<td data-value="' + p.score + '"><span class="score-badge score-badge--' + scoreClass + '" style="width:36px;height:36px;font-size:0.85rem;">' + p.score + '</span></td>' +
        '<td data-value="' + p.price_sek + '">' + formatPrice(p.price_sek) + '</td>' +
        '<td>' + powerLabel + '</td>' +
        '<td class="' + (p.wifi ? 'cell-check' : 'cell-cross') + '"></td>' +
        '<td class="' + (p.anti_pinch ? 'cell-check' : 'cell-cross') + '"></td>' +
        '<td data-value="' + p.min_temp_c + '">' + p.min_temp_c + '°C</td>' +
        '<td class="' + (p.door_included ? 'cell-check' : 'cell-cross') + '"></td>' +
        '<td data-value="' + p.warranty_years + '">' + p.warranty_years + ' år</td>' +
      '</tr>';
    }).join('');

    tbody.innerHTML = html;
  }

  // --- Highlight best in each column ---
  function highlightBestInColumn() {
    var table = document.getElementById('comparison-table');
    if (!table) return;

    var rows = Array.from(table.querySelectorAll('tbody tr'));
    if (!rows.length) return;

    // Column indices to highlight (score=1, price=2 (lowest), temp=6 (lowest), warranty=8 (highest))
    var configs = [
      { col: 1, best: 'max' },   // score: highest
      { col: 2, best: 'min' },   // price: lowest
      { col: 6, best: 'min' },   // min temp: lowest (most cold-resistant)
      { col: 8, best: 'max' }    // warranty: highest
    ];

    configs.forEach(function (cfg) {
      var bestVal = null;
      var bestCells = [];

      rows.forEach(function (row) {
        if (row.style.display === 'none') return;
        var cell = row.cells[cfg.col];
        if (!cell) return;
        var val = parseFloat(cell.getAttribute('data-value') || cell.textContent.replace(/[^\d.-]/g, ''));
        if (isNaN(val)) return;

        if (bestVal === null ||
            (cfg.best === 'max' && val > bestVal) ||
            (cfg.best === 'min' && val < bestVal)) {
          bestVal = val;
          bestCells = [cell];
        } else if (val === bestVal) {
          bestCells.push(cell);
        }
      });

      bestCells.forEach(function (cell) {
        cell.classList.add('cell-best');
      });
    });
  }

  // --- Helpers ---
  function getScoreClass(score) {
    if (score >= 8.5) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 5) return 'ok';
    return 'poor';
  }

  function getKeySpecs(product) {
    var specs = [];
    if (product.power === 'solar') specs.push('Solar');
    if (product.wifi) specs.push('WiFi');
    if (product.anti_pinch) specs.push('Anti-pinch');
    if (product.door_included) specs.push('Lucka ingår');
    return specs;
  }

  function formatPrice(sek) {
    return sek.toLocaleString('sv-SE') + ' kr';
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
