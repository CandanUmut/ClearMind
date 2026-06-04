import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installTranslationGuard } from './lib/translateGuard';
import './index.css';

// Must run before React renders: makes the DOM resilient to Google Translate /
// Chrome auto-translate moving nodes (otherwise React crashes on re-render).
installTranslationGuard();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Register the offline service worker (production only; dev keeps HMR clean).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        /* offline support is a progressive enhancement — ignore failures */
      });
  });
}
