import { useState } from 'react';
import api from '../services/api';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useAuth } from '../contexts/AuthContext';
import './ResponseForm.css';

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
    <form onSubmit={handleSubmit} className="form">
      <div className="formGroup">
        <textarea
          placeholder="Write your response message..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          rows={3}
          className="textarea"
        />
      </div>
      <button type="submit" className="submitButton">
        Send Response
      </button>
    </form>
  );
}
