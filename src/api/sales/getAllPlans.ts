import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export async function getAllPlansApi(country: string): Promise<any[]> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER, {
    eventType: 'GET_ALL_PLANS',
    country,
  });
  
  const data = response.data as any;
  if (data && data.code === 'SUBSCRIPTION_PLANS_RETRIEVED') {
    return data.body;
  }
  throw new Error(data?.message || 'Failed to retrieve plans.');
}
