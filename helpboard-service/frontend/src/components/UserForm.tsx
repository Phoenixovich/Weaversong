import { useState } from "react";
import { apiClient } from "../api/client";

interface UserFormProps {
  onCreated?: () => void; // optional callback after creation
}

export default function UserForm({ onCreated }: UserFormProps) {
  const [form, setForm] = useState({
    user_id: "",
    trade: "",
    experience_years: 1,
    availability: "available",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      user_id: form.user_id,
      location: { type: "Point", coordinates: [12.4924, 41.8902] },
      radius_km: 3,
      trades: [
        { name: form.trade, experience_years: form.experience_years },
      ],
      availability: form.availability,
    };

    await apiClient.post("/helpboard/users", payload);
    setForm({ user_id: "", trade: "", experience_years: 1, availability: "available" });
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      <input
        placeholder="User ID"
        value={form.user_id}
        onChange={(e) => setForm({ ...form, user_id: e.target.value })}
        required
      />
      <input
        placeholder="Trade"
        value={form.trade}
        onChange={(e) => setForm({ ...form, trade: e.target.value })}
        required
      />
      <input
        type="number"
        placeholder="Experience"
        value={form.experience_years}
        onChange={(e) =>
          setForm({ ...form, experience_years: Number(e.target.value) })
        }
        min={1}
        required
      />
      <select
        value={form.availability}
        onChange={(e) => setForm({ ...form, availability: e.target.value })}
      >
        <option value="available">Available</option>
        <option value="busy">Busy</option>
      </select>
      <button type="submit">Add</button>
    </form>
  );
}
