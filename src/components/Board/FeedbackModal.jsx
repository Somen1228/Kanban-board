import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { feedbackApi } from '../../services/api';
import { VscClose, VscChevronDown, VscFeedback } from 'react-icons/vsc';
import { RiCodeBlock } from 'react-icons/ri';
import { IoBugOutline } from 'react-icons/io5';
import { TbUserQuestion } from 'react-icons/tb';

const TYPES = [
  { value: 'feedback',        label: 'General Feedback', icon: <VscFeedback /> },
  { value: 'feature-request', label: 'Feature Request',  icon: <RiCodeBlock /> },
  { value: 'bug',             label: 'Bug Report',       icon: <IoBugOutline /> },
  { value: 'query',           label: 'Query',            icon: <TbUserQuestion /> },
];

function TypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = TYPES.find((t) => t.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--theme-border)',
          borderRadius: '0.375rem',
          backgroundColor: 'var(--theme-bg-secondary)',
          color: 'var(--theme-text-primary)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '0.5rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', display: 'flex' }}>{selected?.icon}</span>
          {selected?.label}
        </span>
        <VscChevronDown
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--theme-bg-secondary)',
          border: '1px solid var(--theme-border)',
          borderRadius: '0.375rem',
          overflow: 'hidden',
          zIndex: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { onChange(t.value); setOpen(false); }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: 'none',
                background: t.value === value ? 'var(--theme-bg-hover)' : 'transparent',
                color: 'var(--theme-text-primary)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = t.value === value ? 'var(--theme-bg-hover)' : 'transparent'}
            >
              <span style={{ fontSize: '1rem', display: 'flex' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackModal({ isOpen, onClose }) {
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await feedbackApi.submit({ type, subject, message });
      toast.success('Thank you for your feedback!');
      setSubject('');
      setMessage('');
      setType('feedback');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'var(--theme-bg-primary)',
          border: '1px solid var(--theme-border)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
            Send Feedback
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '1.25rem',
              cursor: 'pointer', color: 'var(--theme-text-secondary)',
              padding: 0, display: 'flex', alignItems: 'center',
            }}
          >
            <VscClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', color: 'var(--theme-text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
              Type
            </label>
            <TypeDropdown value={type} onChange={setType} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', color: 'var(--theme-text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief subject of your feedback"
              style={{
                width: '100%', padding: '0.5rem 0.75rem',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-primary)',
                fontSize: '0.875rem', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', color: 'var(--theme-text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
              Message
            </label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => { setMessage(e.target.value); autoResize(e.target); }}
              placeholder="Tell us more details..."
              rows="3"
              style={{
                width: '100%', padding: '0.5rem 0.75rem',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-primary)',
                fontSize: '0.875rem', fontFamily: 'inherit',
                resize: 'none', boxSizing: 'border-box',
                outline: 'none',
                overflowY: 'auto',
                minHeight: '72px',
                maxHeight: '240px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-primary)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.5rem 1.25rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;
