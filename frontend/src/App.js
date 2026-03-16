import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import AuthCallback from './components/Auth/AuthCallback';
import LoginPage from './components/Auth/LoginPage';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Overview from './components/Dashboard/Overview';
import PropertyGrid from './components/Properties/PropertyGrid';
import LiveConsole from './components/Console/LiveConsole';
import ProofGallery from './components/Proof/ProofGallery';
import SettingsPage from './components/Settings/SettingsPage';
import ReservationsPage from './components/Reservations/ReservationsPage';
import UsersPage from './components/Users/UsersPage';
import UserSettingsPage from './components/UserSettings/UserSettingsPage';
import SubscriptionPage from './components/Subscription/SubscriptionPage';

const API = process.env.REACT_APP_BACKEND_URL;

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-orbit-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orbit-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  const { login } = useAuth();

  // CRITICAL: Detect session_id during render, not in useEffect
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginWrapper />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function LoginWrapper() {
  const { user, login } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <LoginPage onLogin={(u, t) => { login(u, t); }} />;
}

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-orbit-black text-gray-100 overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Overview api={API} />} />
            <Route path="/dashboard" element={<Overview api={API} />} />
            <Route path="/properties" element={<PropertyGrid api={API} />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/console" element={<LiveConsole api={API} />} />
            <Route path="/proof" element={<ProofGallery api={API} />} />
            <Route path="/settings" element={<SettingsPage api={API} />} />
            <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
            <Route path="/my-settings" element={<UserSettingsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Router>
  );
}

export default App;
