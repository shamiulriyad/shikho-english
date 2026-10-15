/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// One .env for the whole repository (see ../.env.example). Only VITE_* values reach the browser.
const ENV_DIR = '..';

export default defineConfig(({ mode }) => {
  // All keys are readable here (this file runs in Node, never in the browser)
  const env = loadEnv(mode, ENV_DIR, '');
  // Must match one of the backend's Cors__AllowedOrigins
  const port = Number(env.FRONTEND_PORT || 3000);

  return {
    plugins: [react()],
    envDir: ENV_DIR,
    server: {
      port,
      strictPort: true,
    },
    preview: {
      port,
      strictPort: true,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      unstubGlobals: true,
    },
  };
});
