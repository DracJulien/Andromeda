import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API}/api/auth/session?session_id=${sessionId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Session exchange failed');
        const data = await res.json();
        login(data.user, data.session_token);
        navigate('/', { replace: true, state: { user: data.user } });
      } catch {
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, login]);

  return (
    <div className="min-h-screen bg-orbit-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-orbit-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-mono text-gray-400">Establishing secure connection...</p>
      </div>
    </div>
  );
}
