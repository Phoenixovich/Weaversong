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
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            💬 All Responses
          </h1>
          <p className="text-xl text-gray-600">
            View all responses to help requests
          </p>
        </header>

        {loading ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {responses.map((r) => (
              <div key={r._id} className="card card-hover">
                <div className="flex justify-between items-start mb-3">
                  <strong className="text-gray-900">{r.responder_id}</strong>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    r.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    r.status === 'declined' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{r.message}</p>
                <div className="text-sm text-gray-500">
                  Request ID: {r.request_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
