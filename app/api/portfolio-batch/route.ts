import { NextResponse } from 'next/server';

const AECAUTOPILOT_ENDPOINT = process.env.AECAUTOPILOT_ENDPOINT || 'https://aecautopilot.intoaec.ai';
const PAYMASTER_ENDPOINT = process.env.PAYMASTER_ENDPOINT || 'https://paymaster.aecplayhouse.com';
const DEFAULT_API_KEY = process.env.AECAUTOPILOT_APIKEY || 'tR4hTjS954LxUWtRM720BN9yiUbcRUcSB5o9ZjWNVvXGiPFrLtDKRJvSoPDUIw6M';

function toEpochMs(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function safeJsonParse(raw: string): unknown {
  try {
    const once = JSON.parse(raw);
    if (typeof once === 'string') return JSON.parse(once);
    return once;
  } catch {
    return raw;
  }
}

export async function POST(request: Request) {
  try {
    const customApiKey = request.headers.get('x-custom-apikey');
    const apiKey = customApiKey || DEFAULT_API_KEY;
    const body = await request.json().catch(() => ({}));
    const trendDays = Math.min(90, Math.max(1, Number(body?.trendDays) || 14));

    // Step 1: Attempt GET_PORTFOLIO_ANALYTICS first
    const portfolioRes = await fetch(`${AECAUTOPILOT_ENDPOINT.replace(/\/+$/, '')}/customer-success`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({
        eventType: 'GET_PORTFOLIO_ANALYTICS',
        trendDays,
        useLatestPerOrg: true,
        enrichOrgDetails: true,
      }),
    });
    const portfolioRaw = await portfolioRes.text();
    const portfolioEnv = safeJsonParse(portfolioRaw) as { code?: string; body?: { accounts?: unknown[]; summary?: unknown; dailyTrend?: unknown[]; moduleUsageSummary?: unknown[] } };

    if (
      portfolioRes.ok &&
      portfolioEnv?.body &&
      Array.isArray(portfolioEnv.body.accounts) &&
      portfolioEnv.body.accounts.length > 0
    ) {
      // Normalize string epoch fields and mark as paid (CS portfolio is paid-only)
      const normalizedAccounts = (portfolioEnv.body.accounts as Array<Record<string, unknown>>).map((acc) => ({
        ...acc,
        lastActivityAt: toEpochMs(acc.lastActivityAt),
        snapshotDate: toEpochMs(acc.snapshotDate) ?? Date.now(),
        isPaidPlan: true,
      }));
      return NextResponse.json({
        source: 'portfolio',
        data: { ...portfolioEnv.body, accounts: normalizedAccounts },
      });
    }

    // Step 2: Portfolio is empty — fetch org list from Paymaster
    const paymasterRes = await fetch(`${PAYMASTER_ENDPOINT.replace(/\/+$/, '')}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'GET_ALL_IN_ONE_PLAN_ORGANIZATIONS' }),
    });
    const paymasterRaw = await paymasterRes.text();
    const paymasterEnv = safeJsonParse(paymasterRaw) as {
      body?: { organizationIds?: string[] } | string[] | unknown[];
    };

    let orgIds: string[] = [];
    if (paymasterEnv?.body) {
      if (Array.isArray(paymasterEnv.body)) {
        orgIds = (paymasterEnv.body as Array<string | { organizationId?: string }>)
          .map((item) => (typeof item === 'string' ? item : item?.organizationId ?? ''))
          .filter(Boolean);
      } else if (typeof paymasterEnv.body === 'object' && 'organizationIds' in paymasterEnv.body) {
        const ids = (paymasterEnv.body as { organizationIds?: string[] }).organizationIds;
        if (Array.isArray(ids)) orgIds = ids.filter(Boolean);
      }
    }

    // Deduplicate
    orgIds = [...new Set(orgIds)];

    if (orgIds.length === 0) {
      return NextResponse.json({ source: 'empty', data: null });
    }

    // Step 3: Fetch GET_ACCOUNT_DETAIL for each org in parallel (cap at 20 concurrent)
    const CONCURRENCY = 20;
    const results: Array<{ organizationId: string; detail: Record<string, unknown> | null }> = [];
    for (let i = 0; i < orgIds.length; i += CONCURRENCY) {
      const batch = orgIds.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (orgId) => {
          try {
            const r = await fetch(`${AECAUTOPILOT_ENDPOINT.replace(/\/+$/, '')}/customer-success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', apikey: apiKey },
              body: JSON.stringify({
                eventType: 'GET_ACCOUNT_DETAIL',
                organizationId: orgId,
                days: 30,
                historyDays: 14,
                inactiveThresholdDays: 14,
              }),
            });
            const raw = await r.text();
            const env = safeJsonParse(raw) as { body?: Record<string, unknown> };
            return { organizationId: orgId, detail: env?.body ?? null };
          } catch {
            return { organizationId: orgId, detail: null };
          }
        })
      );
      results.push(...batchResults);
    }

    // Step 4: Synthesise portfolio from account details
    interface DetailShape {
      organizationId?: string;
      profile?: { organizationName?: string | null; accountNumber?: string | null; emailAddress?: string | null; organizationType?: string | null; countryCode?: string | null };
      health?: { healthScore?: number; healthTrend?: string; healthBucket?: string; stickinessRatio?: number; dau?: number; wau?: number; mau?: number; moduleBreadth?: number; automationAdoptionScore?: number; lastActivityAt?: number | null; openAlerts?: { critical?: number; warning?: number; escalated?: number }; riskScore?: number };
      adoption?: {
        modulesUsed?: string[];
        lastModuleUsed?: string | null;
        moduleBreakdown?: Array<{
          logSource: string;
          label: string;
          totalActivityCount: number;
          lastUsedAt: number | null;
          features: Array<{ logEvent: string; label: string; activityCount: number; lastUsedAt: number | null }>;
        }>;
      };
      automation?: { activeWorkflowCount?: number };
      healthHistory?: Array<{ date: number; healthScore: number; stickinessRatio: number; dau: number; mau: number }>;
      snapshotDate?: number | string | null;
    }

    const validAccounts = results
      .filter((r) => r.detail !== null)
      .map((r) => {
        const d = r.detail as DetailShape;
        const h = d.health ?? {};
        const p = d.profile ?? {};
        const a = d.adoption ?? {};
        const auto = d.automation ?? {};
        const lastModule = a.lastModuleUsed ?? a.modulesUsed?.[0] ?? null;
        return {
          organizationId: r.organizationId,
          healthScore: h.healthScore ?? 0,
          healthTrend: h.healthTrend ?? 'stable',
          healthBucket: h.healthBucket ?? 'critical',
          stickinessRatio: h.stickinessRatio ?? 0,
          dau: h.dau ?? 0,
          wau: h.wau ?? 0,
          mau: h.mau ?? 0,
          moduleBreadth: h.moduleBreadth ?? 0,
          automationAdoptionScore: h.automationAdoptionScore ?? 0,
          activeWorkflowCount: auto.activeWorkflowCount ?? 0,
          openAlertsCritical: h.openAlerts?.critical ?? 0,
          openAlertsWarning: h.openAlerts?.warning ?? 0,
          openAlertsEscalated: h.openAlerts?.escalated ?? 0,
          riskScore: h.riskScore ?? 0,
          lastActivityAt: toEpochMs(h.lastActivityAt),
          snapshotDate: toEpochMs(d.snapshotDate) ?? Date.now(),
          modulesUsed: a.modulesUsed ?? [],
          lastModuleUsed: lastModule,
          organizationName: p.organizationName ?? null,
          accountNumber: p.accountNumber ?? null,
          emailAddress: p.emailAddress ?? null,
          organizationType: p.organizationType ?? null,
          countryCode: p.countryCode ?? null,
          isPaidPlan: true,
        };
      })
      .sort((a, b) => a.healthScore - b.healthScore); // worst first

    const totalAccounts = validAccounts.length;
    const avgHealthScore = totalAccounts > 0
      ? Math.round((validAccounts.reduce((s, a) => s + a.healthScore, 0) / totalAccounts) * 10) / 10
      : 0;
    const avgStickiness = totalAccounts > 0
      ? Math.round((validAccounts.reduce((s, a) => s + a.stickinessRatio, 0) / totalAccounts) * 1000) / 1000
      : 0;
    const avgAutomationScore = totalAccounts > 0
      ? Math.round(validAccounts.reduce((s, a) => s + a.automationAdoptionScore, 0) / totalAccounts)
      : 0;
    const avgModuleBreadth = totalAccounts > 0
      ? Math.round((validAccounts.reduce((s, a) => s + a.moduleBreadth, 0) / totalAccounts) * 10) / 10
      : 0;

    const distribution = {
      healthy: validAccounts.filter((a) => a.healthBucket === 'healthy').length,
      atRisk: validAccounts.filter((a) => a.healthBucket === 'at-risk').length,
      critical: validAccounts.filter((a) => a.healthBucket === 'critical').length,
    };
    const trends = {
      improving: validAccounts.filter((a) => a.healthTrend === 'improving').length,
      stable: validAccounts.filter((a) => a.healthTrend === 'stable').length,
      declining: validAccounts.filter((a) => a.healthTrend === 'declining').length,
    };
    const accountsNeedingAttention = distribution.atRisk + distribution.critical;
    const totalCriticalAlerts = validAccounts.reduce((s, a) => s + a.openAlertsCritical, 0);

    // Build module usage summary from account details
    const moduleMap = new Map<string, { label: string; orgCount: number; featureMap: Map<string, { label: string; activityCount: number; orgCount: number }> }>();
    for (const r of results) {
      if (!r.detail) continue;
      const d = r.detail as DetailShape;
      for (const mod of d.adoption?.moduleBreakdown ?? []) {
        if (!moduleMap.has(mod.logSource)) {
          moduleMap.set(mod.logSource, { label: mod.label, orgCount: 0, featureMap: new Map() });
        }
        const entry = moduleMap.get(mod.logSource)!;
        entry.orgCount += 1;
        for (const feat of mod.features ?? []) {
          const fKey = feat.logEvent;
          if (!entry.featureMap.has(fKey)) {
            entry.featureMap.set(fKey, { label: feat.label, activityCount: 0, orgCount: 0 });
          }
          const fe = entry.featureMap.get(fKey)!;
          fe.activityCount += feat.activityCount;
          fe.orgCount += 1;
        }
      }
    }
    const moduleUsageSummary = Array.from(moduleMap.entries()).map(([logSource, entry]) => ({
      logSource,
      label: entry.label,
      orgCount: entry.orgCount,
      topFeatures: Array.from(entry.featureMap.entries())
        .map(([logEvent, f]) => ({ logEvent, label: f.label, activityCount: f.activityCount, orgCount: f.orgCount }))
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, 5),
    })).sort((a, b) => b.orgCount - a.orgCount);

    // Build dailyTrend by aggregating healthHistory across all accounts per date
    interface HealthHistoryEntry { date: number; healthScore: number; stickinessRatio: number; dau: number; mau: number }
    const trendMap = new Map<string, { totalHealth: number; totalStickiness: number; totalDau: number; totalMau: number; count: number; ts: number }>();
    for (const r of results) {
      if (!r.detail) continue;
      const d = r.detail as DetailShape;
      const history: HealthHistoryEntry[] = (d as unknown as { healthHistory?: HealthHistoryEntry[] }).healthHistory ?? [];
      for (const h of history) {
        const ts = toEpochMs(h.date);
        if (!ts) continue;
        const day = new Date(ts);
        const key = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`;
        const existing = trendMap.get(key);
        if (existing) {
          existing.totalHealth += h.healthScore || 0;
          existing.totalStickiness += h.stickinessRatio || 0;
          existing.totalDau += h.dau || 0;
          existing.totalMau += h.mau || 0;
          existing.count += 1;
        } else {
          trendMap.set(key, {
            totalHealth: h.healthScore || 0,
            totalStickiness: h.stickinessRatio || 0,
            totalDau: h.dau || 0,
            totalMau: h.mau || 0,
            count: 1,
            ts,
          });
        }
      }
    }
    const dailyTrend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-trendDays)
      .map(([, v]) => ({
        date: v.ts,
        avgHealthScore: Math.round((v.totalHealth / v.count) * 10) / 10,
        avgStickiness: Math.round((v.totalStickiness / v.count) * 1000) / 1000,
        avgAutomationScore: 0,
        orgCount: v.count,
      }));

    const synthesized = {
      summary: {
        totalAccounts,
        avgHealthScore,
        avgStickiness,
        avgAutomationScore,
        avgModuleBreadth,
        accountsNeedingAttention,
        churnRiskOrgs: validAccounts.filter((a) => {
          const last = toEpochMs(a.lastActivityAt);
          return last === null || Date.now() - last > 14 * 86400000;
        }).length,
        totalCriticalAlerts,
        distribution,
        trends,
      },
      dailyTrend,
      moduleUsageSummary,
      accounts: validAccounts,
    };

    return NextResponse.json({ source: 'batch', data: synthesized });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error in portfolio-batch:', msg);
    return NextResponse.json({ error: 'Portfolio batch failed', details: msg }, { status: 500 });
  }
}
