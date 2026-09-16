import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNativeAndroid } from './utils/nativeAndroid';

// Initialize native Android status bar and splash screen if running as native app
initNativeAndroid();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
