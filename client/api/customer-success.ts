// Browser-facing API client for Customer Success screens.
import {
  ApiEnvelope,
  PortfolioAnalyticsBody,
  AccountDetailBody,
  AccountSummary,
  PaymasterOrganization,
  ActivityLogItem,
  AutopilotAlertItem,
} from '../../shared/types/dashboard';
import { toEpochMs } from '../../shared/customer-success/formatters';

const BASE_URL = '/api';

export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

/**
 * Utility to safely unwrap JSON string / double-encoded strings
 */
function parseEnvelope<T>(raw: unknown): ApiEnvelope<T> {
  let parsed = raw;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      // keep raw
    }
  }
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      // ignore
    }
  }

  if (parsed && typeof parsed === 'object') {
    return parsed as ApiEnvelope<T>;
  }

  return {
    code: 'PARSED_RESPONSE',
    message: 'Raw response',
    body: parsed as T,
  };
}

function authHeaders(customApiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customApiKey) {
    headers['x-custom-apikey'] = customApiKey;
  }
  return headers;
}

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

/**
 * Call Paymaster to get all paid All-In-One Plan organizations first
 */
export async function fetchPaidOrganizations(): Promise<PaymasterOrganization[]> {
  try {
    const res = await fetch(`${BASE_URL}/paymaster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS',
      }),
    });

    if (!res.ok) {
      console.warn('Paymaster API warning:', res.statusText);
      return [];
    }

    const text = await res.text();
    const env = parseEnvelope<
      | { organizationIds?: string[] }
      | PaymasterOrganization[]
      | string[]
    >(text);

    let orgs: PaymasterOrganization[] = [];

    if (env.body && !Array.isArray(env.body) && typeof env.body === 'object' && 'organizationIds' in env.body) {
      const ids = (env.body as { organizationIds?: string[] }).organizationIds ?? [];
      orgs = ids.filter(Boolean).map((id) => ({ organizationId: id }));
    } else if (Array.isArray(env.body)) {
      orgs = (env.body as Array<string | PaymasterOrganization>).map((item) =>
        typeof item === 'string' ? { organizationId: item } : item
      );
    }

    // Fetch subscription details in parallel
    const detailedOrgs = await Promise.all(
      orgs.map(async (org) => {
        try {
          const detRes = await fetch(`${BASE_URL}/paymaster`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'GET_ORGANIZATION_SUBSCRIPTION_DETAILS',
              organizationId: org.organizationId,
            }),
          });
          if (detRes.ok) {
            const detText = await detRes.text();
            const detEnv = parseEnvelope<{ subscriptionValidTill?: string | number }>(detText);
            if (detEnv.body?.subscriptionValidTill) {
              org.subscriptionValidTill = toEpochMs(detEnv.body.subscriptionValidTill) || undefined;
            }
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

/**
 * Fetch main portfolio analytics for CS team via smart BFF batch route.
 */
export async function fetchPortfolioAnalytics(
  _trendDays: number = 14,
  _useLatestPerOrg: boolean = true,
  _enrichOrgDetails: boolean = true,
  customApiKey?: string
): Promise<PortfolioAnalyticsBody | null> {
  const res = await fetch(`${BASE_URL}/portfolio-batch`, {
    method: 'POST',
    headers: authHeaders(customApiKey),
    body: JSON.stringify({ trendDays: _trendDays }),
  });

  const text = await res.text();
  let json: { source?: string; data?: PortfolioAnalyticsBody | null; error?: string; details?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiClientError(
      `Portfolio service returned an unexpected response (${res.status}).`,
      res.status
    );
  }

  if (!res.ok) {
    throw new ApiClientError(
      json.error || json.details || `Could not load portfolio (HTTP ${res.status}).`,
      res.status
    );
  }

  if (json.data && Array.isArray(json.data.accounts)) {
    console.log(
      `[CS Dashboard] Portfolio loaded via "${json.source}" — ${json.data.accounts.length} accounts`
    );
    return normalizePortfolio(json.data);
  }

  return null;
}

/**
 * Fetch comprehensive single account drill-down details
 */
export async function fetchAccountDetail(
  organizationId: string,
  days: number = 30,
  historyDays: number = 14,
  inactiveThresholdDays: number = 14,
  customApiKey?: string
): Promise<AccountDetailBody | null> {
  const res = await fetch(`${BASE_URL}/customer-success`, {
    method: 'POST',
    headers: authHeaders(customApiKey),
    body: JSON.stringify({
      eventType: 'GET_ACCOUNT_DETAIL',
      organizationId,
      days,
      historyDays,
      inactiveThresholdDays,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = `Could not load account details (HTTP ${res.status}).`;
    try {
      const env = parseEnvelope<{ error?: string }>(text);
      if (env.error || env.message) msg = env.error || env.message;
    } catch {
      // keep default
    }
    throw new ApiClientError(msg, res.status);
  }

  const env = parseEnvelope<AccountDetailBody>(text);
  if (env.body && typeof env.body === 'object') {
    return normalizeAccountDetail(env.body);
  }
  return null;
}

/**
 * Fetch recent activity feed for CS audit
 */
export async function fetchActivities(
  organizationId?: string,
  rowsPerPage: number = 15,
  customApiKey?: string
): Promise<ActivityLogItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/activities`, {
      method: 'POST',
      headers: authHeaders(customApiKey),
      body: JSON.stringify({
        eventType: 'FETCH_ACTIVITY_LOG',
        ...(organizationId ? { organizationId } : {}),
        rowsPerPage,
        page: 1,
        sortDirection: 'DESC',
      }),
    });

    if (!res.ok) return [];

    const text = await res.text();
    const env = parseEnvelope<{ result?: ActivityLogItem[] } | ActivityLogItem[]>(text);

    let rows: ActivityLogItem[] = [];
    if (Array.isArray(env.body)) {
      rows = env.body;
    } else if (env.body && 'result' in env.body && Array.isArray(env.body.result)) {
      rows = env.body.result;
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

/**
 * Fetch operational alerts
 */
export async function fetchAutopilotAlerts(
  organizationId?: string,
  customApiKey?: string
): Promise<AutopilotAlertItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/autopilot`, {
      method: 'POST',
      headers: authHeaders(customApiKey),
      body: JSON.stringify({
        eventType: 'FETCH_AUTOPILOT_ALERTS',
        ...(organizationId ? { organizationId } : {}),
        pageCount: 20,
        pageNumber: 1,
        status: 'OPEN',
      }),
    });

    if (!res.ok) return [];

    const text = await res.text();
    const env = parseEnvelope<{ alerts?: AutopilotAlertItem[]; result?: AutopilotAlertItem[] } | AutopilotAlertItem[]>(text);

    if (Array.isArray(env.body)) {
      return env.body;
    }
    if (env.body && typeof env.body === 'object') {
      if ('alerts' in env.body && Array.isArray(env.body.alerts)) return env.body.alerts;
      if ('result' in env.body && Array.isArray(env.body.result)) return env.body.result;
    }
    return [];
  } catch (err) {
    console.warn('Autopilot alerts fetch warning:', err);
    return [];
  }
}
