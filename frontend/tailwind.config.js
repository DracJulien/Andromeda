/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orbit: {
          black: '#050505',
          panel: '#0A0E17',
          surface: '#111827',
          blue: '#0070F3',
          'blue-hover': '#3291FF',
          'blue-dim': 'rgba(0, 112, 243, 0.1)',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          // Theme-aware tokens
          'bg-main': 'var(--orbit-bg-main)',
          'bg-panel': 'var(--orbit-bg-panel)',
          'bg-surface': 'var(--orbit-bg-surface)',
          'text-main': 'var(--orbit-text-main)',
          'text-dim': 'var(--orbit-text-dim)',
          'border-main': 'var(--orbit-border-main)',
        }
      },
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'scan-line': 'scan-line 4s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 112, 243, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 112, 243, 0.5)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
