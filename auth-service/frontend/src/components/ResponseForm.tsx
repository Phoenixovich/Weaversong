import { useState } from 'react';
import api from '../services/api';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';

interface ResponseFormProps {
  request_id: string;
  onCreated?: () => void;
}

export default function ResponseForm({ request_id, onCreated }: ResponseFormProps) {
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();

  const [form, setForm] = useState({ message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require authentication for creating responses
    requireAuth(async () => {
      const responderId = user?.id;
      if (!responderId) return;

      const payload = {
        request_id,
        responder_id: responderId,
        message: form.message,
        status: 'pending',
      };

      await api.post('/helpboard/responses', payload);
      setForm({ message: '' });
      onCreated?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formGroup}>
        <textarea
          placeholder="Write your response message..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          rows={3}
          style={styles.textarea}
        />
      </div>
      <button type="submit" style={styles.submitButton}>
        Send Response
      </button>
    </form>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'border-color 0.3s',
  },
  submitButton: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
    alignSelf: 'flex-start',
  },
};
