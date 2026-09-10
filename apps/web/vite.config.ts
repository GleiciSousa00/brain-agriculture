/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Onde a API responde quando se roda `pnpm dev` fora do Docker. */
const API_EM_DESENVOLVIMENTO = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // A tela chama `/api/...` na própria origem, e quem repassa é o servidor. Ver o
      // registro 0009: a API não habilita CORS, então origem cruzada não é uma opção.
      '/api': {
        target: API_EM_DESENVOLVIMENTO,
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/teste/preparo.ts'],
    css: false,
  },
});
