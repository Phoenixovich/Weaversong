import { useState, useEffect } from 'react';
import api from '../services/api';

interface ResponseItem { _id: string; request_id: string; responder_id: string; message: string; status: string }

export default function ResponsesPage() {
  const [responses, setResponses] = useState<ResponseItem[]>([]);

  const fetchResponses = async () => {
    const res = await api.get<ResponseItem[]>('/helpboard/responses');
    setResponses(res.data);
  };

  useEffect(() => { fetchResponses(); }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>💬 Responses</h2>
      <ul>
        {responses.map((r) => (
          <li key={r._id} style={{ background: '#fff', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <strong>For: {r.request_id}</strong>
            <div>{r.message}</div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>By: {r.responder_id} — {r.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
