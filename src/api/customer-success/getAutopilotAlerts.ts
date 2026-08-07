import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';
import { AutopilotAlertItem } from '@/types/dashboard';

export async function fetchAutopilotAlerts(
  organizationId?: string,
  customApiKey?: string
): Promise<AutopilotAlertItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-custom-apikey'] = customApiKey;
    }

    const res = await apiClient.post(
      ENDPOINTS.CUSTOMER_SUCCESS.AUTOPILOT,
      {
        eventType: 'FETCH_AUTOPILOT_ALERTS',
        ...(organizationId ? { organizationId } : {}),
        pageCount: 20,
        pageNumber: 1,
        status: 'OPEN',
      },
      { headers }
    );

    const data = res.data as any;
    let body = data?.body;

    if (Array.isArray(body)) {
      return body;
    }
    if (body && typeof body === 'object') {
      if ('alerts' in body && Array.isArray(body.alerts)) return body.alerts;
      if ('result' in body && Array.isArray(body.result)) return body.result;
    }
    return [];
  } catch (err) {
    console.warn('Autopilot alerts fetch warning:', err);
    return [];
  }
}
