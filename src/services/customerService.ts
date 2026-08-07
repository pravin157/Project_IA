import { fetchPaidOrganizations } from '@/api/customer-success/getPaidOrganizations';
import { fetchPortfolioAnalytics } from '@/api/customer-success/getPortfolioAnalytics';
import { fetchAccountDetail } from '@/api/customer-success/getAccountDetail';
import { fetchActivities } from '@/api/customer-success/getActivities';
import { fetchAutopilotAlerts } from '@/api/customer-success/getAutopilotAlerts';
import { PortfolioAnalyticsBody, AccountDetailBody, ActivityLogItem, AutopilotAlertItem, PaymasterOrganization } from '@/types/dashboard';

export const customerService = {
  async getPaidOrganizations(): Promise<PaymasterOrganization[]> {
    return fetchPaidOrganizations();
  },

  async getPortfolioAnalytics(
    trendDays?: number,
    useLatestPerOrg?: boolean,
    enrichOrgDetails?: boolean,
    customApiKey?: string
  ): Promise<PortfolioAnalyticsBody | null> {
    return fetchPortfolioAnalytics(trendDays, useLatestPerOrg, enrichOrgDetails, customApiKey);
  },

  async getAccountDetail(
    organizationId: string,
    days?: number,
    historyDays?: number,
    inactiveThresholdDays?: number,
    customApiKey?: string
  ): Promise<AccountDetailBody | null> {
    return fetchAccountDetail(organizationId, days, historyDays, inactiveThresholdDays, customApiKey);
  },

  async getActivities(
    organizationId?: string,
    rowsPerPage?: number,
    customApiKey?: string
  ): Promise<ActivityLogItem[]> {
    return fetchActivities(organizationId, rowsPerPage, customApiKey);
  },

  async getAutopilotAlerts(organizationId: string): Promise<AutopilotAlertItem[]> {
    return fetchAutopilotAlerts(organizationId);
  }
};
