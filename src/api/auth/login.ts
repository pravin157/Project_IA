import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';
import { LoginCredentials, SignupCredentials, AuthResponse } from '@/types/dashboard';

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
  return response.data;
}

export async function signupApi(credentials: SignupCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.SIGNUP, credentials);
  return response.data;
}

export async function checkMeApi(): Promise<{ authenticated: boolean; user?: any }> {
  const response = await apiClient.get<{ authenticated: boolean; user?: any }>(ENDPOINTS.AUTH.ME);
  return response.data;
}

export async function refreshTokenApi(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REFRESH);
  return response.data;
}
