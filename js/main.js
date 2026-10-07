/* ==========================================================================
   STACKLY — main.js
   Loader, slideshow, drawer, marquee, spotlight, reveals, cart, wishlist,
   password toggle, 404 go-back, video modal, filters.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IS_TOUCH = window.matchMedia('(hover: none)').matches;

  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o || false); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* =======================================================================
     1. CREATIVE PRELOADER
     ======================================================================= */
  var Loader = (function () {
    var tips = [
      'Torque-tested to -24C in the Brooks Range.',
      'Every shelter ships with a full repair kit.',
      'Average pack weight across our alpine range: 1.42 kg.',
      'Over 214 trail days logged on our flagship tent.',
      'Spare parts guaranteed for fifteen years.'
    ];
    var el, word, bar, pct, tipEl, done = false, pctNow = 0, shown = 0;

    function init() {
      el = $('#loader');
      if (!el) return;
      word = $('.loader-word', el);
      var w = 'STACKLY';
      if (word) {
        word.innerHTML = w.split('').map(function (c, i) {
          return '<span style="animation-delay:' + (i * 70) + 'ms">' + c + '</span>';
        }).join('');
      }
      bar = $('.loader-bar i', el);
      pct = $('.loader-pct b', el);
      tipEl = $('.loader-tips', el);
      rotateTip();
      // Don't auto-close in init; let start() drive the animation to end.
      // This avoids a race where the loader could get stuck if init runs in
      // a different order in some browsers (e.g. Edge).
    }
    function rotateTip() {
      if (!tipEl) return;
      var i = 0;
      tipEl.textContent = tips[0];
      clearInterval(Loader._t);
      Loader._t = setInterval(function () {
        i = (i + 1) % tips.length;
        tipEl.style.opacity = '0';
        setTimeout(function () { tipEl.textContent = tips[i]; tipEl.style.opacity = '1'; }, 260);
      }, 1600);
    }
    function tick() {
      var target = Math.min(100, pctNow + Math.random() * 11 + 3);
      if (target > 100) target = 100;
      pctNow = target;
      shown += (pctNow - shown) * 0.14;
      if (bar) bar.style.right = (100 - shown) + '%';
      if (pct) pct.textContent = String(Math.round(shown)).padStart(2, '0');
      if (shown < 99.4) requestAnimationFrame(tick);
      else close();
    }
    function close() {
      if (done) return;
      done = true;
      if (bar) bar.style.right = '0%';
      if (pct) pct.textContent = '100';
      clearInterval(Loader._t);
      setTimeout(function () {
        if (el) el.classList.add('done');
        document.body.classList.add('loaded');
        document.documentElement.classList.add('no-smooth');
        setTimeout(function () {
          document.documentElement.classList.remove('no-smooth');
          if (el && el.parentNode) el.parentNode.removeChild(el);
          if (typeof Reveal === 'object' && Reveal.scan) Reveal.scan();
          document.dispatchEvent(new CustomEvent('stackly:ready'));
        }, 260);
      }, REDUCED ? 60 : 480);
    }
    return { init: init, start: function () { if (!el) { done = true; return; } requestAnimationFrame(tick); } };
  })();

  /* =======================================================================
     2. SCROLL REVEAL
     ======================================================================= */
  var Reveal = (function () {
    var io;
    function scan() {
      var items = $$('[data-reveal], .split-line, .hl, .hl-line, .stat-item');
      if (!('IntersectionObserver' in window)) {
        each(items, function (n) { n.classList.add('in'); });
        return;
      }
      if (!io) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      }
      each(items, function (n, i) {
        if (!n.hasAttribute('data-rd')) n.style.setProperty('--rd', ((i % 4) * 80) + 'ms');
        io.observe(n);
      });
    }
    return { scan: scan };
  })();

  /* Auto split text: [data-split] children get wrapped into .split-line */
  function autoSplit() {
    each($$('[data-split]'), function (host) {
      if (host.dataset.splitDone) return;
      host.dataset.splitDone = '1';
      var kids = Array.prototype.slice.call(host.childNodes);
      var idx = 0;
      each(kids, function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.split(/(\s+)/);
          var line = document.createElement('span');
          line.className = 'split-line';
          parts.forEach(function (p) {
            if (/^\s+$/.test(p)) { line.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', idx++);
            w.textContent = p;
            line.appendChild(w);
          });
          host.replaceChild(line, node);
        } else if (node.nodeType === 1) {
          var l2 = document.createElement('span');
          l2.className = 'split-line';
          while (node.firstChild) l2.appendChild(node.firstChild);
          each($$('.w', l2), function () {});
          var w2 = document.createElement('span');
          w2.className = 'w';
          w2.style.setProperty('--i', idx++);
          while (l2.firstChild) w2.appendChild(l2.firstChild);
          l2.appendChild(w2);
          host.replaceChild(l2, node);
        }
      });
    });
  }

  /* =======================================================================
     3. HEADER (sticky, scroll progress line)
     ======================================================================= */
  function headerInit() {
    var hdr = $('#siteHeader');
    if (!hdr) return;
    var ticking = false;
    var toTop = $('#toTop');

    function update() {
      var y = window.pageYOffset;
      var docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var pct = clamp(y / docH * 100, 0, 100);
      hdr.style.setProperty('--hscroll', pct.toFixed(2) + '%');
      if (toTop) toTop.classList.toggle('on', y > 640);
      ticking = false;
    }
    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    on(toTop, 'click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  }

  /* =======================================================================
     4. MOBILE DRAWER
     ======================================================================= */
  function drawerInit() {
    var burger = $('#hamburger'), drawer = $('#drawer'), scrim = $('#drawerScrim'), x = $('#drawerClose');
    if (!drawer) return;
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      drawer.classList.add('open'); scrim.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      burger.classList.add('active'); burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('is-locked');
      setTimeout(function () { if (x) x.focus(); }, 260);
    }
    function close() {
      drawer.classList.remove('open'); scrim.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      burger.classList.remove('active'); burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function isOpen() { return drawer.classList.contains('open'); }

    on(burger, 'click', function () { isOpen() ? close() : open(); });
    on(x, 'click', close);
    on(scrim, 'click', close);
    each($$('.drawer-link', drawer), function (a) {
      on(a, 'click', function (e) {
        if (a.hasAttribute('data-open-panel')) { e.preventDefault(); return; }
        setTimeout(close, 90);
      });
    });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close();
      if (e.key === 'Tab' && isOpen()) trap(e, drawer);
    });
    /* close drawer if resized up to desktop */
    var rt;
    on(window, 'resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (window.innerWidth >= 1080 && isOpen()) close(); }, 140);
    });
    DrawerControl = { open: open, close: close, isOpen: isOpen };
  }
  var DrawerControl = { open: function () {}, close: function () {}, isOpen: function () { return false; } };

  function trap(e, root) {
    var f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', root)
      .filter(function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* =======================================================================
     5. SIDE PANELS (cart / wishlist)
     ======================================================================= */
  function panelsInit() {
    var scrim = $('#panelScrim');
    function open(id) {
      closeAll();
      DrawerControl.close();
      var p = document.getElementById(id);
      if (!p) return;
      p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
      scrim.classList.add('open');
      document.body.classList.add('is-locked');
      var c = $('[data-close-panel]', p); if (c) setTimeout(function () { c.focus(); }, 250);
    }
    function closeAll() {
      each($$('.panel'), function (p) { p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); });
      if (scrim) scrim.classList.remove('open');
      if (!DrawerControl.isOpen()) document.body.classList.remove('is-locked');
    }
    on(scrim, 'click', closeAll);
    each($$('[data-open-panel]'), function (b) { on(b, 'click', function (e) { e.preventDefault(); open(b.getAttribute('data-open-panel')); }); });
    each($$('[data-close-panel]'), function (b) { on(b, 'click', closeAll); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    PanelControl = { open: open, close: closeAll };
  }
  var PanelControl = { open: function () {}, close: function () {} };

  /* =======================================================================
     6. CART + WISHLIST STORE
     ======================================================================= */
  var Store = (function () {
    var CK = 'stackly_cart_v1', WK = 'stackly_wish_v1';
    var cart = read(CK), wish = read(WK);

    function read(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
    function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

    function key(el) { return el.getAttribute('data-id') || el.getAttribute('data-name') || 'item'; }
    function meta(el) {
      return {
        id: key(el),
        name: el.getAttribute('data-name') || 'Stackly Product',
        price: parseFloat(el.getAttribute('data-price') || '0'),
        img: el.getAttribute('data-img') || '',
        cat: el.getAttribute('data-cat') || '',
        qty: 1
      };
    }
    function img(m) {
      return m.img
        ? '<img src="' + m.img + '" alt="' + m.name.replace(/"/g, '') + '" loading="lazy" />'
        : '<div style="width:100%;height:100%;display:grid;place-items:center;background:#111"><i class="fa-solid fa-box" style="color:#555"></i></div>';
    }
    function money(n) { return '$' + n.toFixed(2); }

    function addCart(el) {
      var m = meta(el);
      var f = cart.filter(function (x) { return x.id === m.id; })[0];
      if (f) f.qty += 1; else cart.push(m);
      write(CK, cart); render();
      toast('Added to cart', m.name, 'fa-cart-plus');
    }
    /* addWish takes a ready-made item record (see metaFromCard) */
    function addWish(m) {
      if (!m) return;
      if (wish.some(function (x) { return x.id === m.id; })) {
        wish = wish.filter(function (x) { return x.id !== m.id; });
        write(WK, wish); render();
        syncFavs();
        toast('Removed from wishlist', m.name, 'fa-heart-crack');
      } else {
        wish.push(m); write(WK, wish); render();
        syncFavs();
        toast('Saved to wishlist', m.name, 'fa-heart');
      }
    }
    function setQty(id, d) {
      each(cart, function (x) {
        if (x.id === id) { x.qty += d; if (x.qty < 1) x.qty = 0; }
      });
      cart = cart.filter(function (x) { return x.qty > 0; });
      write(CK, cart); render();
    }
    function rmCart(id) { cart = cart.filter(function (x) { return x.id !== id; }); write(CK, cart); render(); }
    function rmWish(id) { wish = wish.filter(function (x) { return x.id !== id; }); write(WK, wish); render(); syncFavs(); }
    function clearCart() { cart = []; write(CK, cart); render(); }

    function moveAll() {
      each(wish.slice(), function (m) {
        var f = cart.filter(function (x) { return x.id === m.id; })[0];
        if (f) f.qty += 1; else cart.push({ id: m.id, name: m.name, price: m.price, img: m.img, cat: m.cat, qty: 1 });
      });
      wish = []; write(CK, cart); write(WK, wish); render();
      toast('Wishlist moved', 'Everything is now in your cart', 'fa-right-left');
    }
    function syncFavs() {
      each($$('[data-wish]'), function (b) {
        b.classList.toggle('on', wish.some(function (x) { return x.id === b.getAttribute('data-wish'); }));
      });
    }

    /* build an item record by scraping the product card around a control */
    function metaFromCard(btn) {
      var id = btn.getAttribute('data-wish') || btn.getAttribute('data-id') || 'item';
      var card = btn.closest ? btn.closest('.pcard,.art,.li-row,.plan') : null;
      if (!card) return { id: id, name: 'Stackly Product', price: 0, img: '', cat: '', qty: 1 };
      var img = card.querySelector('img');
      var title = card.querySelector('.pcard-title,.art b,li-info b');
      var cat = card.querySelector('.pcard-cat,.art-cat');
      var price = card.getAttribute('data-price');
      if (!price) {
        var pn = card.querySelector('.price,.price b,span.mono');
        var mm = pn && pn.textContent.replace(/[^0-9.]/g, '');
        price = mm || '0';
      }
      return {
        id: id,
        name: (title ? title.textContent : 'Stackly Product').trim(),
        price: parseFloat(price) || 0,
        img: img ? img.getAttribute('src') : '',
        cat: cat ? cat.textContent.trim() : '',
        qty: 1
      };
    }

    function totals() {
      var sub = cart.reduce(function (s, x) { return s + x.price * x.qty; }, 0);
      var ship = cart.length === 0 ? 0 : (sub > 250 ? 0 : 18);
      return { sub: sub, ship: ship, total: sub + ship };
    }

    function render() {
      var cc = $('#cartCount'), wc = $('#wishCount');
      var dc = $('#drawerCartCount'), dw = $('#drawerWishCount');
      var n = cart.reduce(function (s, x) { return s + x.qty; }, 0);
      if (cc) { cc.textContent = n; cc.classList.toggle('show', n > 0); }
      if (dc) { dc.textContent = n; }
      if (wc) { wc.textContent = wish.length; wc.classList.toggle('show', wish.length > 0); }
      if (dw) { dw.textContent = wish.length; }

      var body = $('#cartBody');
      if (body) {
        if (!cart.length) {
          body.innerHTML = empty('fa-bag-shopping', 'Your cart is empty', 'Add field-tested kit to get started.');
        } else {
          body.innerHTML = cart.map(function (m) {
            return '<div class="li-row" data-row="' + m.id + '">' +
              '<div class="li-thumb">' + img(m) + '</div>' +
              '<div class="li-info"><b>' + m.name + '</b><small>' + (m.cat || 'Stackly') + '</small>' +
                '<div class="li-actions">' +
                  '<div class="qty"><button type="button" data-dec="' + m.id + '" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>' +
                  '<span>' + m.qty + '</span>' +
                  '<button type="button" data-inc="' + m.id + '" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button></div>' +
                  '<span class="mono">' + money(m.price * m.qty) + '</span>' +
                  '<button class="li-rm" type="button" data-rm="' + m.id + '" aria-label="Remove item"><i class="fa-solid fa-trash-can"></i></button>' +
                '</div>' +
              '</div></div>';
          }).join('');
        }
      }
      var wb = $('#wishBody');
      if (wb) {
        if (!wish.length) {
          wb.innerHTML = empty('fa-heart', 'No saved gear', 'Tap the heart on any product to keep it here.');
        } else {
          wb.innerHTML = wish.map(function (m) {
            return '<div class="li-row">' +
              '<div class="li-thumb">' + img(m) + '</div>' +
              '<div class="li-info"><b>' + m.name + '</b><small>' + (m.cat || 'Stackly') + '</small>' +
                '<div class="li-actions"><span class="mono">' + money(m.price) + '</span>' +
                '<button class="li-rm" type="button" data-rmw="' + m.id + '" aria-label="Remove"><i class="fa-solid fa-xmark"></i></button>' +
                '</div>' +
              '</div></div>';
          }).join('');
        }
      }
      var t = totals();
      var sub = $('#cartSub'), shp = $('#cartShip'), tot = $('#cartTotal');
      if (sub) sub.textContent = money(t.sub);
      if (shp) shp.textContent = cart.length === 0 ? 'Calculated at checkout' : (t.ship === 0 ? 'Free' : money(t.ship));
      if (tot) tot.textContent = money(t.total);
      var cpc = $('#cartPanelCount'), wpc = $('#wishPanelCount');
      if (cpc) cpc.textContent = n + ' ITEM' + (n === 1 ? '' : 'S');
      if (wpc) wpc.textContent = wish.length + ' SAVED';

      /* page-level lists (wishlist.html) */
      var wl = $('#wishPageList');
      if (wl) {
        var rows = wish.slice();
        var catSel = $('#wishCat'), sortSel = $('#wishSort');
        var cat = catSel ? catSel.value : '';
        if (cat) rows = rows.filter(function (m) {
          /* stored cat strings are inconsistent across the shop
             ("Sleep Systems", "Lighting & Power", "Technical Apparel"),
             so match on the token rather than strict equality */
          return String(m.cat || '').toLowerCase().indexOf(cat.toLowerCase()) > -1;
        });
        var sort = sortSel ? sortSel.value : 'recent';
        if (sort === 'price-asc') rows.sort(function (a, b) { return a.price - b.price; });
        else if (sort === 'price-desc') rows.sort(function (a, b) { return b.price - a.price; });
        else if (sort === 'name') rows.sort(function (a, b) {
          return String(a.name).localeCompare(String(b.name));
        });

        var wc2 = $('#wishCount2');
        if (wc2) wc2.textContent = wish.length
          ? (rows.length === wish.length
              ? wish.length + ' SAVED'
              : rows.length + ' OF ' + wish.length + ' SAVED')
          : '';

        wl.innerHTML = wish.length
          ? (rows.length
              ? rows.map(function (m) { return wishCard(m); }).join('')
              : '<div class="empty-state" style="grid-column:1/-1"><span class="ic"><i class="fa-solid fa-filter-circle-xmark"></i></span>' +
                '<b>No matches in this category</b><p class="dim">Nothing you have saved falls under that filter.</p>' +
                '<button class="btn sm" type="button" id="wishClearFilter">Show everything</button></div>')
          : '<div class="empty-state" style="grid-column:1/-1"><span class="ic"><i class="fa-regular fa-heart"></i></span>' +
            '<b>Nothing saved yet</b><p class="dim">Browse the range and tap the heart icon on anything you like.</p>' +
            '<a class="btn sm" href="shop.html">Browse the shop</a></div>';
      }
      var cp = $('#cartPageList');
      if (cp) {
        cp.innerHTML = cart.length
          ? cart.map(function (m) { return cartCard(m); }).join('')
          : '<div class="empty-state" style="grid-column:1/-1"><span class="ic"><i class="fa-solid fa-bag-shopping"></i></span>' +
            '<b>Your cart is empty</b><p class="dim">Every expedition starts with one good piece of kit.</p>' +
            '<a class="btn sm" href="shop.html">Browse the shop</a></div>';
      }
      var cs = $('#cartPageSum');
      if (cs) cs.innerHTML = cart.length
        ? '<div class="sum-row"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' +
          '<div class="sum-row"><span>Shipping</span><span>' + (t.ship === 0 ? 'Free' : money(t.ship)) + '</span></div>' +
          '<div class="sum-row total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
          '<a class="btn solid block" href="404.html" data-404><i class="fa-solid fa-lock"></i> Secure Checkout</a>'
        : '';
      var ws = $('#wishPageSum');
      if (ws) ws.innerHTML = wish.length
        ? '<div class="sum-row total"><span>' + wish.length + ' item' + (wish.length === 1 ? '' : 's') + ' saved</span><span>' +
          money(wish.reduce(function (s, x) { return s + x.price; }, 0)) + '</span></div>' +
          '<button class="btn solid block" type="button" id="wishPageMove"><i class="fa-solid fa-cart-plus"></i> Move all to cart</button>'
        : '';
    }

    function wishCard(m) {
      return '<div class="pcard" data-card>' +
        '<div class="pcard-media"><img src="' + m.img + '" alt="' + m.name + '" loading="lazy" />' +
        '<button class="pcard-fav on" type="button" data-wish="' + m.id + '" aria-label="Remove from wishlist"><i class="fa-regular fa-heart"></i></button></div>' +
        '<div class="pcard-body"><span class="pcard-cat">' + (m.cat || 'Stackly') + '</span>' +
        '<b class="pcard-title">' + m.name + '</b>' +
        '<div class="pcard-row"><span class="price">' + money(m.price) + '</span>' +
        '<button class="add-btn" type="button" data-add data-id="' + m.id + '" data-name="' + m.name + '" data-price="' + m.price + '" data-img="' + m.img + '" data-cat="' + m.cat + '" aria-label="Add to cart"><i class="fa-solid fa-plus"></i></button></div></div></div>';
    }
    function cartCard(m) {
      return '<div class="pcard" data-card>' +
        '<div class="pcard-media"><img src="' + m.img + '" alt="' + m.name + '" loading="lazy" />' +
        '<span class="badge soft" style="top:.7rem;left:.7rem">Qty ' + m.qty + '</span></div>' +
        '<div class="pcard-body"><span class="pcard-cat">' + (m.cat || 'Stackly') + '</span>' +
        '<b class="pcard-title">' + m.name + '</b>' +
        '<div class="li-actions"><div class="qty"><button type="button" data-dec="' + m.id + '" aria-label="Decrease"><i class="fa-solid fa-minus"></i></button>' +
        '<span>' + m.qty + '</span><button type="button" data-inc="' + m.id + '" aria-label="Increase"><i class="fa-solid fa-plus"></i></button></div>' +
        '<span class="mono">' + money(m.price * m.qty) + '</span>' +
        '<button class="li-rm" type="button" data-rm="' + m.id + '" aria-label="Remove"><i class="fa-solid fa-trash-can"></i></button></div></div></div>';
    }
    function empty(ico, t, s) {
      return '<div class="empty-state"><span class="ic"><i class="fa-solid ' + ico + '"></i></span>' +
        '<b>' + t + '</b><p class="dim" style="max-width:34ch">' + s + '</p>' +
        '<a class="btn sm" href="shop.html">Browse the shop</a></div>';
    }

    return {
      render: render, addCart: addCart, addWish: addWish, setQty: setQty,
      rmCart: rmCart, rmWish: rmWish, clearCart: clearCart, moveAll: moveAll,
      syncFavs: syncFavs, totals: totals, metaFromCard: metaFromCard
    };
  })();

  /* =======================================================================
     7. TOASTS
     ======================================================================= */
  function toast(title, sub, ico) {
    var wrap = $('#toastWrap');
    if (!wrap) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<span class="ic"><i class="fa-solid ' + (ico || 'fa-check') + '"></i></span>' +
      '<span><b>' + title + '</b>' + (sub ? '<br><span style="font-size:.76rem;opacity:.66">' + sub + '</span>' : '') + '</span>';
    wrap.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 420);
    }, 2600);
  }

  /* =======================================================================
     8. HERO SLIDESHOW
     ======================================================================= */
  function slideshowInit() {
    var root = $('#heroSlides');
    if (!root) return;
    var slides = $$('.slide', root);
    if (slides.length < 1) return;
    var dotsWrap = $('.sl-dots', root.parentNode) || $('.sl-dots');
    var idx = 0, timer = null, dur = 4200, paused = false;
    /* On phones the slides stack in normal flow (see the max-width:860px block in
       style.css) instead of crossfading in a fixed box. Auto-rotating there would
       change the page height out from under the reader, so the interval is not
       started at all there. Arrows and dots still work. */
    var STACKED = window.matchMedia('(max-width:860px)').matches;

    slides.forEach(function (s, i) {
      s.style.setProperty('--sd', (dur / 1000) + 's');
      if (i === 0) s.classList.add('on');
      if (!dotsWrap) return;
      var b = document.createElement('button');
      b.className = 'sl-dot' + (i === 0 ? ' on' : '');
      b.type = 'button';
      b.style.setProperty('--sd', (dur / 1000) + 's');
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.innerHTML = '<i></i>';
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
    });

    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
      each($$('.sl-dot'), function (d, i) {
        d.classList.toggle('on', i === idx);
        if (i !== idx) { var p = d.querySelector('i'); if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; } }
      });
      var cur = $('#slNow');
      if (cur) cur.textContent = String(idx + 1).padStart(2, '0');
      var vid = slides[idx].querySelector('video');
      each($$('.slide video'), function (v) { if (v !== vid) { try { v.pause(); } catch (e) {} } });
    }
    function next() { go(idx + 1); }
    function restart() { clearInterval(timer); if (!REDUCED && !STACKED) timer = setInterval(function () { if (!paused) next(); }, dur); }

    on($('#slNext'), 'click', function () { next(); restart(); });
    on($('#slPrev'), 'click', function () { go(idx - 1); restart(); });
    on(root, 'mouseenter', function () { paused = true; });
    on(root, 'mouseleave', function () { paused = false; });
    on(document, 'keydown', function (e) {
      if (!root.offsetParent) return;
      if (e.key === 'ArrowRight') { next(); restart(); }
      if (e.key === 'ArrowLeft') { go(idx - 1); restart(); }
    });
    /* swipe */
    var sx = null;
    on(root, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    on(root, 'touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 48) { dx < 0 ? next() : go(idx - 1); restart(); }
      sx = null;
    }, { passive: true });
    restart();
    Slideshow = { next: next, prev: function () { go(idx - 1); }, go: go };
  }
  var Slideshow = { next: function () {}, prev: function () {}, go: function () {} };

  /* =======================================================================
     9. MARQUEE (auto-fill along the correct axis, skipping hidden rails)
     ======================================================================= */
  function marqueeInit() {
    /* horizontal rails */
    each($$('.marquee:not(.vert)'), function (m) {
      var track = $('.marquee-track', m);
      if (!track) return;
      var w = m.clientWidth;
      if (w < 40) return;                       /* hidden (mobile-only or display:none) */
      var min = w + 320;
      if (track.scrollWidth >= min) { track.dataset.done = '1'; return; }
      var guard = 0;
      while (track.scrollWidth < min && guard < 16) {
        var first = track.firstElementChild;
        if (!first) break;
        track.appendChild(first.cloneNode(true));
        guard++;
      }
      track.dataset.done = '1';
    });
    /* vertical rails */
    each($$('.marquee.vert'), function (m) {
      var track = $('.marquee-track', m);
      if (!track) return;
      var h = m.clientHeight;
      if (h < 40) return;
      var min = h + 260;
      if (track.scrollHeight >= min) { track.dataset.vdone = '1'; return; }
      var guard = 0;
      while (track.scrollHeight < min && guard < 16) {
        var first = track.firstElementChild;
        if (!first) break;
        track.appendChild(first.cloneNode(true));
        guard++;
      }
      track.dataset.vdone = '1';
    });
  }

  /* =======================================================================
     10. SPOTLIGHT + 3D TILT
     ======================================================================= */
  function spotlightInit() {
    if (IS_TOUCH) return;
    each($$('.spot'), function (card) {
      on(card, 'pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
    each($$('[data-tilt]'), function (card) {
      var max = parseFloat(card.getAttribute('data-tilt')) || 7;
      on(card, 'pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-py * max) + 'deg) rotateY(' + (px * max) + 'deg) translateZ(0)';
        var inner = $('.tilt', card);
        if (inner) inner.style.transform = 'translateZ(30px)';
      });
      on(card, 'pointerleave', function () {
        card.style.transition = 'transform .7s cubic-bezier(.22,.61,.36,1)';
        card.style.transform = '';
        var inner = $('.tilt', card);
        if (inner) { inner.style.transition = 'transform .7s cubic-bezier(.22,.61,.36,1)'; inner.style.transform = ''; }
        setTimeout(function () { card.style.transition = ''; if (inner) inner.style.transition = ''; }, 720);
      });
      on(card, 'pointerenter', function () { card.style.transition = ''; });
    });
  }

  /* =======================================================================
     11. PARALLAX + FLOATING
     ======================================================================= */
  function parallaxInit() {
    var items = $$('[data-parallax]');
    if (!items.length || REDUCED) return;
    var ticking = false;
    function run() {
      var vh = window.innerHeight;
      each(items, function (n) {
        var r = n.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var sp = parseFloat(n.getAttribute('data-parallax')) || 0.14;
        var mid = r.top + r.height / 2;
        var off = (mid - vh / 2) * -sp;
        n.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    on(window, 'scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    on(window, 'resize', run, { passive: true });
    run();
  }

  /* =======================================================================
     12. COUNTERS
     ======================================================================= */
  function countersInit() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      each(nodes, function (n) { n.textContent = n.getAttribute('data-count') + (n.getAttribute('data-suffix') || ''); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target;
        io.unobserve(n);
        var to = parseFloat(n.getAttribute('data-count'));
        var pre = n.getAttribute('data-prefix') || '';
        var suf = n.getAttribute('data-suffix') || '';
        var dec = parseInt(n.getAttribute('data-decimals') || '0', 10);
        var dur = 1500, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = clamp((ts - t0) / dur, 0, 1);
          var e = 1 - Math.pow(1 - p, 3);
          n.textContent = pre + (to * e).toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(step);
          else n.textContent = pre + to.toFixed(dec) + suf;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.35 });
    each(nodes, function (n) { io.observe(n); });
  }

  /* =======================================================================
     13. ACCORDION (shared)
     ======================================================================= */
  function accordionInit() {
    each($$('.acc'), function (acc) {
      each($$('.acc-btn', acc), function (btn) {
        on(btn, 'click', function () {
          var item = btn.closest('.acc-item');
          var panel = item.querySelector('.acc-panel');
          var isOpen = item.classList.contains('on');
          var multi = acc.hasAttribute('data-multi');
          if (!multi) {
            each($$('.acc-item.on', acc), function (o) {
              if (o === item) return;
              o.classList.remove('on');
              var op = o.querySelector('.acc-panel');
              if (op) { op.style.height = op.scrollHeight + 'px'; void op.offsetWidth; op.style.height = '0px'; }
              var ob = o.querySelector('.acc-btn'); if (ob) ob.setAttribute('aria-expanded', 'false');
            });
          }
          btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
          if (isOpen) {
            item.classList.remove('on');
            panel.style.height = panel.scrollHeight + 'px'; void panel.offsetWidth; panel.style.height = '0px';
          } else {
            item.classList.add('on');
            panel.style.height = panel.innerHTML.length ? panel.firstElementChild.offsetHeight + 'px' : '0px';
            setTimeout(function () { if (item.classList.contains('on')) panel.style.height = 'auto'; }, 560);
          }
        });
      });
    });
  }

  /* =======================================================================
     14. FOOTER EXPANDABLE COLUMNS (mobile accordion)
     ======================================================================= */
  function footerInit() {
    each($$('.fcol'), function (col) {
      var btn = $('.fcol-btn', col), body = $('.fcol-body', col);
      if (!btn || !body) return;
      on(btn, 'click', function () {
        var open = col.classList.contains('open');
        col.classList.toggle('open', !open);
        btn.setAttribute('aria-expanded', String(!open));
        if (open) { body.style.height = body.scrollHeight + 'px'; void body.offsetWidth; body.style.height = '0px'; body.style.opacity = '0'; }
        else { body.style.opacity = '1'; body.style.height = body.firstElementChild.offsetHeight + 'px'; setTimeout(function () { body.style.height = 'auto'; }, 520); }
      });
    });
    /* newsletter — handled by newsletterInit() (form[data-nl]) */
  }

  /* =======================================================================
     14b. NEWSLETTER — Gmail-only signup with inline field error
     ======================================================================= */
  var GMAIL_RE = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

  function newsletterInit() {
    each($$('form[data-nl]'), function (f) {
      var input = f.querySelector('input[type="email"], input[name="email"]');
      if (!input) return;
      var field = input.closest('.field') || input.closest('.nl-field');
      var errSpan = field && field.querySelector('.err-msg');
      /* stash the authored copy so an empty submit does not inherit the
         gmail-specific message from the static markup */
      if (errSpan && !errSpan.dataset.defaultMsg) errSpan.dataset.defaultMsg = errSpan.innerHTML;

      function clearErr() {
        if (field) field.classList.remove('invalid');
        input.removeAttribute('aria-invalid');
        if (errSpan && errSpan.dataset.defaultMsg) errSpan.innerHTML = errSpan.dataset.defaultMsg;
      }

      function fail(msgHTML) {
        if (field) field.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        if (errSpan) errSpan.innerHTML = msgHTML;
      }

      on(input, 'input', clearErr);

      on(f, 'submit', function (e) {
        e.preventDefault();
        var v = (input.value || '').trim();

        /* every newsletter form authors the gmail message as its default copy,
           so the empty case needs its own string rather than defaultMsg */
        if (!v) {
          fail(NL_EMPTY_MSG);
          return;
        }
        if (!GMAIL_RE.test(v)) {
          fail(RULE_MSG.gmail);
          toast('Only Gmail is allowed', 'Please use a @gmail.com address', 'fa-triangle-exclamation');
          return;
        }

        clearErr();
        var btn = f.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending'; }
        /* record the page + scroll offset first, so the 404 page can offer
           an exact "Return to <page>" instead of a blind history back */
        Back404.record();
        setTimeout(function () { location.href = '404.html'; }, 700);
      });
    });
  }

  /* =======================================================================
     15. PASSWORD EYE TOGGLE  (single-icon swap, no duplicated glyph)
     ======================================================================= */
  function passwordInit() {
    each($$('[data-pw-toggle]'), function (btn) {
      btn.setAttribute('type', 'button');
      /* Rebuild the button with exactly one icon element. This guarantees no
         double (or ghost) eye glyph survives in any browser, even if the markup
         or a cached HTML ever contained two icons. */
      btn.innerHTML = '';
      var iconEl = document.createElement('i');
      iconEl.className = 'fa-regular fa-eye';
      btn.appendChild(iconEl);
      var targetId = btn.getAttribute('data-pw-toggle');
      var input = document.getElementById(targetId);
      if (!input) return;
      var inputType = input.getAttribute('type') || 'password';
      var shown = (inputType === 'text');
      function paint() {
        iconEl.className = shown ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
        btn.classList.toggle('reveal', shown);
        btn.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
        btn.setAttribute('aria-pressed', shown ? 'true' : 'false');
      }
      paint();
      on(btn, 'click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        shown = !shown;
        input.type = shown ? 'text' : 'password';
        var s = input.selectionStart, en = input.selectionEnd;
        paint();
        try { input.setSelectionRange(s, en); input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
      });
    });

    /* strength meter */
    each($$('[data-pw-meter]'), function (meter) {
      var input = document.getElementById(meter.getAttribute('data-pw-meter'));
      if (!input) return;
      on(input, 'input', function () {
        var v = input.value, s = pwScore(v);
        meter.setAttribute('data-lv', String(s));
        var lbl = meter.parentNode.querySelector('.pw-meter-lbl');
        if (lbl) lbl.textContent = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][s];
      });
    });
  }

  /* =======================================================================
     16. TABS (sign in / sign up + role)
     ======================================================================= */
  function tabsInit() {
    each($$('[data-tabs]'), function (group) {
      var btns = $$('button[data-tab]', group);
      var ind = $('.ind', group);
      function move(b) {
        btns.forEach(function (x) { x.classList.toggle('on', x === b); });
        if (ind && b) {
          ind.style.width = b.offsetWidth + 'px';
          ind.style.transform = 'translateX(' + (b.offsetLeft - group.clientLeft - 4) + 'px)';
        }
      }
      btns.forEach(function (b) {
        on(b, 'click', function () {
          move(b);
          var target = b.getAttribute('data-tab');
          var scope = document.getElementById(group.getAttribute('data-tabs')) || document;
          each($$('[data-pane]'), function (p) { p.classList.toggle('on', p.getAttribute('data-pane') === target); });
        });
      });
      function sync() {
        var active = btns.filter(function (b) { return b.classList.contains('on'); })[0] || btns[0];
        move(active);
      }
      on(window, 'resize', sync, { passive: true });
      setTimeout(sync, 60);
    });

    /* role switch */
    each($$('[data-role-group]'), function (g) {
      var out = document.querySelector(g.getAttribute('data-role-group'));
      each($$('.role', g), function (r) {
        on(r, 'click', function () {
          each($$('.role', g), function (x) { x.classList.toggle('on', x === r); x.setAttribute('aria-pressed', String(x === r)); });
          if (out) out.value = r.getAttribute('data-role') || 'user';
        });
      });
    });
  }

  /* =======================================================================
     17. VIDEO MODAL
     ======================================================================= */
  function videoInit() {
    var m = $('#videoModal'), v = $('#vmVideo');
    function open(src) { if (!m || !v) return; v.src = src; m.classList.add('open'); document.body.classList.add('is-locked'); }
    function close() { if (!m) return; m.classList.remove('open'); document.body.classList.remove('is-locked'); try { v.pause(); } catch (e) {} v.removeAttribute('src'); }
    each($$('[data-video]'), function (b) { on(b, 'click', function () { open(b.getAttribute('data-video')); }); });
    each($$('video[autoplay]'), function (v2) {
      if (!REDUCED) return;
      v2.removeAttribute('autoplay'); v2.removeAttribute('loop');
      try { v2.pause(); } catch (e) {}
      v2.controls = true;
    });
    on($('#vmClose'), 'click', close);
    on(m, 'click', function (e) { if (e.target === m) close(); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape' && m && m.classList.contains('open')) close(); });
  }

  /* =======================================================================
     18. SEARCH
     ======================================================================= */
  function searchInit() {
    var form = $('#searchForm'), input = $('#searchInput'), sug = $('#searchSuggest'), wrap = $('#searchForm');
    var toggle = $('#searchToggle');
    on(toggle, 'click', function () {
      var isOpen = wrap.classList.contains('mobile-open');
      wrap.classList.toggle('mobile-open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) setTimeout(function () { input.focus(); }, 200);
    });
    on(input, 'focus', function () { if (window.innerWidth >= 860) wrap.classList.add('open'); });
    on(input, 'blur', function () { setTimeout(function () { wrap.classList.remove('open'); }, 200); });
    on(form, 'submit', function (e) {
      e.preventDefault();
      var q = (input.value || '').trim();
      if (!q) { toast('Type something first', 'Search tents, stoves or trail guides', 'fa-magnifying-glass'); input.focus(); return; }
      location.href = 'shop.html?q=' + encodeURIComponent(q);
    });
    on(document, 'click', function (e) {
      if (sug && wrap && !wrap.contains(e.target)) wrap.classList.remove('open');
    });
  }

  /* =======================================================================
     19. SHOP FILTER / SORT
     ======================================================================= */
  /* =======================================================================
     9b. WISHLIST PAGE — sort / category controls
     ======================================================================= */
  function wishPageInit() {
    var sortSel = $('#wishSort'), catSel = $('#wishCat');
    if (!sortSel && !catSel) return;

    function onChange() { Store.render(); }

    on(sortSel, 'change', onChange);
    on(catSel, 'change', onChange);

    /* delegated: the "show everything" button is injected by render() when a
       filter matches nothing, so it is not in the DOM at bind time */
    on(document, 'click', function (e) {
      var clr = e.target.closest ? e.target.closest('#wishClearFilter') : null;
      if (!clr) return;
      if (catSel) catSel.value = '';
      onChange();
    });
  }

  function shopInit() {
    var grid = $('#productGrid');
    if (!grid) return;
    var cards = $$('[data-item]', grid);
    var sortSel = $('#sortSel');
    var countEl = $('#shopCount');
    var chips = $$('#shopChips .chip');

    function apply() {
      var active = chips.filter(function (c) { return c.classList.contains('on'); })[0];
      var cat = active ? active.getAttribute('data-cat') : 'all';
      var shown = 0;
      each(cards, function (c) {
        var ok = cat === 'all' || c.getAttribute('data-cat') === cat;
        c.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = shown + ' OF ' + cards.length + ' PRODUCTS';
    }
    each(chips, function (c) {
      on(c, 'click', function () {
        each(chips, function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
        c.classList.add('on'); c.setAttribute('aria-pressed', 'true');
        apply();
      });
    });
    on(sortSel, 'change', function () {
      var v = sortSel.value;
      var list = cards.slice().sort(function (a, b) {
        var pa = parseFloat(a.getAttribute('data-price') || '0'), pb = parseFloat(b.getAttribute('data-price') || '0');
        var ra = parseFloat(a.getAttribute('data-rating') || '0'), rb = parseFloat(b.getAttribute('data-rating') || '0');
        if (v === 'lo') return pa - pb;
        if (v === 'hi') return pb - pa;
        if (v === 'az') return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '');
        if (v === 'rate') return rb - ra;
        return 0;
      });
      list.forEach(function (c) { grid.appendChild(c); });
    });
    apply();

    /* mobile filter drawer */
    var f = $('#filterPanel'), fx = $('#filterClose'), fs = $('#filterScrim');
    on($('#filterOpen'), 'click', function () {
      f.classList.add('open'); fs.classList.add('open'); document.body.classList.add('is-locked');
    });
    function closeF() { f.classList.remove('open'); fs.classList.remove('open'); document.body.classList.remove('is-locked'); }
    on(fx, 'click', closeF);
    on(fs, 'click', closeF);
    on(document, 'keydown', function (e) { if (e.key === 'Escape') closeF(); });
  }

  /* =======================================================================
     20. 404 — record source page, exact go-back
     ======================================================================= */
  var Back404 = {
    KEY: 'stackly_404_origin',
    /* called on every page before navigating away */
    record: function () {
      try {
        sessionStorage.setItem(Back404.KEY, JSON.stringify({
          url: location.pathname.split('/').pop() || 'index.html',
          hash: location.hash,
          y: window.pageYOffset,
          top: document.documentElement.scrollTop || document.body.scrollTop || 0,
          t: Date.now()
        }));
      } catch (e) {}
    },
    /* called on 404 page */
    restoreOrBack: function () {
      var rec = null;
      try { rec = JSON.parse(sessionStorage.getItem(Back404.KEY)); } catch (e) {}
      var back = $('#goBack');
      var lbl = $('#goBackLabel');
      var hint = $('#nfHint');
      if (!back) return;
      if (rec && rec.url !== '404.html') {
        if (lbl) lbl.textContent = 'Return to ' + titleOf(rec.url);
        if (hint) hint.textContent = 'Returning to ' + titleOf(rec.url) + ' \u00b7 section you left';
        on(back, 'click', function () {
          back.setAttribute('aria-busy', 'true');
          back.style.pointerEvents = 'none';
          var ic = back.querySelector('i');
          if (ic) ic.className = 'fa-solid fa-circle-notch fa-spin';
          document.documentElement.classList.add('no-smooth');
          document.body.classList.add('is-locked');
          try { sessionStorage.setItem('stackly_restore', JSON.stringify(rec)); } catch (e) {}
          /* history.back() only lands on the recorded origin when that origin is
             still the entry directly before us. A stale record (reused tab,
             restored session, 404 typed after browsing) would drop the user on
             some unrelated page, and restorePending() silently bails because the
             url does not match - so anything older than 10 minutes loads the
             recorded url + hash directly and lets restorePending() place the
             scroll instead. */
          var fresh = typeof rec.t === 'number' && (Date.now() - rec.t) < 600000;
          if (fresh && history.length > 1) { history.back(); }
          else { location.replace(rec.url + (rec.hash || '')); }
        });
      } else {
        if (lbl) lbl.textContent = 'GO BACK';
        if (hint) hint.textContent = 'No previous section found \u00b7 returning to start';
        on(back, 'click', function () { location.replace('index.html'); });
      }
    }
  };
  function titleOf(u) {
    return ({
      'index.html': 'Home', 'shop.html': 'Shop', 'gear.html': 'Gear',
      'journal.html': 'Journal', 'contact.html': 'Contact',
      'signin.html': 'Sign In', 'wishlist.html': 'Wishlist',
      'user-dashboard.html': 'Dashboard', 'admin-dashboard.html': 'Admin Console'
    })[u] || 'previous page';
  }
  /* called on normal pages: honour a pending restore request */
  function restorePending() {
    var raw = null;
    try { raw = sessionStorage.getItem('stackly_restore'); } catch (e) {}
    if (!raw) return;
    try { sessionStorage.removeItem('stackly_restore'); } catch (e) {}
    var rec;
    try { rec = JSON.parse(raw); } catch (e) { return; }
    var here = location.pathname.split('/').pop() || 'index.html';
    if (rec.url !== here) return;

    var jumped = false;
    function jump() {
      if (jumped) return;
      jumped = true;
      var y = rec.y || 0;
      document.documentElement.classList.add('no-smooth');
      window.scrollTo(0, y);
      var sec = nearestSection(y);
      if (sec) {
        sec.style.transition = 'box-shadow .5s ease';
        sec.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,.32)';
        setTimeout(function () { sec.style.boxShadow = ''; }, 1800);
      }
      setTimeout(function () { document.documentElement.classList.remove('no-smooth'); }, 80);
    }
    /* wait for the preloader to clear, then hard-jump (no smooth scroll fight) */
    var done = false;
    function once() {
      if (done) return;
      done = true;
      requestAnimationFrame(function () { requestAnimationFrame(jump); });
    }
    document.addEventListener('stackly:ready', once, { once: true });
    on(window, 'load', function () { setTimeout(once, 140); });
    setTimeout(once, 3200);
  }
  function nearestSection(y) {
    var best = null, bd = 1e9;
    each($$('section, footer'), function (s) {
      var t = s.offsetTop;
      var d = Math.abs(t - y);
      if (d < bd && s.offsetHeight > 80) { bd = d; best = s; }
    });
    return bd < 1400 ? best : null;
  }

  /* =======================================================================
     SCROLL MEMORY (normal back/forward navigation)
     history.scrollRestoration is forced to 'manual' above so the 404 return
     flow can place its own offset. That also disables the browser's native
     "remember where I was" for ordinary back/forward moves, so a user who
     scrolls down a page, follows a link and hits Back gets dropped at the top.
     This keeps a small per-page map in sessionStorage and replays it only when
     the page was reached through history traversal, leaving fresh navigations
     at the top and deferring to the 404 flow / hash anchors when they apply. */
  var SCROLL_KEY = 'stackly_scroll';
  function scrollKey() {
    return location.pathname.split('/').pop() || 'index.html';
  }
  function readScrollMap() {
    try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function navType() {
    try {
      var e = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      return e ? e.type : 'navigate';
    } catch (err) { return 'navigate'; }
  }
  function scrollMemoryInit() {
    on(window, 'pagehide', function () {
      var map = readScrollMap();
      map[scrollKey()] = window.pageYOffset || document.documentElement.scrollTop || 0;
      try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map)); } catch (e) {}
    });
  }
  function restoreScroll() {
    /* the 404 return flow owns its own restore request */
    try { if (sessionStorage.getItem('stackly_restore')) return; } catch (e) {}
    /* hash targets are placed by anchorInit */
    if (location.hash) return;
    var t = navType();
    if (t !== 'back_forward' && t !== 'reload') return;
    var y = readScrollMap()[scrollKey()];
    if (!y) return;
    var jumped = false;
    function jump() {
      if (jumped) return;
      jumped = true;
      document.documentElement.classList.add('no-smooth');
      window.scrollTo(0, y);
      setTimeout(function () { document.documentElement.classList.remove('no-smooth'); }, 80);
    }
    var done = false;
    function once() {
      if (done) return;
      done = true;
      requestAnimationFrame(function () { requestAnimationFrame(jump); });
    }
    document.addEventListener('stackly:ready', once, { once: true });
    on(window, 'load', function () { setTimeout(once, 140); });
    setTimeout(once, 3200);
  }

  /* record origin for any 404 link */
  function wire404Links() {
    each($$('[data-404], a[href="404.html"]'), function (a) {
      on(a, 'click', function () { Back404.record(); });
    });
    /* Exact-position capture. The per-link handlers above only fire for links
       that existed when boot() ran, so anything injected later (cart markup from
       Store.render(), drawer content), plus form submits and location.href
       redirects, would fall back to the boot-time record - y = 0 - and send the
       user back to the top of the page rather than the section they left.
       pagehide fires at the instant the page is gone, whatever triggered the
       navigation, so it always sees the live scroll offset.
       Skipped on the 404 page itself: leaving it must not overwrite the origin
       with url:'404.html', which would flip the return button to "Back to home". */
    on(window, 'pagehide', function () {
      if (!document.getElementById('back404')) Back404.record();
    });
  }

  /* =======================================================================
     21. ANCHOR OFFSET + MISC
     ======================================================================= */
  function anchorInit() {
    on(window, 'load', function () {
      if (!location.hash) return;
      var t = document.querySelector(location.hash);
      if (!t) return;
      setTimeout(function () {
        var y = t.getBoundingClientRect().top + window.pageYOffset - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h'), 10) + 18);
        window.scrollTo(0, y);
      }, 120);
    });
  }

  function globalAdd() {
    on(document, 'click', function (e) {
      var add = e.target.closest ? e.target.closest('[data-add]') : null;
      if (add) { e.preventDefault(); Store.addCart(add); return; }
      var wish = e.target.closest ? e.target.closest('[data-wish]') : null;
      if (wish) {
        e.preventDefault();
        Store.addWish(Store.metaFromCard(wish));
        return;
      }
      var inc = e.target.closest ? e.target.closest('[data-inc]') : null;
      if (inc) { Store.setQty(inc.getAttribute('data-inc'), 1); return; }
      var dec = e.target.closest ? e.target.closest('[data-dec]') : null;
      if (dec) { Store.setQty(dec.getAttribute('data-dec'), -1); return; }
      var rm = e.target.closest ? e.target.closest('[data-rm]') : null;
      if (rm) { Store.rmCart(rm.getAttribute('data-rm')); toast('Removed from cart', '', 'fa-trash-can'); return; }
      var rmw = e.target.closest ? e.target.closest('[data-rmw]') : null;
      if (rmw) { Store.rmWish(rmw.getAttribute('data-rmw')); return; }
      var wpm = e.target.closest ? e.target.closest('#wishPageMove, #wishToCart') : null;
      if (wpm) { Store.moveAll(); return; }
      var cc = e.target.closest ? e.target.closest('#cartClear') : null;
      if (cc) { Store.clearCart(); toast('Cart cleared', '', 'fa-broom'); return; }
    });
  }

  /* =======================================================================
     22. FAQ contact / form validation
     ======================================================================= */
  var ALPHA_RE = /^[A-Za-z]+(?:[ '\u2019-][A-Za-z]+)*$/;
  /* phone fields: digits plus the usual separators, but no letters */
  var NUM_RE = /^[0-9+\-\s()]+$/;

  /* shared password strength score (0-4): feeds the sign-up meter and the
     "strong password" gate so both always agree */
  function pwScore(v) {
    var s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) s++;
    return s;
  }

  var RULE_ICO = '<i class="fa-solid fa-circle-exclamation"></i> ';
  /* newsletter empty-field copy lives outside RULE_MSG on purpose: that table
     has no "empty" key because generic forms keep their own per-field defaults
     ("A standfirst is required", "Passwords must match", ...) */
  var NL_EMPTY_MSG = RULE_ICO + 'Please complete this field';
  /* no key = value passed, so the field keeps its own default copy */
  var RULE_MSG = {
    alpha: RULE_ICO + 'Only alphabets are allowed',
    numeral: RULE_ICO + 'Only numerals are allowed',
    gmail: RULE_ICO + 'Only Gmail addresses are allowed',
    email: RULE_ICO + 'Enter a valid email address',
    consent: RULE_ICO + 'Please agree to continue',
    strong: RULE_ICO + 'Password is too weak — add uppercase, a number or a symbol'
  };

  function formsInit() {
    each($$('form[data-validate]:not([data-nl])'), function (f) {
      /* remember each field's original error copy so the alphabet rule can
         swap it in and later restore it without hardcoding strings twice */
      each($$('.field', f), function (x) {
        var em = x.querySelector('.err-msg');
        if (em && !em.dataset.defaultMsg) em.dataset.defaultMsg = em.innerHTML;
      });

      on(f, 'submit', function (e) {
        e.preventDefault();
        var ok = true, first = null;
        each($$('input[required], textarea[required], select[required]', f), function (i) {
          var field = i.closest('.field');
          var em = field && field.querySelector('.err-msg');
          var v = (i.value || '').trim();
          /* checkboxes carry value="on" whether or not they are ticked, so an
             empty-value test would wave an unticked consent box straight through */
          if ((i.type === 'checkbox' || i.type === 'radio') && !i.checked) v = '';
          /* work out the failure reason, most specific first, so the inline
             copy always names the rule that actually rejected the value */
          var reason = null;
          if (!v) reason = i.type === 'checkbox' || i.type === 'radio' ? 'consent' : 'empty';
          else if (i.type === 'email') {
            if (i.hasAttribute('data-gmail-only')) {
              if (!GMAIL_RE.test(v)) reason = 'gmail';
            } else if (!/^\S+@\S+\.\S+$/.test(v)) reason = 'email';
          } else if (i.hasAttribute('data-alpha-only') && !ALPHA_RE.test(v)) {
            reason = 'alpha';
          }
          /* swap in reason-specific copy, otherwise restore the default so an
             emptied field never keeps saying "Only alphabets are allowed" */
          if (em) em.innerHTML = RULE_MSG[reason]
            ? RULE_MSG[reason]
            : (em.dataset.defaultMsg || em.innerHTML);
          if (field) field.classList.toggle('invalid', !!reason);
          if (reason) { ok = false; if (!first) first = i; }
        });
        if (!ok) { if (first) first.focus(); toast('Please complete the form', 'Highlighted fields need attention', 'fa-triangle-exclamation'); return; }
        var btn = f.querySelector('[type="submit"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending'; }
        /* capture page + scroll offset before leaving, so the 404 page's return
           button names this page and lands on the form, not the top */
        Back404.record();
        setTimeout(function () { location.href = '404.html'; }, 700);
      });
      each($$('input, textarea, select', f), function (i) {
        on(i, 'input', function () { var fl = i.closest('.field'); if (fl) fl.classList.remove('invalid'); });
      });
    });
  }

  /* =======================================================================
     23. AUTH ROLE -> DASHBOARD
     ======================================================================= */
  function authInit() {
    var form = $('#authForm');
    if (!form) return;
    var role = $('#rolePick');
    var loginEmail = $('#loginEmail');
    function gmailValid(v) { return /^[^\s@]+@gmail\.com$/.test((v || '').trim()); }
    function markLogin(fieldEl, bad) {
      var fl = fieldEl.closest('.field');
      if (fl) fl.classList.toggle('invalid', bad);
    }
    /* live inline error: shows as soon as a non-Gmail address is typed, and on blur */
    if (loginEmail) {
      on(loginEmail, 'input', function () {
        var v = loginEmail.value.trim();
        if (!v) return;
        markLogin(loginEmail, !gmailValid(v));
      });
      on(loginEmail, 'blur', function () { markLogin(loginEmail, !gmailValid(loginEmail.value)); });
    }
    on(form, 'submit', function (e) {
      e.preventDefault();
      var email = $('#loginEmail'), pw = $('#loginPw');
      var bad = false;
      if (!email.value || !gmailValid(email.value)) { email.closest('.field').classList.add('invalid'); bad = true; }
      if (!pw.value || pw.value.length < 6) { pw.closest('.field').classList.add('invalid'); bad = true; }
      if (bad) { toast('Check your details', 'Email and password are required', 'fa-triangle-exclamation'); return; }
      var btn = form.querySelector('[type="submit"]');
      var html = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating';
      var r = (role && role.value) === 'admin' ? 'admin' : 'user';
      setTimeout(function () {
        try { sessionStorage.setItem('stackly_session', JSON.stringify({ role: r, email: email.value, at: Date.now() })); } catch (err) {}
        location.href = r === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
      }, 950);
      void html;
    });

    var sform = $('#signupForm');
    if (sform) {
      var suEmail = $('#suEmail');
      function gmailValid(v) { return /^[^\s@]+@gmail\.com$/.test((v || '').trim()); }
      function mark(emailEl, bad) {
        var fl = emailEl.closest('.field');
        if (fl) fl.classList.toggle('invalid', bad);
      }
      /* inline Gmail-only check: paints `.invalid` as soon as a non-Gmail
         address is typed, so the inline error shows while the user fills it */
      if (suEmail) {
        on(suEmail, 'input', function () {
          var v = suEmail.value.trim();
          if (!v) { mark(suEmail, false); return; }
          mark(suEmail, !gmailValid(v));
        });
        on(suEmail, 'blur', function () { mark(suEmail, !gmailValid(suEmail.value)); });
      }
      /* first/last name: allow letters only, surface the inline error the
         moment a digit or symbol is typed */
      function markRule(el, re, msg) {
        var fl = el.closest('.field');
        var em = fl && fl.querySelector('.err-msg');
        if (em && !em.dataset.defaultMsg) em.dataset.defaultMsg = em.innerHTML;
        var v = (el.value || '').trim();
        var bad = v !== '' && !re.test(v);
        if (em) em.innerHTML = bad ? msg : (em.dataset.defaultMsg || em.innerHTML);
        if (fl) fl.classList.toggle('invalid', bad);
        return bad;
      }
      each($$('[data-alpha-only]', sform), function (el) {
        on(el, 'input', function () { markRule(el, ALPHA_RE, RULE_MSG.alpha); });
        on(el, 'blur', function () { if (!(el.value || '').trim()) markRule(el, ALPHA_RE, RULE_MSG.alpha); });
      });
      /* phone: numerals only — letters flip the field to the inline error */
      each($$('[data-numeral-only]', sform), function (el) {
        on(el, 'input', function () { markRule(el, NUM_RE, RULE_MSG.numeral); });
        on(el, 'blur', function () { if (!(el.value || '').trim()) markRule(el, NUM_RE, RULE_MSG.numeral); });
      });
      /* strong password alert: warns inline the moment the entered password
         scores below "Good" and blocks submission until it is strong enough */
      var suPw = $('#suPw');
      function markStrong(el) {
        var fl = el.closest('.field');
        var em = fl && fl.querySelector('.err-msg');
        if (em && !em.dataset.defaultMsg) em.dataset.defaultMsg = em.innerHTML;
        var v = el.value || '';
        var bad = v !== '' && pwScore(v) < 3;
        if (em) em.innerHTML = bad ? RULE_MSG.strong : (em.dataset.defaultMsg || em.innerHTML);
        if (fl) fl.classList.toggle('invalid', bad);
        return bad;
      }
      if (suPw) {
        on(suPw, 'input', function () { markStrong(suPw); });
        on(suPw, 'blur', function () { if (!suPw.value) markStrong(suPw); });
      }
      /* consent checkbox: drop the inline error as soon as it is ticked */
      var suTerms = $('#suTerms');
      if (suTerms) on(suTerms, 'change', function () {
        if (suTerms.checked) {
          var fl = suTerms.closest('.field');
          if (fl) fl.classList.remove('invalid');
        }
      });
      on(sform, 'submit', function (e) {
        e.preventDefault();
        var ok = true;
        each($$('input[required]', sform), function (i) {
          var v = (i.value || '').trim();
          /* checkboxes carry value="on" whether or not they are ticked */
          if ((i.type === 'checkbox' || i.type === 'radio') && !i.checked) v = '';
          var bad = !v;
          var reason = bad && (i.type === 'checkbox' || i.type === 'radio') ? 'consent' : null;
          if (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)) bad = true;
          if (i === suEmail && !gmailValid(i.value)) bad = true;
          if (i.hasAttribute('data-alpha-only') && v && !ALPHA_RE.test(v)) { bad = true; reason = 'alpha'; }
          var fl = i.closest('.field');
          var em = fl && fl.querySelector('.err-msg');
          if (em && !em.dataset.defaultMsg) em.dataset.defaultMsg = em.innerHTML;
          if (em) em.innerHTML = (reason && RULE_MSG[reason]) ? RULE_MSG[reason] : (em.dataset.defaultMsg || em.innerHTML);
          if (fl) fl.classList.toggle('invalid', bad);
          if (bad) ok = false;
        });
        each($$('[data-numeral-only]', sform), function (i) {
          if (markRule(i, NUM_RE, RULE_MSG.numeral)) ok = false;
        });
        if (suPw && markStrong(suPw)) {
          ok = false;
          toast('Weak password', 'Add uppercase, a number or a symbol', 'fa-triangle-exclamation');
        }
        var p1 = $('#suPw'), p2 = $('#suPw2');
        if (p1 && p2 && p1.value !== p2.value) {
          p2.closest('.field').classList.add('invalid'); ok = false;
        }
        if (!ok) { toast('Almost there', 'Highlighted fields need attention', 'fa-triangle-exclamation'); return; }
        var btn = sform.querySelector('[type="submit"]');
        btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating account';
        /* capture page + scroll offset before leaving, so the 404 page's return
           button names this page and lands on the form */
        Back404.record();
        setTimeout(function () { location.href = '404.html'; }, 1200);
      });
    }

    var sp = $('#socialLogin');
    if (sp) on(sp, 'submit', function (e) {
      e.preventDefault();
      Back404.record();
      setTimeout(function () { location.href = '404.html'; }, 700);
    });
  }

  /* =======================================================================
     24. DASHBOARD
     ======================================================================= */
  function dashInit() {
    var side = $('#dashSide');
    var links = $$('.dash-link[data-pane]');
    var panes = $$('[data-dashpane]');
    function activate(key, push) {
      each(links, function (l) { l.classList.toggle('active', l.getAttribute('data-pane') === key && !l.hasAttribute('data-shortcut')); });
      each(panes, function (p) { p.classList.toggle('on', p.getAttribute('data-dashpane') === key); });
      if (push && location.hash !== '#' + key) {
        try { history.replaceState(null, '', '#' + key); } catch (e) {}
      }
      /* a freshly opened pane always starts at the top of its content, not at
         whatever scroll offset the previous pane was left at; jump straight
         there so the new pane is simply viewed from the top (no scroll anim).
         'instant' overrides the global scroll-behavior:smooth; the class +
         forced reflow is the fallback for browsers without 'instant' support. */
      if (push) {
        var html = document.documentElement;
        html.classList.add('no-smooth');
        void html.offsetHeight;
        try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
        catch (e) { window.scrollTo(0, 0); }
        setTimeout(function () { html.classList.remove('no-smooth'); }, 80);
      }
      if (DrawerControl.isOpen()) DrawerControl.close();
    }
    each(links, function (l) { on(l, 'click', function (e) { e.preventDefault(); activate(l.getAttribute('data-pane'), true); }); });
    var initial = (location.hash || '').replace('#', '');
    activate(panes.length && initial ? initial : 'overview', false);
    on(window, 'hashchange', function () {
      var k = (location.hash || '').replace('#', '');
      if (k) activate(k, false);
    });
    void side;

    /* mobile header burger: opens the dashboard sidebar as an off-canvas drawer */
    var mobBurger = $('#dashMobBurger');
    var dashScrim = $('#dashScrim');
    function closeSide() {
      if (!side) return;
      side.classList.remove('open');
      if (dashScrim) dashScrim.classList.remove('open');
      if (mobBurger) {
        mobBurger.classList.remove('active');
        mobBurger.setAttribute('aria-expanded', 'false');
      }
      document.body.classList.remove('is-locked');
    }
    if (mobBurger && side) {
      on(mobBurger, 'click', function () {
        var open = !side.classList.contains('open');
        side.classList.toggle('open', open);
        if (dashScrim) dashScrim.classList.toggle('open', open);
        mobBurger.classList.toggle('active', open);
        mobBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('is-locked', open);
      });
    }
    if (dashScrim) on(dashScrim, 'click', closeSide);
    each(links, function (l) { on(l, 'click', closeSide); });

    /* populate session identity — the display name is derived from the email
       used at sign-in; there is no hard-coded default persona */
    function nameFromEmail(email) {
      var local = String(email || '').split('@')[0];
      local = local.replace(/[._\-+]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!local) return '';
      return local.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    try {
      var s = JSON.parse(sessionStorage.getItem('stackly_session') || 'null');
      if (s && s.email) {
        var name = nameFromEmail(s.email);
        var parts = name.split(' ').filter(Boolean);
        var initials = parts.slice(0, 2).map(function (p) { return p.charAt(0); }).join('').toUpperCase();
        each($$('[data-session-email]'), function (n) { n.textContent = s.email; });
        each($$('[data-session-name]'), function (n) { n.textContent = name; });
        each($$('[data-session-initials]'), function (n) { n.textContent = initials; });
        each($$('#setName'), function (n) { n.value = name; });
        each($$('#setEmail'), function (n) { n.value = s.email; });
      }
    } catch (e) {}
    each($$('#signOutBtn, [data-signout]'), function (b) {
      on(b, 'click', function (e) {
        e.preventDefault();
        try { sessionStorage.removeItem('stackly_session'); } catch (err) {}
        toast('Signed out', 'See you on the trail', 'fa-right-from-bracket');
        setTimeout(function () { location.href = 'signin.html?tab=signin'; }, 700);
      });
    });

    /* order status filter chips: narrow the table to the chosen status and
       keep the "N OF 41 ORDERS" counter in step */
    each($$('.dash .fbar'), function (bar) {
      var chips = $$('.chip', bar);
      var scope = bar.closest('[data-dashpane]') || document;
      var tbody = scope.querySelector('table.tbl tbody');
      if (!chips.length || !tbody) return;
      var count = bar.querySelector('.fcount');
      var nums = count ? (count.textContent.match(/\d+/g) || []) : [];
      var total = nums.length > 1 ? nums[nums.length - 1] : nums[0];
      var rows = $$('tr', tbody);
      function apply(label) {
        var want = label.toLowerCase();
        var all = want.indexOf('all') === 0;
        var shown = 0;
        each(rows, function (tr) {
          var pill = tr.querySelector('.pill');
          var status = (pill ? pill.textContent : '').toLowerCase().replace(/\s+/g, ' ').trim();
          var match = all || status.indexOf(want) !== -1;
          tr.style.display = match ? '' : 'none';
          if (match) shown++;
        });
        if (count && total) count.textContent = shown + ' OF ' + total + ' ORDERS';
      }
      each(chips, function (c) {
        on(c, 'click', function () {
          each(chips, function (x) {
            var on2 = x === c;
            x.classList.toggle('on', on2);
            x.setAttribute('aria-pressed', on2 ? 'true' : 'false');
          });
          apply((c.textContent || '').trim());
        });
      });
    });
  }

  /* =======================================================================
     25. TILT / MISC micro-interactions
     ======================================================================= */
  function microInit() {
    /* magnetic buttons on desktop */
    if (!IS_TOUCH && !REDUCED) {
      each($$('[data-magnetic]'), function (m) {
        on(m, 'pointermove', function (e) {
          var r = m.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width / 2) * 0.28;
          var y = (e.clientY - r.top - r.height / 2) * 0.4;
          m.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        });
        on(m, 'pointerleave', function () { m.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)'; m.style.transform = ''; });
        on(m, 'pointerenter', function () { m.style.transition = ''; });
      });
    }
    /* live clock in footers / dashboards */
    each($$('[data-clock]'), function (n) {
      function t() {
        var d = new Date();
        n.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0') + ' PT';
      }
      t(); setInterval(t, 1000);
    });
    /* progress bars in dashboards */
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = e.target.querySelector('i'); if (i) i.style.width = (i.getAttribute('data-w') || '60') + '%';
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 }) : null;
    each($$('.bar-mini'), function (b) { if (io) io.observe(b); else { var i = b.querySelector('i'); if (i) i.style.width = (i.getAttribute('data-w') || '60') + '%'; } });
  }

  /* =======================================================================
     BOOT
     ======================================================================= */
  function boot() {
    if ('scrollRestoration' in history) {
      try { history.scrollRestoration = 'manual'; } catch (e) {}
    }
    autoSplit();
    headerInit();
    drawerInit();
    panelsInit();
    slideshowInit();
    marqueeInit();
    spotlightInit();
    parallaxInit();
    countersInit();
    accordionInit();
    footerInit();
    newsletterInit();
    passwordInit();
    tabsInit();
    videoInit();
    searchInit();
    shopInit();
    wishPageInit();
    formsInit();
    authInit();
    dashInit();
    microInit();
    globalAdd();
    wire404Links();
    Store.render();
    Store.syncFavs();
    anchorInit();
    scrollMemoryInit();
    restoreScroll();
    restorePending();

    if ($('#back404')) Back404.restoreOrBack();
    else Back404.record();

    /* reveal + marquee need final layout metrics */
    requestAnimationFrame(function () { marqueeInit(); Reveal.scan(); });
    on(window, 'load', function () { marqueeInit(); Reveal.scan(); });
    on(window, 'resize', function () { marqueeInit(); }, { passive: true });

    /* guard against any rogue horizontal overflow */
    var guardT;
    function guard() {
      document.body.style.setProperty('--ovw', document.documentElement.scrollWidth + 'px');
      clearTimeout(guardT);
      guardT = setTimeout(guard, 900);
    }
    guard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); Loader.init(); });
  else { boot(); Loader.init(); }
  on(window, 'load', function () { setTimeout(function () { Loader.start(); }, 120); });

  /* expose */
  window.Stackly = {
    store: Store, toast: toast, slideshow: Slideshow,
    drawer: function () { return DrawerControl; }, panel: function () { return PanelControl; }
  };
})();
