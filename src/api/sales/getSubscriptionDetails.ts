import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export async function getSubscriptionDetailsApi(organizationId: string): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER, {
    eventType: 'GET_ORGANIZATION_SUBSCRIPTION_DETAILS',
    organizationId,
  });
  
  const data = response.data as any;
  if (data && data.code === 'ORGANIZATION_SUBSCRIPTION_RETRIEVED') {
    return data.body;
  }
  throw new Error(data?.message || 'Failed to retrieve subscription details.');
}
