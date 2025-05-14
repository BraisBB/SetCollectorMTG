import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // eslint-disable-next-line no-console
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // eslint-disable-next-line no-console
            console.log('Enviando solicitud:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // eslint-disable-next-line no-console
            console.log('Recibiendo respuesta:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    cors: true,
    hmr: {
      clientPort: 5173,
      overlay: true
    }
  }
})
