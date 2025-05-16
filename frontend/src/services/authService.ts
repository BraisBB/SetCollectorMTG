import axios from 'axios';
import { KEYCLOAK_CONFIG } from './config';
import { LoginCredentials, AuthTokens, User } from './types';

class AuthService {
  // Gestión de nombres de usuario
  private knownUsernames: Map<string, string> = new Map();

  constructor() {
    this.loadKnownUsernames();
    this.initAuth();
  }

  /**
   * Carga los nombres de usuario conocidos desde localStorage
   */
  private loadKnownUsernames(): void {
    try {
      const storedData = localStorage.getItem('known_usernames');
      if (storedData) {
        const entries = JSON.parse(storedData) as [string, string][];
        this.knownUsernames = new Map(entries);
      }
    } catch (error) {
      console.error('Error loading known usernames:', error);
    }
  }

  /**
   * Guarda los nombres de usuario conocidos en localStorage
   */
  private saveKnownUsernames(): void {
    try {
      const entries = Array.from(this.knownUsernames.entries());
      localStorage.setItem('known_usernames', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving known usernames:', error);
    }
  }

  /**
   * Registra un nuevo nombre de usuario conocido
   */
  registerKnownUsername(exactUsername: string): void {
    const normalizedUsername = exactUsername.toLowerCase();
    this.knownUsernames.set(normalizedUsername, exactUsername);
    this.saveKnownUsernames();
  }

  /**
   * Intenta obtener el formato exacto del nombre de usuario
   */
  async getExactUsername(username: string): Promise<string | null> {
    const normalizedUsername = username.toLowerCase();
    return this.knownUsernames.get(normalizedUsername) || null;
  }

  /**
   * Realiza el login del usuario usando las credenciales proporcionadas
   */
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      // Verificamos si conocemos el formato exacto del nombre de usuario
      const exactUsername = await this.getExactUsername(credentials.username);
      
      // Si conocemos el formato exacto y no coincide, rechazamos el intento
      if (exactUsername && exactUsername !== credentials.username) {
        localStorage.setItem('format_error', 'true');
        return false;
      }
      
      const params = new URLSearchParams();
      params.append('client_id', KEYCLOAK_CONFIG.CLIENT_ID);
      params.append('client_secret', KEYCLOAK_CONFIG.CLIENT_SECRET);
      params.append('grant_type', 'password');
      params.append('username', credentials.username);
      params.append('password', credentials.password);
      params.append('scope', 'openid profile email');

      const response = await axios.post<AuthTokens>(
        `${KEYCLOAK_CONFIG.URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid-connect/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
        }
      );
      
      // Registro el formato exacto y limpio indicadores de error
      this.registerKnownUsername(credentials.username);
      localStorage.removeItem('format_error');
      
      // Guardo la sesión
      this.setSession(response.data);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error.message);
      return false;
    }
  }

  /**
   * Verifica si hubo un error de formato en el último intento de login
   */
  hasFormatError(): boolean {
    return localStorage.getItem('format_error') === 'true';
  }

  /**
   * Cierra la sesión del usuario actual
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        const params = new URLSearchParams();
        params.append('client_id', KEYCLOAK_CONFIG.CLIENT_ID);
        params.append('refresh_token', refreshToken);

        await axios.post(
          `${KEYCLOAK_CONFIG.URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid-connect/logout`,
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.clearSession();
  }

  /**
   * Obtiene el ID del usuario del token JWT
   * Para interacciones con la API, preferimos usar username
   */
  getUserIdentifier(): string | null {
    // Preferimos usar el username como identificador principal para la API
    const username = localStorage.getItem('username');
    if (username) {
      return username;
    }
    
    // Si por alguna razón no tenemos el username, intentamos con keycloakId como fallback
    const keycloakId = localStorage.getItem('user_keycloak_id');
    if (keycloakId) {
      return keycloakId;
    }
    
    // Último recurso: intentar extraerlo del token
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Extraer identificadores por orden de preferencia
      if (payload.preferred_username) {
        localStorage.setItem('username', payload.preferred_username);
        return payload.preferred_username;
      }
      
      if (payload.sub) {
        localStorage.setItem('user_keycloak_id', payload.sub);
        return payload.sub;
      }
      
      console.warn("No se encontró ningún identificador adecuado en el token");
      return null;
    } catch (error) {
      console.error("Error al decodificar token o extraer identificador:", error);
      return null;
    }
  }
  
  /**
   * Obtiene el ID de Keycloak del usuario (UUID)
   * Para operaciones internas que requieren específicamente el UUID de Keycloak
   */
  getKeycloakId(): string | null {
    // Primero intentar desde localStorage
    const keycloakId = localStorage.getItem('user_keycloak_id');
    if (keycloakId) {
      return keycloakId;
    }
    
    // Intentar extraerlo del token
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        localStorage.setItem('user_keycloak_id', payload.sub);
        return payload.sub;
      }
      
      return null;
    } catch (error) {
      console.error("Error al extraer keycloakId:", error);
      return null;
    }
  }
  
  /**
   * Guarda los tokens en el localStorage y extrae información del usuario
   */
  private setSession(authResult: AuthTokens): void {
    const expiresAt = Date.now() + authResult.expires_in * 1000;
    
    localStorage.setItem('access_token', authResult.access_token);
    localStorage.setItem('refresh_token', authResult.refresh_token);
    localStorage.setItem('expires_at', expiresAt.toString());
    
    // Decodificar el token para obtener información del usuario
    try {
      const payload = JSON.parse(atob(authResult.access_token.split('.')[1]));
      console.log("Token payload:", payload);
      
      // Guardar todos los identificadores disponibles
      if (payload.preferred_username) {
        localStorage.setItem('username', payload.preferred_username);
        console.log("Username guardado:", payload.preferred_username);
      }
      
      if (payload.name) {
        localStorage.setItem('display_name', payload.name);
      }
      
      if (payload.sub) {
        localStorage.setItem('user_keycloak_id', payload.sub);
        console.log("Keycloak ID guardado:", payload.sub);
      }
      
      if (payload.email) {
        localStorage.setItem('email', payload.email);
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }
  
  /**
   * Elimina los tokens del localStorage
   */
  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('username');
    localStorage.removeItem('user_keycloak_id');
    localStorage.removeItem('display_name');
    localStorage.removeItem('email');
    localStorage.removeItem('user_internal_id');
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const expiresAt = localStorage.getItem('expires_at');
    return !!expiresAt && Date.now() < parseInt(expiresAt, 10);
  }

  /**
   * Obtiene el token de acceso
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Verifica si el token está a punto de expirar
   */
  isTokenExpiringSoon(): boolean {
    const expiresAt = localStorage.getItem('expires_at');
    if (!expiresAt) return false;
    
    // Consideramos que expira pronto si queda menos de 3 minutos
    // Esto nos da tiempo suficiente para renovarlo antes de que expire
    const expiresAtMs = parseInt(expiresAt, 10);
    const timeRemaining = expiresAtMs - Date.now();
    const THREE_MINUTES = 3 * 60 * 1000;
    
    return timeRemaining < THREE_MINUTES;
  }

  /**
   * Refresca el token si es necesario
   * @param force Si es true, fuerza la renovación incluso si el token no está por expirar
   */
  async refreshTokenIfNeeded(force: boolean = false): Promise<boolean> {
    // Si no está forzado y el token no está por expirar, no hacemos nada
    if (!force && !this.isTokenExpiringSoon()) {
      return true;
    }
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    try {
      console.log(`Intentando renovar token... (forzado: ${force})`);
      const params = new URLSearchParams();
      params.append('client_id', KEYCLOAK_CONFIG.CLIENT_ID);
      params.append('client_secret', KEYCLOAK_CONFIG.CLIENT_SECRET);
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);
      
      const response = await axios.post<AuthTokens>(
        `${KEYCLOAK_CONFIG.URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid-connect/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      this.setSession(response.data);
      console.log('Token renovado con éxito, nueva expiración:', new Date(parseInt(localStorage.getItem('expires_at') || '0')));
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Inicializa la autenticación
   */
  initAuth(): void {
    // Verificamos si hay token válido
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token && refreshToken) {
      console.log('Token encontrado al iniciar, intentando renovar sesión...');
      // Intentar renovar el token siempre al iniciar la app o recargar la página
      // Esto asegura que siempre tengamos un token fresco al comenzar
      this.refreshTokenIfNeeded(true)
        .then(success => {
          if (success) {
            console.log('Sesión renovada correctamente al iniciar');
          } else {
            console.warn('No se pudo renovar la sesión al iniciar, cerrando sesión...');
            this.clearSession();
          }
        })
        .catch(error => {
          console.error('Error al renovar token durante inicialización:', error);
          this.clearSession();
        });
    } else if (!this.isAuthenticated()) {
      // Si no hay token válido, limpiamos la sesión
      if (token) {
        console.log('Token expirado encontrado, limpiando sesión...');
        this.clearSession();
      }
    }
  }

  /**
   * Precarga un nombre de usuario exacto (útil para testing)
   */
  preloadKnownUsername(exactUsername: string): void {
    this.registerKnownUsername(exactUsername);
  }
}

const authService = new AuthService();
export default authService;