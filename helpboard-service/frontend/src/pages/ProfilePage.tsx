import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Trade {
  name: string;
  experience_years: number;
  description: string;
  rate: number;
}

interface HelpboardProfile {
  _id?: string;
  user_id?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  radius_km: number;
  trades: Trade[];
  availability: string;
  date_created?: string;
  date_updated?: string;
}

function LocationPicker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e: import("leaflet").LeafletMouseEvent) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HelpboardProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPos, setSelectedPos] = useState<[number, number]>([41.8902, 12.4924]);
  const [newTrade, setNewTrade] = useState<Trade>({
    name: "",
    experience_years: 0,
    description: "",
    rate: 0,
  });

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const data = await apiClient.get<HelpboardProfile[]>(`/helpboard/users?limit=100`);
    // find current user’s profile
    const found = data.find((u) => u.user_id === user._id);
    if (found) {
      setProfile(found);
      if (found.location?.coordinates) {
        const [lon, lat] = found.location.coordinates;
        setSelectedPos([lat, lon]);
      }
    } else {
      // if no profile, create one automatically
      const newProfile = await apiClient.post<HelpboardProfile>("/helpboard/users", {
        user_id: user._id,
        location: { type: "Point", coordinates: [12.4924, 41.8902] },
        radius_km: 3,
        trades: [],
        availability: "available",
      });
      setProfile(newProfile);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const handleGeolocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setSelectedPos([latitude, longitude]);
    });
  };

  const handleSave = async () => {
    if (!profile) return;
    const updated = {
      ...profile,
      location: {
        type: "Point",
        coordinates: [selectedPos[1], selectedPos[0]],
      },
    };
    const saved = await apiClient.put<HelpboardProfile>(
      `/helpboard/users/${profile._id}`,
      updated
    );
    setProfile(saved);
    alert("Profile updated!");
  };

  const handleAddTrade = () => {
    if (!newTrade.name.trim()) return;
    setProfile((prev) =>
      prev ? { ...prev, trades: [...prev.trades, newTrade] } : prev
    );
    setNewTrade({ name: "", experience_years: 0, description: "", rate: 0 });
  };

  const handleRemoveTrade = (name: string) => {
    setProfile((prev) =>
      prev
        ? { ...prev, trades: prev.trades.filter((t) => t.name !== name) }
        : prev
    );
  };

  if (!user) return <p>Please log in to manage your profile.</p>;
  if (loading) return <p>Loading your profile...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>👤 My Helpboard Profile</h2>
      <p>
        Logged in as <strong>{user.name || user.username}</strong> (
        {user.email})
      </p>

      <section style={{ marginTop: "1rem" }}>
        <h3>📍 Location</h3>
        <button onClick={handleGeolocation}>Use My Current Location</button>
        <div style={{ height: "300px", marginTop: "1rem" }}>
          <MapContainer
            center={selectedPos}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationPicker
              position={selectedPos}
              onChange={(pos) => setSelectedPos(pos)}
            />
          </MapContainer>
        </div>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h3>🛠️ Trades</h3>
        <ul>
          {profile?.trades.map((t, i) => (
            <li key={i}>
              <strong>{t.name}</strong> — {t.experience_years} yrs — ${t.rate}/hr
              <br />
              <small>{t.description}</small>
              <button onClick={() => handleRemoveTrade(t.name)}>❌ Remove</button>
            </li>
          ))}
        </ul>

        <h4>Add New Trade</h4>
        <input
          placeholder="Trade name"
          value={newTrade.name}
          onChange={(e) => setNewTrade({ ...newTrade, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Experience (years)"
          value={newTrade.experience_years}
          onChange={(e) =>
            setNewTrade({ ...newTrade, experience_years: parseInt(e.target.value) })
          }
        />
        <input
          placeholder="Description"
          value={newTrade.description}
          onChange={(e) => setNewTrade({ ...newTrade, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Rate ($/hr)"
          value={newTrade.rate}
          onChange={(e) =>
            setNewTrade({ ...newTrade, rate: parseFloat(e.target.value) })
          }
        />
        <button onClick={handleAddTrade}>Add Trade</button>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h3>⚙️ Availability</h3>
        <select
          value={profile?.availability || "available"}
          onChange={(e) =>
            setProfile((prev) =>
              prev ? { ...prev, availability: e.target.value } : prev
            )
          }
        >
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="offline">Offline</option>
        </select>
      </section>

      <button style={{ marginTop: "1rem" }} onClick={handleSave}>
        💾 Save Profile
      </button>
    </div>
  );
}
