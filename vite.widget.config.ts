import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Configuration for building the widget as a standalone script
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget/chat.ts'),
      name: 'BusinessChatWidget',
      fileName: () => 'chat.js',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      },
      external: []
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: false,
    minify: true
  }
});