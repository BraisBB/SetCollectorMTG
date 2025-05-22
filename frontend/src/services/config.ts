// config.ts - Configuración usando proxy y variables de entorno
// Configuración centralizada para los servicios

// Detectar el entorno de ejecución
const isDev = import.meta.env.DEV;
const isDocker = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// API y Backend - URLs
export const API_URL = isDev ? '/api' : 'http://localhost:8080';
export const API_BASE_URL = isDev ? '/api' : 'http://localhost:8080';

// Keycloak - Configuración según entorno
export const KEYCLOAK_CONFIG = {
  URL: isDev ? '/auth' : 'http://localhost:8181',
  REALM: 'setcollector-realm',
  CLIENT_ID: 'setcollector-frontend',
  // No es necesario el client_secret para clientes públicos en frontend
  CLIENT_SECRET: ''
};

// Log de configuración
console.log('Running in:', isDev ? 'Development' : 'Production', isDocker ? '(Docker)' : '(Local)');
console.log('API URL:', API_URL);
console.log('Keycloak URL:', KEYCLOAK_CONFIG.URL);