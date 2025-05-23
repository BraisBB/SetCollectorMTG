// Configuración unificada para sistema de autenticación simple
export const API_BASE_URL = 'http://localhost:5173';

export const AUTH_CONFIG = {
  TOKEN_KEY: 'authToken', // Clave para almacenar el token en localStorage
  LOGIN_ENDPOINT: '/api/auth/login',
  REGISTER_ENDPOINT: '/api/auth/register',
  REFRESH_ENDPOINT: '/api/auth/refresh'
};

console.log('Configuración para autenticación simple');
console.log('API URL:', API_BASE_URL);
console.log('Endpoints de autenticación:', AUTH_CONFIG);

// Configuración de entorno simplificada
export const ENV = {
  isLocal: true
};