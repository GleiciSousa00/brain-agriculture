import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Elemento raiz não encontrado no documento.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
