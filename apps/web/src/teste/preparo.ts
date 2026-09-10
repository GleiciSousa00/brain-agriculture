import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { fetchFalso } from './fetch-falso';

vi.stubGlobal('fetch', fetchFalso);

afterEach(() => {
  cleanup();
  fetchFalso.mockReset();
});
