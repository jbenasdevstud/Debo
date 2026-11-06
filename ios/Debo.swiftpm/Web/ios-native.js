// iOS only (loaded by the Swift app, not by index.html).
// WKWebView inside Swift Playgrounds does not bring up the iOS keyboard or pickers for web fields,
// so every text, number, date/time field and select is edited with a native iOS control placed
// over it. The native side sends the value back and this script fires the same input / change /
// Enter events the page gets in a browser, so app.js works unchanged.
(function () {
  if (window.__deboInput) return;
  var post = function (body) {
    window.webkit.messageHandlers.deboInput.postMessage(body);
  };

  document.documentElement.classList.add('ios-app');
  var style = document.createElement('style');
  // Android-only parts: Health Connect, voice input (no Web Speech in WKWebView), Android notes
  style.textContent =
    '#cgm-sync, #food-mode-voice, [data-i18n="careNote"], [data-i18n="customRemindersNote"] { display: none !important; }' +
    'html { -webkit-text-size-adjust: 100%; } body { -webkit-tap-highlight-color: transparent; }' +
    '.debo-native-editing { color: transparent !important; -webkit-text-fill-color: transparent !important; caret-color: transparent !important; }' +
    // Focus rings are for keyboard users; iOS also shows them after a window closes on a touch screen
    'html.debo-touch :focus-visible:not(input):not(textarea):not(select) { outline: none !important; }';
  document.head.appendChild(style);

  var root = document.documentElement;
  root.classList.add('debo-touch');
  document.addEventListener('pointerdown', function () { root.classList.add('debo-touch'); }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' || e.key.indexOf('Arrow') === 0) root.classList.remove('debo-touch');
  }, true);

  var TEXT_TYPES = ['text', 'search', 'email', 'password', 'tel', 'url', 'number', ''];
  var PICKER_TYPES = ['time', 'date', 'datetime-local', 'month'];

  function kind(el) {
    if (!el || el.disabled || el.readOnly) return null;
    if (el.tagName === 'SELECT') return 'select';
    if (el.tagName === 'TEXTAREA') return 'text';
    if (el.tagName !== 'INPUT') return null;
    var type = (el.getAttribute('type') || 'text').toLowerCase();
    if (TEXT_TYPES.indexOf(type) >= 0) return 'text';
    if (PICKER_TYPES.indexOf(type) >= 0) return 'picker';
    return null;
  }

  function fieldFrom(target) {
    var el = target && target.closest ? target.closest('input, textarea, select') : null;
    if (!el && target && target.closest) {
      var label = target.closest('label');
      if (label) el = label.control;
    }
    return kind(el) ? el : null;
  }

  var current = null;
  var token = 0;
  var lastRect = '';
  var tracker = 0;
  var suppressFocus = false;

  function rectOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }

  // The page sometimes rebuilds a field while it is being edited (food catalogue search):
  // carry on with the new copy instead of closing the keyboard
  function live() {
    if (!current) return null;
    if (current.el.isConnected) return current.el;
    var fresh = current.el.id ? document.getElementById(current.el.id) : null;
    if (!fresh || kind(fresh) !== current.kind) return null;
    current.el = fresh;
    if (current.kind === 'text') {
      fresh.classList.add('debo-native-editing');
      if (fresh.hasAttribute('placeholder')) {
        current.placeholder = fresh.getAttribute('placeholder');
        fresh.removeAttribute('placeholder');
      }
    }
    if (document.activeElement !== fresh) {
      suppressFocus = true;
      fresh.focus({ preventScroll: true });
      suppressFocus = false;
    }
    return fresh;
  }

  function visible(el) {
    if (!el.isConnected) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function open(el) {
    if (current && (current.el === el || live() === el)) {
      post({ action: 'show', token: current.token });
      return;
    }
    if (current) finish(false);
    var k = kind(el);
    var cs = getComputedStyle(el);
    var info = {
      action: 'open',
      token: ++token,
      kind: k,
      type: (el.getAttribute('type') || (el.tagName === 'TEXTAREA' ? 'textarea' : 'text')).toLowerCase(),
      value: el.value || '',
      placeholder: el.getAttribute('placeholder') || '',
      inputmode: el.getAttribute('inputmode') || '',
      enterkeyhint: el.getAttribute('enterkeyhint') || '',
      autocapitalize: el.getAttribute('autocapitalize') || '',
      autocomplete: el.getAttribute('autocomplete') || '',
      maxLength: el.maxLength > 0 ? el.maxLength : 0,
      min: el.getAttribute('min') || '',
      max: el.getAttribute('max') || '',
      fontSize: parseFloat(cs.fontSize) || 16,
      fontWeight: parseInt(cs.fontWeight, 10) || 400,
      color: cs.color,
      align: cs.textAlign,
      paddingLeft: parseFloat(cs.paddingLeft) || 0,
      paddingRight: parseFloat(cs.paddingRight) || 0,
      rect: rectOf(el)
    };
    if (k === 'select') {
      info.options = Array.prototype.map.call(el.options, function (o, i) {
        return { label: o.label || o.text, index: i, selected: o.selected, disabled: o.disabled || o.hidden };
      });
      var label = el.labels && el.labels[0] ? el.labels[0].cloneNode(true) : null;
      if (label) label.querySelectorAll('select, small, option').forEach(function (n) { n.remove(); });
      info.label = (label ? label.textContent : el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    }
    current = { el: el, token: info.token, kind: k, placeholder: el.getAttribute('placeholder') };
    if (k === 'text') {
      el.classList.add('debo-native-editing');
      if (current.placeholder !== null) el.removeAttribute('placeholder');
    }
    lastRect = JSON.stringify(info.rect);
    clearInterval(tracker);
    tracker = setInterval(track, 120);
    post(info);
  }

  function track() {
    if (!current) return clearInterval(tracker);
    var el = live();
    if (!el || !visible(el)) {
      post({ action: 'close', token: current.token });
      finish(false);
      return;
    }
    var rect = rectOf(el);
    var key = JSON.stringify(rect);
    if (key !== lastRect) {
      lastRect = key;
      post({ action: 'move', token: current.token, rect: rect });
    }
  }

  function fire(el, type) {
    el.dispatchEvent(new Event(type, { bubbles: true }));
  }

  function finish(blur) {
    if (!current) return;
    var c = current;
    current = null;
    clearInterval(tracker);
    c.el.classList.remove('debo-native-editing');
    if (c.el.id) {
      var copy = document.getElementById(c.el.id);
      if (copy && copy !== c.el) {
        copy.classList.remove('debo-native-editing');
        if (c.placeholder !== null && c.placeholder !== undefined && !copy.hasAttribute('placeholder')) copy.setAttribute('placeholder', c.placeholder);
      }
    }
    if (c.placeholder !== null && c.placeholder !== undefined) c.el.setAttribute('placeholder', c.placeholder);
    if (blur && document.activeElement === c.el) c.el.blur();
  }

  function setValue(el, value) {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, value);
  }

  // Called by Swift
  window.__deboInput = {
    input: function (t, value) {
      if (!current || current.token !== t) return;
      var el = live();
      if (!el) return;
      if (el.type === 'number') value = String(value).replace(',', '.');
      setValue(el, value);
      fire(el, 'input');
      if (current.kind === 'picker') fire(el, 'change');
    },
    select: function (t, index) {
      if (!current || current.token !== t) return;
      var el = live() || current.el;
      if (el.selectedIndex !== index) {
        el.selectedIndex = index;
        fire(el, 'input');
        fire(el, 'change');
      }
      finish(true);
    },
    enter: function (t) {
      if (!current || current.token !== t) return;
      var el = live() || current.el;
      var opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
      var down = new KeyboardEvent('keydown', opts);
      var allowed = el.dispatchEvent(down);
      el.dispatchEvent(new KeyboardEvent('keyup', opts));
      // A form without its own Enter handling submits, like in a browser
      if (allowed && el.form && el.tagName !== 'TEXTAREA') {
        var submit = el.form.querySelector('button:not([type=button]):not([type=reset]), input[type=submit]');
        if (submit && typeof el.form.requestSubmit === 'function') el.form.requestSubmit(submit);
      }
      setTimeout(function () {
        // Still on the same field (the page did not move focus): close the keyboard
        if (current && current.token === t) {
          post({ action: 'close', token: t });
          fire(el, 'change');
          finish(true);
        }
      }, 0);
    },
    end: function (t) {
      if (!current || current.token !== t) return;
      var el = live() || current.el;
      if (current.kind === 'text') fire(el, 'change');
      finish(true);
    }
  };

  // Taps: stop WebKit's own (non-working) keyboard / picker and open the native one instead
  var start = null;
  document.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    start = t ? { x: t.clientX, y: t.clientY, field: fieldFrom(e.target) } : null;
  }, { capture: true, passive: true });

  document.addEventListener('touchend', function (e) {
    var s = start;
    start = null;
    if (!s || !s.field) return;
    var t = e.changedTouches[0];
    if (!t || Math.abs(t.clientX - s.x) > 10 || Math.abs(t.clientY - s.y) > 10) return;
    e.preventDefault();
    activate(s.field);
  }, { capture: true, passive: false });

  // Trackpad / mouse clicks
  document.addEventListener('mousedown', function (e) {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    var field = fieldFrom(e.target);
    if (!field) return;
    e.preventDefault();
    activate(field);
  }, true);

  function activate(field) {
    if (document.activeElement === field) open(field);
    else field.focus({ preventScroll: true }); // focusin opens it
  }

  // Focus set by the page itself (first field of a form, validation errors) or by a <label>
  document.addEventListener('focusin', function (e) {
    if (suppressFocus) return;
    var field = kind(e.target) ? e.target : null;
    if (field) open(field);
  }, true);

  // A tap anywhere else closes the native keyboard
  document.addEventListener('pointerdown', function (e) {
    if (!current) return;
    var field = fieldFrom(e.target);
    if (field === current.el) return;
    if (field) return; // another field: it takes over on touchend / focusin
    post({ action: 'close', token: current.token });
    window.__deboInput.end(current.token);
  }, true);

  // While a window (dialog) is open, the page behind it must not scroll: iOS scrolls it anyway
  // when a swipe reaches the end of the window or starts on the dimmed background
  var lockedAt = null;
  function syncScrollLock() {
    var open = !!document.querySelector('dialog[open]');
    var body = document.body;
    if (open && lockedAt === null) {
      lockedAt = window.scrollY;
      root.classList.add('debo-scroll-locked');
      body.style.top = -lockedAt + 'px';
    } else if (!open && lockedAt !== null) {
      var y = lockedAt;
      lockedAt = null;
      root.classList.remove('debo-scroll-locked');
      body.style.top = '';
      window.scrollTo(0, y);
    }
  }
  var lockStyle = document.createElement('style');
  lockStyle.textContent =
    'html.debo-scroll-locked, html.debo-scroll-locked body { overflow: hidden !important; overscroll-behavior: none; }' +
    'html.debo-scroll-locked body { position: fixed !important; left: 0; right: 0; width: 100%; }' +
    'dialog { overscroll-behavior: contain; }';
  document.head.appendChild(lockStyle);
  new MutationObserver(syncScrollLock).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
  syncScrollLock();

  // The field the page already focused before this script ran
  if (kind(document.activeElement)) open(document.activeElement);
})();
