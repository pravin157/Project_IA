import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';
import { PaymasterOrganization } from '@/types/dashboard';
import { toEpochMs } from '@/modules/customer-success/utils/formatters';

export async function fetchPaidOrganizations(): Promise<PaymasterOrganization[]> {
  try {
    const response = await apiClient.post(ENDPOINTS.SALES.PAYMASTER, {
      eventType: 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS',
    });

    const data = response.data as any;
    let orgs: PaymasterOrganization[] = [];

    // Parse envelope logic identical to previous code
    let body = data?.body;
    if (body && !Array.isArray(body) && typeof body === 'object' && 'organizationIds' in body) {
      const ids = (body as { organizationIds?: string[] }).organizationIds ?? [];
      orgs = ids.filter(Boolean).map((id) => ({ organizationId: id }));
    } else if (Array.isArray(body)) {
      orgs = (body as Array<string | PaymasterOrganization>).map((item) =>
        typeof item === 'string' ? { organizationId: item } : item
      );
    }

    // Fetch subscription details in parallel
    const detailedOrgs = await Promise.all(
      orgs.map(async (org) => {
        try {
          const detRes = await apiClient.post(ENDPOINTS.SALES.PAYMASTER, {
            eventType: 'GET_ORGANIZATION_SUBSCRIPTION_DETAILS',
            organizationId: org.organizationId,
          });
          const detData = detRes.data as any;
          if (detData?.body?.subscriptionValidTill) {
            org.subscriptionValidTill = toEpochMs(detData.body.subscriptionValidTill) || undefined;
          }
        } catch (e) {
          // ignore
        }
        return org;
      })
    );

    return detailedOrgs;
  } catch (err) {
    console.error('Failed to fetch paid organizations from Paymaster:', err);
    return [];
  }
}
