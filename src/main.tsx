import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import './index.css';
import App from './App.tsx';
import { seedCatalog } from './db';
import { requestPersistence } from './lib/storage';

seedCatalog().catch((error) => console.error('No se pudo cargar el catálogo de ejercicios', error));

void requestPersistence();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
