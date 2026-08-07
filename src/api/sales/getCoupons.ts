import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export async function getCouponsApi(): Promise<any[]> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'GET_DISCOUNT_COUPONS',
  });
  
  const data = response.data as any;
  if (data && data.code === 'DISCOUNT_COUPONS_RETRIEVED') {
    return data.body || [];
  }
  throw new Error(data?.message || 'Failed to retrieve discount coupons.');
}
