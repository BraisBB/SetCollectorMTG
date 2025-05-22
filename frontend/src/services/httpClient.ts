import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import authService from './authService';

// Cliente HTTP centralizado para todas las peticiones a la API
class HttpClient {
  private api;
  
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // Aumentamos timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Para despliegue local con CORS simplificado (Access-Control-Allow-Origin: *)
      // no podemos usar withCredentials: true
      withCredentials: false
    });
    
    // Interceptor para añadir token de autorización
    this.api.interceptors.request.use(async (config: any) => {
      // Log para debugging
      console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url || config.baseURL);
      
      // Verificar estado de autenticación para debugging
      console.log('Estado de autenticación antes de la petición:', authService.isAuthenticated());
      
      // Actualizar token si está por expirar
      if (authService.isAuthenticated() && authService.isTokenExpiringSoon()) {
        console.log('Token a punto de expirar, intentando renovar...');
        const refreshed = await authService.refreshTokenIfNeeded();
        if (!refreshed) {
          console.warn('Failed to refresh token, continuing with current token');
        } else {
          console.log('Token renovado exitosamente');
        }
      }
      
      // Añadir token de autenticación si existe
      const token = authService.getToken();
      if (token) {
        console.log('Añadiendo token de autenticación a la petición');
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('No hay token disponible, la petición será anónima');
      }
      
      return config;
    }, (error) => {
      console.error('Error en la configuración de la petición:', error);
      return Promise.reject(error);
    });
    
    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => {
        console.log(`Response ${response.status} from:`, response.config.url);
        return response.data; // Devolver directamente response.data para simplificar
      },
      async (error: AxiosError) => {
        // Logging mejorado para debugging
        if (error.response) {
          const status = error.response.status;
          const url = error.config?.url || 'unknown';
          
          console.error(`HTTP Error ${status} for ${url}`);
          console.error('Response headers:', error.response.headers);
          console.error('Response data:', error.response.data);
          
          if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
            error.message = `Error ${status}: ${error.response.data.message}`;
          } else {
            error.message = `Error ${status}: ${error.response.statusText}`;
          }
          
          // Manejo de errores de autenticación
          if (status === 401 || status === 403) {
            console.log('Error de autenticación detectado');
            if (status === 401 && authService.isAuthenticated() && error.config) {
              console.log('Intentando renovar token después de error 401...');
              const refreshed = await authService.refreshTokenIfNeeded(true); // Forzar renovación
              
              if (refreshed) {
                console.log('Token renovado después de error 401, reintentando petición');
                const newToken = authService.getToken();
                if (newToken && error.config.headers) {
                  error.config.headers.Authorization = `Bearer ${newToken}`;
                }
                return this.api(error.config);
              } else {
                console.warn('No se pudo renovar el token, redireccionar a login');
                // Aquí podrías redirigir al usuario a la página de login si tienes acceso al router
                // Por ejemplo: window.location.href = '/login';
              }
            }
          }
        } else if (error.request) {
          console.error('Network error - no response received:', error.config?.url);
          console.error('Request details:', {
            method: error.config?.method,
            url: error.config?.url,
            headers: error.config?.headers
          });
          error.message = 'No se recibió respuesta del servidor';
        } else {
          console.error('Request setup error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Métodos simplificados para usar con response.data directo
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.api.get(url, config);
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.api.post(url, data, config);
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.api.put(url, data, config);
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.api.delete(url, config);
  }
}

export const httpClient = new HttpClient();