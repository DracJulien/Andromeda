import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Patch pour éviter que l'erreur inoffensive "ResizeObserver loop" de l'overlay CRA ne devienne bloquante lors d'animations
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
    return;
  }
  originalError(...args);
};

window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop limit exceeded' || e.message === 'ResizeObserver loop completed with undelivered notifications.' || e.message === 'ResizeObserver loop completed with undelivered notifications') {
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
