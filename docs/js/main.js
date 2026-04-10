/* ========================================
   HÖNSGÅRDEN — Main JS
   Progressive enhancement only
   ======================================== */

(function () {
  'use strict';

  // --- Scroll animations (Intersection Observer) ---
  function initAnimations() {
    var elements = document.querySelectorAll('.animate-in');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything
      elements.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  // --- Mobile navigation ---
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var overlay = document.getElementById('navOverlay');
    var closeBtn = overlay ? overlay.querySelector('.nav-overlay-close') : null;
    if (!toggle || !overlay) return;

    function openMenu() {
      overlay.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Close on link click
    overlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // --- Load popular products on homepage (no-op now, content is pre-rendered) ---
  function initPopularProducts() {
    // Pre-rendered in HTML. This function is kept for backwards compat only.
    return;
  }

  function renderProductCard(product) {
    var scoreClass = getScoreClass(product.score);
    var badgeLabel = getBadgeLabel(product.badge);
    var badgeHtml = badgeLabel
      ? '<span class="award-badge">' + badgeLabel + '</span> '
      : '';

    var specs = [];
    if (product.power === 'solar') specs.push('Solar');
    if (product.wifi) specs.push('WiFi');
    if (product.anti_pinch) specs.push('Anti-pinch');
    if (product.door_included) specs.push('Lucka ingår');
    if (product.min_temp_c !== null) specs.push(product.min_temp_c + '°C');

    var tagsHtml = specs.map(function (s) {
      return '<span class="tag">' + s + '</span>';
    }).join('');

    return '<a href="luckoppnare.html" class="product-card">' +
      '<div class="score-badge score-badge--' + scoreClass + '">' + product.score + '</div>' +
      '<div class="product-card-info">' +
        '<div class="product-card-name">' + badgeHtml + product.name + '</div>' +
        '<div class="product-card-meta">' + product.brand + '</div>' +
        '<div class="product-card-specs">' + tagsHtml + '</div>' +
      '</div>' +
      '<div class="product-card-price">' + formatPrice(product.price_sek) + '</div>' +
    '</a>';
  }

  function getScoreClass(score) {
    if (score >= 8.5) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 5) return 'ok';
    return 'poor';
  }

  function getBadgeLabel(badge) {
    var labels = {
      'best-overall': 'Bäst totalt',
      'best-budget': 'Bäst pris',
      'best-winter': 'Bäst vinter',
      'best-smart': 'Bäst smart',
      'best-value': 'Bäst värde'
    };
    return labels[badge] || null;
  }

  function formatPrice(sek) {
    return sek.toLocaleString('sv-SE') + ' kr';
  }

  // --- Comparison table sorting ---
  function initTableSort() {
    var table = document.querySelector('.comparison-table');
    if (!table) return;

    var headers = table.querySelectorAll('th[data-sort]');
    headers.forEach(function (th, index) {
      th.addEventListener('click', function () {
        var key = th.getAttribute('data-sort');
        var type = th.getAttribute('data-sort-type') || 'string';
        var tbody = table.querySelector('tbody');
        var rows = Array.from(tbody.querySelectorAll('tr'));

        // Toggle sort direction
        var isAsc = th.classList.contains('sorted-asc');
        headers.forEach(function (h) {
          h.classList.remove('sorted-asc', 'sorted-desc');
        });

        var direction = isAsc ? 'desc' : 'asc';
        th.classList.add('sorted-' + direction);

        rows.sort(function (a, b) {
          var aVal = a.querySelector('[data-value]') ?
            a.cells[index].getAttribute('data-value') || a.cells[index].textContent.trim() :
            a.cells[index].textContent.trim();
          var bVal = b.querySelector('[data-value]') ?
            b.cells[index].getAttribute('data-value') || b.cells[index].textContent.trim() :
            b.cells[index].textContent.trim();

          if (type === 'number') {
            aVal = parseFloat(aVal.replace(/[^\d.-]/g, '')) || 0;
            bVal = parseFloat(bVal.replace(/[^\d.-]/g, '')) || 0;
          }

          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          return 0;
        });

        rows.forEach(function (row) { tbody.appendChild(row); });
      });
    });
  }

  // --- Comparison table filters ---
  function initTableFilters() {
    var filters = document.querySelectorAll('[data-filter]');
    if (!filters.length) return;

    filters.forEach(function (filter) {
      filter.addEventListener('change', applyFilters);
    });
  }

  function applyFilters() {
    var table = document.querySelector('.comparison-table');
    if (!table) return;

    var rows = table.querySelectorAll('tbody tr');
    var powerFilter = document.querySelector('[data-filter="power"]');
    var wifiFilter = document.querySelector('[data-filter="wifi"]');
    var maxPrice = document.querySelector('[data-filter="max-price"]');

    rows.forEach(function (row) {
      var show = true;

      if (powerFilter && powerFilter.value) {
        var power = row.getAttribute('data-power');
        if (power !== powerFilter.value) show = false;
      }

      if (wifiFilter && wifiFilter.value) {
        var wifi = row.getAttribute('data-wifi');
        if (wifi !== wifiFilter.value) show = false;
      }

      if (maxPrice && maxPrice.value) {
        var price = parseInt(row.getAttribute('data-price'), 10);
        if (price > parseInt(maxPrice.value, 10)) show = false;
      }

      row.style.display = show ? '' : 'none';
    });
  }

  // --- Smooth scroll for anchor links ---
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Update URL without jump
          history.pushState(null, '', this.getAttribute('href'));
        }
      });
    });
  }

  // --- Newsletter form (placeholder) ---
  function initNewsletter() {
    var form = document.querySelector('.newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var btn = form.querySelector('button');
      if (!input || !btn) return;

      // Simple feedback — replace with real integration later
      var email = input.value;
      btn.textContent = 'Tack!';
      btn.disabled = true;
      input.disabled = true;
      input.value = '';

      // Reset after 3s
      setTimeout(function () {
        btn.textContent = 'Prenumerera';
        btn.disabled = false;
        input.disabled = false;
      }, 3000);
    });
  }

  // --- Active nav link ---
  function initActiveNav() {
    var path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && path.endsWith(href)) {
        link.classList.add('active');
      }
    });
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', function () {
    initAnimations();
    initMobileNav();
    initPopularProducts();
    initTableSort();
    initTableFilters();
    initSmoothScroll();
    initNewsletter();
    initActiveNav();
  });

})();
