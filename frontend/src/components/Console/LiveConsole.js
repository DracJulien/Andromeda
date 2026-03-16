import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Pause, Play, Trash2, Download } from 'lucide-react';

const levelStyles = {
  INFO: { color: 'text-blue-600', prefix: 'INF' },
  WARN: { color: 'text-yellow-600', prefix: 'WRN' },
  ERROR: { color: 'text-red-500', prefix: 'ERR' },
  SUCCESS: { color: 'text-emerald-600', prefix: 'OK ' },
};

export default function LiveConsole({ api }) {
  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const scrollRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Load initial logs
    const token = localStorage.getItem('orbit_token');
    const h = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${api}/api/logs?limit=50`, { credentials: 'include', headers: h })
      .then((r) => r.json())
      .then((data) => setLogs(data.reverse()))
      .catch(() => {});

    // SSE stream
    const es = new EventSource(`${api}/api/logs/stream`);
    eventSourceRef.current = es;
    es.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-200), log]);
      } catch {}
    };
    es.onerror = () => {
      es.close();
      setTimeout(() => {
        const newEs = new EventSource(`${api}/api/logs/stream`);
        eventSourceRef.current = newEs;
        newEs.onmessage = es.onmessage;
      }, 3000);
    };
    return () => es.close();
  }, [api]);

  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, paused]);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter((l) => l.level === filter);

  const exportLogs = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.level}] ${l.action}: ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="live-console-page" className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-orbit-text-main">
            Live Console
          </h1>
          <p className="text-sm text-orbit-text-dim mt-1 font-mono">
            Real-time agent telemetry stream
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'INFO', 'WARN', 'ERROR'].map((f) => (
            <button
              key={f}
              data-testid={`filter-${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-orbit-blue/10 text-orbit-blue border border-orbit-blue/30'
                  : 'text-orbit-text-dim hover:text-orbit-text-main border border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-orbit-bg-main border border-orbit-border-main rounded-sm overflow-hidden flex flex-col min-h-0 shadow-inner">
        <div className="flex items-center justify-between px-3 py-2 border-b border-orbit-border-main bg-orbit-bg-panel flex-shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-orbit-blue" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-orbit-text-dim">
              orbit://console
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-yellow-500' : 'bg-orbit-success animate-pulse'}`} />
          </div>
          <div className="flex items-center gap-1">
            <button
              data-testid="toggle-pause-btn"
              onClick={() => setPaused(!paused)}
              className="p-1 rounded-sm text-orbit-text-dim hover:text-orbit-text-main transition-colors"
              title={paused ? 'Resume' : 'Pause'}
            >
              {paused ? <Play size={12} /> : <Pause size={12} />}
            </button>
            <button
              data-testid="export-logs-btn"
              onClick={exportLogs}
              className="p-1 rounded-sm text-orbit-text-dim hover:text-orbit-text-main transition-colors"
              title="Export logs"
            >
              <Download size={12} />
            </button>
            <button
              data-testid="clear-console-btn"
              onClick={() => setLogs([])}
              className="p-1 rounded-sm text-orbit-text-dim hover:text-orbit-text-main transition-colors"
              title="Clear"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
          {filteredLogs.length === 0 ? (
            <div className="text-orbit-text-dim/50 text-center py-8 italic">
              Awaiting telemetry data...
            </div>
          ) : (
            filteredLogs.map((log, i) => {
              const style = levelStyles[log.level] || levelStyles.INFO;
              return (
                <div
                  key={log.log_id || i}
                  data-testid={`log-entry-${i}`}
                  className="flex gap-2 py-0.5 hover:bg-orbit-bg-surface transition-colors leading-relaxed group"
                >
                  <span className="text-orbit-text-dim opacity-40 group-hover:opacity-70 flex-shrink-0 w-20">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`flex-shrink-0 w-8 font-bold ${style.color}`}>
                    {style.prefix}
                  </span>
                  <span className="text-orbit-text-dim flex-shrink-0">
                    {log.action}
                  </span>
                  <span className="text-orbit-text-main/80 group-hover:text-orbit-text-main">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
