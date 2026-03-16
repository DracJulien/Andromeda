import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Building2, Terminal, Image, Settings, ChevronLeft, ChevronRight, Orbit } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Dashboard' },
  { path: '/properties', icon: Building2, label: 'Properties' },
  { path: '/console', icon: Terminal, label: 'Live Console' },
  { path: '/proof', icon: Image, label: 'Proof Gallery' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      data-testid="sidebar"
      className={`flex flex-col border-r border-[#1F2937] bg-orbit-panel transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1F2937]">
        <div className="w-8 h-8 rounded-sm bg-orbit-blue flex items-center justify-center flex-shrink-0">
          <Orbit size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-heading text-xl font-bold tracking-wider uppercase text-white">
            Orbit
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orbit-blue/10 text-orbit-blue border-l-2 border-orbit-blue'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        data-testid="sidebar-toggle"
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-[#1F2937] text-gray-500 hover:text-gray-300 transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
