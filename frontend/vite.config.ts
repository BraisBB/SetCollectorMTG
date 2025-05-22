import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Configuración simplificada para entorno local unificado
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permitir acceso desde otros hosts
    port: 5173,
    cors: true,
    proxy: {
      // Proxy al backend Spring Boot
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // No reescribimos la ruta para que llegue como /api al backend
        // Esto es consistente con la configuración de Nginx
        configure: (proxy: any, _options: any) => {
          proxy.on('error', (err: Error, _req: any, _res: any) => {
            console.log('Proxy error:', err);
          });
        }
      },
      // Proxy a Keycloak
      '/auth': {
        target: 'http://localhost:8181',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/auth/, ''),
        configure: (proxy: any, _options: any) => {
          proxy.on('error', (err: Error, _req: any, _res: any) => {
            console.log('Keycloak proxy error:', err);
          });
        }
      }
    }
  }
})