/* ========================================
   Hönsguiden — Main JS
   ======================================== */

(function () {
  'use strict';

  // --- Analytics (cookiefri) ---
  var ANALYTICS_URL = 'https://honsguiden-analytics.smakfynd.workers.dev';

  function trackPageView() {
    if (navigator.doNotTrack === '1') return;
    var data = {
      page: location.pathname,
      referrer: document.referrer ? new URL(document.referrer).hostname : 'direct'
    };
    fetch(ANALYTICS_URL + '/api/hit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function() {});
  }

  function sendEvent(eventData) {
    if (navigator.doNotTrack === '1') return;
    eventData.page = location.pathname;
    fetch(ANALYTICS_URL + '/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    }).catch(function() {});
  }

  // Spåra köpklick
  function initClickTracking() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('.btn-buy');
      if (!link) return;

      // Hitta produktnamn från närmaste product-detail/product-card
      var card = link.closest('.product-detail') || link.closest('.product-card');
      var product = 'unknown';
      if (card) {
        var h3 = card.querySelector('h3');
        if (h3) product = h3.textContent.trim();
      }

      var store = link.textContent.trim();

      sendEvent({
        type: 'click',
        product: product,
        store: store
      });
    });
  }

  // Spåra scroll-djup
  function initScrollTracking() {
    var milestones = { 25: false, 50: false, 75: false, 100: false };
    var docHeight, winHeight;

    function updateHeights() {
      docHeight = document.documentElement.scrollHeight;
      winHeight = window.innerHeight;
    }

    updateHeights();

    window.addEventListener('scroll', function() {
      updateHeights();
      var scrolled = window.scrollY + winHeight;
      var percent = Math.round((scrolled / docHeight) * 100);

      [25, 50, 75, 100].forEach(function(m) {
        if (percent >= m && !milestones[m]) {
          milestones[m] = true;
          sendEvent({ type: 'scroll', depth: m });
        }
      });
    }, { passive: true });
  }

  // Spåra tid på sidan (skickar vid unload)
  function initTimeTracking() {
    var startTime = Date.now();
    var sent = false;

    function sendTime() {
      if (sent) return;
      sent = true;
      var seconds = Math.round((Date.now() - startTime) / 1000);
      if (seconds < 2) return; // Ignörera bounces
      // Använd sendBeacon för att säkerställa leverans vid unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ANALYTICS_URL + '/api/event', JSON.stringify({
          type: 'time',
          seconds: seconds,
          page: location.pathname
        }));
      } else {
        sendEvent({ type: 'time', seconds: seconds });
      }
    }

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') sendTime();
    });
    window.addEventListener('beforeunload', sendTime);
  }

  // Spåra FAQ-klick
  function initFaqTracking() {
    document.querySelectorAll('.faq-item summary').forEach(function(summary) {
      summary.addEventListener('click', function() {
        var question = summary.textContent.trim().slice(0, 80);
        sendEvent({ type: 'faq', question: question });
      });
    });
  }

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

      // Placeholder — inte kopplat till något ännu
      var email = input.value;
      btn.textContent = 'Kommer snart!';
      btn.disabled = true;
      input.disabled = true;
      input.value = '';

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

  // --- Accessibility: aria-labels for table cells and score badges ---
  function initAccessibility() {
    document.querySelectorAll('.cell-check').forEach(function(el) {
      el.setAttribute('aria-label', 'Ja');
      el.setAttribute('role', 'cell');
    });
    document.querySelectorAll('.cell-cross').forEach(function(el) {
      el.setAttribute('aria-label', 'Nej');
      el.setAttribute('role', 'cell');
    });
    document.querySelectorAll('.score-badge').forEach(function(el) {
      var score = el.textContent.trim();
      el.setAttribute('aria-label', 'Betyg: ' + score + ' av 10');
    });
  }

  // --- Back to top button ---
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Tillbaka till toppen');
    btn.innerHTML = '↑';
    btn.style.display = 'none';
    document.body.appendChild(btn);

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', function() {
      btn.style.display = window.scrollY > 500 ? '' : 'none';
    }, { passive: true });
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', function () {
    trackPageView();
    initClickTracking();
    initScrollTracking();
    initTimeTracking();
    initFaqTracking();
    initAnimations();
    initMobileNav();
    initPopularProducts();
    initTableSort();
    initTableFilters();
    initSmoothScroll();
    initNewsletter();
    initActiveNav();
    initAccessibility();
    initBackToTop();
  });

})();
