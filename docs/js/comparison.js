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
      html += '<div class="cover-grid" style="margin-top: var(--spacing-md);">';
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
      '<div style="margin-top: var(--spacing-sm);">' +
        '<div class="score-badge score-badge--' + scoreClass + ' score-badge--large" style="margin: 0 auto var(--spacing-sm);">' + product.score + '</div>' +
        '<h3 class="product-card-name" style="font-size: 1.4rem;">' + product.name + '</h3>' +
        '<div class="product-card-meta">' + product.brand + '</div>' +
        '<div class="product-card-specs" style="justify-content: center; margin-top: var(--spacing-sm);">' +
          specs.map(function (s) { return '<span class="tag">' + s + '</span>'; }).join('') +
        '</div>' +
        '<div class="product-card-price" style="font-size: 1.5rem; margin-top: var(--spacing-sm);">' + formatPrice(product.price_sek) + '</div>' +
        '<p style="margin: var(--spacing-sm) auto 0; max-width: 500px; font-size: 0.9rem; color: var(--text-secondary);">' + product.summary + '</p>' +
      '</div>' +
    '</div>';
  }

  function renderPickCard(product) {
    var scoreClass = getScoreClass(product.score);
    return '<div class="product-card" style="flex-direction: column; text-align: center; padding: var(--spacing-md);">' +
      '<span class="award-badge" style="align-self: center;">' + BADGE_LABELS[product.badge] + '</span>' +
      '<div class="score-badge score-badge--' + scoreClass + '" style="margin: var(--spacing-sm) auto;">' + product.score + '</div>' +
      '<div class="product-card-name">' + product.name + '</div>' +
      '<div class="product-card-price" style="margin-top: 0.25rem;">' + formatPrice(product.price_sek) + '</div>' +
    '</div>';
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
