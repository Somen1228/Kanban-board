// Renders inline markdown (**bold**, __underline__, _italic_), URLs, and search highlights
// Returns an array of React nodes — safe to place inside any <p> or <span>

function highlight(str, term) {
  if (!term?.trim()) return [str];
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return str.split(new RegExp(`(${safe})`, 'gi')).map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <span key={i} style={{ background: 'var(--theme-highlight-bg)', borderRadius: '2px', padding: '0 2px' }}>{part}</span>
      : part
  );
}

export function renderRichText(text, searchTerm = '') {
  if (!text) return null;

  // Order matters: ** before __, __ before _ to avoid partial matches
  const rx = /\*\*[^*\n]+\*\*|__[^_\n]+__|_[^_\n]+_|https?:\/\/[^\s]+/g;
  const parts = [];
  let lastIndex = 0;
  let key = 0;
  let m;

  while ((m = rx.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(<span key={key++}>{highlight(text.slice(lastIndex, m.index), searchTerm)}</span>);
    }
    const t = m[0];
    if (t.startsWith('**')) {
      parts.push(<strong key={key++}>{highlight(t.slice(2, -2), searchTerm)}</strong>);
    } else if (t.startsWith('__')) {
      parts.push(<u key={key++}>{highlight(t.slice(2, -2), searchTerm)}</u>);
    } else if (t.startsWith('_')) {
      parts.push(<em key={key++}>{highlight(t.slice(1, -1), searchTerm)}</em>);
    } else {
      parts.push(
        <a key={key++} href={t} target="_blank" rel="noopener noreferrer"
           onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
           draggable={false}
           style={{ color: 'var(--theme-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>
          {t}
        </a>
      );
    }
    lastIndex = m.index + t.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{highlight(text.slice(lastIndex), searchTerm)}</span>);
  }

  return parts.length ? parts : [text];
}
