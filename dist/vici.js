/*!
 * Vici — small behaviours for the Vici design system.
 * No dependencies. Load with <script src="dist/vici.js" defer></script>.
 * Everything works without it except: theme toggle, tabs, toasts, dialog triggers,
 * menu positioning, slider fill, carousel dots, table sorting and copy buttons.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'vc-theme';
  var root = document.documentElement;

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch (e) { /* storage blocked: the choice simply is not remembered */ }
  }
  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ---------------------------------------------------------------- theme */
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolvedTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return media && media.matches ? 'dark' : 'light';
  }

  function syncThemeControls() {
    var current = resolvedTheme();
    var setting = root.getAttribute('data-theme') || 'system';
    $all('[data-vc-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(current === 'dark'));
      var label = current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
    $all('[data-vc-theme-set]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-vc-theme-set') === setting));
    });
  }

  function setTheme(value) {
    if (value === 'light' || value === 'dark') {
      root.setAttribute('data-theme', value);
      storageSet(STORAGE_KEY, value);
    } else {
      root.removeAttribute('data-theme');
      storageSet(STORAGE_KEY, null);
    }
    syncThemeControls();
    document.dispatchEvent(new CustomEvent('vc:themechange', { detail: { theme: resolvedTheme() } }));
  }

  // Apply a stored choice as early as possible (an inline copy of these lines in <head> avoids a flash).
  var stored = storageGet(STORAGE_KEY);
  if ((stored === 'light' || stored === 'dark') && !root.hasAttribute('data-theme')) {
    root.setAttribute('data-theme', stored);
  }
  if (media && media.addEventListener) media.addEventListener('change', syncThemeControls);

  /* ---------------------------------------------------------------- toast */
  function toastRegion() {
    var region = document.querySelector('.vc-toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'vc-toast-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(region);
    }
    return region;
  }

  var TONE_ICON = { info: 'info', success: 'success', warning: 'warning', danger: 'error', feature: 'sparkle' };

  function dismissToast(el) {
    if (!el || el.hasAttribute('data-leaving')) return;
    el.setAttribute('data-leaving', '');
    window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
  }

  /**
   * Vici.toast('Saved') or Vici.toast({ title, message, tone: 'success', duration: 5000 })
   * duration: 0 keeps the toast until it is closed.
   */
  function toast(options) {
    var opts = typeof options === 'string' ? { title: options } : (options || {});
    var tone = opts.tone || 'info';
    var el = document.createElement('div');
    el.className = 'vc-toast vc-toast--' + tone;
    el.setAttribute('role', tone === 'danger' ? 'alert' : 'status');

    var icon = document.createElement('span');
    icon.className = 'vc-icon vc-icon--' + (TONE_ICON[tone] || 'info');
    icon.setAttribute('aria-hidden', 'true');

    var body = document.createElement('div');
    body.className = 'vc-toast__body';
    if (opts.title) {
      var title = document.createElement('p');
      title.className = 'vc-toast__title';
      title.textContent = opts.title;
      body.appendChild(title);
    }
    if (opts.message) {
      var msg = document.createElement('p');
      msg.textContent = opts.message;
      body.appendChild(msg);
    }

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'vc-icon-button vc-icon-button--sm';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.innerHTML = '<span class="vc-icon vc-icon--close" aria-hidden="true"></span>';
    close.addEventListener('click', function () { dismissToast(el); });

    el.appendChild(icon);
    el.appendChild(body);
    el.appendChild(close);
    toastRegion().appendChild(el);

    var duration = opts.duration === undefined ? 5000 : opts.duration;
    if (duration > 0) {
      var timer = window.setTimeout(function () { dismissToast(el); }, duration);
      var pause = function () { window.clearTimeout(timer); };
      var resume = function () { timer = window.setTimeout(function () { dismissToast(el); }, 2000); };
      el.addEventListener('mouseenter', pause);
      el.addEventListener('focusin', pause);
      el.addEventListener('mouseleave', resume);
    }
    return el;
  }

  /* ----------------------------------------------------------------- tabs */
  function initTabs(scope) {
    $all('.vc-tabs', scope).forEach(function (tabsEl) {
      if (tabsEl.__vcTabs) return;
      tabsEl.__vcTabs = true;
      var tabs = $all('[role="tab"]', tabsEl);
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var selected = t === tab;
          t.setAttribute('aria-selected', String(selected));
          t.tabIndex = selected ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
        if (focus) tab.focus();
        tabsEl.dispatchEvent(new CustomEvent('vc:tabchange', { detail: { tab: tab } }));
      }
      var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
      if (initial) select(initial, false);
      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(tab, false); });
        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
          if (e.key === 'Home') next = tabs[0];
          if (e.key === 'End') next = tabs[tabs.length - 1];
          if (next) { e.preventDefault(); select(next, true); }
        });
      });
    });
  }

  /* -------------------------------------------------------------- sliders */
  function updateSlider(input) {
    var min = parseFloat(input.min || '0');
    var max = parseFloat(input.max || '100');
    var val = parseFloat(input.value);
    var pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    input.style.setProperty('--vc-slider-fill', pct + '%');
    if (input.id) {
      $all('output[for~="' + input.id + '"]').forEach(function (out) { out.textContent = input.value; });
    }
  }
  function initSliders(scope) {
    $all('input.vc-slider', scope).forEach(updateSlider);
  }

  /* ---------------------------------------------------------------- menus */
  function positionPopover(pop, invoker) {
    if (!invoker) return;
    var r = invoker.getBoundingClientRect();
    var gap = 6;
    var w = pop.offsetWidth;
    var h = pop.offsetHeight;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    var top = r.bottom + gap;
    if (top + h > window.innerHeight - 8 && r.top - gap - h > 8) top = r.top - gap - h;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }
  var openPopovers = [];
  function invokerFor(pop) {
    return document.querySelector('[popovertarget="' + pop.id + '"]');
  }
  function onScrollOrResize() {
    openPopovers.forEach(function (pop) { positionPopover(pop, invokerFor(pop)); });
  }
  function menuItems(menu) {
    return $all('.vc-menu__item:not([disabled]):not([aria-disabled="true"])', menu);
  }
  function initPopovers(scope) {
    $all('.vc-menu[popover], .vc-popover[popover]', scope).forEach(function (pop) {
      if (pop.__vcPopover) return;
      pop.__vcPopover = true;
      pop.addEventListener('toggle', function (e) {
        var invoker = invokerFor(pop);
        var open = e.newState === 'open';
        if (invoker) invoker.setAttribute('aria-expanded', String(open));
        if (open) {
          positionPopover(pop, invoker);
          openPopovers.push(pop);
          if (pop.classList.contains('vc-menu')) {
            var items = menuItems(pop);
            if (items[0]) items[0].focus();
          }
        } else {
          openPopovers = openPopovers.filter(function (p) { return p !== pop; });
        }
      });
      if (!pop.classList.contains('vc-menu')) return;
      pop.addEventListener('keydown', function (e) {
        var items = menuItems(pop);
        var i = items.indexOf(document.activeElement);
        var next = null;
        if (e.key === 'ArrowDown') next = items[(i + 1) % items.length];
        if (e.key === 'ArrowUp') next = items[(i - 1 + items.length) % items.length];
        if (e.key === 'Home') next = items[0];
        if (e.key === 'End') next = items[items.length - 1];
        if (next) { e.preventDefault(); next.focus(); }
        if (e.key === 'Tab') pop.hidePopover();
      });
      pop.addEventListener('click', function (e) {
        var item = e.target.closest('.vc-menu__item');
        if (!item || pop.hasAttribute('data-vc-keep-open')) return;
        if (item.getAttribute('role') === 'menuitemradio') {
          menuItems(pop).forEach(function (it) {
            if (it.getAttribute('role') === 'menuitemradio') it.setAttribute('aria-checked', String(it === item));
          });
        }
        if (item.getAttribute('role') === 'menuitemcheckbox') {
          item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
          return;
        }
        pop.hidePopover();
        var invoker = invokerFor(pop);
        if (invoker) invoker.focus();
      });
    });
  }
  window.addEventListener('resize', onScrollOrResize);
  window.addEventListener('scroll', onScrollOrResize, true);

  /* ------------------------------------------------------------- carousel */
  function initCarousels(scope) {
    $all('[data-vc-carousel]', scope).forEach(function (car) {
      if (car.__vcCarousel) return;
      car.__vcCarousel = true;
      var track = car.querySelector('.vc-carousel__track');
      if (!track) return;
      var slides = $all('.vc-carousel__slide', track);
      var dotsWrap = car.querySelector('.vc-carousel__dots');
      var dots = [];
      if (dotsWrap) {
        dotsWrap.innerHTML = '';
        slides.forEach(function (slide, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Show slide ' + (i + 1) + ' of ' + slides.length);
          b.addEventListener('click', function () { go(i); });
          dotsWrap.appendChild(b);
          dots.push(b);
        });
      }
      function current() {
        var x = track.scrollLeft;
        var best = 0;
        slides.forEach(function (s, i) {
          if (Math.abs(s.offsetLeft - track.offsetLeft - x) < Math.abs(slides[best].offsetLeft - track.offsetLeft - x)) best = i;
        });
        return best;
      }
      function go(i) {
        var n = Math.max(0, Math.min(slides.length - 1, i));
        track.scrollTo({ left: slides[n].offsetLeft - track.offsetLeft, behavior: 'smooth' });
      }
      function sync() {
        var c = current();
        dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === c)); });
        slides.forEach(function (s, i) { s.setAttribute('aria-hidden', String(i !== c)); s.inert = i !== c; });
      }
      var prev = car.querySelector('[data-vc-prev]');
      var next = car.querySelector('[data-vc-next]');
      if (prev) prev.addEventListener('click', function () { go(current() - 1); });
      if (next) next.addEventListener('click', function () { go(current() + 1); });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
      });
      var raf = 0;
      track.addEventListener('scroll', function () {
        window.cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(sync);
      });
      sync();
    });
  }

  /* ---------------------------------------------------------- table sort */
  // Sort key for a cell: its data-value if present (use this for localised numbers),
  // otherwise the text — read as a number when it looks like one (1,234.5 · 12% · € 40).
  function cellValue(row, index) {
    var cell = row.children[index];
    if (!cell) return '';
    var raw = cell.getAttribute('data-value');
    if (raw === null) raw = cell.textContent.trim();
    var cleaned = raw.replace(/[€$£%\s\u2009\u202f]/g, '').replace(/[\u2212\u2013]/g, '-');
    if (/^-?[\d.,]+$/.test(cleaned)) {
      var n = parseFloat(cleaned.replace(/,/g, ''));
      if (!isNaN(n)) return n;
    }
    return raw.toLowerCase();
  }
  function initTables(scope) {
    $all('table[data-vc-sortable]', scope).forEach(function (table) {
      if (table.__vcSort) return;
      table.__vcSort = true;
      $all('thead th', table).forEach(function (th, index) {
        var btn = th.querySelector('.vc-table__sort');
        if (!btn) return;
        btn.addEventListener('click', function () {
          var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
          $all('thead th', table).forEach(function (other) { if (other !== th) other.removeAttribute('aria-sort'); });
          th.setAttribute('aria-sort', dir);
          var body = table.tBodies[0];
          var rows = Array.prototype.slice.call(body.rows);
          rows.sort(function (a, b) {
            var x = cellValue(a, index);
            var y = cellValue(b, index);
            var cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
            return dir === 'ascending' ? cmp : -cmp;
          });
          rows.forEach(function (r) { body.appendChild(r); });
        });
      });
    });
  }

  /* ---------------------------------------------------------------- misc */
  function initIndeterminate(scope) {
    $all('input[type="checkbox"][data-vc-indeterminate]', scope).forEach(function (cb) { cb.indeterminate = true; });
  }

  function copyText(text, button) {
    function done(ok) {
      if (!button) return;
      var original = button.getAttribute('data-vc-label') || button.getAttribute('aria-label') || '';
      button.setAttribute('data-vc-copied', ok ? 'true' : 'false');
      if (original) button.setAttribute('aria-label', ok ? 'Copied' : 'Copy failed');
      window.setTimeout(function () {
        button.removeAttribute('data-vc-copied');
        if (original) button.setAttribute('aria-label', original);
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
  }

  function init(scope) {
    initTabs(scope);
    initSliders(scope);
    initPopovers(scope);
    initCarousels(scope);
    initTables(scope);
    initIndeterminate(scope);
    syncThemeControls();
  }

  /* --------------------------------------------------- delegated events */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;

    var themeToggle = t.closest('[data-vc-theme-toggle]');
    if (themeToggle) { setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark'); return; }
    var themeSet = t.closest('[data-vc-theme-set]');
    if (themeSet) { setTheme(themeSet.getAttribute('data-vc-theme-set')); return; }

    var opener = t.closest('[data-vc-open]');
    if (opener) {
      var dlg = document.getElementById(opener.getAttribute('data-vc-open'));
      if (dlg && typeof dlg.showModal === 'function') { e.preventDefault(); dlg.showModal(); }
      return;
    }
    var closer = t.closest('[data-vc-close]');
    if (closer) {
      var d = closer.closest('dialog');
      if (d) { e.preventDefault(); d.close(closer.getAttribute('data-vc-close') || ''); }
      return;
    }
    if (t.tagName === 'DIALOG' && t.classList.contains('vc-dialog') && t.getAttribute('data-vc-dismissable') !== 'false') {
      var r = t.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) t.close('backdrop');
      return;
    }

    var dismiss = t.closest('[data-vc-dismiss]');
    if (dismiss) {
      var target = dismiss.closest(dismiss.getAttribute('data-vc-dismiss') || '.vc-alert, .vc-tag, .vc-toast');
      if (target && target.classList.contains('vc-toast')) dismissToast(target);
      else if (target) target.remove();
      return;
    }

    var copyBtn = t.closest('[data-vc-copy]');
    if (copyBtn) {
      var src = copyBtn.getAttribute('data-vc-copy');
      var node = src && src.charAt(0) === '#' ? document.querySelector(src) : null;
      copyText(node ? node.textContent : src, copyBtn);
      return;
    }

    var headerToggle = t.closest('.vc-header__toggle');
    if (headerToggle) {
      var header = headerToggle.closest('.vc-header');
      var open = !header.hasAttribute('data-open');
      header.toggleAttribute('data-open', open);
      headerToggle.setAttribute('aria-expanded', String(open));
      return;
    }

    var pressable = t.closest('.vc-chip[aria-pressed], .vc-button--toggle[aria-pressed]');
    if (pressable && !pressable.disabled) {
      pressable.setAttribute('aria-pressed', String(pressable.getAttribute('aria-pressed') !== 'true'));
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target instanceof HTMLInputElement && e.target.classList.contains('vc-slider')) updateSlider(e.target);
  });

  // Tooltips stay dismissible with Escape (WCAG 1.4.13).
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $all('.vc-tooltip-anchor:hover, .vc-tooltip-anchor:focus-within').forEach(function (a) { a.setAttribute('data-dismissed', ''); });
    $all('.vc-header[data-open]').forEach(function (h) {
      h.removeAttribute('data-open');
      var btn = h.querySelector('.vc-header__toggle');
      if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  });
  function clearDismissed(e) {
    var a = e.target instanceof Element ? e.target.closest('.vc-tooltip-anchor[data-dismissed]') : null;
    if (a) a.removeAttribute('data-dismissed');
  }
  document.addEventListener('mouseout', clearDismissed);
  document.addEventListener('focusout', clearDismissed);

  window.Vici = {
    version: '1.0.0',
    init: init,
    toast: toast,
    theme: { get: resolvedTheme, set: setTheme },
    copy: copyText,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);
})();
