import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

// WYSIWYG editor on top of contentEditable.
// Cmd/Ctrl+B/I/U → bold/italic/underline. Enter → save, Shift+Enter → newline.
// Paste is forced to plain text to keep storage clean.

const RichEditor = forwardRef(function RichEditor({
  initialHtml = '',
  onChange,
  onSave,
  onCancel,
  onBlur,
  className = '',
  style,
  placeholder = '',
  autoFocus = false,
}, ref) {
  const editorRef = useRef(null);

  const updateEmptyState = () => {
    if (!editorRef.current) return;
    const empty = !editorRef.current.textContent?.trim();
    editorRef.current.setAttribute('data-empty', empty ? 'true' : 'false');
  };

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    getElement: () => editorRef.current,
    getHtml: () => editorRef.current?.innerHTML || '',
    setHtml: (html) => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = html || '';
      updateEmptyState();
      onChange?.(editorRef.current.innerHTML);
    },
    exec: (cmd, value = null) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      document.execCommand(cmd, false, value);
      updateEmptyState();
      onChange?.(el.innerHTML);
    },
  }), [onChange]);

  // Seed initial content once. After mount, contentEditable owns the DOM.
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = initialHtml || '';
    updateEmptyState();
    if (autoFocus) {
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false); // cursor at end
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = () => {
    updateEmptyState();
    onChange?.(editorRef.current?.innerHTML || '');
  };

  const handleKeyDown = (e) => {
    // Cmd/Ctrl + B/I/U
    if ((e.metaKey || e.ctrlKey) && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'b' || k === 'i' || k === 'u') {
        e.preventDefault();
        const cmd = { b: 'bold', i: 'italic', u: 'underline' }[k];
        document.execCommand(cmd, false);
        updateEmptyState();
        onChange?.(editorRef.current?.innerHTML || '');
        return;
      }
    }

    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        onSave?.();
      } else {
        e.preventDefault();
        document.execCommand('insertLineBreak');
        updateEmptyState();
        onChange?.(editorRef.current?.innerHTML || '');
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
  };

  // Paste as plain text — keeps storage clean and prevents pasted XSS attempts
  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={onBlur}
      className={`rich-editor ${className}`}
      style={style}
      data-placeholder={placeholder}
      data-empty="true"
    />
  );
});

export default RichEditor;
