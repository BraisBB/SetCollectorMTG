// config.ts - Configuración optimizada para desarrollo y producción
// Configuración centralizada para los servicios

// Detectar el entorno de ejecución
const isDev = import.meta.env.DEV;

// Mejor detección del entorno Docker
// La app en contenedor siempre usa Nginx, que hace proxy a los servicios
const isDocker = typeof window !== 'undefined' && 
                (window.location.hostname !== 'localhost' || 
                 window.location.port === '80');

// Determinar las URLs base según el entorno
const getApiUrl = () => {
  // Cambiamos para eliminar el prefijo /api para evitar duplicaciones
  return '';
};

const getKeycloakUrl = () => {
  // En cualquier entorno usamos los proxies
  return '/auth';
};

// API y Backend - URLs con soporte para entornos múltiples
export const API_URL = getApiUrl();
export const API_BASE_URL = getApiUrl();

// Keycloak - Configuración con soporte para entornos múltiples
export const KEYCLOAK_CONFIG = {
  URL: getKeycloakUrl(),
  REALM: 'setcollector-realm',
  CLIENT_ID: 'setcollector-frontend',
  // No es necesario el client_secret para clientes públicos en frontend
  CLIENT_SECRET: '',
  // URL de redirección para después del login
  REDIRECT_URI: window.location.origin
};

// Log de configuración
console.log('Running in:', isDev ? 'Development' : 'Production', isDocker ? '(Docker)' : '(Local)');
console.log('API URL:', API_URL);
console.log('Keycloak URL:', KEYCLOAK_CONFIG.URL);
console.log('Redirect URI:', KEYCLOAK_CONFIG.REDIRECT_URI);

// Exportar entorno para uso en otros archivos
export const ENV = {
  isDev,
  isDocker
};