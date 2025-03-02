import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    sourcemap: false,
    minify: true,
  },
  // Separate configuration for the widget library build
  // This ensures it's built as a standalone script that can be included in any website
  lib: {
    entry: 'src/widget/chat.ts',
    name: 'BusinessChatWidget',
    formats: ['iife'],
    fileName: () => 'chat.js'
  }
});