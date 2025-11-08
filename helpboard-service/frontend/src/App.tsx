import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import UsersPage from "./pages/UsersPage";
import RequestsPage from "./pages/RequestsPage";
import ResponsesPage from "./pages/ResponsesPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<h2>Welcome to NeighborHelpboard</h2>} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/responses" element={<ResponsesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </>
  );
}
