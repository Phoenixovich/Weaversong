import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import UserForm from "../components/UserForm";

interface Trade {
  name: string;
  experience_years: number;
  description?: string;
  rate?: number;
}

interface User {
  _id: string;
  user_id: string;
  trades: Trade[];
  availability: string;
  radius_km: number;
  location?: { type: string; coordinates: [number, number] };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tradeSearch, setTradeSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNearby = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const data = await apiClient.get<User[]>(
        `/helpboard/users/nearby?lat=${latitude}&lon=${longitude}&radius_km=3`
      );
      setUsers(data);
      setLoading(false);
    });
  };

  const searchByTrade = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const data = await apiClient.get<User[]>(
        `/helpboard/users/search?trade=${tradeSearch}&lat=${latitude}&lon=${longitude}&radius_km=3`
      );
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchNearby();
  }, []);

  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            👷 Nearby Helpers
          </h1>
          <p className="text-xl text-gray-600">
            Find local professionals and request help
          </p>
        </header>

        <div className="card mb-6">
          <UserForm onCreated={fetchNearby} />
        </div>

        <div className="card mb-6">
          <div className="flex gap-4 flex-wrap">
            <input
              className="input-field flex-1 min-w-[200px]"
              placeholder="Search by trade (e.g. Plumber)"
              value={tradeSearch}
              onChange={(e) => setTradeSearch(e.target.value)}
            />
            <button 
              onClick={searchByTrade} 
              disabled={!tradeSearch}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
            <button 
              onClick={fetchNearby}
              className="btn-secondary"
            >
              Show Nearby
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => (
              <div
                key={u._id}
                className="card card-hover"
              >
                <div className="font-semibold text-lg text-gray-900 mb-2">
                  {u.trades?.map((t) => t.name).join(", ") || "No trades listed"}
                </div>
                <div className="text-gray-600 mb-2">
                  {u.availability}
                </div>
                <div className="text-sm text-gray-500">
                  Radius: {u.radius_km} km
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
