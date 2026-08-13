import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface CreateManualReceiptParams {
  organizationId: string;
  paidOn: string;
  amountPaid: number;
  duration: string;
  numUsers: number;
  country: string;
  planName: string;
  aecNumber: string;
  name?: string;
  email?: string;
}

export async function createManualReceiptApi(params: CreateManualReceiptParams): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'CREATE_MANUAL_RECEIPT',
    ...params,
  });
  return response.data;
}
