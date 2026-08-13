import { getOrganizationsApi } from '@/api/sales/getOrganizations';
import { getSubscriptionDetailsApi } from '@/api/sales/getSubscriptionDetails';
import { extendSubscriptionApi, ExtendSubscriptionParams } from '@/api/sales/extendSubscription';
import { createDiscountApi, CreateDiscountParams } from '@/api/sales/createDiscount';
import { getCouponsApi } from '@/api/sales/getCoupons';
import { deleteCouponApi, DeleteCouponParams } from '@/api/sales/deleteCoupon';
import { generateReceiptApi, GenerateReceiptParams } from '@/api/sales/generateReceipt';
import { getPaymentGatewayDetailsApi, PaymentGatewayDetails } from '@/api/sales/getPaymentGatewayDetails';
import { getOrganizationByAccountIdApi } from '@/api/sales/getOrganizationByAccountId';
import { createManualReceiptApi, CreateManualReceiptParams } from '@/api/sales/createManualReceipt';
import { getAllPlansApi } from '@/api/sales/getAllPlans';
import { getSubscriptionPlanByIdApi } from '@/api/sales/getSubscriptionPlanById';
import { updateSubscriptionApi, UpdateSubscriptionParams } from '@/api/sales/updateSubscription';

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

  async updateSubscription(params: UpdateSubscriptionParams): Promise<any> {
    return updateSubscriptionApi(params);
  },

  async createDiscount(params: CreateDiscountParams): Promise<any> {
    return createDiscountApi(params);
  },

  async getCoupons(): Promise<any[]> {
    return getCouponsApi();
  },

  async deleteCoupon(params: DeleteCouponParams): Promise<any> {
    return deleteCouponApi(params);
  },

  async generateReceipt(params: GenerateReceiptParams): Promise<any> {
    return generateReceiptApi(params);
  },

  async getPaymentGatewayDetails(countryCode: string): Promise<PaymentGatewayDetails | null> {
    return getPaymentGatewayDetailsApi(countryCode);
  },

  async getOrganizationByAccountId(accountId: string): Promise<any> {
    return getOrganizationByAccountIdApi(accountId);
  },

  async createManualReceipt(params: CreateManualReceiptParams): Promise<any> {
    return createManualReceiptApi(params);
  },

  async getAllPlans(country: string): Promise<any[]> {
    return getAllPlansApi(country);
  },

  async getSubscriptionPlanById(planId: string): Promise<any> {
    return getSubscriptionPlanByIdApi(planId);
  }
};




