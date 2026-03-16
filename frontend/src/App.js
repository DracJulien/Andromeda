import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import AuthCallback from './components/Auth/AuthCallback';
import LoginPage from './components/Auth/LoginPage';
import LandingPage from './components/Landing/LandingPage';
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
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function LandingWrapper() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-orbit-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orbit-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingWrapper />} />
      <Route path="/login" element={<LoginWrapper />} />
      <Route path="/dashboard/*" element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      } />
      <Route path="/properties" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      <Route path="/reservations" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      <Route path="/console" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      <Route path="/proof" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      <Route path="/my-settings" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
}

function LoginWrapper() {
  const { user, login } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
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
            <Route path="*" element={<></>} />
          </Routes>
          <RouteContent />
        </main>
      </div>
    </div>
  );
}

function RouteContent() {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/properties') return <PropertyGrid api={API} />;
  if (path === '/reservations') return <ReservationsPage />;
  if (path === '/console') return <LiveConsole api={API} />;
  if (path === '/proof') return <ProofGallery api={API} />;
  if (path === '/settings') return <SettingsPage api={API} />;
  if (path === '/users') return <AdminRoute><UsersPage /></AdminRoute>;
  if (path === '/my-settings') return <UserSettingsPage />;
  if (path === '/subscription') return <SubscriptionPage />;
  return null;
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
