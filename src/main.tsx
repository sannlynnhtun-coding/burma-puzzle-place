import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GuestSessionProvider } from './contexts/GuestSessionContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GuestSessionProvider>
      <App />
    </GuestSessionProvider>
  </StrictMode>
);
