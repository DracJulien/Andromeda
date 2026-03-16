import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Orbit } from 'lucide-react';

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const navigate = useNavigate();

  return (
    <section ref={ref} data-testid="cta-section" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      {/* Large orbital background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[600px] h-[600px] rounded-full border border-orbit-blue/[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full border border-white/[0.03]"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orbit-blue/[0.04] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-sm bg-orbit-blue/20 border border-orbit-blue/30 flex items-center justify-center shadow-[0_0_40px_rgba(0,112,243,0.3)]">
            <Orbit size={32} className="text-orbit-blue" />
          </div>

          <h2 className="font-heading text-4xl md:text-6xl font-bold uppercase tracking-tight text-white mb-4">
            Pret a lancer
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orbit-blue to-cyan-300">
              la mission ?
            </span>
          </h2>

          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Rejoignez les proprietaires qui dorment tranquilles
            pendant que leurs agents Orbit synchronisent tout.
          </p>

          <motion.button
            data-testid="final-cta-btn"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-sm bg-orbit-blue text-white font-heading text-xl font-bold uppercase tracking-wider hover:bg-orbit-blue-hover transition-all shadow-[0_0_40px_rgba(0,112,243,0.5)] hover:shadow-[0_0_60px_rgba(0,112,243,0.7)]"
          >
            Lancer la Mission
            <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
          </motion.button>

          <p className="mt-6 text-xs font-mono text-gray-600">
            Gratuit pour commencer. Aucune carte requise.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
