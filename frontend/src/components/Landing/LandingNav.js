import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Orbit, ArrowRight, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Fonctionnalites', href: '#features' },
  { label: 'Comment ca marche', href: '#demo' },
  { label: 'Tarifs', href: '#pricing' },
];

export default function LandingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 50);
  });

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      data-testid="landing-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-sm bg-orbit-blue flex items-center justify-center shadow-[0_0_12px_rgba(0,112,243,0.4)]">
            <Orbit size={16} className="text-white" />
          </div>
          <span className="font-heading text-lg font-bold tracking-wider uppercase text-white">Orbit</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => scrollTo(l.href)}
              className="text-sm text-gray-400 hover:text-white transition-colors font-medium tracking-wide"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            data-testid="nav-login-btn"
            onClick={() => navigate('/login')}
            className="text-sm text-gray-300 hover:text-white transition-colors font-medium px-4 py-2"
          >
            Connexion
          </button>
          <button
            data-testid="nav-register-btn"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-orbit-blue text-white text-sm font-medium hover:bg-orbit-blue-hover transition-colors shadow-[0_0_15px_rgba(0,112,243,0.3)]"
          >
            Commencer
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-orbit-panel/95 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 space-y-3"
        >
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => scrollTo(l.href)}
              className="block w-full text-left text-sm text-gray-400 hover:text-white py-2"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-3 border-t border-white/[0.05] space-y-2">
            <button onClick={() => navigate('/login')} className="block w-full text-left text-sm text-gray-300 py-2">Connexion</button>
            <button onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-orbit-blue text-white text-sm font-medium">
              Commencer <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
