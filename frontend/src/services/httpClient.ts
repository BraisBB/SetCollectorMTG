import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import authService from './authService';

class HttpClient {
  private api;
  
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: false
    });
    
    // Interceptor para añadir token de autorización
    this.api.interceptors.request.use(async (config: any) => {
      console.log(`Making ${config.method?.toUpperCase()} request to:`, config.url || config.baseURL);
      
      // Detectar endpoints públicos
      const isPublicEndpoint = config.url && (
        config.url.includes('cards/search') || 
        config.url.includes('cards?') || 
        config.url.includes('/sets') ||
        config.url.includes('/auth/login') ||
        config.url.includes('/auth/register')
      );

      console.log('¿Es endpoint público?:', isPublicEndpoint);
      
      const isAuth = authService.isAuthenticated();
      const token = authService.getToken();
      console.log('¿Usuario autenticado?:', isAuth);
      console.log('¿Token disponible?:', !!token);

      if (!isPublicEndpoint && authService.isAuthenticated()) {
        const authToken = authService.getToken();
        if (authToken) {
          console.log('Añadiendo token de autenticación a la petición');
          config.headers.Authorization = `Bearer ${authToken}`;
        } else {
          console.error('Usuario autenticado pero no hay token disponible');
        }
      } else if (isPublicEndpoint) {
        console.log('Endpoint público detectado, no se añade token');
        delete config.headers.Authorization;
      } else {
        console.warn('No hay token disponible o no autenticado, la petición será anónima');
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
        return response.data;
      },
      async (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const url = error.config?.url || 'unknown';
          
          console.error(`HTTP Error ${status} for ${url}`);
          console.error('Response data:', error.response.data);
          
          // Manejo mejorado de errores de validación
          if (error.response.data && typeof error.response.data === 'object') {
            const errorData = error.response.data as any;
            
            // Si hay errores de validación específicos del backend
            if (errorData.errors && typeof errorData.errors === 'object') {
              const validationMessages = Object.entries(errorData.errors)
                .map(([field, message]) => `${field}: ${message}`)
                .join(', ');
              error.message = `Error ${status}: ${validationMessages}`;
            } else if (errorData.message) {
              error.message = `Error ${status}: ${errorData.message}`;
            } else {
              error.message = `Error ${status}: ${error.response.statusText}`;
            }
          } else {
            error.message = `Error ${status}: ${error.response.statusText}`;
          }
          
          // Manejo de errores de autenticación
          if (status === 401 && authService.isAuthenticated()) {
            console.log('Error 401 detectado, cerrando sesión');
            authService.logout();
            window.location.href = '/login';
          }
        } else if (error.request) {
          console.error('Network error - no response received:', error.config?.url);
          error.message = 'No se recibió respuesta del servidor';
        } else {
          console.error('Request setup error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
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