// Wide-screen layout probe for the docs shell, run inside a page with page.evaluate(). On wide
// screens the page is a centred block of at most --doc-page-max; inside it the article and the
// On this page column are centred together beside the sidebar. The function returns a list of
// problems: content pushed away from the sidebar, the On this page column past the window's edge,
// an off-centre page or content group, or a page wider than the window. It reads nothing from
// outside the page, so a prototype's own render test can import it too.
export function wideLayoutProblems() {
  const out = [];
  const root = document.documentElement;
  const vw = root.clientWidth;
  if (root.scrollWidth > vw + 1) out.push(`page is ${root.scrollWidth}px wide in a ${vw}px window`);
  const el = (s) => document.querySelector(s);
  const box = (s) => { const e = el(s); if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return r.width > 0 ? r : null; };
  const shell = box('.doc-shell'), sidebar = box('.doc-sidebar'), main = box('.doc-main'), article = box('.doc-article'), toc = box('.doc-toc');
  if (!shell || !main || !article) return out; // not a docs page
  if (Math.abs(shell.left - (vw - shell.right)) > 2) out.push(`page block off centre: ${Math.round(shell.left)}px left, ${Math.round(vw - shell.right)}px right`);
  if (sidebar && getComputedStyle(el('.doc-sidebar')).position === 'sticky') {
    const gap = article.left - sidebar.right;
    if (gap > 128) out.push(`content starts ${Math.round(gap)}px after the sidebar`);
  }
  if (toc) {
    if (toc.right > vw + 1) out.push(`On this page ends at ${Math.round(toc.right)}px, past the ${vw}px window`);
    const cs = getComputedStyle(el('.doc-main'));
    const before = article.left - (main.left + parseFloat(cs.paddingLeft));
    const after = main.right - parseFloat(cs.paddingRight) - toc.right;
    if (Math.abs(before - after) > 2) out.push(`content off centre: ${Math.round(before)}px before it, ${Math.round(after)}px after On this page`);
  }
  return out;
}
