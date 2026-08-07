import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

export interface CreateDiscountParams {
  couponCode: string;
  discountUnit: 'PERCENTAGE' | 'AMOUNT';
  discountValue: number;
  isRecurringDiscount: boolean;
}

export async function createDiscountApi(params: CreateDiscountParams): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER_ADMIN, {
    eventType: 'CREATE_DISCOUNT_COUPON',
    ...params,
  });
  
  const data = response.data as any;
  if (data && data.code === 'DISCOUNT_COUPON_CREATED') {
    return data;
  }
  throw new Error(data?.error || data?.message || 'Failed to create discount coupon.');
}
