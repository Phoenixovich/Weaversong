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
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            🛠️ Help Requests
          </h1>
          <p className="text-xl text-gray-600">
            Find local professionals and request help
          </p>
        </header>

        <div className="card mb-8">
          <RequestForm onCreated={fetchRequests} />
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((r) => (
              <div
                key={r._id}
                className="card card-hover"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{r.title}</h3>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Trade:</span> {r.trade_needed} | 
                      <span className="font-semibold ml-2">Budget:</span> ${r.budget} | 
                      <span className="font-semibold ml-2">Status:</span> {r.status}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{r.description}</p>

                <div className="mb-4">
                  <ResponseForm request_id={r._id} onCreated={fetchRequests} />
                </div>

                {r.responses && r.responses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Responses:</h4>
                    <div className="space-y-3">
                      {r.responses.map((res) => (
                        <div key={res._id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <strong className="text-gray-900">{res.responder_id}</strong>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              res.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              res.status === 'declined' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {res.status}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{res.message}</p>
                          {res.status === "pending" && (
                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={() => updateResponseStatus(res._id, "accepted")}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 shadow-sm hover:shadow-md transition-all duration-280 ease"
                              >
                                ✅ Accept
                              </button>
                              <button 
                                onClick={() => updateResponseStatus(res._id, "declined")}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md transition-all duration-280 ease"
                              >
                                ❌ Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
