import { defineConfig } from 'vite';

// LeaveHub is a client-side routed single-domain app (History API router).
// Vite's dev server falls back to index.html for unknown routes by default
// (appType: 'spa'), which is what our router relies on.
export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
