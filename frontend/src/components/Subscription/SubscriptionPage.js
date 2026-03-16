import React, { useState, useEffect } from 'react';
import { Zap, Check, ArrowRight, CreditCard, RefreshCw } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import { useSearchParams } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('orbit_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const PLAN_DETAILS = {
  starter: { name: 'Starter', price: 0, period: '', desc: 'Perfect for testing Orbit', color: 'gray' },
  pro: { name: 'Pro', price: 29, period: '/mo', desc: 'For small guesthouses & concierges', color: 'blue' },
  enterprise: { name: 'Enterprise', price: 99, period: '/mo', desc: 'For agencies & property managers', color: 'purple' },
};

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState('');
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    fetch(`${API}/api/plans`).then(r => r.json()).then(setPlans).catch(() => {});
  }, []);

  // Poll payment status if returning from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return;

    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPaymentStatus('timeout');
        return;
      }
      attempts++;
      try {
        const res = await fetch(`${API}/api/checkout/status/${sessionId}`, {
          credentials: 'include', headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.payment_status === 'paid') {
          setPaymentStatus('success');
          refreshUser();
          return;
        }
        if (data.status === 'expired') {
          setPaymentStatus('expired');
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setPaymentStatus('error');
      }
    };
    setPaymentStatus('checking');
    poll();
  }, [searchParams, refreshUser]);

  const handleSubscribe = async (planId) => {
    setLoading(planId);
    try {
      const originUrl = window.location.origin;
      const res = await fetch(`${API}/api/checkout`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ plan_id: planId, origin_url: originUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Checkout failed');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert(err.message);
    }
    setLoading('');
  };

  const currentPlan = user?.subscription || 'starter';

  return (
    <div data-testid="subscription-page" className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight uppercase text-white">Subscription Plans</h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">Choose the plan that fits your operation</p>
      </div>

      {paymentStatus === 'checking' && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-orbit-blue/10 border border-orbit-blue/30 rounded-sm">
          <RefreshCw size={14} className="text-orbit-blue animate-spin" />
          <span className="text-sm font-mono text-orbit-blue">Verifying payment...</span>
        </div>
      )}
      {paymentStatus === 'success' && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-900/50 rounded-sm">
          <Check size={14} className="text-emerald-400" />
          <span className="text-sm font-mono text-emerald-400">Payment successful! Your plan has been upgraded.</span>
        </div>
      )}
      {paymentStatus === 'error' && (
        <div className="px-4 py-3 bg-red-900/20 border border-red-900/50 rounded-sm text-sm font-mono text-red-400 text-center">
          Payment verification failed. Please contact support.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLAN_DETAILS).map(([id, plan]) => {
          const serverPlan = plans[id] || {};
          const isCurrent = currentPlan === id;
          const isPopular = id === 'pro';

          return (
            <div key={id} data-testid={`plan-card-${id}`}
              className={`bg-orbit-panel border rounded-sm overflow-hidden relative ${
                isPopular ? 'border-orbit-blue shadow-[0_0_20px_rgba(0,112,243,0.15)]' : 'border-[#1F2937]'
              } ${isCurrent ? 'ring-1 ring-orbit-success' : ''}`}>
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-orbit-blue" />
              )}
              {isCurrent && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-900/30 text-emerald-400 text-[9px] font-mono uppercase rounded-sm border border-emerald-900/50">
                  Current
                </div>
              )}

              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className={
                      id === 'enterprise' ? 'text-purple-400' :
                      id === 'pro' ? 'text-orbit-blue' : 'text-gray-500'
                    } />
                    <h3 className="font-heading text-xl font-bold uppercase tracking-wide text-white">{plan.name}</h3>
                  </div>
                  <p className="text-xs font-mono text-gray-500">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold text-white">
                    {plan.price === 0 ? 'Free' : `${plan.price}\u20AC`}
                  </span>
                  {plan.period && <span className="text-sm text-gray-500 font-mono">{plan.period}</span>}
                </div>

                <ul className="space-y-2 mb-6">
                  {(serverPlan.features || []).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <Check size={12} className={
                        id === 'enterprise' ? 'text-purple-400' :
                        id === 'pro' ? 'text-orbit-blue' : 'text-gray-500'
                      } />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-gray-500 border border-[#1F2937] rounded-sm font-mono">
                    Active Plan
                  </div>
                ) : plan.price === 0 ? (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-gray-600 font-mono">
                    Default plan
                  </div>
                ) : (
                  <button data-testid={`subscribe-${id}-btn`} onClick={() => handleSubscribe(id)}
                    disabled={!!loading}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                      id === 'enterprise'
                        ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.3)]'
                        : 'bg-orbit-blue text-white hover:bg-orbit-blue-hover shadow-[0_0_10px_rgba(0,112,243,0.3)]'
                    } disabled:opacity-50`}>
                    {loading === id ? (
                      <><RefreshCw size={14} className="animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard size={14} /> Upgrade<ArrowRight size={14} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
