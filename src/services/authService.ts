import { loginApi, signupApi, checkMeApi, refreshTokenApi } from '@/api/auth/login';
import { logoutApi } from '@/api/auth/logout';
import { LoginCredentials, SignupCredentials, AuthResponse } from '@/types/dashboard';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return loginApi(credentials);
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    return signupApi(credentials);
  },

  async checkSession(): Promise<{ authenticated: boolean; user?: any }> {
    return checkMeApi();
  },

  async refreshSession(): Promise<AuthResponse> {
    return refreshTokenApi();
  },

  async performCompleteLogout(): Promise<void> {
    try {
      await logoutApi().catch(() => {});
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
};
export const performCompleteLogout = authService.performCompleteLogout;
