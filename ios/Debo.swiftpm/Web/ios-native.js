// iOS only (loaded by the Swift app, not by index.html): small fixes so the web app behaves like an iPhone app.
// Text fields, drop-down lists and time pickers use the normal iOS keyboard and pickers of WKWebView.
(function () {
  if (window.__deboIos) return;
  window.__deboIos = true;
  var root = document.documentElement;
  root.classList.add('ios-app', 'debo-touch');

  // No automatic zoom when a small text field gets focus
  var viewport = document.querySelector('meta[name=viewport]');
  if (viewport && viewport.content.indexOf('maximum-scale') < 0) viewport.content += ',maximum-scale=1';

  var style = document.createElement('style');
  style.textContent =
    // Android-only parts: Health Connect, voice input (no Web Speech in WKWebView), Android notes
    '#cgm-sync, #food-mode-voice, [data-i18n="careNote"], [data-i18n="customRemindersNote"] { display: none !important; }' +
    'html { -webkit-text-size-adjust: 100%; } body { -webkit-tap-highlight-color: transparent; }' +
    // Focus rings are for keyboard users; iOS also shows them after a window closes on a touch screen
    'html.debo-touch :focus-visible:not(input):not(textarea):not(select) { outline: none !important; }' +
    // While a window is open the page behind it stays still
    'html.debo-scroll-locked, html.debo-scroll-locked body { overflow: hidden !important; overscroll-behavior: none; }' +
    'html.debo-scroll-locked body { position: fixed !important; left: 0; right: 0; width: 100%; }' +
    'dialog { overscroll-behavior: contain; }';
  document.head.appendChild(style);

  document.addEventListener('pointerdown', function () { root.classList.add('debo-touch'); }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' || e.key.indexOf('Arrow') === 0) root.classList.remove('debo-touch');
  }, true);

  // The app focuses some fields by itself (name, amount, search). iOS then shows a cursor but no keyboard,
  // and a tap on that already focused field does not open it either. Blur it on touch, so the tap
  // focuses it again as a real tap and the keyboard opens.
  var TEXT = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]):not([type=time]):not([type=date]), textarea';
  var touchedField = null, touchedAt = 0, tappedFocus = null;
  document.addEventListener('touchstart', function (e) {
    var field = e.target && e.target.closest ? e.target.closest(TEXT) : null;
    touchedField = field;
    touchedAt = Date.now();
    // Only a field the app focused by itself; one you are typing in keeps its keyboard
    if (field && field === document.activeElement && field !== tappedFocus) field.blur();
  }, { capture: true, passive: true });
  document.addEventListener('focusin', function (e) {
    tappedFocus = e.target === touchedField && Date.now() - touchedAt < 1500 ? e.target : null;
  }, true);
  document.addEventListener('focusout', function (e) {
    if (e.target === tappedFocus) tappedFocus = null;
  }, true);

  // While a window (dialog) is open, the page behind it must not scroll
  var lockedAt = null;
  function tellApp(locked) {
    try { window.webkit.messageHandlers.deboLock.postMessage({ locked: locked }); } catch (e) {}
  }
  function syncScrollLock() {
    var open = !!document.querySelector('dialog[open]');
    if (open) rememberSheet();
    if (open && lockedAt === null) {
      lockedAt = window.scrollY;
      root.classList.add('debo-scroll-locked');
      document.body.style.top = -lockedAt + 'px';
      tellApp(true);
    } else if (!open && lockedAt !== null) {
      tellApp(false);
      var y = lockedAt;
      lockedAt = null;
      root.classList.remove('debo-scroll-locked');
      document.body.style.top = '';
      window.scrollTo(0, y);
    }
  }
  // When the keyboard opens or closes, the app shrinks or grows the page together with it.
  // An open window then glides to its new place instead of jumping there (FLIP animation).
  var sheet = { el: null, top: 0 };
  function openSheet() {
    return document.querySelector('dialog[open]:not(.debo-closing)');
  }
  function layoutTop(d) {
    // Where the window sits without any running animation
    var h = d.offsetHeight, vh = window.innerHeight;
    return window.matchMedia('(max-width:760px)').matches ? vh - h : Math.max(0, (vh - h) / 2);
  }
  function rememberSheet() {
    var d = openSheet();
    sheet.el = d;
    if (d) sheet.top = layoutTop(d);
  }
  window.addEventListener('resize', function () {
    var d = openSheet();
    if (!d) { sheet.el = null; return; }
    var before = sheet.el === d ? sheet.top : null;
    var after = layoutTop(d);
    sheet.el = d;
    sheet.top = after;
    if (before === null || Math.abs(before - after) < 2 || !d.animate) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    d.animate([{ transform: 'translateY(' + (before - after) + 'px)' }, { transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', composite: 'add' });
  });
  // The window's own height changes (content shown or hidden) also glide
  if (window.ResizeObserver) {
    var sheetObserver = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        var d = entry.target;
        if (d !== openSheet() || sheet.el !== d) return;
        var before = sheet.top, after = layoutTop(d);
        sheet.top = after;
        if (Math.abs(before - after) < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        d.animate([{ transform: 'translateY(' + (before - after) + 'px)' }, { transform: 'none' }],
          { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)', composite: 'add' });
      });
    });
    document.querySelectorAll('dialog').forEach(function (d) { sheetObserver.observe(d); });
  }
  new MutationObserver(syncScrollLock).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
  syncScrollLock();
})();
