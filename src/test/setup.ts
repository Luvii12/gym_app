import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import 'fake-indexeddb/auto';

// IndexedDB es asíncrono: con la máquina ocupada, el margen por defecto (1 s) da fallos esporádicos.
configure({ asyncUtilTimeout: 4000 });
