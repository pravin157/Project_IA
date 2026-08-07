import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export async function getOrganizationsApi(): Promise<any[]> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER, {
    eventType: 'GET_ORGANIZATIONS_WITH_USER_COUNT',
  });
  
  // Accept standard Axios response wrapping or custom body response formatting
  const data = response.data as any;
  if (data && Array.isArray(data.body)) {
    return data.body;
  }
  throw new Error(data?.message || 'Failed to retrieve organizations.');
}
