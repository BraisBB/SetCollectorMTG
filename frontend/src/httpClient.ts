import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import authService from './services/authService';

// Configuración base para todas las peticiones
const httpClient = axios.create({
  baseURL: '/api',
  timeout: 20000, // Aumentamos el timeout a 20 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el token a las peticiones
httpClient.interceptors.request.use(
  async (config) => {
    // Log de solicitud para depuración
    console.log(`Enviando solicitud: ${config.method?.toUpperCase()} ${config.url}`);
    
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
  },
  (error) => {
    console.error('Error en la configuración de la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
httpClient.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa para depuración
    console.log(`Recibiendo respuesta: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // La solicitud fue hecha y el servidor respondió con un código de estado
      const status = error.response.status;
      const url = error.config?.url || '';
      
      console.log(`Recibiendo respuesta: ${status} ${url}`);
      console.error(`Error en solicitud HTTP (${status}): ${url}`);
      console.error('Detalles:', error.response.data);
      
      // Si es un error de autenticación, actualizar token o redirigir al login
      if (status === 401 || status === 403) {
        console.error('Error de autenticación o autorización. Considera renovar el token o redirigir al login.');
        
        // En caso de 401, intentar refrescar el token y reintentar
        if (status === 401 && authService.isAuthenticated()) {
          const refreshed = await authService.refreshTokenIfNeeded();
          
          if (refreshed && error.config) {
            // Si se refrescó el token con éxito, reintentar la solicitud original
            console.log('Token refrescado, reintentando solicitud');
            const newToken = authService.getToken();
            
            if (newToken && error.config.headers) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
            }
            
            return httpClient(error.config);
          }
        }
        
        // Para errores 403, podría ser un problema de permisos o del ID de usuario
        if (status === 403) {
          console.log('Error 403: Verificando si podemos resolver usando ID alternativo...');
          
          // Si hay un userId en el config, podríamos estar usando un ID numérico incorrecto
          const userId = authService.getUserIdentifier();
          const username = localStorage.getItem('user_identifier');
          
          if (username && userId && url.includes(`/user/${userId}`)) {
            // Intentar con username en lugar de ID numérico
            const newUrl = url.replace(`/user/${userId}`, `/user/byUsername/${username}`);
            console.log(`Reintentando con URL alternativa: ${newUrl}`);
            
            if (error.config) {
              error.config.url = newUrl;
              return httpClient(error.config);
            }
          }
        }
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('Error de red (Sin respuesta):', error.config?.url);
      console.error('Detalles: El servidor no respondió. Verifica tu conexión a internet o si el servidor está disponible.');
    } else {
      // Algo sucedió al configurar la solicitud
      console.error('Error al iniciar la solicitud:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Métodos para simplificar las peticiones HTTP
export const httpClientMethods = {
  /**
   * Realiza una petición GET
   * @param url URL de la petición
   * @param config Configuración adicional
   * @returns Promesa con los datos de la respuesta
   */
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    console.log(`Enviando solicitud a: ${url}`);
    const response = await httpClient.get<T>(url, config);
    return response.data;
  },

  /**
   * Realiza una petición POST
   * @param url URL de la petición
   * @param data Datos a enviar
   * @param config Configuración adicional
   * @returns Promesa con los datos de la respuesta
   */
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    console.log(`Enviando POST a: ${url}`);
    const response = await httpClient.post<T>(url, data, config);
    return response.data;
  },

  /**
   * Realiza una petición PUT
   * @param url URL de la petición
   * @param data Datos a enviar
   * @param config Configuración adicional
   * @returns Promesa con los datos de la respuesta
   */
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    console.log(`Enviando PUT a: ${url}`);
    const response = await httpClient.put<T>(url, data, config);
    return response.data;
  },

  /**
   * Realiza una petición DELETE
   * @param url URL de la petición
   * @param config Configuración adicional
   * @returns Promesa con los datos de la respuesta
   */
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    console.log(`Enviando DELETE a: ${url}`);
    const response = await httpClient.delete<T>(url, config);
    return response.data;
  }
};

export { httpClient };
export default httpClientMethods; 