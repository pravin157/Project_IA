import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export async function logoutApi(): Promise<void> {
  await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
}
