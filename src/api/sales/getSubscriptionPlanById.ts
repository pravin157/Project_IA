import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export async function getSubscriptionPlanByIdApi(planId: string): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER, {
    eventType: 'GET_SUBSCRIPTION_PLAN_BY_ID',
    planId,
  });
  
  const data = response.data as any;
  if (data && data.code === 'SUBSCRIPTION_PLAN_DETAILS_RETRIEVED') {
    return data.body;
  }
  throw new Error(data?.message || 'Failed to retrieve plan details.');
}
