import { useState, useEffect } from "react";
import { apiClient } from "../api/client";

interface Response {
  _id: string;
  request_id: string;
  responder_id: string;
  message: string;
  status: string;
}

export default function ResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResponses = async () => {
    setLoading(true);
    const data = await apiClient.get<Response[]>("/helpboard/responses");
    setResponses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>💬 All Responses</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {responses.map((r) => (
            <li key={r._id}>
              <strong>{r.responder_id}</strong> → Request {r.request_id}
              <br />
              {r.message} ({r.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
