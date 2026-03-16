import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('orbit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export default function Header() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API}/api/health`);
        setHealth(await res.json());
      } catch { setHealth(null); }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === 'operational';

  return (
    <header data-testid="header"
      className="h-14 border-b border-[#1F2937] flex items-center justify-between px-6 bg-orbit-black/80 backdrop-blur-sm z-10 flex-shrink-0">
      <div className="flex items-center gap-3">
        <Activity size={16} className="text-orbit-blue" />
        <span className="font-heading text-sm font-semibold tracking-wider uppercase text-gray-400">Mission Control</span>
      </div>
      <div className="flex items-center gap-4">
        {health && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-gray-500">PROPS: <span className="text-gray-300">{health.properties?.total || 0}</span></span>
            <span className="text-gray-500">ONLINE: <span className="text-orbit-success">{health.properties?.online || 0}</span></span>
          </div>
        )}
        <div data-testid="system-health-indicator"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-wider ${
            isOnline ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'bg-red-900/20 text-red-400 border border-red-900/50'
          }`}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'Systems Nominal' : 'Offline'}
        </div>
      </div>
    </header>
  );
}
