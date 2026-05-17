// HTML sanitization, markdown→HTML migration, and html→plain-text helpers
// for the contentEditable rich-text editor in tasks.

const ALLOWED_TAGS = new Set(['STRONG', 'B', 'EM', 'I', 'U', 'BR', 'DIV', 'P', 'A', 'SPAN']);
const ALLOWED_ATTRS = { A: ['href', 'target', 'rel'] };

export function sanitizeHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstChild;

  function walk(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) return; // text
      if (child.nodeType !== 1) { child.remove(); return; }

      if (!ALLOWED_TAGS.has(child.tagName)) {
        // Unwrap: replace child with its children
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        child.remove();
        return;
      }

      const okAttrs = ALLOWED_ATTRS[child.tagName] || [];
      [...child.attributes].forEach((attr) => {
        if (!okAttrs.includes(attr.name.toLowerCase())) child.removeAttribute(attr.name);
      });

      // Reject javascript: and other dangerous URLs
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') || '';
        if (!/^https?:\/\//i.test(href)) child.removeAttribute('href');
      }

      walk(child);
    });
  }
  walk(root);
  return root.innerHTML;
}

const HTML_TAG_RX = /<(strong|b|em|i|u|br|div|p|a|span)\b/i;
export function isHtml(value) {
  return HTML_TAG_RX.test(value || '');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Migrate plain-text-with-markdown to HTML for the editor.
// Order matters: ** before __ before _ to avoid partial matches.
export function markdownToHtml(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_\n]+)__/g, '<u>$1</u>');
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

export function htmlToText(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').trim();
}
