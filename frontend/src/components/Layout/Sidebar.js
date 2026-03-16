import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Building2, Terminal, Image, Settings, ChevronLeft, ChevronRight, Orbit, CalendarDays, Users, UserCog, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { path: '/properties', icon: Building2, label: 'Properties' },
  { path: '/reservations', icon: CalendarDays, label: 'Reservations' },
  { path: '/console', icon: Terminal, label: 'Live Console' },
  { path: '/proof', icon: Image, label: 'Proof Gallery' },
];

const bottomItems = [
  { path: '/subscription', icon: CreditCard, label: 'Subscription' },
  { path: '/my-settings', icon: UserCog, label: 'My Settings' },
  { path: '/settings', icon: Settings, label: 'Agent Config' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside data-testid="sidebar"
      className={`flex flex-col border-r border-[#1F2937] bg-orbit-panel transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1F2937]">
        <div className="w-8 h-8 rounded-sm bg-orbit-blue flex items-center justify-center flex-shrink-0">
          <Orbit size={18} className="text-white" />
        </div>
        {!collapsed && <span className="font-heading text-xl font-bold tracking-wider uppercase text-white">Orbit</span>}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        <div className="mb-2">
          {!collapsed && <p className="px-3 mb-1 text-[9px] font-mono uppercase tracking-widest text-gray-600">Operations</p>}
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path} data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                isActive ? 'bg-orbit-blue/10 text-orbit-blue border-l-2 border-orbit-blue' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}>
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <div className="mb-2">
            {!collapsed && <p className="px-3 mb-1 mt-3 text-[9px] font-mono uppercase tracking-widest text-gray-600">Admin</p>}
            <NavLink to="/users" data-testid="nav-users"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                isActive ? 'bg-orbit-blue/10 text-orbit-blue border-l-2 border-orbit-blue' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}>
              <Users size={16} className="flex-shrink-0" />
              {!collapsed && <span>Users</span>}
            </NavLink>
          </div>
        )}

        <div>
          {!collapsed && <p className="px-3 mb-1 mt-3 text-[9px] font-mono uppercase tracking-widest text-gray-600">Account</p>}
          {bottomItems.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path} data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                isActive ? 'bg-orbit-blue/10 text-orbit-blue border-l-2 border-orbit-blue' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}>
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {!collapsed && user && (
        <div className="px-3 py-3 border-t border-[#1F2937]">
          <div className="flex items-center gap-2 mb-2">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-orbit-blue/20 flex items-center justify-center text-[10px] font-bold text-orbit-blue">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate">{user.name}</p>
              <p className="text-[9px] font-mono text-gray-600 truncate">{user.email}</p>
            </div>
          </div>
          <button data-testid="logout-btn" onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition-colors">
            <LogOut size={12} /> Logout
          </button>
        </div>
      )}

      <button data-testid="sidebar-toggle" onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-[#1F2937] text-gray-500 hover:text-gray-300 transition-colors">
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
