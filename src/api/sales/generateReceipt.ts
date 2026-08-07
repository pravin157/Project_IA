import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface GenerateReceiptParams {
  aecId: string;
  dateTime: string;
  amount: number;
  duration: 'Monthly' | 'Annually' | 'Half Yearly' | 'Quarterly' | string;
  numberOfUsers: number;
  countryCode: string; // strictly 2 characters
  planName: string;
}

export async function generateReceiptApi(params: GenerateReceiptParams): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'GENERATE_RECEIPT',
    ...params,
  });
  
  const data = response.data as any;
  if (data && (data.code === 'RECEIPT_GENERATED' || data.success)) {
    return data;
  }
  return data;
}
