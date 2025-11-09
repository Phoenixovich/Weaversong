import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { ClarifAI } from './pages/ClarifAI';
import { PublicDataHub } from './pages/PublicDataHub';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import UsersPage from './pages/UsersPage';
import RequestsPage from './pages/RequestsPage';
import ResponsesPage from './pages/ResponsesPage';
import LoginCallback from './pages/LoginCallback';
import CityPulse from './pages/CityPulse';
import { PedestrianAnalyzer } from './pages/PedestrianAnalyzer';

const AppRoutes: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Public pages - accessible without login (view-only, create/edit requires auth) */}
        <Route path="/citypulse" element={<CityPulse />} />
        <Route path="/public-data" element={<PublicDataHub />} />
        <Route path="/clarifai" element={<ClarifAI />} />
        <Route path="/helpboard/users" element={<UsersPage />} />
        <Route path="/helpboard/requests" element={<RequestsPage />} />
        <Route path="/helpboard/responses" element={<ResponsesPage />} />
        {/* Protected pages - require login */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedestrian-analyzer"
          element={
            <ProtectedRoute>
              <PedestrianAnalyzer />
            </ProtectedRoute>
          }
        />
        <Route path="/helpboard/login" element={<LoginCallback />} />
        {/* Default route - redirect to public page */}
        <Route path="/" element={<Navigate to="/citypulse" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return <AppRoutes />;
}

export default App;

