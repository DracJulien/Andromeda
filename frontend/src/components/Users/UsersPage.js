import React, { useState, useEffect } from 'react';
import { Users, Shield, ShieldCheck, Trash2, RefreshCw } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('orbit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users`, { credentials: 'include', headers: getAuthHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'manager' : 'admin';
    await fetch(`${API}/api/users/${userId}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    await fetch(`${API}/api/users/${userId}`, { method: 'DELETE', credentials: 'include', headers: getAuthHeaders() });
    fetchUsers();
  };

  return (
    <div data-testid="users-page" className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-white">User Management</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{users.length} registered users</p>
        </div>
        <button data-testid="refresh-users-btn" onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-[#1F2937] text-gray-300 hover:bg-[#374151] text-sm border border-[#374151]">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="bg-orbit-panel border border-[#1F2937] rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw size={20} className="text-orbit-blue animate-spin" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F2937]">
                {['User', 'Email', 'Role', 'Subscription', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {users.map(u => (
                <tr key={u.user_id} data-testid={`user-row-${u.user_id}`} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.picture ? (
                        <img src={u.picture} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-orbit-blue/20 flex items-center justify-center text-xs font-bold text-orbit-blue">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="text-sm text-gray-200">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase ${
                      u.role === 'admin' ? 'bg-orbit-blue/10 text-orbit-blue border border-orbit-blue/30' : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {u.role === 'admin' ? <ShieldCheck size={9} /> : <Shield size={9} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase ${
                      u.subscription === 'enterprise' ? 'bg-purple-900/20 text-purple-400' :
                      u.subscription === 'pro' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                    }`}>{u.subscription || 'starter'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button data-testid={`toggle-role-${u.user_id}`} onClick={() => toggleRole(u.user_id, u.role)}
                        className="p-1.5 rounded-sm text-gray-500 hover:text-orbit-blue hover:bg-orbit-blue/10 transition-colors"
                        title={`Switch to ${u.role === 'admin' ? 'Manager' : 'Admin'}`}>
                        <Shield size={12} />
                      </button>
                      <button data-testid={`delete-user-${u.user_id}`} onClick={() => deleteUser(u.user_id)}
                        className="p-1.5 rounded-sm text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
