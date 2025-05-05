import axios from 'axios';

// Configuración de Keycloak desde el backend
const AUTH_API_URL = 'http://localhost:8080/api/auth';
const KEYCLOAK_URL = 'http://localhost:8181';
const REALM = 'setcollector-realm';
const CLIENT_ID = 'setcollector-app';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;

  /**
   * Realiza el login del usuario usando las credenciales proporcionadas
   */
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('client_id', CLIENT_ID);
      params.append('grant_type', 'password');
      params.append('username', credentials.username);
      params.append('password', credentials.password);

      const response = await axios.post<AuthTokens>(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
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
      console.error('Login failed:', error);
      return false;
    }
  }

  /**
   * Cierra la sesión del usuario actual
   */
  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('refresh_token', this.refreshToken);

        await axios.post(
          `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`,
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
   * Guarda los tokens en el localStorage y en la memoria
   */
  private setSession(authResult: AuthTokens): void {
    this.accessToken = authResult.access_token;
    this.refreshToken = authResult.refresh_token;
    this.expiresAt = Date.now() + authResult.expires_in * 1000;
    
    // Guardar en localStorage
    localStorage.setItem('access_token', authResult.access_token);
    localStorage.setItem('refresh_token', authResult.refresh_token);
    localStorage.setItem('expires_at', this.expiresAt.toString());
    
    // Configurar el token por defecto para las solicitudes de axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${authResult.access_token}`;
  }

  /**
   * Limpia la sesión actual
   */
  private clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = 0;
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    
    delete axios.defaults.headers.common['Authorization'];
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && Date.now() < this.getExpiresAt();
  }

  /**
   * Obtiene el token de acceso actual
   */
  getToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  /**
   * Obtiene el tiempo de expiración del token
   */
  getExpiresAt(): number {
    if (this.expiresAt === 0) {
      const expiresAt = localStorage.getItem('expires_at');
      this.expiresAt = expiresAt ? parseInt(expiresAt, 10) : 0;
    }
    return this.expiresAt;
  }

  /**
   * Inicializa el servicio de autenticación al cargar la aplicación
   */
  initAuth(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.accessToken = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      this.refreshToken = localStorage.getItem('refresh_token');
      const expiresAt = localStorage.getItem('expires_at');
      this.expiresAt = expiresAt ? parseInt(expiresAt, 10) : 0;
    }
  }
}

const authService = new AuthService();
export default authService; 