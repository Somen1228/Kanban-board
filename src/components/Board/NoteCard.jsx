import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  VscBold, VscItalic, VscClose,
  VscScreenFull, VscListUnordered, VscListOrdered, VscCode,
} from 'react-icons/vsc';
import { RiUnderline, RiHeading } from 'react-icons/ri';
import { IoImageOutline } from 'react-icons/io5';
import RichEditor from './RichEditor';
import ImageModal from './ImageModal';
import { sanitizeHtml, isHtml, markdownToHtml, htmlToText } from '../../utils/htmlEditor';

// ── Shared image compression util (mirrored from Card.jsx) ─────────────────
const compressImage = (file) =>
  new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) { reject(new Error('Image must be smaller than 10 MB')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = ({ target: { result } }) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Not a valid image'));
      img.onload = () => {
        const MAX = 1200;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });

// ── Code block insertion + lazy-loaded syntax highlighting ──────────────────

// Lazy-load highlight.js (~30KB gz). Only fetched when a note actually has
// or gains a code block.
let hljsPromise = null;
function loadHljs() {
  if (!hljsPromise) hljsPromise = import('highlight.js').then((m) => m.default);
  return hljsPromise;
}

function insertCodeBlock(editorRef) {
  // Insert a code block and a trailing paragraph so the cursor can escape it.
  // Browsers handle the cursor placement inside the inserted <code> element.
  const html =
    '<pre><code class="language-text">// type your code here</code></pre><p><br></p>';
  editorRef.current?.exec('insertHTML', html);
}

// Iterate <pre><code> blocks in the editor DOM and run hljs.highlightAuto.
// Skips re-highlighting blocks that already match their current text + lang.
async function applyHighlighting(editorEl) {
  if (!editorEl) return;
  const codes = editorEl.querySelectorAll('pre > code');
  if (codes.length === 0) return;
  const hljs = await loadHljs();
  codes.forEach((code) => {
    // Reset to plain text so we re-detect cleanly (strips previous spans)
    const text = code.textContent;
    code.textContent = text;
    code.className = '';
    try {
      hljs.highlightElement(code);
    } catch {
      // ignore — keep plain text
    }
    const cls = code.className || '';
    const lang = (cls.match(/language-(\S+)/)?.[1]) || 'text';
    if (code.parentElement) code.parentElement.dataset.lang = lang;
  });
}

// ── Toolbar shared by inline and expanded views ─────────────────────────────
function NoteToolbar({ editorRef, onUploadClick, compact = false }) {
  const apply  = (cmd, value)    => editorRef.current?.exec(cmd, value);
  const mod = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl';

  const btnStyle = {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '0.25rem',
    color: 'var(--theme-text-secondary)',
    cursor: 'pointer',
    padding: compact ? '2px 5px' : '4px 8px',
    fontSize: compact ? '0.8rem' : '0.95rem',
    display: 'flex', alignItems: 'center',
    transition: 'background 0.12s',
  };
  const hover = (e) => { e.currentTarget.style.background = 'var(--theme-bg-hover)'; };
  const leave = (e) => { e.currentTarget.style.background = 'transparent'; };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', borderBottom: '1px solid var(--theme-border)', paddingBottom: '4px', marginBottom: '6px' }}
         onMouseDown={(e) => e.preventDefault()}>
      <button type="button" style={btnStyle} title={`Heading (${mod}+Alt+2)`}
        onMouseEnter={hover} onMouseLeave={leave}
        onClick={() => apply('formatBlock', 'H2')}>
        <RiHeading />
      </button>
      <button type="button" style={btnStyle} title={`Bold (${mod}+B)`}
        onMouseEnter={hover} onMouseLeave={leave}
        onClick={() => apply('bold')}>
        <VscBold />
      </button>
      <button type="button" style={btnStyle} title={`Italic (${mod}+I)`}
        onMouseEnter={hover} onMouseLeave={leave}
        onClick={() => apply('italic')}>
        <VscItalic />
      </button>
      <button type="button" style={btnStyle} title={`Underline (${mod}+U)`}
        onMouseEnter={hover} onMouseLeave={leave}
        onClick={() => apply('underline')}>
        <RiUnderline />
      </button>
      <span style={{ width: 1, background: 'var(--theme-border)', margin: '2px 4px' }} />
      <button type="button" style={btnStyle} title="Bullet list"
        onMouseEnter={hover} onMouseLeave={leave}
        onClick={() => apply('insertUnorderedList')}>
        <VscListUnordered />
      </button>
      <button type="button" style={btnStyle} title="Numbered list"
        onMouseEnter={hover} onMouseLeave={leave}
        onClick={() => apply('insertOrderedList')}>
        <VscListOrdered />
      </button>
      <span style={{ width: 1, background: 'var(--theme-border)', margin: '2px 4px' }} />
      <button type="button" style={btnStyle} title="Code block (auto language)"
        onMouseEnter={hover} onMouseLeave={leave}
        onClick={() => insertCodeBlock(editorRef)}>
        <VscCode />
      </button>
      {onUploadClick && (
        <>
          <span style={{ width: 1, background: 'var(--theme-border)', margin: '2px 4px' }} />
          <button type="button" style={btnStyle} title="Add image"
            onMouseEnter={hover} onMouseLeave={leave}
            onClick={onUploadClick}>
            <IoImageOutline />
          </button>
        </>
      )}
    </div>
  );
}

// ── Image strip (used inline + in expanded view) ────────────────────────────
function ImageStrip({ images, onRemove, onView, thumbSize = 64 }) {
  if (!images || images.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', justifyContent: 'flex-start' }}>
      {images.map((src, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <img
            src={src}
            alt={`img-${i}`}
            onClick={(e) => { e.stopPropagation(); onView?.(i); }}
            style={{
              width: thumbSize, height: thumbSize,
              objectFit: 'cover', borderRadius: 4,
              border: '1px solid var(--theme-border)',
              cursor: onView ? 'pointer' : 'default', flexShrink: 0,
            }}
          />
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--theme-danger)', border: 'none', borderRadius: '50%',
                color: 'white', width: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 10, padding: 0,
              }}
            >
              <VscClose />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// "edited X ago" formatter
function relativeTime(ts) {
  if (!ts) return '';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)       return 'just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800)   return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Expanded (fullscreen) view ──────────────────────────────────────────────
function NoteExpandModal({ title, note, onChangeContent, onChangeImages, onClose }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [viewing, setViewing] = useState(null);
  const [tick, setTick] = useState(0); // re-render every minute so "edited X ago" stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Apply syntax highlighting once the editor mounts inside the modal
  useEffect(() => {
    const id = setTimeout(() => applyHighlighting(editorRef.current?.getElement()), 50);
    return () => clearTimeout(id);
  }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const out = [];
    for (const f of files) {
      try { out.push(await compressImage(f)); }
      catch (err) { toast.error(`${f.name}: ${err.message}`); }
    }
    if (out.length) onChangeImages([...(note.images || []), ...out]);
    editorRef.current?.focus();
  };

  const initialHtml = isHtml(note.content) ? note.content : markdownToHtml(note.content || '');

  return createPortal(
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{
        background: 'var(--theme-bg-primary)',
        border: '1px solid var(--theme-border)',
        borderRadius: '0.75rem',
        width: '100%', maxWidth: '1200px', height: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--theme-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--theme-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title || 'Untitled note'}
            </h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--theme-text-muted)' }}>
              {note.updatedAt && `edited ${relativeTime(note.updatedAt)}`}
              {tick >= 0 ? '' : ''}
            </span>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-secondary)', fontSize: '1.2rem', display: 'flex' }}>
            <VscClose />
          </button>
        </div>

        {/* Toolbar + editor + images */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          <NoteToolbar editorRef={editorRef} onUploadClick={() => fileInputRef.current?.click()} />
          <RichEditor
            ref={editorRef}
            initialHtml={initialHtml}
            onChange={(html) => onChangeContent(sanitizeHtml(html))}
            onBlur={() => applyHighlighting(editorRef.current?.getElement())}
            placeholder="Start typing your note…"
            autoFocus
            style={{
              minHeight: '50vh',
              padding: '4px 2px',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--theme-text-primary)',
            }}
          />
          <ImageStrip
            images={note.images}
            thumbSize={92}
            onRemove={(i) => onChangeImages(note.images.filter((_, idx) => idx !== i))}
            onView={(i) => setViewing(i)}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.5rem 1rem', borderTop: '1px solid var(--theme-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.72rem', color: 'var(--theme-text-muted)',
        }}>
          <span>{htmlToText(note.content || '').length} characters · autosaves</span>
          <span>Esc to close</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      {viewing !== null && (
        <ImageModal images={note.images} initialIndex={viewing} onClose={() => setViewing(null)} />
      )}
    </div>,
    document.body
  );
}

// ── Inline note body (renders inside the existing card frame) ───────────────
function NoteCard({ index, note, updateCardNote, title, cardColor }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [viewing, setViewing] = useState(null);
  const safeNote = note || { content: '', images: [], updatedAt: Date.now() };

  // Inline editor is keyed by `expanded` so it remounts (picks up fresh content)
  // whenever the fullscreen view closes.
  const editorKey = expanded ? 'expanded' : 'inline';

  // Apply syntax highlighting once after (re)mount — covers reload and
  // returning from the fullscreen view with edited code blocks.
  useEffect(() => {
    if (expanded) return; // skip while modal is open
    const id = setTimeout(() => {
      applyHighlighting(editorRef.current?.getElement());
    }, 50); // wait for RichEditor's own useEffect that sets innerHTML
    return () => clearTimeout(id);
  }, [editorKey, expanded]);

  const handleContentChange = (html) => {
    updateCardNote(index, { ...safeNote, content: sanitizeHtml(html), images: safeNote.images || [] });
  };
  const handleImagesChange = (images) => {
    updateCardNote(index, { ...safeNote, images });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const out = [];
    for (const f of files) {
      try { out.push(await compressImage(f)); }
      catch (err) { toast.error(`${f.name}: ${err.message}`); }
    }
    if (out.length) handleImagesChange([...(safeNote.images || []), ...out]);
    editorRef.current?.focus();
  };

  const initialHtml = isHtml(safeNote.content) ? safeNote.content : markdownToHtml(safeNote.content || '');

  return (
    <>
      {/* Body — replaces the task list in note-type cards */}
      <div style={{ padding: '0.5rem 0.6rem', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar + expand on the same row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <NoteToolbar
              editorRef={editorRef}
              onUploadClick={() => fileInputRef.current?.click()}
              compact
            />
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            title="Expand to fullscreen"
            style={{
              background: 'transparent', border: '1px solid var(--theme-border)',
              borderRadius: '0.25rem', cursor: 'pointer',
              padding: '4px 6px', display: 'flex', alignItems: 'center',
              color: 'var(--theme-text-secondary)',
              marginBottom: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <VscScreenFull />
          </button>
        </div>

        {/* Editor — auto-grows, capped, then scrolls */}
        <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
          <RichEditor
            key={editorKey}
            ref={editorRef}
            initialHtml={initialHtml}
            onChange={handleContentChange}
            onBlur={() => applyHighlighting(editorRef.current?.getElement())}
            placeholder="Write a note…"
            style={{
              minHeight: '6rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color: 'var(--theme-text-primary)',
              padding: '2px 0',
            }}
          />
          <ImageStrip
            images={safeNote.images}
            onRemove={(i) => handleImagesChange(safeNote.images.filter((_, idx) => idx !== i))}
            onView={(i) => setViewing(i)}
          />
        </div>

        {/* Footer: last edited */}
        {safeNote.updatedAt && (
          <div style={{
            fontSize: '0.65rem', color: 'var(--theme-text-muted)',
            marginTop: 6, textAlign: 'right',
          }}>
            edited {relativeTime(safeNote.updatedAt)}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      {viewing !== null && createPortal(
        <ImageModal images={safeNote.images} initialIndex={viewing} onClose={() => setViewing(null)} />,
        document.body
      )}

      {expanded && (
        <NoteExpandModal
          title={title}
          note={safeNote}
          onChangeContent={(html) => updateCardNote(index, { ...safeNote, content: html })}
          onChangeImages={handleImagesChange}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  );
}

export default NoteCard;
