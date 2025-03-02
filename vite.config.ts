import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        chat: 'src/widget/chat.ts'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'chat' ? 'chat.js' : 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'react-color']
        }
      }
    },
    sourcemap: false,
    minify: true,
    // Ensure the chat.js is built as IIFE (Immediately Invoked Function Expression)
    // This makes it work as a regular script tag without module requirements
    lib: {
      entry: 'src/widget/chat.ts',
      name: 'BusinessChatWidget',
      formats: ['iife'],
      fileName: () => 'chat.js'
    }
  }
});