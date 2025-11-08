import { useState, useEffect } from 'react';
import api from '../services/api';
import RequestForm from '../components/RequestForm';
import ResponseForm from '../components/ResponseForm';

interface RequestItem { _id: string; title: string; trade_needed?: string; status?: string; urgency?: string; budget?: number }

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const fetchRequests = async () => {
    const res = await api.get<RequestItem[]>('/helpboard/requests');
    setRequests(res.data);
  };

  useEffect(() => { fetchRequests(); }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>📣 Help Requests</h2>
      <RequestForm onCreated={fetchRequests} />
      <ul>
        {requests.map((r) => (
          <li key={r._id} style={{ background: '#f9f9f9', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <strong>{r.title}</strong> — {r.trade_needed} — {r.status}
            <div style={{ marginTop: '0.5rem' }}>
              <ResponseForm request_id={r._id} onCreated={fetchRequests} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
