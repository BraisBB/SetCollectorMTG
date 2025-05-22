import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permitir acceso desde otros hosts
    port: 5173,
    cors: true,
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Proxy request:', req.method, req.url);
            // Agregar encabezados personalizados a la solicitud proxy si es necesario
            if (req.headers.cookie) {
              _proxyReq.setHeader('Cookie', req.headers.cookie);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/auth': {
        target: 'http://localhost:8181',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Keycloak proxy error:', err);
          });
          
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Keycloak proxy request:', req.method, req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Keycloak proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})