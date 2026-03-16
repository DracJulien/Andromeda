import React, { useState, useEffect } from 'react';
import { Activity, Building2, RefreshCw, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

function getAuthHeaders() {
  const token = localStorage.getItem('orbit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export default function Overview({ api }) {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const h = { credentials: 'include', headers: getAuthHeaders() };
        const [hRes, lRes, pRes] = await Promise.all([
          fetch(`${api}/api/health`),
          fetch(`${api}/api/logs?limit=8`, h),
          fetch(`${api}/api/properties`, h),
        ]);
        setHealth(await hRes.json());
        setLogs(await lRes.json());
        setProperties(await pRes.json());
      } catch {}
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [api]);

  const stats = [
    {
      label: 'Total Properties',
      value: health?.properties?.total || 0,
      icon: Building2,
      color: 'text-orbit-blue',
      bg: 'bg-orbit-blue/10',
    },
    {
      label: 'Online',
      value: health?.properties?.online || 0,
      icon: CheckCircle,
      color: 'text-orbit-success',
      bg: 'bg-emerald-900/20',
    },
    {
      label: 'Syncing',
      value: health?.properties?.syncing || 0,
      icon: RefreshCw,
      color: 'text-orbit-warning',
      bg: 'bg-yellow-900/20',
    },
    {
      label: 'Errors',
      value: health?.properties?.error || 0,
      icon: AlertTriangle,
      color: 'text-orbit-error',
      bg: 'bg-red-900/20',
    },
  ];

  const levelColor = {
    INFO: 'text-blue-400',
    WARN: 'text-yellow-400',
    ERROR: 'text-red-400',
    SUCCESS: 'text-emerald-400',
  };

  return (
    <div data-testid="dashboard-overview" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            System overview and telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${health?.agent?.running ? 'bg-orbit-success animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs font-mono text-gray-400 uppercase">
            Agent {health?.agent?.running ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}
            className="bg-orbit-panel border border-[#1F2937] rounded-sm p-5 relative overflow-hidden group hover:border-[#374151] transition-colors"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">{s.label}</p>
                <p className="font-heading text-4xl font-bold text-white">{s.value}</p>
              </div>
              <div className={`p-2 rounded-sm ${s.bg}`}>
                <s.icon size={20} className={s.color} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: s.color.includes('blue') ? '#0070F3' : s.color.includes('success') ? '#10B981' : s.color.includes('warning') ? '#F59E0B' : '#EF4444' }} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F2937]">
            <Activity size={14} className="text-orbit-blue" />
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Recent Activity</span>
          </div>
          <div className="divide-y divide-[#1F2937] max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm font-mono">
                No activity recorded. Add a property to begin.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.log_id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="mt-0.5">
                    <Clock size={12} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono ${levelColor[log.level] || 'text-gray-400'}`}>
                      [{log.level}] {log.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{log.message}</p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F2937]">
            <Zap size={14} className="text-orbit-warning" />
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Quick Status</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-mono text-xs">MongoDB</span>
              <span className={`text-xs font-mono ${health?.mongodb ? 'text-orbit-success' : 'text-orbit-error'}`}>
                {health?.mongodb ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-mono text-xs">Agent Status</span>
              <span className={`text-xs font-mono ${health?.agent?.running ? 'text-orbit-success' : 'text-gray-500'}`}>
                {health?.agent?.running ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-mono text-xs">Poll Interval</span>
              <span className="text-xs font-mono text-gray-300">
                {health?.agent?.polling_interval || 900}s
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-mono text-xs">Last Run</span>
              <span className="text-xs font-mono text-gray-300">
                {health?.agent?.last_run ? new Date(health.agent.last_run).toLocaleTimeString() : 'Never'}
              </span>
            </div>

            <div className="pt-3 mt-3 border-t border-[#1F2937]">
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2">Properties</p>
              {properties.length === 0 ? (
                <p className="text-xs text-gray-600 font-mono">No properties registered</p>
              ) : (
                properties.slice(0, 5).map((p) => (
                  <div key={p.property_id} className="flex items-center gap-2 py-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      p.status === 'Online' ? 'bg-orbit-success' :
                      p.status === 'Error' ? 'bg-orbit-error' :
                      p.status === 'Syncing' ? 'bg-orbit-warning animate-pulse' :
                      'bg-gray-600'
                    }`} />
                    <span className="text-xs text-gray-400 truncate">{p.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
