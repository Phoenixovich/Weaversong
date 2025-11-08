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
import UsersPage from './pages/UsersPage';
import RequestsPage from './pages/RequestsPage';
import ResponsesPage from './pages/ResponsesPage';
import LoginCallback from './pages/LoginCallback';
import CityPulse from './pages/CityPulse';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clarifai"
          element={
            <ProtectedRoute>
              <ClarifAI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citypulse"
          element={
            <ProtectedRoute>
              <CityPulse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/public-data"
          element={
            <ProtectedRoute>
              <PublicDataHub />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/helpboard/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/helpboard/requests"
          element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/helpboard/responses"
          element={
            <ProtectedRoute>
              <ResponsesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/helpboard/login" element={<LoginCallback />} />
      </Routes>
    </>
  );
};

function App() {
  return <AppRoutes />;
}

export default App;

