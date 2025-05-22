// config.ts - Configuración optimizada para desarrollo y producción
// Configuración centralizada para los servicios

// Detectar el entorno de ejecución
const isDev = import.meta.env.DEV;
console.log('DEV environment detected:', isDev);

// Mejor detección del entorno Docker
// La app en contenedor siempre usa Nginx, que hace proxy a los servicios
const isDocker = typeof window !== 'undefined' && 
                (window.location.hostname !== 'localhost' || 
                 window.location.port === '80');

// Determinar las URLs base según el entorno
const getApiUrl = () => {
  // En desarrollo con Vite, la URL base debe estar vacía porque el proxy lo maneja
  // Vite redirige /api a http://localhost:8080
  if (isDev) {
    console.log('Usando configuración de desarrollo con proxy Vite');
    return '';
  }
  
  // En producción con Docker, usar la ruta configurada en Nginx
  console.log('Usando configuración de producción');
  return '/api';
};

const getKeycloakUrl = () => {
  // En cualquier entorno usamos los proxies
  return '/auth';
};

// API y Backend - URLs con soporte para entornos múltiples
export const API_URL = getApiUrl();
export const API_BASE_URL = getApiUrl();

// Keycloak - Configuración con soporte para entornos múltiples
// Asegurarnos de que coincida con el valor en podman-compose.yml (KEYCLOAK_REALM)
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
console.log('Keycloak Realm:', KEYCLOAK_CONFIG.REALM);
console.log('Keycloak Client ID:', KEYCLOAK_CONFIG.CLIENT_ID);
console.log('Redirect URI:', KEYCLOAK_CONFIG.REDIRECT_URI);

// Exportar entorno para uso en otros archivos
export const ENV = {
  isDev,
  isDocker
};