import { getOrganizationsApi } from '@/api/sales/getOrganizations';
import { getSubscriptionDetailsApi } from '@/api/sales/getSubscriptionDetails';

export const organizationService = {
  async getOrganizations(): Promise<any[]> {
    return getOrganizationsApi();
  },

  async getSubscriptionDetails(organizationId: string): Promise<any> {
    return getSubscriptionDetailsApi(organizationId);
  }
};
