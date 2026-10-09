import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Registro do Service Worker PWA para Vercel e Produção
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registra se for ambiente de produção ou HTTPS
    if (import.meta.env.PROD || window.location.protocol === 'https:') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registrado com escopo:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Falha ao registrar Service Worker:', error);
        });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
