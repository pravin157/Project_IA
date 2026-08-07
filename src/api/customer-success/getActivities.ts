import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';
import { ActivityLogItem } from '@/types/dashboard';
import { toEpochMs } from '@/modules/customer-success/utils/formatters';

export async function fetchActivities(
  organizationId?: string,
  rowsPerPage: number = 15,
  customApiKey?: string
): Promise<ActivityLogItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-custom-apikey'] = customApiKey;
    }

    const res = await apiClient.post(
      ENDPOINTS.CUSTOMER_SUCCESS.ACTIVITIES,
      {
        eventType: 'FETCH_ACTIVITY_LOG',
        ...(organizationId ? { organizationId } : {}),
        rowsPerPage,
        page: 1,
        sortDirection: 'DESC',
      },
      { headers }
    );

    const data = res.data as any;
    let rows: ActivityLogItem[] = [];
    
    let body = data?.body;
    if (Array.isArray(body)) {
      rows = body;
    } else if (body && 'result' in body && Array.isArray(body.result)) {
      rows = body.result;
    }

    return rows.map((act) => ({
      ...act,
      createdAt: toEpochMs(act.createdAt as number | string | null) ?? undefined,
    }));
  } catch (err) {
    console.warn('Activities log fetch warning:', err);
    return [];
  }
}
