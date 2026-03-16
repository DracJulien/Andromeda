import React, { useState } from 'react';
import { User, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('orbit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export default function UserSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const body = {};
      if (name !== user?.name) body.name = name;
      if (newPassword) {
        body.current_password = currentPassword;
        body.new_password = newPassword;
      }
      if (Object.keys(body).length === 0) {
        setMessage('No changes to save');
        setSaving(false);
        return;
      }
      const res = await fetch(`${API}/api/auth/settings`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Update failed');
      setMessage('Settings updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      refreshUser();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div data-testid="user-settings-page" className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-white">My Settings</h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">Manage your account</p>
      </div>

      <div className="bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1F2937]">
          <User size={14} className="text-orbit-blue" />
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Profile</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4 mb-6">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-14 h-14 rounded-full border-2 border-[#1F2937]" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-orbit-blue/20 flex items-center justify-center text-xl font-bold text-orbit-blue border-2 border-orbit-blue/30">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-200 font-medium">{user?.name}</p>
              <p className="text-xs font-mono text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase ${
                  user?.role === 'admin' ? 'bg-orbit-blue/10 text-orbit-blue' : 'bg-gray-800 text-gray-400'
                }`}>{user?.role}</span>
                <span className={`px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase ${
                  user?.subscription === 'enterprise' ? 'bg-purple-900/20 text-purple-400' :
                  user?.subscription === 'pro' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                }`}>{user?.subscription || 'starter'}</span>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-emerald-900/20 border border-emerald-900/50 rounded-sm text-xs text-emerald-400 font-mono">
              <CheckCircle size={12} /> {message}
            </div>
          )}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/20 border border-red-900/50 rounded-sm text-xs text-red-400 font-mono">{error}</div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1.5">Display Name</label>
              <input data-testid="settings-name-input" type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 font-mono focus:outline-none focus:border-orbit-blue" />
            </div>

            <div className="pt-4 border-t border-[#1F2937]">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={14} className="text-gray-500" />
                <span className="text-xs font-mono uppercase tracking-wider text-gray-500">Change Password</span>
              </div>
              <div className="space-y-3">
                <input data-testid="current-password-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-orbit-blue" />
                <input data-testid="new-password-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password" minLength={6}
                  className="w-full px-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-orbit-blue" />
              </div>
            </div>

            <button data-testid="save-settings-btn" type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-orbit-blue text-white hover:bg-orbit-blue-hover text-sm font-medium transition-colors shadow-[0_0_10px_rgba(0,112,243,0.3)] disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
