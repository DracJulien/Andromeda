import React from 'react';
import { Orbit } from 'lucide-react';

export default function Footer() {
  return (
    <footer data-testid="landing-footer" className="relative border-t border-white/[0.05] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-orbit-blue/20 flex items-center justify-center">
            <Orbit size={14} className="text-orbit-blue" />
          </div>
          <span className="font-heading text-sm font-bold tracking-wider uppercase text-gray-500">Orbit</span>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono text-gray-600">
          <span>Sync autonome</span>
          <span className="w-px h-3 bg-gray-800" />
          <span>Vision IA</span>
          <span className="w-px h-3 bg-gray-800" />
          <span>Zero downtime</span>
        </div>

        <p className="text-[10px] font-mono text-gray-700 tracking-wider">
          &copy; {new Date().getFullYear()} ORBIT. ALL SYSTEMS NOMINAL.
        </p>
      </div>
    </footer>
  );
}
