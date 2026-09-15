import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initNativeAndroid } from './utils/nativeAndroid';

// Initialize native Android status bar and splash screen if running as native app
initNativeAndroid();

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available for Salati PWA');
  },
  onOfflineReady() {
    console.log('Salati PWA is ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
