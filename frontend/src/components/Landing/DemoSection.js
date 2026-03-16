import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function DemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} data-testid="demo-section" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-orbit-blue/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-orbit-blue mb-3 block">
            Comment ca marche
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white">
            Un agent. Deux plateformes. Zero friction.
          </h2>
        </motion.div>

        {/* Animated sync visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative"
        >
          <div className="bg-orbit-panel/50 backdrop-blur-xl border border-white/[0.06] rounded-sm p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Booking side */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={inView ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex-1 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-[#003580]/20 border border-[#003580]/30 flex items-center justify-center">
                  <span className="font-heading text-2xl font-bold text-[#003580] brightness-150">B</span>
                </div>
                <p className="font-heading text-lg font-semibold text-white uppercase tracking-wide">Booking.com</p>
                <p className="text-xs font-mono text-gray-500 mt-1">Calendrier source</p>

                {/* Calendar mini */}
                <div className="mt-4 grid grid-cols-7 gap-1 max-w-[180px] mx-auto">
                  {Array.from({length: 28}, (_, i) => {
                    const booked = [2,3,4,9,10,11,17,18].includes(i);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3, delay: 0.8 + i * 0.02 }}
                        className={`w-5 h-5 rounded-sm text-[8px] flex items-center justify-center font-mono ${
                          booked ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.03] text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Arrow / Agent */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="relative flex flex-col items-center gap-3 py-6"
              >
                <div className="w-16 h-16 rounded-full bg-orbit-blue/20 border border-orbit-blue/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,112,243,0.3)]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                  </motion.div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-orbit-blue">Agent Orbit</span>

                {/* Animated data flow lines */}
                <div className="absolute top-1/2 -left-20 w-16 h-px">
                  <motion.div
                    className="h-full bg-gradient-to-r from-transparent to-orbit-blue/60"
                    animate={{ opacity: [0.2, 1, 0.2], scaleX: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="absolute top-1/2 -right-20 w-16 h-px">
                  <motion.div
                    className="h-full bg-gradient-to-l from-transparent to-emerald-400/60"
                    animate={{ opacity: [0.2, 1, 0.2], scaleX: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* Airbnb side */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={inView ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex-1 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-[#FF5A5F]/20 border border-[#FF5A5F]/30 flex items-center justify-center">
                  <span className="font-heading text-2xl font-bold text-[#FF5A5F]">A</span>
                </div>
                <p className="font-heading text-lg font-semibold text-white uppercase tracking-wide">Airbnb</p>
                <p className="text-xs font-mono text-gray-500 mt-1">Calendrier cible</p>

                <div className="mt-4 grid grid-cols-7 gap-1 max-w-[180px] mx-auto">
                  {Array.from({length: 28}, (_, i) => {
                    const synced = [2,3,4,9,10,11,17,18].includes(i);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.3, delay: 1.4 + i * 0.02 }}
                        className={`w-5 h-5 rounded-sm text-[8px] flex items-center justify-center font-mono ${
                          synced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.03] text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/[0.04]">
              {[
                { step: '01', title: 'Observer', desc: 'L\'agent navigue et capture le calendrier source' },
                { step: '02', title: 'Analyser', desc: 'Gemini Vision detecte les nouvelles reservations' },
                { step: '03', title: 'Agir', desc: 'Blocage automatique des dates sur la cible' },
                { step: '04', title: 'Valider', desc: 'Screenshot de preuve et confirmation visuelle' },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 1.8 + i * 0.15 }}
                  className="text-center"
                >
                  <span className="font-mono text-[10px] text-orbit-blue tracking-widest">{s.step}</span>
                  <p className="font-heading text-sm font-semibold uppercase tracking-wide text-white mt-1">{s.title}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
