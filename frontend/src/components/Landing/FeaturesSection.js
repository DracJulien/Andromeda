import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Eye, Brain, MousePointer, ShieldCheck, Terminal, Camera } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Vision Autonome',
    desc: 'L\'agent voit les calendriers comme un humain. Pas d\'API fragile, pas de scraping. Du pur navigateur pilote par IA.',
    span: 'col-span-1 md:col-span-2',
    accent: 'from-orbit-blue to-cyan-400',
  },
  {
    icon: Brain,
    title: 'Gemini Vision',
    desc: 'Analyse d\'images en temps reel pour detecter les reservations et les changements de disponibilite.',
    span: 'col-span-1',
    accent: 'from-purple-500 to-violet-400',
  },
  {
    icon: MousePointer,
    title: 'Clic Reel',
    desc: 'L\'agent clique, navigue et bloque les dates exactement comme vous le feriez. Aucune manipulation d\'API.',
    span: 'col-span-1',
    accent: 'from-emerald-500 to-green-400',
  },
  {
    icon: Camera,
    title: 'Preuves Visuelles',
    desc: 'Chaque synchronisation genere des captures d\'ecran avant/apres. Transparence totale.',
    span: 'col-span-1',
    accent: 'from-orange-500 to-amber-400',
  },
  {
    icon: Terminal,
    title: 'Console Live',
    desc: 'Suivez chaque action de l\'agent en temps reel. Logs color-codes, filtres, export.',
    span: 'col-span-1',
    accent: 'from-blue-500 to-indigo-400',
  },
  {
    icon: ShieldCheck,
    title: 'Anti Double-Booking',
    desc: 'Cycle complet Observer-Comparer-Agir-Valider. Vos calendriers restent synchronises 24/7.',
    span: 'col-span-1 md:col-span-2',
    accent: 'from-red-500 to-rose-400',
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" ref={ref} data-testid="features-section" className="relative py-32 px-6">
      <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-orbit-blue mb-3 block">
            Fonctionnalites
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white">
            Automatisation de grade spatial
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm">
            Chaque composant est concu pour une fiabilite maximale.
            Comme un systeme de navigation orbitale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className={`${f.span} group relative overflow-hidden`}
            >
              <div className="h-full bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-sm p-6 hover:border-white/[0.12] transition-all duration-500 hover:bg-white/[0.04]">
                {/* Gradient highlight on hover */}
                <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className={`inline-flex p-2.5 rounded-sm bg-gradient-to-br ${f.accent} mb-4 opacity-80`}>
                  <f.icon size={20} className="text-white" />
                </div>

                <h3 className="font-heading text-lg font-semibold uppercase tracking-wide text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
