import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface UpdateSubscriptionParams {
  organizationId: string;
  planId: string;
  planName: string;
  validFrom: number;
  validTill: number;
  licenseCount: number;
  paymentTenure: string;
  recurringAutoDebit: boolean;
}

export async function updateSubscriptionApi(params: UpdateSubscriptionParams): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'UPDATE_ORGANIZATION_SUBSCRIPTION',
    ...params,
  });

  const data = response.data as any;
  if (data && (data.code === 'ORGANIZATION_SUBSCRIPTION_UPDATED' || data.success === true || response.status === 200)) {
    return data;
  }
  throw new Error(data?.error || data?.message || 'Failed to update organization subscription.');
}
