import React, { useState } from 'react';
import { Orbit, Mail, Lock, User, ArrowRight } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password };
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      onLogin(data.user, data.session_token);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard#callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-orbit-black flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orbit-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-orbit-blue/3 rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-md" data-testid="login-page">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-sm bg-orbit-blue flex items-center justify-center">
            <Orbit size={28} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-wider uppercase text-white">Orbit</h1>
            <p className="text-xs font-mono text-gray-500 tracking-wider">SPACE-GRADE AUTOMATION</p>
          </div>
        </div>

        <div className="bg-orbit-panel border border-[#1F2937] rounded-sm p-6">
          <h2 className="font-heading text-xl font-semibold uppercase tracking-wide text-white mb-1">
            {mode === 'login' ? 'Mission Login' : 'Create Account'}
          </h2>
          <p className="text-xs font-mono text-gray-500 mb-6">
            {mode === 'login' ? 'Access your command center' : 'Join the orbital network'}
          </p>

          <button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-sm bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#1F2937]" />
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#1F2937]" />
          </div>

          {error && (
            <div data-testid="auth-error" className="mb-4 px-3 py-2 bg-red-900/20 border border-red-900/50 rounded-sm text-xs text-red-400 font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-gray-600" />
                <input
                  data-testid="register-name-input"
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full pl-9 pr-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-gray-600" />
              <input
                data-testid="email-input"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-9 pr-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
                required
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-gray-600" />
              <input
                data-testid="password-input"
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2.5 bg-orbit-surface border border-[#1F2937] rounded-sm text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orbit-blue transition-colors font-mono"
                required minLength={6}
              />
            </div>
            <button
              data-testid="submit-auth-btn"
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-orbit-blue text-white font-medium text-sm hover:bg-orbit-blue-hover transition-colors shadow-[0_0_15px_rgba(0,112,243,0.3)] disabled:opacity-50"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
              <ArrowRight size={14} />
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500 font-mono">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              data-testid="toggle-auth-mode"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-orbit-blue hover:text-orbit-blue-hover transition-colors"
            >
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
