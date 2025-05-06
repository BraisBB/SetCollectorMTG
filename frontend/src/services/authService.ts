import axios from 'axios';

// Configuración de Keycloak desde el backend
const KEYCLOAK_URL = 'http://localhost:8181';
const REALM = 'setcollector-realm';
const CLIENT_ID = 'setcollector-app';
const CLIENT_SECRET = 'IiAm00pAe5U3Np4rUjRZPUIg0c7zWwB1';
const API_URL = 'http://localhost:8080';

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

interface UserInfo {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;
  private knownUsernames: Map<string, string> = new Map(); // Mapa de usernames normalizados a exactos

  constructor() {
    // Cargar nombres de usuario conocidos
    this.loadKnownUsernames();
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
   * Intenta obtener el formato exacto del nombre de usuario
   * Esta función simula una consulta al backend para obtener el formato exacto
   */
  async getExactUsername(username: string): Promise<string | null> {
    // Primero verificamos si ya conocemos el formato exacto
    const normalizedUsername = username.toLowerCase();
    const knownUsername = this.knownUsernames.get(normalizedUsername);
    
    if (knownUsername) {
      return knownUsername;
    }
    
    // Si no lo conocemos, intentamos una consulta directa a Keycloak
    // Nota: Esto es una simulación, ya que no podemos consultar directamente a Keycloak
    // En un escenario real, esto sería un endpoint en el backend
    
    // Para simular, vamos a verificar si hay alguna coincidencia parcial en los nombres conocidos
    // Esto no es una solución real, pero servirá para demostrar el concepto
    for (const [key, value] of this.knownUsernames.entries()) {
      if (key.includes(normalizedUsername) || normalizedUsername.includes(key)) {
        return value;
      }
    }
    
    return null; // No encontramos coincidencias
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
   * Realiza el login del usuario usando las credenciales proporcionadas
   */
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      // Primero verificamos si conocemos el formato exacto del nombre de usuario
      const exactUsername = await this.getExactUsername(credentials.username);
      
      // Si conocemos el formato exacto y no coincide, rechazamos el intento
      if (exactUsername && exactUsername !== credentials.username) {
        console.warn('Username format mismatch');
        // Solo almacenamos un indicador de que hubo un error de formato, no el nombre exacto
        localStorage.setItem('format_error', 'true');
        return false;
      }
      
      const params = new URLSearchParams();
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);
      params.append('grant_type', 'password');
      params.append('username', credentials.username);
      params.append('password', credentials.password);
      params.append('scope', 'openid profile email');

      console.log('Attempting login with:', {
        url: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        client_id: CLIENT_ID,
        username: credentials.username,
        client_secret: CLIENT_SECRET.substring(0, 4) + '...' // Only showing first 4 characters for security
      });

      const response = await axios.post<AuthTokens>(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
        }
      );

      console.log('Login successful:', {
        access_token: response.data.access_token.substring(0, 10) + '...',
        expires_in: response.data.expires_in
      });
      
      // Si el login fue exitoso, registrar el formato exacto del nombre de usuario
      this.registerKnownUsername(credentials.username);
      
      // Limpiar cualquier indicador de error de formato
      localStorage.removeItem('format_error');
      
      this.setSession(response.data);
      return true;
    } catch (error: any) {
      console.error('Login failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // Si el error es 401 (Unauthorized), intentamos obtener el formato exacto
      // Esto simula una consulta al backend para verificar si existe un usuario con ese nombre
      // pero con un formato diferente
      if (error.response?.status === 401) {
        try {
          // Consultar al backend para verificar si existe un usuario con ese nombre
          // pero con un formato diferente
          const response = await axios.get<UserInfo[]>(`${API_URL}/users?username=${credentials.username.toLowerCase()}`);
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const userInfo = response.data[0];
            if (userInfo && userInfo.username && userInfo.username !== credentials.username) {
              // Solo almacenamos un indicador de que hubo un error de formato, no el nombre exacto
              localStorage.setItem('format_error', 'true');
              this.registerKnownUsername(userInfo.username);
            }
          }
        } catch (e) {
          console.error('Error checking username after failed login:', e);
        }
      }
      
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
   * Obtiene el último formato exacto de nombre de usuario que se intentó usar
   * Por seguridad, solo indica si hay un error de formato, no devuelve el nombre exacto
   */
  getLastExactUsername(): string | null {
    return this.hasFormatError() ? 'format_error' : null;
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
    
    // Remove username from localStorage
    localStorage.removeItem('username');
    
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
    
    // Cargar nombres de usuario conocidos
    this.loadKnownUsernames();
  }
  
  /**
   * Precarga un nombre de usuario conocido (para pruebas)
   */
  preloadKnownUsername(exactUsername: string): void {
    this.registerKnownUsername(exactUsername);
  }
}

const authService = new AuthService();

// Precargamos el nombre de usuario "Brais" para pruebas
authService.preloadKnownUsername('Brais');

export default authService;