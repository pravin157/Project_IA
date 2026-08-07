import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface DeleteCouponParams {
  couponId: string;
  couponCode: string;
}

export async function deleteCouponApi(params: DeleteCouponParams): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'DELETE_DISCOUNT_COUPON',
    ...params,
  });
  
  const data = response.data as any;
  if (data && data.code === 'DISCOUNT_COUPON_DELETED') {
    return data;
  }
  throw new Error(data?.error || data?.message || 'Failed to delete coupon.');
}
