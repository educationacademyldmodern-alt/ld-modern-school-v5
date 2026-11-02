/* Keep operational controls from starting a page-wide selection. Normal text
   drags, table copying, editable fields, and document previews stay native. */
(() => {
  'use strict';
  const shell = '#erp, #parentDashboard';
  const control = 'button, select, option, [role="button"], .erpTop, #erpNav';
  const nativeText = 'input, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"], pre, code, [data-print], .printArea';
  function editable(el) {
    return el?.isContentEditable || el?.closest(nativeText);
  }
  document.addEventListener('keydown', event => {
    const el = event.target;
    if (!(el instanceof Element) || event.defaultPrevented || event.isComposing ||
        event.key.toLowerCase() !== 'a' || !(event.ctrlKey || event.metaKey) ||
        event.altKey || event.shiftKey || editable(el)) return;
    // Only intercept Select All when focus is on an operational control.
    // When the user selects report text, their selection and shortcuts survive.
    if (el.closest(shell) && el.closest(control)) {
      event.preventDefault();
      return;
    }
    if (el !== document.body && el !== document.documentElement) return;
    if (document.querySelector('dialog[open]') || !window.getSelection()?.isCollapsed) return;
    const app = document.querySelector('#erp:not(.hidden)');
    const panel = app?.querySelector('#x320Center, #sw403, #teacherClassBody, #attendanceSheet, #v240Export, .ldmRootAdminDash, .ldmNewTeacher');
    if (panel?.getClientRects().length) event.preventDefault();
  });
  document.addEventListener('pointerdown', event => {
    const el = event.target;
    if (!(el instanceof Element) || event.button !== 0 || event.shiftKey ||
        event.ctrlKey || event.metaKey || editable(el) || !el.closest(control)) return;
    const root = el.closest(shell);
    if (!root) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !root.contains(selection.anchorNode) ||
        !root.contains(selection.focusNode)) return;
    // Single-field selections and selections outside this workspace are untouched.
    if (selection.anchorNode !== selection.focusNode) selection.removeAllRanges();
  }, {capture:true, passive:true});
})();
