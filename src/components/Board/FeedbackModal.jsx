import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { feedbackApi } from '../../services/api';
import { VscClose } from 'react-icons/vsc';

function FeedbackModal({ isOpen, onClose }) {
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--theme-text-primary)' }}>Send Feedback</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--theme-text-secondary)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}>
            <VscClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--theme-text-primary)', fontWeight: 500 }}>
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-primary)',
                fontSize: '0.875rem',
              }}>
              <option value="feedback">💬 General Feedback</option>
              <option value="feature-request">✨ Feature Request</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="query">❓ Query</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--theme-text-primary)', fontWeight: 500 }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief subject of your feedback"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-primary)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--theme-text-primary)', fontWeight: 500 }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more details..."
              rows="5"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-bg-secondary)',
                color: 'var(--theme-text-primary)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
              }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: isLoading ? 0.7 : 1,
              }}>
              {isLoading ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;
