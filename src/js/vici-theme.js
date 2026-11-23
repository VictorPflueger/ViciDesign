/*!
 * Vici theme, before the page is drawn. Load it in the head as a plain script, not deferred and not a
 * module, so it runs before the first paint:  <script src="dist/vici-theme.js"></script>
 * It applies the theme the visitor chose with the header's toggle, kept under "vc-theme", so a dark
 * choice doesn't flash light first. Without a choice the page follows the operating system, or the theme
 * its <html> element names in data-vc-theme-default ("light" for a prototype shown on projectors in lit
 * rooms). A file of its own rather than an inline line, so a page whose security policy allows only its
 * own scripts (script-src 'self') can use it. vici.js does the rest: the toggle and remembering the choice.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var theme = null;
  try {
    theme = window.localStorage.getItem('vc-theme');
  } catch (e) {
    /* storage blocked: no remembered choice */
  }
  if (theme !== 'light' && theme !== 'dark') theme = root.getAttribute('data-vc-theme-default');
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
})();
