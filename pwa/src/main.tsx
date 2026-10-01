import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Auto-recuperação caso um chunk dinâmico falhe após novo deploy no servidor
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Novo deploy detectado ou falha de chunk dinâmico. Recarregando PWA...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
