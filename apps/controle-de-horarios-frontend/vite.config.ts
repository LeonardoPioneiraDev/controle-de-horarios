import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const srcPath = path.resolve(__dirname, './src');
const srcAlias = srcPath.replace(/\\/g, '/');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Alias somente para '@/' e com caminho POSIX para evitar problemas no Windows
      { find: /^@\//, replacement: `${srcAlias}/` },
    ],
  },
  server: {
    //port: 3005, // Desenvolvimento
    //port: 3000, // Docker
   port: 3008, // Produção
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
