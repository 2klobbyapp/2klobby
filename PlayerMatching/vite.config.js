import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Increase chunk size warning limit to suppress the warning
    chunkSizeWarningLimit: 1000,
    // Use esbuild for minification (faster and built-in)
    minify: true,
  },
});