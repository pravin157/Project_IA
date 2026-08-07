import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';
import { PortfolioAnalyticsBody, AccountSummary } from '@/types/dashboard';
import { toEpochMs } from '@/modules/customer-success/utils/formatters';

function normalizeAccountSummary(acc: AccountSummary): AccountSummary {
  return {
    ...acc,
    lastActivityAt: toEpochMs(acc.lastActivityAt),
    snapshotDate: toEpochMs(acc.snapshotDate) ?? Date.now(),
    isPaidPlan: acc.isPaidPlan ?? true,
  };
}

function normalizePortfolio(body: PortfolioAnalyticsBody): PortfolioAnalyticsBody {
  return {
    ...body,
    dailyTrend: (body.dailyTrend || []).map((d) => ({
      ...d,
      date: toEpochMs(d.date) ?? 0,
    })),
    accounts: (body.accounts || []).map(normalizeAccountSummary),
  };
}

export async function fetchPortfolioAnalytics(
  trendDays: number = 14,
  _useLatestPerOrg: boolean = true,
  _enrichOrgDetails: boolean = true,
  customApiKey?: string
): Promise<PortfolioAnalyticsBody | null> {
  const headers: Record<string, string> = {};
  if (customApiKey) {
    headers['x-custom-apikey'] = customApiKey;
  }

  const res = await apiClient.post(
    ENDPOINTS.CUSTOMER_SUCCESS.BATCH,
    { trendDays },
    { headers }
  );

  const data = res.data as any;
  const portfolio = data?.data || data;
  if (portfolio && Array.isArray(portfolio.accounts)) {
    return normalizePortfolio(portfolio);
  }
  return null;
}
