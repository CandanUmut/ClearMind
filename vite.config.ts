import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the app works at any path — GitHub Pages serves project
// sites from /<repo>/ (here /ClearMind/), and path casing is significant.
// './' keeps every asset reference relative to index.html, avoiding 404s.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
