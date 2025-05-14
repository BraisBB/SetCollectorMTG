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
        console.error(`Error en solicitud HTTP: ${error.config?.url}`, error);
        return Promise.reject(error);
      }
    );
  }
  
  // Métodos genéricos para las operaciones CRUD
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.get(url, config);
    return response.data as T;
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