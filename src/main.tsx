import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initializeNativeApp } from './utils/nativeAuth.ts';
import './index.css';

// Initialize native Capacitor device capabilities (StatusBar, SplashScreen, GoogleAuth)
initializeNativeApp().catch((err) => {
  console.warn('Native bootstrap note:', err);
});

// Handle generic cross-origin script and transient browser database errors gracefully
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('Script error') ||
      msg.includes('adsbygoogle') ||
      msg.includes('Database is closing') ||
      msg.includes('closing/hidden') ||
      msg.includes('The database connection is closing')
    ) {
      console.info('ℹ️ Handled transient window error event:', msg);
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason || '');
    if (
      reasonStr.includes('Script error') ||
      reasonStr.includes('Database is closing') ||
      reasonStr.includes('closing/hidden') ||
      reasonStr.includes('The database connection is closing')
    ) {
      console.info('ℹ️ Handled transient unhandled rejection:', reasonStr);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

