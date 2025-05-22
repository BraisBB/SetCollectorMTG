import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Permitir acceso desde otros hosts
    cors: true,
    hmr: {
      clientPort: 5173,
      overlay: true
    },
    proxy: {
      // Proxy para el backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
      // Proxy para Keycloak
      '/auth': {
        target: 'http://localhost:8181',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, ''),
      }
    }
  }
})