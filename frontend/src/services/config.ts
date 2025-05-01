// Configuración unificada para sistema de autenticación simple
// Detectar automáticamente la URL base según el dominio actual
const getCurrentDomain = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Si es setcollectormtg.com, usar ese dominio
    if (hostname === 'setcollectormtg.com' || hostname === 'www.setcollectormtg.com') {
      return `${protocol}//setcollectormtg.com`;
    }
    
    // Si es localhost con puerto, incluir el puerto
    if (hostname === 'localhost' && port) {
      return `${protocol}//${hostname}:${port}`;
    }
    
    // Por defecto, usar localhost:5173
    return `${protocol}//${hostname}:${port || '5173'}`;
  }
  
  // Fallback para entornos sin window (SSR, tests, etc.)
  return 'http://localhost:5173';
};

export const API_BASE_URL = getCurrentDomain();

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