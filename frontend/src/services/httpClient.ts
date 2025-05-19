import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import authService from './authService';

// Cliente HTTP centralizado para todas las peticiones a la API
class HttpClient {
  private api;
  
  constructor(baseURL: string) {
    // Asegurarnos de que tenemos un baseURL adecuado
    this.api = axios.create({
      baseURL,
      timeout: 10000, // Reducimos el timeout a 10 segundos
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Interceptor para añadir token de autorización
    this.api.interceptors.request.use(async (config: any) => {
      // Asegurar que la URL tiene el formato correcto
      if (!config.url.startsWith('/') && !config.url.startsWith('http')) {
        config.url = `/${config.url}`;
      }
      
      // Actualizar token si está por expirar
      if (authService.isAuthenticated() && authService.isTokenExpiringSoon()) {
        const refreshed = await authService.refreshTokenIfNeeded();
        if (!refreshed) {
          console.warn('Failed to refresh token, continuing with current token');
        }
      }
      
      // Añadir token de autenticación si existe
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      console.error('Error en la configuración de la petición:', error);
      return Promise.reject(error);
    });
    
    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        // Mejora en la gestión de errores
        if (error.response) {
          // La solicitud fue realizada y el servidor respondió con un código de estado
          // que no está en el rango de 2xx
          const status = error.response.status;
          const url = error.config?.url || '';
          
          console.error(`Error en solicitud HTTP (${status}): ${url}`);
          
          // Añadir información más descriptiva al error
          if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
            error.message = `Error ${status}: ${error.response.data.message}`;
          } else {
            error.message = `Error ${status}: ${error.response.statusText}`;
          }
          
          // Si es un error de autenticación, actualizar token o redirigir al login
          if (status === 401 || status === 403) {
            // En caso de 401, intentar refrescar el token y reintentar
            if (status === 401 && authService.isAuthenticated() && error.config) {
              const refreshed = await authService.refreshTokenIfNeeded();
              
              if (refreshed) {
                // Si se refrescó el token con éxito, reintentar la solicitud original
                const newToken = authService.getToken();
                
                if (newToken && error.config.headers) {
                  error.config.headers.Authorization = `Bearer ${newToken}`;
                }
                
                return axios(error.config);
              }
            }
            
            // Para errores 403, podría ser un problema de permisos o del ID de usuario
            if (status === 403 && error.config) {
              // Si hay un userId en el config, podríamos estar usando un ID numérico incorrecto
              const userId = authService.getUserIdentifier();
              const username = localStorage.getItem('username');
              
              if (username && userId && url.includes(`/user/${userId}`)) {
                // Intentar con username en lugar de ID numérico
                const newUrl = url.replace(`/user/${userId}`, `/user/byUsername/${username}`);
                
                error.config.url = newUrl;
                return axios(error.config);
              }
            }
          }
        } else if (error.request) {
          // La solicitud fue realizada pero no se recibió respuesta
          console.error('Error de red (Sin respuesta):', error.config?.url);
          error.message = 'No se recibió respuesta del servidor';
        } else {
          // Algo ocurrió durante la preparación de la solicitud
          console.error('Error en la configuración de la solicitud:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Métodos genéricos para las operaciones CRUD
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get(url, config);
      // Asegurar que tenemos datos válidos
      if (response && response.data !== undefined) {
        return response.data as T;
      } else {
        // Si estamos esperando un array, devolvemos un array vacío
        if (url.includes('/users') || url.includes('/sets') || url.includes('/cards') || url.includes('/decks')) {
          return [] as unknown as T;
        }
        return null as unknown as T;
      }
    } catch (error) {
      // Manejo de fallback para desarrollo
      if (url.includes('/sets')) {
        console.warn('Fallback para sets en desarrollo');
        return [] as unknown as T;
      }
      throw error;
    }
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post(url, data, config);
    if (response && response.data !== undefined) {
      return response.data as T;
    }
    return null as unknown as T;
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put(url, data, config);
    if (response && response.data !== undefined) {
      return response.data as T;
    }
    return null as unknown as T;
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete(url, config);
    if (response && response.data !== undefined) {
      return response.data as T;
    }
    return null as unknown as T;
  }
}

// Exportamos una instancia única para todo el proyecto
export const httpClient = new HttpClient(API_URL); 