// Configuración centralizada para los servicios

// API y Backend
export const API_URL = '/api'; // Usando el proxy configurado en vite.config.ts
export const API_BASE_URL = 'http://localhost:8080';

// Keycloak
export const KEYCLOAK_CONFIG = {
  URL: 'http://localhost:8181',
  REALM: 'setcollector-realm',
  CLIENT_ID: 'setcollector-app',
  CLIENT_SECRET: 'uhIU5gtTgCXqTT8V84uXtS20b8vBGXnr'
}; 