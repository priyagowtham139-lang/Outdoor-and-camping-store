/* ==========================================================================
   STACKLY — layout.js
   Renders the shared sticky header, mobile drawer, side panels, footer
   and toasts. Single source of truth for every page.
   ========================================================================== */
(function () {
  'use strict';

  var FA = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">';

  /* ---------------- Navigation model ---------------- */
  var NAV = [
    { id: 'home',      label: 'Home',      href: 'index.html',            ico: 'fa-house' },
    { id: 'shop',      label: 'Shop',      href: 'shop.html',             ico: 'fa-bag-shopping' },
    { id: 'gear',      label: 'Gear',      href: 'gear.html',             ico: 'fa-layer-group' },
    
    { id: 'journal',   label: 'Journal',   href: 'journal.html',          ico: 'fa-book-open' },
    { id: 'contact',   label: 'Contact',   href: 'contact.html',          ico: 'fa-compass' }
  ];

  /* ---------------- Footer columns ----------------
     Only the Company column routes to live pages (built from NAV below).
     Every other footer link points at 404.html, so nothing dead-links. */
  var FCOLS = [
    {
      h: 'Shop',
      links: [
        ['404.html', 'New Arrivals'],
        ['404.html', 'Tents & Shelters'],
        ['404.html', 'Sleep Systems'],
        ['404.html', 'Backpacks'],
        ['404.html', 'Camp Kitchen'],
        ['404.html', 'Technical Apparel'],
        ['404.html', 'Lighting & Power'],
        ['404.html', 'All Products']
      ]
    },
    {
      h: 'Explore',
      links: [
        ['404.html', 'Equipment Categories'],
        ['404.html', 'Field Notes'],
        ['404.html', 'Campfire Stories'],
        ['404.html', 'Kit Builder'],
        ['404.html', 'Latest Journal']
      ]
    },
    {
      h: 'Support',
      links: [
        ['404.html', 'Shipping & Delivery'],
        ['404.html', 'Returns & Exchanges'],
        ['404.html', 'Warranty Claims'],
        ['404.html', 'Size & Fit Guide'],
        ['404.html', 'Contact Support'],
        ['404.html', 'Find a Store'],
        ['404.html', 'Track an Order'],
        ['404.html', 'Gift Cards']
      ]
    },
    {
      h: 'Company',
      nav: true,
      links: NAV.map(function (n) { return [n.href, n.label]; })
    }
  ];

  var SOCIALS = [
    ['fa-facebook-f',  'Facebook'],
    ['fa-x-twitter',   'X'],
    ['fa-instagram',   'Instagram'],
    ['fa-youtube',     'YouTube'],
    ['fa-linkedin-in', 'LinkedIn'],
    ['fa-pinterest-p', 'Pinterest']
  ];

  /* ---------------- Header ---------------- */
  function headerHTML(active) {
    var deskNav = NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (n.id === active ? ' class="active" aria-current="page"' : '') + '>' + n.label + '</a>';
    }).join('');

    var drawerNav = NAV.map(function (n, i) {
      return '<a class="drawer-link' + (n.id === active ? ' active' : '') + '" href="' + n.href + '"' +
        (n.id === active ? ' aria-current="page"' : '') + ' data-nav="' + n.id + '">' +
        '<span class="dl-ico"><i class="fa-solid ' + n.ico + '"></i></span>' +
        '<span>' + n.label + '</span>' +
        '<span class="dl-idx">0' + (i + 1) + '</span>' +
        '</a>';
    }).join('');

    var socials = SOCIALS.map(function (s) {
      return '<a href="404.html" data-404 title="' + s[1] + '" aria-label="' + s[1] + '"><i class="fa-brands ' + s[0] + '"></i></a>';
    }).join('');

    return '' +
    '<header class="site-header" id="siteHeader">' +
      '<div class="hdr">' +
        '<a class="logo" href="index.html" aria-label="Stackly home">' +
          '<img class="logo-img" src="assets/logo_c2410c.webp" alt="" width="367" height="98" />' +
        '</a>' +

        '<nav class="main-nav" aria-label="Primary">' + deskNav + '</nav>' +

        '<div class="hdr-tools">' +
          '<form class="search" id="searchForm" role="search" autocomplete="off">' +
            '<i class="fa-solid fa-magnifying-glass"></i>' +
            '<input type="search" id="searchInput" name="q" placeholder="Search tents, stoves, trails" aria-label="Search products" />' +
            '<button type="submit" aria-label="Run search"><i class="fa-solid fa-arrow-right-long"></i></button>' +
            '<div class="search-suggest" id="searchSuggest">' +
              '<a href="shop.html" class="hot"><i class="fa-solid fa-fire"></i> Trending: 3-season tent</a>' +
              '<a href="shop.html"><i class="fa-solid fa-utensils"></i> Titanium cook set</a>' +
              '<a href="gear.html"><i class="fa-solid fa-tent"></i> Expedition shelter</a>' +
              '<a href="journal.html"><i class="fa-solid fa-book"></i> Winter field notes</a>' +
            '</div>' +
          '</form>' +

          '<button class="icon-btn only-mob" id="searchToggle" aria-label="Open search" aria-expanded="false">' +
            '<i class="fa-solid fa-magnifying-glass"></i></button>' +

          '<a class="icon-btn only-lg" href="wishlist.html" aria-label="Wishlist">' +
            '<i class="fa-regular fa-heart"></i><span class="count-badge" id="wishCount">0</span></a>' +

          '<button class="icon-btn only-lg" data-open-panel="cartPanel" aria-label="Open cart">' +
            '<i class="fa-solid fa-bag-shopping"></i><span class="count-badge" id="cartCount">0</span></button>' +

          '<a class="btn btn-signin" href="signin.html?tab=signin"><i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In</a>' +

          '<button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">' +
            '<i class="fa-solid fa-bars i-open"></i><i class="fa-solid fa-xmark i-close"></i>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</header>' +

    '<div class="drawer-scrim" id="drawerScrim"></div>' +
    '<aside class="drawer" id="drawer" aria-label="Mobile menu" aria-hidden="true">' +
      '<div class="drawer-top">' +
        '<img class="logo-img" src="assets/logo_c2410c.webp" alt="" width="367" height="98" />' +
        '<span class="drawer-label">Menu</span>' +
        '<button class="drawer-x" id="drawerClose" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<nav class="drawer-nav">' +
        '<div class="drawer-sub">Primary</div>' +
        drawerNav +
        '<div class="drawer-sep"></div>' +
        '<a class="drawer-link sm' + (active === 'wishlist' ? ' active' : '') + '" href="wishlist.html" data-nav="wishlist"' + (active === 'wishlist' ? ' aria-current="page"' : '') + '>' +
          '<span class="dl-ico"><i class="fa-solid fa-heart"></i></span><span>Wishlist</span>' +
          '<span class="dl-idx" id="drawerWishCount">0</span></a>' +
        '<button class="drawer-link sm" type="button" data-open-panel="cartPanel">' +
          '<span class="dl-ico"><i class="fa-solid fa-bag-shopping"></i></span><span>Add to Cart</span>' +
          '<span class="dl-idx" id="drawerCartCount">0</span></button>' +
      '</nav>' +
      '<div class="drawer-foot">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;">' +
          '<a class="btn solid block" href="signin.html?tab=signin"><i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In</a>' +
          '<a class="btn block" href="signin.html?tab=signup"><i class="fa-solid fa-user-plus"></i> Sign Up</a>' +
        '</div>' +
        '<div class="drawer-socials">' + socials + '</div>' +
      '</div>' +
    '</aside>';
  }

  /* ---------------- Cart / Wishlist panels ---------------- */
  function panelsHTML() {
    return '' +
    '<div class="drawer-scrim" id="panelScrim"></div>' +

    '<aside class="panel" id="cartPanel" aria-label="Shopping cart" aria-hidden="true">' +
      '<div class="panel-top">' +
        '<span class="logo-mark" style="width:34px;height:34px;border-radius:9px;font-size:.8rem"><i class="fa-solid fa-bag-shopping"></i></span>' +
        '<h3>Your Cart</h3><span class="cnt" id="cartPanelCount">0 ITEMS</span>' +
        '<button class="drawer-x" data-close-panel aria-label="Close cart"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<div class="panel-body" id="cartBody"></div>' +
      '<div class="panel-foot">' +
        '<div class="sum-row"><span>Subtotal</span><span id="cartSub">$0.00</span></div>' +
        '<div class="sum-row"><span>Shipping</span><span id="cartShip">Calculated at checkout</span></div>' +
        '<div class="sum-row total"><span>Total</span><span id="cartTotal">$0.00</span></div>' +
        '<a class="btn solid block" href="404.html" data-404><i class="fa-solid fa-lock"></i> Secure Checkout</a>' +
        '<button class="btn block" id="cartClear"><i class="fa-solid fa-trash-can"></i> Clear Cart</button>' +
      '</div>' +
    '</aside>' +

    '<aside class="panel" id="wishPanel" aria-label="Wishlist" aria-hidden="true">' +
      '<div class="panel-top">' +
        '<span class="logo-mark" style="width:34px;height:34px;border-radius:9px;font-size:.8rem"><i class="fa-solid fa-heart"></i></span>' +
        '<h3>Wishlist</h3><span class="cnt" id="wishPanelCount">0 SAVED</span>' +
        '<button class="drawer-x" data-close-panel aria-label="Close wishlist"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<div class="panel-body" id="wishBody"></div>' +
      '<div class="panel-foot">' +
        '<button class="btn solid block" id="wishToCart"><i class="fa-solid fa-cart-plus"></i> Move All to Cart</button>' +
        '<a class="btn block" href="wishlist.html"><i class="fa-solid fa-list"></i> Open Full Wishlist</a>' +
      '</div>' +
    '</aside>';
  }

  /* ---------------- Footer ---------------- */
  function footerHTML() {
    var cols = FCOLS.map(function (c) {
      var links = c.links.map(function (l) {
        var is404 = /404\.html/.test(l[0]);
        return '<a href="' + l[0] + '"' + (is404 ? ' data-404' : '') + '>' + l[1] + '</a>';
      }).join('');
      return '' +
      '<div class="fcol">' +
        '<button class="fcol-btn" aria-expanded="false"><span>' + c.h + '</span><span class="fx"><i class="fa-solid fa-chevron-down"></i></span></button>' +
        '<div class="fcol-body"><div class="fcol-inner">' + links + '</div></div>' +
      '</div>';
    }).join('');

    var socials = SOCIALS.map(function (s) {
      return '<a href="404.html" data-404 title="' + s[1] + '" aria-label="' + s[1] + '"><i class="fa-brands ' + s[0] + '"></i></a>';
    }).join('');

    return '' +
    '<footer class="footer" id="siteFooter">' +
      '<div class="wrap">' +

        '<div class="footer-top ftwo">' +
          '<div>' +
            '<a class="logo" href="index.html" style="margin-bottom:1.1rem">' +
              '<img class="logo-img" src="assets/logo_c2410c.webp" alt="Stackly Outdoor Co." width="367" height="98" />' +
            '</a>' +
            '<div class="footer-brand">' +
              '<p class="footer-about">Stackly Outdoor Co. builds field-tested equipment for people who treat the trail as a workplace. ' +
              'We design in Portland, torture-test in the Cascades, and ship to 48 countries from a carbon-neutral facility in Reno. ' +
              'Every piece leaves our floor repairable, recyclable, and honest about what it can do.</p>' +
              '<div class="footer-badges">' +
                '<span class="fbadge"><i class="fa-solid fa-leaf"></i> Climate Neutral</span>' +
                '<span class="fbadge"><i class="fa-solid fa-recycle"></i> Repairable</span>' +
                '<span class="fbadge"><i class="fa-solid fa-award"></i> Lifetime Warranty</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div style="display:grid;gap:1.4rem;align-content:start">' +
            '<div>' +
              '<b class="mono" style="display:block;margin-bottom:.8rem">Newsletter</b>' +
              '<form class="nl-form" id="nlForm" data-nl novalidate>' +
                '<div class="nl-field">' +
                  '<input type="email" name="email" placeholder="trailhead@gmail.com" aria-label="Email address" aria-describedby="nlErr" required />' +
                  '<span class="err-msg" id="nlErr" role="alert"><i class="fa-solid fa-circle-exclamation"></i> Only Gmail addresses are allowed</span>' +
                '</div>' +
                '<button class="btn solid" type="submit" aria-label="Subscribe"><i class="fa-solid fa-paper-plane"></i></button>' +
              '</form>' +
              '<p class="nl-note">Field reports, gear drops and route intel. Two letters a month, no filler.</p>' +
            '</div>' +
            '<div>' +
              '<b class="mono" style="display:block;margin-bottom:.8rem">Head Office</b>' +
              '<div class="addr-list">' +
                '<div class="addr-row"><span class="ic"><i class="fa-solid fa-location-dot"></i></span>' +
                  '<span><b>Stackly Outdoor Co.</b>MMR Complex, Chinna Thirupathi (near Chinna Muniyappan Kovil)<br>Salem, Tamil Nadu 636008, India</span></div>' +
                '<div class="addr-row"><span class="ic"><i class="fa-solid fa-phone"></i></span>' +
                  '<span><b>Sales &amp; Support</b><a href="tel:+917010792745">+91 70107 92745</a> &middot; Mon&ndash;Fri 07:00&ndash;19:00 PT</span></div>' +
                '<div class="addr-row"><span class="ic"><i class="fa-solid fa-envelope"></i></span>' +
                  '<span><b>Email</b><a href="mailto:info@thestackly.com">info@thestackly.com</a></span></div>' +
                '<div class="addr-row"><span class="ic"><i class="fa-solid fa-industry"></i></span>' +
                  '<span><b>Fulfilment Hub</b>9400 Sierra Vista Parkway<br>Reno, Nevada 89506, United States</span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="fcols">' + cols + '</div>' +

        '<div class="footer-top fmeta">' +
          '<div class="socials">' + socials + '</div>' +
          '<div style="display:grid;gap:.5rem;justify-items:start">' +
            '<span class="mono dim">Storefront status</span>' +
            '<span class="pill ok"><i class="fa-solid fa-circle"></i> All systems operational</span>' +
          '</div>' +
          '<div style="display:grid;gap:.5rem;justify-items:start">' +
            '<span class="mono dim">Accepted payments</span>' +
            '<div class="pay-row"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>PAYPAL</span><span>APPLE PAY</span><span>KLARNA</span></div>' +
          '</div>' +
          '<div style="display:grid;gap:.5rem;justify-items:start">' +
            '<span class="mono dim">Regional hubs</span>' +
            '<div class="chip-row"><span class="chip">Portland</span><span class="chip">Reno</span><span class="chip">Boulder</span><span class="chip">Innsbruck</span></div>' +
          '</div>' +
        '</div>' +

        '<div class="footer-bottom">' +
          '<div class="fb-left">' +
            '<span>&copy; <span id="yr">2026</span> Stackly Outdoor Co. All rights reserved.</span>' +
            '<a href="404.html" data-404>Privacy</a><a href="404.html" data-404>Terms</a><a href="404.html" data-404>Cookies</a>' +
            '<a href="404.html" data-404>Accessibility</a>' +
          '</div>' +
          '<div class="fb-left">' +
            '<span>Designed &amp; built in Portland, Oregon</span>' +
            '<a href="404.html" data-404>Status page</a>' +
          '</div>' +
        '</div>' +

        '<div class="footer-giant" aria-hidden="true">STACKLY</div>' +
      '</div>' +
    '</footer>' +

    '<button class="totop" id="toTop" aria-label="Back to top">' +
      '<i class="fa-solid fa-arrow-up"></i>' +
      '<svg class="ring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22"/></svg>' +
    '</button>' +

    '<div class="toast-wrap" id="toastWrap" aria-live="polite"></div>' +

    '<div class="video-modal" id="videoModal">' +
      '<button class="icon-btn vm-close" id="vmClose" aria-label="Close video"><i class="fa-solid fa-xmark"></i></button>' +
      '<div class="vm-box"><video id="vmVideo" controls playsinline preload="none"></video></div>' +
    '</div>';
  }

  /* ---------------- Mount ---------------- */
  /* Mobile-only header for the two dashboards: just the logo and a burger
     that opens the off-canvas sidebar (hidden from 1080px up via CSS). */
  function dashHeaderHTML() {
    return '' +
    '<header class="dash-mobile-header" id="dashMobileHeader">' +
      '<a class="logo" href="index.html" aria-label="Stackly home">' +
        '<img class="logo-img" src="assets/logo_c2410c.webp" alt="Stackly" width="367" height="98" />' +
      '</a>' +
      '<button class="dash-mob-burger" id="dashMobBurger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="dashSide">' +
        '<i class="fa-solid fa-bars i-open"></i><i class="fa-solid fa-xmark i-close"></i>' +
      '</button>' +
    '</header>' +
    '<div class="dash-scrim" id="dashScrim"></div>';
  }

  function mount() {
    var page = document.body.getAttribute('data-page') || 'home';
    /* both dashboards run their own chrome: a mobile-only header replaces the
       shared one, and the shared footer is skipped; keep the toast host */
    var isDash = page === 'user-dashboard' || page === 'admin-dash';
    var hHost = document.getElementById('layout-header');
    var fHost = document.getElementById('layout-footer');
    if (hHost) {
      hHost.outerHTML = isDash ? dashHeaderHTML() : headerHTML(page);
    }
    if (fHost) {
      fHost.outerHTML = isDash
        ? '<div class="toast-wrap" id="toastWrap" aria-live="polite"></div>'
        : footerHTML() + panelsHTML();
    }

    var yr = document.getElementById('yr');
    if (yr) yr.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
