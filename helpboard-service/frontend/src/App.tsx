import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginCallback from "./pages/LoginCallback";
import UsersPage from "./pages/UsersPage";
import RequestsPage from "./pages/RequestsPage";
import ResponsesPage from "./pages/ResponsesPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <div className="min-h-screen bg-background-light">
      <Navbar />
      <Routes>
        <Route path="/" element={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Welcome to NeighborHelpboard</h1>
            <p className="text-xl text-gray-600">Connect with neighbors, find local help, and offer your skills</p>
          </div>
        } />
        <Route path="/login" element={<LoginCallback />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/responses" element={<ResponsesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
}
