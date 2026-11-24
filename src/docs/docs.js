/* Documentation-only behaviour: mobile sidebar, copy feedback, "on this page" highlight, and the demo of a key
 * held in memory on Build a prototype. Nothing here touches browser storage (scripts/check-storage.mjs). */
(function () {
  'use strict';
  var body = document.body;
  var toggle = document.querySelector('.doc-sidebar-toggle');
  var sidebar = document.getElementById('doc-sidebar');
  var scrim = document.querySelector('.doc-scrim');

  function setSidebar(open) {
    body.toggleAttribute('data-sidebar-open', open);
    if (scrim) scrim.hidden = !open;
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      var tip = document.getElementById(toggle.getAttribute('aria-labelledby'));
      if (tip) tip.textContent = open ? 'Close navigation' : 'Open navigation';
    }
    if (open && sidebar) {
      var current = sidebar.querySelector('[aria-current="page"]') || sidebar.querySelector('a');
      if (current) current.focus();
    }
  }
  if (toggle) toggle.addEventListener('click', function () { setSidebar(!body.hasAttribute('data-sidebar-open')); });
  if (scrim) scrim.addEventListener('click', function () { setSidebar(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.hasAttribute('data-sidebar-open')) {
      setSidebar(false);
      if (toggle) toggle.focus();
    }
  });

  // Copy feedback, once vici.js reports the result: demo buttons change their label,
  // swatches and icons confirm with a toast. A failed copy says so.
  document.addEventListener('vc:copy', function (e) {
    var btn = e.target instanceof Element ? e.target : null;
    if (!btn) return;
    var ok = e.detail && e.detail.ok;
    if (btn.classList.contains('doc-demo__copy')) {
      var icon = btn.querySelector('.vc-icon');
      btn.lastChild.textContent = ok ? 'Copied' : 'Copy failed';
      if (icon) icon.className = 'vc-icon vc-icon--' + (ok ? 'check' : 'warning');
      window.setTimeout(function () {
        btn.lastChild.textContent = 'Copy';
        if (icon) icon.className = 'vc-icon vc-icon--copy';
      }, 1600);
    } else if (window.Vici && (btn.classList.contains('doc-swatch') || btn.classList.contains('doc-icon'))) {
      window.Vici.toast(ok
        ? { title: 'Copied', message: e.detail.text, tone: 'success', duration: 2200 }
        : { title: 'Copy failed', message: 'Your browser blocked the clipboard.', tone: 'warning', duration: 3200 });
    }
  });

  // Motion page: replay the easing curves.
  document.addEventListener('click', function (e) {
    var play = e.target instanceof Element ? e.target.closest('[data-doc-play]') : null;
    if (!play) return;
    var grid = document.querySelector(play.getAttribute('data-doc-play'));
    if (grid) grid.toggleAttribute('data-playing');
  });

  // Build a prototype, Nothing is kept: the key lives in this variable and nowhere else, so a reload forgets it.
  var heldKey = null;
  function masked(v) {
    return v.length > 11 ? v.slice(0, 7) + '\u2026' + v.slice(-4) : '\u2026' + v.slice(-Math.min(4, Math.ceil(v.length / 2)));
  }
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null;
    var box = t ? t.closest('.doc-demo__preview') : null;
    var field = box ? box.querySelector('[data-doc-key]') : null;
    var state = box ? box.querySelector('[data-doc-key-state]') : null;
    if (!field || !state) return;
    var show = t.closest('[data-doc-key-show]');
    if (show) {
      var reveal = field.type === 'password';
      field.type = reveal ? 'text' : 'password';
      show.setAttribute('aria-pressed', String(reveal));
      show.setAttribute('aria-label', reveal ? 'Hide key' : 'Show key');
    } else if (t.closest('[data-doc-key-hold]')) {
      var value = field.value.trim();
      if (!value) { state.textContent = 'Type a test value first.'; field.focus(); return; }
      heldKey = value;
      field.value = '';
      field.type = 'password';
      var eye = box.querySelector('[data-doc-key-show]');
      if (eye) { eye.setAttribute('aria-pressed', 'false'); eye.setAttribute('aria-label', 'Show key'); }
      state.textContent = 'Held in memory: ' + masked(heldKey) + '. Reload the page and it is gone.';
    } else if (t.closest('[data-doc-key-forget]')) {
      heldKey = null;
      field.value = '';
      state.textContent = 'Nothing held.';
    }
  });

  // Overlays, Live-run dialog: a test value held in this variable turns the start button on once the box is
  // ticked. Nothing runs, and a reload forgets it.
  var liveKey = null;
  function liveParts(el) {
    var dlg = el.closest('.vc-live');
    if (!dlg) return null;
    return {
      field: dlg.querySelector('.vc-live__key input'),
      show: dlg.querySelector('[data-doc-live-show]'),
      ack: dlg.querySelector('[data-doc-live-ack]'),
      start: dlg.querySelector('[data-doc-live-start]'),
      current: dlg.querySelector('.vc-live__current'),
      masked: dlg.querySelector('[data-doc-live-masked]')
    };
  }
  function liveSync(p) {
    p.start.disabled = !((p.field.value.trim() || liveKey) && p.ack.checked);
    p.current.hidden = !liveKey;
    if (liveKey) p.masked.textContent = masked(liveKey);
  }
  document.addEventListener('input', function (e) {
    var p = e.target instanceof Element ? liveParts(e.target) : null;
    if (p) liveSync(p);
  });
  document.addEventListener('change', function (e) {
    var p = e.target instanceof Element ? liveParts(e.target) : null;
    if (p) liveSync(p);
  });
  document.addEventListener('click', function (e) {
    var t = e.target instanceof Element ? e.target : null;
    var p = t ? liveParts(t) : null;
    if (!p) return;
    if (t.closest('[data-doc-live-show]')) {
      var reveal = p.field.type === 'password';
      p.field.type = reveal ? 'text' : 'password';
      p.show.setAttribute('aria-pressed', String(reveal));
      p.show.setAttribute('aria-label', reveal ? 'Hide key' : 'Show key');
    } else if (t.closest('[data-doc-live-forget]')) {
      liveKey = null;
      liveSync(p);
    } else if (t.closest('[data-doc-live-start]')) {
      if (p.field.value.trim()) liveKey = p.field.value.trim();
      p.field.value = '';
      p.field.type = 'password';
      p.show.setAttribute('aria-pressed', 'false');
      p.show.setAttribute('aria-label', 'Show key');
      liveSync(p);
      if (window.Vici) window.Vici.toast({ title: 'Nothing runs here', message: 'In a prototype the run starts now.', tone: 'info', duration: 2600 });
    }
  });
  // The box is unticked at every opening.
  document.addEventListener('click', function (e) {
    var opener = e.target instanceof Element ? e.target.closest('[data-vc-open]') : null;
    var dlg = opener ? document.getElementById(opener.getAttribute('data-vc-open')) : null;
    if (!dlg || !dlg.classList.contains('vc-live')) return;
    var p = liveParts(dlg.querySelector('.vc-live__key'));
    if (p) { p.ack.checked = false; liveSync(p); }
  }, true);

  // Highlight the current section in "On this page".
  var toc = document.querySelector('.doc-toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var headings = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var active = null;
      for (var i = 0; i < headings.length; i++) {
        if (visible[headings[i].id]) { active = headings[i].id; break; }
      }
      if (!active) {
        var y = window.scrollY + 120;
        headings.forEach(function (h) { if (h.offsetTop <= y) active = h.id; });
      }
      // still reading the introduction: the first section is next
      if (!active && headings.length) active = headings[0].id;
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (active && map[active]) map[active].setAttribute('aria-current', 'true');
    }, { rootMargin: '-72px 0px -60% 0px' });
    headings.forEach(function (h) { io.observe(h); });
  }
})();
