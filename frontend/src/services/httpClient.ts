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
      }
      return config;
    });
    
    // Interceptor para manejar errores de respuesta
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Mejorar la información del error
        let errorMessage = 'Error desconocido';
        let errorDetails = '';
        
        if (error.response) {
          // La respuesta fue recibida pero el servidor respondió con un error
          const status = error.response.status;
          errorMessage = `Error en solicitud HTTP (${status}): ${error.config?.url}`;
          
          // Intentar extraer detalles del error del cuerpo de la respuesta
          if (error.response.data) {
            if (error.response.data.message) {
              errorDetails = error.response.data.message;
            } else if (error.response.data.error) {
              errorDetails = error.response.data.error;
            } else {
              try {
                errorDetails = JSON.stringify(error.response.data);
              } catch (e) {
                errorDetails = 'No se pudo parsear el detalle del error';
              }
            }
          }
        } else if (error.request) {
          // La petición fue realizada pero no se recibió respuesta (ej: timeout)
          errorMessage = `Error de red (Sin respuesta): ${error.config?.url}`;
          errorDetails = 'El servidor no respondió. Verifica tu conexión a internet o si el servidor está disponible.';
        } else {
          // Hubo un error al configurar la petición
          errorMessage = `Error al preparar la petición: ${error.config?.url}`;
          errorDetails = error.message || 'Error desconocido al preparar la petición';
        }
        
        // Agregar más detalles al error para usarlo en la UI
        if (errorDetails) {
          console.error(`${errorMessage}\nDetalles: ${errorDetails}`, error);
        } else {
          console.error(errorMessage, error);
        }
        
        // Si es un error 401/403, podemos intentar renovar el token
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('Error de autenticación o autorización. Considera renovar el token o redirigir al login.');
          // Aquí se podría implementar la lógica para renovar el token o redirigir al login
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Métodos genéricos para las operaciones CRUD
  async get<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.api.get(url, config);
      return response.data as T;
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
    return response.data as T;
  }
  
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put(url, data, config);
    return response.data as T;
  }
  
  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete(url, config);
    return response.data as T;
  }
}

// Exportamos una instancia única para todo el proyecto
export const httpClient = new HttpClient(API_URL); 