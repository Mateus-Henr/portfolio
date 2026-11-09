import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps every asset path relative, so the built site works on
// GitHub Pages both at https://<user>.github.io/ and at
// https://<user>.github.io/<repository>/ without changing anything.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 900,
  },
});
