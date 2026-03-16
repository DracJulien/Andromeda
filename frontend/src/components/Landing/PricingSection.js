import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, CreditCard, ArrowRight } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Gratuit',
    period: '',
    desc: 'Testez la puissance d\'Orbit',
    features: ['1 propriete', 'Synchronisation basique', 'Console de logs', 'Support communautaire'],
    color: 'gray',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29\u20AC',
    period: '/mois',
    desc: 'Pour les gites & conciergeries',
    features: ['10 proprietes', 'Sync prioritaire', 'Preuves visuelles', 'Support email', 'Analytics avances'],
    color: 'blue',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '99\u20AC',
    period: '/mois',
    desc: 'Pour les agences immobilieres',
    features: ['Proprietes illimitees', 'Sync temps reel', 'Support dedie', 'Integrations custom', 'Acces API', 'SLA garanti'],
    color: 'purple',
    popular: false,
  },
];

export default function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const navigate = useNavigate();

  return (
    <section id="pricing" ref={ref} data-testid="pricing-section" className="relative py-32 px-6">
      <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-orbit-blue/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-orbit-blue mb-3 block">
            Tarification
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white">
            Choisissez votre orbite
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm">
            Commencez gratuitement. Upgradez quand vous etes pret a scaler.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.15 }}
              className={`relative group ${plan.popular ? 'md:-mt-4 md:mb-[-16px]' : ''}`}
            >
              <div className={`h-full rounded-sm overflow-hidden ${
                plan.popular
                  ? 'bg-white/[0.04] backdrop-blur-xl border-2 border-orbit-blue/30 shadow-[0_0_40px_rgba(0,112,243,0.1)]'
                  : 'bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]'
              } hover:border-white/[0.12] transition-all duration-500`}>

                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orbit-blue via-blue-400 to-cyan-300" />
                )}

                <div className="p-7">
                  {plan.popular && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.8 }}
                      className="inline-block px-2.5 py-0.5 bg-orbit-blue/20 text-orbit-blue text-[9px] font-mono uppercase tracking-widest rounded-sm border border-orbit-blue/30 mb-4"
                    >
                      Populaire
                    </motion.span>
                  )}

                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className={
                      plan.color === 'purple' ? 'text-purple-400' :
                      plan.color === 'blue' ? 'text-orbit-blue' : 'text-gray-500'
                    } />
                    <h3 className="font-heading text-xl font-bold uppercase tracking-wide text-white">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-5">{plan.desc}</p>

                  <div className="mb-6">
                    <span className="font-heading text-5xl font-bold text-white">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-500 font-mono">{plan.period}</span>}
                  </div>

                  <ul className="space-y-2.5 mb-7">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-300">
                        <Check size={14} className={
                          plan.color === 'purple' ? 'text-purple-400' :
                          plan.color === 'blue' ? 'text-orbit-blue' : 'text-gray-600'
                        } />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    data-testid={`pricing-cta-${plan.id}`}
                    onClick={() => navigate('/login')}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-sm font-heading text-sm font-semibold uppercase tracking-wider transition-all ${
                      plan.popular
                        ? 'bg-orbit-blue text-white hover:bg-orbit-blue-hover shadow-[0_0_20px_rgba(0,112,243,0.3)]'
                        : plan.color === 'purple'
                          ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 border border-purple-500/30'
                          : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    {plan.price === 'Gratuit' ? 'Commencer' : 'Choisir ce plan'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
