// Renders task content for display: handles HTML (from contentEditable editor),
// legacy markdown markers, URLs, and search-term highlighting.

import { isHtml, sanitizeHtml } from './htmlEditor';

const URL_RX = /(https?:\/\/[^\s<>]+)/g;
const MD_RX  = /\*\*[^*\n]+\*\*|__[^_\n]+__|_[^_\n]+_|https?:\/\/[^\s]+/g;

// ── Shared: highlight a search term inside plain text ─────────────────────

function highlight(str, term) {
  if (!term?.trim()) return [str];
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return str.split(new RegExp(`(${safe})`, 'gi')).map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <span key={i} style={{ background: 'var(--theme-highlight-bg)', borderRadius: '2px', padding: '0 2px' }}>{part}</span>
      : part
  );
}

// Render a text fragment with URL detection + search highlight
function renderTextWithExtras(text, searchTerm, keyGen) {
  if (!text) return null;
  const out = [];
  const parts = text.split(URL_RX);
  parts.forEach((seg, i) => {
    if (i % 2 === 1) {
      out.push(
        <a key={keyGen()} href={seg} target="_blank" rel="noopener noreferrer"
           onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
           draggable={false}
           style={{ color: 'var(--theme-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {seg}
        </a>
      );
    } else if (seg) {
      const hl = highlight(seg, searchTerm);
      hl.forEach((node) => {
        if (typeof node === 'string') out.push(node);
        else out.push(node);
      });
    }
  });
  return out;
}

// ── Legacy markdown renderer (for old tasks stored with **bold** etc) ────

export function renderRichText(text, searchTerm = '') {
  if (!text) return null;
  const parts = [];
  let lastIndex = 0;
  let key = 0;
  let m;
  const rx = new RegExp(MD_RX.source, 'g');

  while ((m = rx.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(<span key={key++}>{highlight(text.slice(lastIndex, m.index), searchTerm)}</span>);
    }
    const t = m[0];
    if (t.startsWith('**'))      parts.push(<strong key={key++}>{highlight(t.slice(2, -2), searchTerm)}</strong>);
    else if (t.startsWith('__')) parts.push(<u key={key++}>{highlight(t.slice(2, -2), searchTerm)}</u>);
    else if (t.startsWith('_'))  parts.push(<em key={key++}>{highlight(t.slice(1, -1), searchTerm)}</em>);
    else
      parts.push(
        <a key={key++} href={t} target="_blank" rel="noopener noreferrer"
           onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
           draggable={false}
           style={{ color: 'var(--theme-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {t}
        </a>
      );
    lastIndex = m.index + t.length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{highlight(text.slice(lastIndex), searchTerm)}</span>);
  }
  return parts.length ? parts : [text];
}

// ── HTML renderer: parses sanitized HTML and walks the DOM, applying
//     search highlighting and URL detection to text nodes only.

function htmlNodeToReact(node, searchTerm, keyGen) {
  if (node.nodeType === Node.TEXT_NODE) {
    return renderTextWithExtras(node.textContent, searchTerm, keyGen);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  const children = [...node.childNodes].map(n => htmlNodeToReact(n, searchTerm, keyGen)).flat().filter(Boolean);

  switch (tag) {
    case 'strong': case 'b':  return <strong key={keyGen()}>{children}</strong>;
    case 'em':     case 'i':  return <em key={keyGen()}>{children}</em>;
    case 'u':                 return <u key={keyGen()}>{children}</u>;
    case 'br':                return <br key={keyGen()} />;
    case 'div': case 'p':     return <div key={keyGen()}>{children}</div>;
    case 'a': {
      const href = node.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        return (
          <a key={keyGen()} href={href} target="_blank" rel="noopener noreferrer"
             onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
             draggable={false}
             style={{ color: 'var(--theme-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {children}
          </a>
        );
      }
      return <span key={keyGen()}>{children}</span>;
    }
    default: return <span key={keyGen()}>{children}</span>;
  }
}

function renderHtmlValue(html, searchTerm) {
  const clean = sanitizeHtml(html);
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html');
  const root = doc.body.firstChild;
  let key = 0;
  const keyGen = () => key++;
  return [...root.childNodes].map(n => htmlNodeToReact(n, searchTerm, keyGen)).flat().filter(Boolean);
}

// ── Main entry: picks the right renderer based on content shape ──────────

export function renderTaskValue(value, searchTerm = '') {
  if (!value) return null;
  if (isHtml(value)) return renderHtmlValue(value, searchTerm);
  return renderRichText(value, searchTerm);
}
