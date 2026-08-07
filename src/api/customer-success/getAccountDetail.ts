import { apiClient } from '../common/apiClient';
import { ENDPOINTS } from '../common/endpoints';
import { AccountDetailBody } from '@/types/dashboard';
import { toEpochMs } from '@/modules/customer-success/utils/formatters';

function normalizeAccountDetail(body: AccountDetailBody): AccountDetailBody {
  return {
    ...body,
    snapshotDate: toEpochMs(body.snapshotDate),
    health: {
      ...body.health,
      lastActivityAt: toEpochMs(body.health?.lastActivityAt),
    },
    automation: {
      ...body.automation,
      lastExecutionAt: toEpochMs(body.automation?.lastExecutionAt),
    },
    healthHistory: (body.healthHistory || []).map((h) => ({
      ...h,
      date: toEpochMs(h.date) ?? 0,
    })),
    activityTimeline: (body.activityTimeline || []).map((a) => ({
      ...a,
      date: toEpochMs(a.date) ?? 0,
    })),
    topUsers: (body.topUsers || []).map((u) => ({
      ...u,
      lastActivityAt: toEpochMs(u.lastActivityAt),
    })),
    inactiveUsers: (body.inactiveUsers || []).map((u) => ({
      ...u,
      lastActivityAt: toEpochMs(u.lastActivityAt),
    })),
    onboarding: {
      ...body.onboarding,
      milestones: (body.onboarding?.milestones || []).map((m) => ({
        ...m,
        achievedAt: toEpochMs(m.achievedAt),
      })),
    },
    alerts: (body.alerts || []).map((a) => ({
      ...a,
      firstDetectedAt: toEpochMs(a.firstDetectedAt),
    })),
    adoption: {
      ...body.adoption,
      moduleActivity: (body.adoption?.moduleActivity || []).map((m) => ({
        ...m,
        lastUsedAt: toEpochMs(m.lastUsedAt),
      })),
      moduleBreakdown: (body.adoption?.moduleBreakdown || []).map((m) => ({
        ...m,
        lastUsedAt: toEpochMs(m.lastUsedAt),
        features: (m.features || []).map((f) => ({
          ...f,
          lastUsedAt: toEpochMs(f.lastUsedAt),
        })),
      })),
    },
  };
}

export async function fetchAccountDetail(
  organizationId: string,
  days: number = 30,
  historyDays: number = 14,
  inactiveThresholdDays: number = 14,
  customApiKey?: string
): Promise<AccountDetailBody | null> {
  const headers: Record<string, string> = {};
  if (customApiKey) {
    headers['x-custom-apikey'] = customApiKey;
  }

  const res = await apiClient.post(
    ENDPOINTS.CUSTOMER_SUCCESS.DRILLDOWN,
    {
      eventType: 'GET_ACCOUNT_DETAIL',
      organizationId,
      days,
      historyDays,
      inactiveThresholdDays,
    },
    { headers }
  );

  const data = res.data as any;
  if (data && data.body && typeof data.body === 'object') {
    return normalizeAccountDetail(data.body);
  }
  return null;
}
