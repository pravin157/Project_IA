import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';

/**
 * Fetch organization details by AEC Account ID.
 * Calls: POST /api/session → { eventType: "GET_ORGANIZATION_BY_ACCOUNT_ID", accountId, aecId }
 * The /api/session proxy handles failover: localhost:9091/session → userhub.aecplayhouse.com/session
 */
export async function getOrganizationByAccountIdApi(accountId: string): Promise<any> {
  const response = await apiClient.post(ENDPOINTS.SALES.SESSION, {
    eventType: 'GET_ORGANIZATION_BY_ACCOUNT_ID',
    accountId: accountId,
    aecId: accountId,
  });

  return response.data;
}
