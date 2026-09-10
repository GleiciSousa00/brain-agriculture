import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { fetchFalso } from './fetch-falso';

// Antes de qualquer módulo da aplicação carregar, para que o cliente gerado guarde o
// duplo, e não a rede de verdade.
vi.stubGlobal('fetch', fetchFalso);

afterEach(() => {
  cleanup();
  fetchFalso.mockReset();
});
