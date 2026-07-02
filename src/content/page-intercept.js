import { EVENT_FILES, EVENT_READY, EVENT_CLEANUP } from '../shared/brand.js';

(function () {
  if (window.__tokenzIntercept) return;
  window.__tokenzIntercept = true;

  var SUPPORTED = ['.txt', '.md', '.docx', '.html', '.htm', '.pdf'];
  var dragDepth = 0;
  var DRAG_STYLE_ID = 'tokenz-drag-style';

  function isEnabled() {
    return document.documentElement.getAttribute('data-tokenz') !== 'off';
  }

  function isSupported(file) {
    var n = (file && file.name || '').toLowerCase();
    return SUPPORTED.some(function (e) { return n.endsWith(e); });
  }

  function hasFiles(dt) {
    if (!dt || !dt.types) return false;
    try { return dt.types.contains ? dt.types.contains('Files') : dt.types.indexOf('Files') !== -1; }
    catch (_e) { return false; }
  }

  function sendEscape() {
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    } catch (_e) {}
  }

  /** Undo inline styles left by older Tokenz builds. */
  function repairChatGptDropZones() {
    try {
      document.querySelectorAll(
        '[data-testid="drop-zone"],[data-testid="upload-file-drop-zone"]',
      ).forEach(function (el) {
        if (!(el instanceof HTMLElement)) return;
        el.style.removeProperty('display');
        el.style.removeProperty('pointer-events');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
      });
    } catch (_e) {}
  }

  /** End drag session — removes temporary CSS only, never leaves permanent DOM damage. */
  function endDragSession() {
    dragDepth = 0;
    document.documentElement.removeAttribute('data-tokenz-drag');
    var style = document.getElementById(DRAG_STYLE_ID);
    if (style) style.remove();
    repairChatGptDropZones();
    sendEscape();
  }

  function beginDragSession() {
    document.documentElement.setAttribute('data-tokenz-drag', '1');
    if (!document.getElementById(DRAG_STYLE_ID)) {
      var s = document.createElement('style');
      s.id = DRAG_STYLE_ID;
      s.textContent =
        'html[data-tokenz-drag="1"] [data-testid="drop-zone"],' +
        'html[data-tokenz-drag="1"] [data-testid="upload-file-drop-zone"]{' +
        'display:none!important;pointer-events:none!important;opacity:0!important}';
      document.documentElement.appendChild(s);
    }
  }

  function blockDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.dataTransfer) {
      try { e.dataTransfer.dropEffect = 'copy'; } catch (_e) {}
    }
  }

  function blockDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function emit(files) {
    var list = Array.prototype.slice.call(files);
    document.dispatchEvent(new CustomEvent(EVENT_FILES, { detail: { files: list }, bubbles: true }));
  }

  document.addEventListener(EVENT_CLEANUP, endDragSession);

  window.addEventListener('dragenter', function (e) {
    if (!isEnabled() || !hasFiles(e.dataTransfer)) return;
    blockDrag(e);
    dragDepth++;
    beginDragSession();
  }, true);

  window.addEventListener('dragover', function (e) {
    if (!isEnabled() || !hasFiles(e.dataTransfer)) return;
    blockDrag(e);
  }, true);

  window.addEventListener('dragleave', function (e) {
    if (!isEnabled() || !hasFiles(e.dataTransfer)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) endDragSession();
  }, true);

  window.addEventListener('dragend', function () {
    if (document.documentElement.getAttribute('data-tokenz-drag')) endDragSession();
  }, true);

  window.addEventListener('drop', function (e) {
    if (!hasFiles(e.dataTransfer)) return;
    var wasTokenzDrag = document.documentElement.getAttribute('data-tokenz-drag') === '1';
    if (wasTokenzDrag) endDragSession();
    if (!isEnabled()) return;

    var files = Array.prototype.filter.call(e.dataTransfer.files, isSupported);
    if (!files.length) return;
    blockDrop(e);
    emit(files);
  }, true);

  window.addEventListener('change', function (e) {
    if (!isEnabled()) return;
    var t = e.target;
    if (!t || t.tagName !== 'INPUT' || t.type !== 'file' || !t.files || !t.files.length) return;
    var files = Array.prototype.filter.call(t.files, isSupported);
    if (!files.length) return;
    blockDrop(e);
    t.value = '';
    endDragSession();
    emit(files);
  }, true);

  document.dispatchEvent(new CustomEvent(EVENT_READY, { bubbles: true }));

  repairChatGptDropZones();
})();
