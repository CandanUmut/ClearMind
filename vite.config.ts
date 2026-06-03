import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages is served from /clearmind/ — keep base in sync with the repo name.
export default defineConfig({
  base: '/clearmind/',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
