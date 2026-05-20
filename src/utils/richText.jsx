// Renders task content for display: handles HTML (from contentEditable editor),
// legacy markdown markers, URLs, and search-term highlighting.

import { isHtml, sanitizeHtml } from './htmlEditor';

const URL_RX = /(https?:\/\/[^\s<>]+)/g;
const MD_RX  = /\*\*[^*\n]+\*\*|__[^_\n]+__|_[^_\n]+_|https?:\/\/[^\s]+/g;

// ── Shared: highlight a search term inside plain text ─────────────────────

// Accepts a single term (string) or multiple (array). Highlights all of them.
function highlight(str, terms) {
  const list = Array.isArray(terms)
    ? terms.filter((t) => t && t.trim())
    : (terms && terms.trim() ? [terms] : []);
  if (list.length === 0) return [str];
  const escaped = list.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const lowerSet = new Set(list.map((t) => t.toLowerCase()));
  const rx = new RegExp(`(${escaped.join('|')})`, 'gi');
  return str.split(rx).map((part, i) =>
    lowerSet.has(part.toLowerCase())
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
    case 'h1':                return <h1 key={keyGen()} style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.4rem 0' }}>{children}</h1>;
    case 'h2':                return <h2 key={keyGen()} style={{ fontSize: '1.1rem',  fontWeight: 600, margin: '0.35rem 0' }}>{children}</h2>;
    case 'h3':                return <h3 key={keyGen()} style={{ fontSize: '1rem',    fontWeight: 600, margin: '0.3rem 0' }}>{children}</h3>;
    case 'ul':                return <ul key={keyGen()} style={{ paddingLeft: '1.25rem', listStyle: 'disc',    margin: '0.25rem 0' }}>{children}</ul>;
    case 'ol':                return <ol key={keyGen()} style={{ paddingLeft: '1.25rem', listStyle: 'decimal', margin: '0.25rem 0' }}>{children}</ol>;
    case 'li':                return <li key={keyGen()}>{children}</li>;
    case 'blockquote':        return <blockquote key={keyGen()} style={{ borderLeft: '3px solid var(--theme-border)', paddingLeft: '0.6rem', margin: '0.3rem 0', color: 'var(--theme-text-secondary)' }}>{children}</blockquote>;
    case 'pre': {
      // Render code blocks with their classes intact (hljs spans inside)
      const lang = node.getAttribute('data-lang');
      return (
        <pre key={keyGen()} data-lang={lang || undefined} className="kandoo-code-block">
          {children}
        </pre>
      );
    }
    case 'code': {
      const className = node.getAttribute('class') || '';
      return <code key={keyGen()} className={className}>{children}</code>;
    }
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
