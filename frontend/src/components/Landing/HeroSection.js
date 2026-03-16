import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Orbit } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Orbital ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full border border-[#0070F3]/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-orbit-blue shadow-[0_0_15px_rgba(0,112,243,0.8)]" />
        </motion.div>
        <motion.div
          className="absolute w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full border border-[#0070F3]/5"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
        </motion.div>
        <motion.div
          className="absolute w-[250px] h-[250px] md:w-[350px] md:h-[350px] rounded-full border border-white/[0.03]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-orbit-blue/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-sm bg-orbit-blue flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.4)]">
            <Orbit size={22} className="text-white" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-[0.3em] uppercase text-gray-400">
            Orbit Platform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] uppercase text-white mb-6"
        >
          <span className="block">Dormez.</span>
          <span className="block mt-2">
            Vos calendriers
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orbit-blue via-blue-400 to-cyan-300">
              ne dorment jamais.
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Des agents autonomes pilotes par IA synchronisent vos disponibilites
          Booking & Airbnb en temps reel. Plus de double reservations. Plus de stress.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            data-testid="hero-cta-btn"
            onClick={() => navigate('/login')}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-sm bg-orbit-blue text-white font-heading text-lg font-semibold uppercase tracking-wider hover:bg-orbit-blue-hover transition-all shadow-[0_0_30px_rgba(0,112,243,0.4)] hover:shadow-[0_0_50px_rgba(0,112,243,0.6)]"
          >
            Lancer la Mission
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            data-testid="hero-scroll-btn"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-sm text-gray-400 hover:text-white font-mono text-sm tracking-wider transition-colors"
          >
            Decouvrir Orbit
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              &#8595;
            </motion.span>
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-16 flex items-center justify-center gap-6 text-xs font-mono text-gray-600"
        >
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sync en temps reel</span>
          <span className="w-px h-3 bg-gray-800" />
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orbit-blue" /> Vision IA Gemini</span>
          <span className="w-px h-3 bg-gray-800" />
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Zero double-booking</span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-5 h-8 rounded-full border border-gray-700 flex justify-center pt-1.5">
          <motion.div
            className="w-1 h-2 rounded-full bg-gray-500"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
