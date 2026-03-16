import React, { useState, useEffect } from 'react';
import { Settings, Save, Play, Square, RefreshCw, Zap } from 'lucide-react';

export default function SettingsPage({ api }) {
  const [agentStatus, setAgentStatus] = useState(null);
  const [interval, setInterval_] = useState(900);
  const [saving, setSaving] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${api}/api/agent/status`);
      const data = await res.json();
      setAgentStatus(data);
      setInterval_(data.polling_interval || 900);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, [api]);

  const toggleAgent = async () => {
    const endpoint = agentStatus?.running ? 'stop' : 'start';
    await fetch(`${api}/api/agent/${endpoint}`, { method: 'POST' });
    fetchStatus();
  };

  const saveConfig = async () => {
    setSaving(true);
    await fetch(`${api}/api/agent/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ polling_interval: interval }),
    });
    setSaving(false);
    fetchStatus();
  };

  return (
    <div data-testid="settings-page" className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">
          Agent configuration and control
        </p>
      </div>

      <div className="bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F2937]">
          <Zap size={14} className="text-orbit-blue" />
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Agent Control</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Agent Status</p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">
                {agentStatus?.running ? 'Agent is actively syncing properties' : 'Agent is idle'}
              </p>
            </div>
            <button
              data-testid="toggle-agent-btn"
              onClick={toggleAgent}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                agentStatus?.running
                  ? 'bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50'
                  : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/50'
              }`}
            >
              {agentStatus?.running ? (
                <>
                  <Square size={14} /> Stop Agent
                </>
              ) : (
                <>
                  <Play size={14} /> Start Agent
                </>
              )}
            </button>
          </div>

          {agentStatus?.running && agentStatus?.current_task && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orbit-blue/5 border border-orbit-blue/20 rounded-sm">
              <RefreshCw size={12} className="text-orbit-blue animate-spin" />
              <span className="text-xs font-mono text-orbit-blue">
                Syncing: {agentStatus.current_task.slice(0, 8)}...
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F2937]">
          <Settings size={14} className="text-gray-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Configuration</span>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">
              Polling Interval (seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                data-testid="polling-interval-input"
                type="number"
                min="60"
                max="3600"
                value={interval}
                onChange={(e) => setInterval_(parseInt(e.target.value) || 900)}
                className="w-32 px-3 py-2 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 font-mono focus:outline-none focus:border-orbit-blue transition-colors"
              />
              <span className="text-xs text-gray-500 font-mono">
                ({Math.floor(interval / 60)}m {interval % 60}s)
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-600 mt-1">
              How often the agent checks for calendar changes (min: 60s, max: 3600s)
            </p>
          </div>

          <button
            data-testid="save-config-btn"
            onClick={saveConfig}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-orbit-blue text-white hover:bg-orbit-blue-hover text-sm font-medium transition-colors shadow-[0_0_10px_rgba(0,112,243,0.3)] disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <div className="bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F2937]">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400">System Info</span>
        </div>
        <div className="p-4 space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Last Agent Run</span>
            <span className="text-gray-300">
              {agentStatus?.last_run ? new Date(agentStatus.last_run).toLocaleString() : 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Vision Model</span>
            <span className="text-gray-300">Gemini 2.5 Flash</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Browser Engine</span>
            <span className="text-gray-300">Playwright Chromium</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mock Pages</span>
            <span className="text-gray-300">/storage/mock_pages/</span>
          </div>
        </div>
      </div>
    </div>
  );
}
