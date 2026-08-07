import { getOrganizationsApi } from '@/api/sales/getOrganizations';
import { getSubscriptionDetailsApi } from '@/api/sales/getSubscriptionDetails';
import { extendSubscriptionApi, ExtendSubscriptionParams } from '@/api/sales/extendSubscription';
import { createDiscountApi, CreateDiscountParams } from '@/api/sales/createDiscount';
import { getCouponsApi } from '@/api/sales/getCoupons';
import { deleteCouponApi, DeleteCouponParams } from '@/api/sales/deleteCoupon';

export const salesService = {
  async getOrganizations(): Promise<any[]> {
    return getOrganizationsApi();
  },

  async getSubscriptionDetails(organizationId: string): Promise<any> {
    return getSubscriptionDetailsApi(organizationId);
  },

  async extendSubscription(params: ExtendSubscriptionParams): Promise<any> {
    return extendSubscriptionApi(params);
  },

  async createDiscount(params: CreateDiscountParams): Promise<any> {
    return createDiscountApi(params);
  },

  async getCoupons(): Promise<any[]> {
    return getCouponsApi();
  },

  async deleteCoupon(params: DeleteCouponParams): Promise<any> {
    return deleteCouponApi(params);
  }
};
