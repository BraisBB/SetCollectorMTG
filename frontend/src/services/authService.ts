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
   * Guarda los tokens en el localStorage
   */
  private setSession(authResult: AuthTokens): void {
    const expiresAt = Date.now() + authResult.expires_in * 1000;
    
    localStorage.setItem('access_token', authResult.access_token);
    localStorage.setItem('refresh_token', authResult.refresh_token);
    localStorage.setItem('expires_at', expiresAt.toString());
  }

  /**
   * Elimina los tokens del localStorage
   */
  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('username');
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
    
    // Consideramos que expira pronto si queda menos de 5 minutos
    return Date.now() > parseInt(expiresAt, 10) - 5 * 60 * 1000;
  }

  /**
   * Refresca el token si es necesario
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.isTokenExpiringSoon()) return true;
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    try {
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
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Obtiene el ID del usuario del token JWT
   */
  getUserId(): number | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Intentar diferentes propiedades donde puede estar el ID
      if (payload.sub) {
        return parseInt(payload.sub, 10);
      }
      if (payload.user_id) {
        return parseInt(payload.user_id, 10);
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  /**
   * Inicializa la autenticación
   */
  initAuth(): void {
    // Verificamos si hay token y si está expirado
    if (this.isAuthenticated()) {
      // Si el token está a punto de expirar, lo refrescamos
      if (this.isTokenExpiringSoon()) {
        this.refreshTokenIfNeeded().catch(() => {
          console.error('Failed to refresh token during init');
        });
      }
    } else {
      // Si no hay token válido, limpiamos la sesión
      const token = localStorage.getItem('access_token');
      if (token) {
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