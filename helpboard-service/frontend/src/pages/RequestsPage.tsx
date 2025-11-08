import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import RequestForm from "../components/RequestForm";
import ResponseForm from "../components/ResponseForm";

interface Response {
  _id: string;
  responder_id: string;
  message: string;
  status: string;
}

interface Request {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  trade_needed: string;
  budget: number;
  status: string;
  responses?: Response[];
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await apiClient.get<Request[]>("/helpboard/requests");
    setRequests(data);
    setLoading(false);
  };

  const updateResponseStatus = async (responseId: string, status: string) => {
    await apiClient.put(`/helpboard/responses/${responseId}/status?status=${status}`, {});
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>🛠️ Help Requests</h2>
      <RequestForm onCreated={fetchRequests} />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {requests.map((r) => (
            <li
              key={r._id}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#fafafa",
              }}
            >
              <strong>{r.title}</strong> — {r.trade_needed}
              <div style={{ fontSize: "0.9em", color: "#555" }}>
                Budget: ${r.budget} | Status: {r.status}
              </div>
              <p>{r.description}</p>

              <ResponseForm request_id={r._id} onCreated={fetchRequests} />

              {r.responses && r.responses.length > 0 && (
                <ul>
                  {r.responses.map((res) => (
                    <li key={res._id}>
                      <strong>{res.responder_id}</strong>: {res.message} (
                      {res.status})
                      {res.status === "pending" && (
                        <>
                          <button onClick={() => updateResponseStatus(res._id, "accepted")}>
                            ✅ Accept
                          </button>
                          <button onClick={() => updateResponseStatus(res._id, "declined")}>
                            ❌ Decline
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
