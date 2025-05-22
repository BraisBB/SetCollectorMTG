// Configuración única para entorno local sin distinción de desarrollo/producción

// URLs base para la aplicación local
export const API_URL = '/api';
export const API_BASE_URL = '/api';

// Configuración de Keycloak
export const KEYCLOAK_CONFIG = {
  URL: '/auth',
  REALM: 'setcollector-realm',
  CLIENT_ID: 'setcollector-frontend',
  CLIENT_SECRET: '',
  REDIRECT_URI: window.location.origin
};

// Log de configuración
console.log('Configuración única para entorno local');
console.log('API URL:', API_URL);
console.log('Keycloak URL:', KEYCLOAK_CONFIG.URL);
console.log('Keycloak Realm:', KEYCLOAK_CONFIG.REALM);
console.log('Keycloak Client ID:', KEYCLOAK_CONFIG.CLIENT_ID);
console.log('Redirect URI:', KEYCLOAK_CONFIG.REDIRECT_URI);

// Configuración de entorno simplificada
export const ENV = {
  isLocal: true
};