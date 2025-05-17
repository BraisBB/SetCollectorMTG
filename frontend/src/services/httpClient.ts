import axios from 'axios';
import { API_URL } from './config';

// Cliente HTTP centralizado para todas las peticiones a la API
class HttpClient {
  private api;
  
  constructor(baseURL: string) {
    // Asegurarnos de que tenemos un baseURL adecuado
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Interceptor para añadir token de autorización
    this.api.interceptors.request.use((config: any) => {
      // Asegurar que la URL tiene el formato correcto
      if (!config.url.startsWith('/') && !config.url.startsWith('http')) {
        config.url = `/${config.url}`;
      }
      
      console.log(`Enviando solicitud a: ${config.baseURL}${config.url}`);
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token incluido en la solicitud');
        
        // Para depuración, mostrar parte del token (pero no completo por seguridad)
        if (token.length > 20) {
          console.log(`Token Auth: Bearer ${token.substring(0, 15)}...${token.substring(token.length - 5)}`);
        }
      } else {
        console.warn('No hay token de autenticación disponible para la solicitud');
      }
      return config;
    });
    
    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Mejora en la gestión de errores
        if (error.response) {
          // La solicitud fue realizada y el servidor respondió con un código de estado
          // que no está en el rango de 2xx
          console.error('Error de respuesta del servidor:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            config: {
              url: error.config.url,
              method: error.config.method,
              baseURL: error.config.baseURL,
              headers: error.config.headers,
            }
          });
          
          // Añadir información más descriptiva al error
          if (error.response.data && error.response.data.message) {
            error.message = `Error ${error.response.status}: ${error.response.data.message}`;
          } else {
            error.message = `Error ${error.response.status}: ${error.response.statusText}`;
          }
          
          // Si es un error 401/403, podemos intentar renovar el token
          if (error.response.status === 401 || error.response.status === 403) {
            console.warn('Error de autenticación o autorización. Considera renovar el token o redirigir al login.');
            // Aquí se podría implementar lógica para renovar el token o redirigir al login
          }
        } else if (error.request) {
          // La solicitud fue realizada pero no se recibió respuesta
          console.error('No se recibió respuesta del servidor:', error.request);
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
  async get<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.api.get(url, config);
      // Asegurar que tenemos datos válidos
      if (response && response.data !== undefined) {
        return response.data as T;
      } else {
        console.warn(`Respuesta vacía o inválida para GET ${url}`, response);
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
  
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post(url, data, config);
    if (response && response.data !== undefined) {
      return response.data as T;
    }
    console.warn(`Respuesta vacía o inválida para POST ${url}`, response);
    return null as unknown as T;
  }
  
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put(url, data, config);
    if (response && response.data !== undefined) {
      return response.data as T;
    }
    console.warn(`Respuesta vacía o inválida para PUT ${url}`, response);
    return null as unknown as T;
  }
  
  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete(url, config);
    if (response && response.data !== undefined) {
      return response.data as T;
    }
    console.warn(`Respuesta vacía o inválida para DELETE ${url}`, response);
    return null as unknown as T;
  }
}

// Exportamos una instancia única para todo el proyecto
export const httpClient = new HttpClient(API_URL); 