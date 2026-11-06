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
    'dialog { overscroll-behavior: contain; }' +
    // ---- Edge to edge around the Dynamic Island / notch and the home indicator ----
    ':root { --ios-safe-top: env(safe-area-inset-top, 0px); }' +
    'html.ios-app body { padding-top: var(--ios-safe-top) !important; }' +
    'html.ios-app .auth-screen { padding-top: calc(22px + var(--ios-safe-top)) !important; padding-bottom: calc(22px + var(--safe-bottom)) !important; }' +
    // Windows never reach under the Dynamic Island
    'html.ios-app dialog[open] { max-height: calc(100dvh - var(--ios-safe-top) - 10px) !important; }' +
    'html.ios-app dialog > .modal-card, html.ios-app dialog > .chart-modal-card, html.ios-app dialog > form.modal-card { max-height: calc(100dvh - var(--ios-safe-top) - 10px) !important; }' +
    // Frosted strip behind the status bar: content scrolling up slides under it, like in native apps
    '.debo-status-scrim { position: fixed; top: 0; left: 0; right: 0; height: var(--ios-safe-top); z-index: 1001; pointer-events: none;' +
    '  background: color-mix(in srgb, var(--page, #F5F7F4) 72%, transparent); -webkit-backdrop-filter: saturate(1.8) blur(20px); backdrop-filter: saturate(1.8) blur(20px);' +
    '  opacity: 0; transition: opacity .25s ease; }' +
    'html.debo-scrolled .debo-status-scrim { opacity: 1; }' +
    // Press-and-hold on buttons and cards must not select text or open a callout (it does in Safari)
    'html.ios-app body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }' +
    'html.ios-app :is(input, textarea, [contenteditable="true"], .selectable) { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }';
  document.head.appendChild(style);

  var scrim = document.createElement('div');
  scrim.className = 'debo-status-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim);
  var scrolledFrame = 0;
  function syncScrolled() {
    scrolledFrame = 0;
    root.classList.toggle('debo-scrolled', window.scrollY > 4 || root.classList.contains('debo-scroll-locked'));
  }
  window.addEventListener('scroll', function () { if (!scrolledFrame) scrolledFrame = requestAnimationFrame(syncScrolled); }, { passive: true });

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

  // A light tap of the Taptic Engine with every confirmation message (saved, deleted, copied …)
  if (typeof window.toast === 'function' && window.DeboHaptic) {
    var showToast = window.toast;
    window.toast = function () {
      try { window.DeboHaptic('light'); } catch (e) {}
      return showToast.apply(this, arguments);
    };
  }

  // While a window (dialog) is open, the page behind it must not scroll
  var lockedAt = null;
  function tellApp(locked) {
    try { window.webkit.messageHandlers.deboLock.postMessage({ locked: locked }); } catch (e) {}
  }
  function syncScrollLock() {
    var open = !!document.querySelector('dialog[open]');
    if (open) rememberSheet();
    if (open && unlocking) {
      unlocking = false;
      clearTimeout(unlockTimer);
      tellApp(true);
      return;
    }
    if (open && lockedAt === null) {
      lockedAt = window.scrollY;
      root.classList.add('debo-scroll-locked');
      document.body.style.top = -lockedAt + 'px';
      tellApp(true);
    } else if (!open && lockedAt !== null && !unlocking) {
      // First the app releases its hold on the page, then the page is unlocked and put back at the
      // same place in one step, so it never shows at the top for a moment
      unlocking = true;
      tellApp(false);
      clearTimeout(unlockTimer);
      unlockTimer = setTimeout(finishUnlock, 400); // in case the app does not answer
    }
  }
  var unlocking = false, unlockTimer = 0;
  function finishUnlock() {
    clearTimeout(unlockTimer);
    if (!unlocking) return;
    unlocking = false;
    if (document.querySelector('dialog[open]')) { tellApp(true); return; } // another window opened meanwhile
    var y = lockedAt;
    lockedAt = null;
    root.classList.remove('debo-scroll-locked');
    document.body.style.top = '';
    // Instantly: the page has smooth scrolling, which would slide down from the top
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }
  window.__deboUnpinned = function () { requestAnimationFrame(finishUnlock); };
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
