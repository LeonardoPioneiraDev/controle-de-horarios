import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:3335';
  const frontendPort = parseInt(env.VITE_FRONTEND_PORT) || 3005;
  const useProxy = env.VITE_USE_PROXY === 'true';
  
  console.log('⚙️ Vite Config:', {
    mode,
    backendUrl,
    frontendPort,
    useProxy
  });

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      host: 'localhost',
      proxy: useProxy ? {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('❌ Proxy Error:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('📤 Proxy Request:', req.method, req.url, '→', backendUrl);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('�� Proxy Response:', proxyRes.statusCode, req.url);
            });
          },
        }
      } : undefined
    },
    optimizeDeps: {
      include: ['axios', 'react', 'react-dom', 'react-router-dom', 'lucide-react']
    },
    define: {
      // Disponibilizar variáveis de ambiente no build
      __API_URL__: JSON.stringify(env.VITE_API_URL),
      __FRONTEND_URL__: JSON.stringify(env.VITE_FRONTEND_URL),
    }
  }
})