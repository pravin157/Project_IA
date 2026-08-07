import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface ExtendSubscriptionParams {
  organizationId: string;
  subscriptionId: string;
  extendedToDate: string;
}

export async function extendSubscriptionApi(params: ExtendSubscriptionParams): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'EXTEND_SUBSCRIPTION_DATE',
    ...params,
  });
  
  const data = response.data as any;
  if (data && data.code === 'SUBSCRIPTION_EXPIRY_EXTENDED') {
    return data;
  }
  throw new Error(data?.error || data?.message || 'Failed to extend subscription.');
}
