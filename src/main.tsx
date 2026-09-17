import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNativeAndroid } from './utils/nativeAndroid';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize native Android status bar and notification channels safely
initNativeAndroid();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
