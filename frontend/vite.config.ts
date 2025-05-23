import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Configuración básica para Vite - sin proxy para usar con Docker
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permitir acceso desde otros hosts
    port: 5173,
    cors: true
  }
})