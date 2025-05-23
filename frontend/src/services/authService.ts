import { AUTH_CONFIG } from './config';
import { LoginCredentials, RegisterCredentials, AuthResponse } from './types';
import { httpClient } from './httpClient';

class AuthService {
  constructor() {
    this.initAuth();
  }

  initAuth(): void {
    if (this.hasToken() && !this.isTokenValid()) {
      console.log('Token expirado encontrado, limpiando sesión');
      this.clearSession();
    }
  }

  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      console.log('Enviando solicitud de login para usuario:', credentials.username);
      
      const authData: AuthResponse = await httpClient.post<AuthResponse>(
        AUTH_CONFIG.LOGIN_ENDPOINT,
        credentials
      );
      
      console.log('Login exitoso para usuario:', authData.username);
      this.setSession(authData);
      return true;
    } catch (error: any) {
      console.error('Error durante el login:', error);
      
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<boolean> {
    try {
      console.log('Enviando solicitud de registro para usuario:', credentials.username);
      
      const authData: AuthResponse = await httpClient.post<AuthResponse>(
        AUTH_CONFIG.REGISTER_ENDPOINT, 
        credentials
      );
      
      console.log('Registro exitoso para usuario:', authData.username);
      this.setSession(authData);
      return true;
    } catch (error: any) {
      console.error('Error durante el registro:', error);
      
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.clearSession();
    console.log('Sesión cerrada');
  }

  isAuthenticated(): boolean {
    return this.hasToken() && this.isTokenValid();
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getRoles(): string[] {
    const rolesStr = localStorage.getItem('userRoles');
    return rolesStr ? JSON.parse(rolesStr) : [];
  }

  isAdmin(): boolean {
    const roles = this.getRoles();
    return roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  }

  getUserIdentifier(): string | null {
    return this.getUsername();
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    return this.isTokenValid();
  }

  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = currentTime + (5 * 60);
      
      return payload.exp && payload.exp < fiveMinutesFromNow;
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      return false;
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  }

  private isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token ha expirado');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validando token:', error);
      return false;
    }
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, authData.token);
    localStorage.setItem('username', authData.username);
    localStorage.setItem('userRoles', JSON.stringify(authData.roles));
    
    console.log('Sesión guardada para usuario:', authData.username);
    console.log('Roles del usuario:', authData.roles);
  }

  private clearSession(): void {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('userRoles');
    console.log('Sesión limpiada');
  }
}

const authService = new AuthService();
export default authService; 