import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3005, // Desenvolvimento
    //port: 3000, // Docker
   //port: 3008, // Produção
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove todos os console.* em produção
        drop_debugger: true, // Remove debugger statements
      },
    },
  },
})
