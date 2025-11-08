import { useState } from 'react';
import api from '../services/api';

interface ResponseFormProps {
  request_id: string;
  onCreated?: () => void;
}

export default function ResponseForm({ request_id, onCreated }: ResponseFormProps) {
  const [form, setForm] = useState({ responder_id: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      request_id,
      responder_id: form.responder_id,
      message: form.message,
      status: 'pending',
    };

    await api.post('/helpboard/responses', payload);
    setForm({ responder_id: '', message: '' });
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <input placeholder="Responder ID" value={form.responder_id} onChange={(e) => setForm({ ...form, responder_id: e.target.value })} required />
      <input placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
      <button type="submit">Respond</button>
    </form>
  );
}
