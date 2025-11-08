import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav
        style={{
        display: "flex",
        gap: "1rem",
        background: "#f2f2f2",
        padding: "1rem",
        borderBottom: "1px solid #ccc",
      }}
    >
      {user ? (
        <>
          <span>Welcome, {user.name || user.username}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="https://auth-service.local/login?redirect_uri=http://localhost:5173/login">
          Login / Signup
        </a>
      )}
      <Link to="/users">Users</Link>
      <Link to="/requests">Requests</Link>
      <Link to="/responses">Responses</Link>
    </nav>
  );
}

