// Types for Customer Success Dashboard (AECAutopilot + Paymaster)

// Types shared by client components and route handlers.
export interface PaymasterOrganization {
  organizationId: string;
  organizationName?: string;
  planName?: string;
  status?: string;
  subscribedAt?: number;
  subscriptionValidTill?: number;
  [key: string]: unknown;
}

export interface PaymasterResponse {
  code?: string;
  message?: string;
  body?: PaymasterOrganization[] | Record<string, unknown>;
  [key: string]: unknown;
}

export interface PortfolioSummary {
  totalAccounts: number;
  avgHealthScore: number;
  avgStickiness: number;
  avgAutomationScore: number;
  avgModuleBreadth: number;
  accountsNeedingAttention: number;
  churnRiskOrgs: number;
  totalCriticalAlerts: number;
  distribution: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
  trends: {
    improving: number;
    stable: number;
    declining: number;
  };
}

export interface DailyTrendItem {
  date: number;
  avgHealthScore: number;
  avgStickiness: number;
  avgAutomationScore: number;
  orgCount: number;
}

export interface FeatureUsage {
  logEvent: string;
  label: string;
  activityCount: number;
  orgCount: number;
}

export interface ModuleUsageSummaryItem {
  logSource: string;
  label: string;
  orgCount: number;
  topFeatures: FeatureUsage[];
}

export interface AccountSummary {
  organizationId: string;
  healthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining' | string;
  healthBucket: 'healthy' | 'at-risk' | 'critical';
  stickinessRatio: number;
  dau: number;
  wau: number;
  mau: number;
  moduleBreadth: number;
  automationAdoptionScore: number;
  activeWorkflowCount: number;
  openAlertsCritical: number;
  openAlertsWarning: number;
  openAlertsEscalated: number;
  riskScore: number;
  lastActivityAt: number | null;
  snapshotDate: number;
  modulesUsed: string[];
  lastModuleUsed: string | null;
  organizationName?: string | null;
  accountNumber?: string | null;
  emailAddress?: string | null;
  organizationType?: string | null;
  countryCode?: string | null;
  isPaidPlan?: boolean;
}

export interface PortfolioAnalyticsBody {
  summary: PortfolioSummary;
  dailyTrend: DailyTrendItem[];
  moduleUsageSummary: ModuleUsageSummaryItem[];
  accounts: AccountSummary[];
}

export interface AccountDetailBody {
  organizationId: string;
  profile: {
    organizationId: string;
    organizationName: string | null;
    accountNumber: string | null;
    emailAddress: string | null;
    organizationType: string | null;
    countryCode: string | null;
    subscription: Record<string, unknown> | null;
  };
  hasSnapshot: boolean;
  snapshotDate: number | null;
  health: {
    healthScore: number;
    healthTrend: string;
    healthBucket: 'healthy' | 'at-risk' | 'critical';
    riskScore: number;
    stickinessRatio: number;
    dau: number;
    wau: number;
    mau: number;
    activeUsers30d: number;
    moduleBreadth: number;
    automationAdoptionScore: number;
    lastActivityAt: number | null;
    openAlerts: {
      critical: number;
      warning: number;
      escalated: number;
    };
  };
  adoption: {
    modulesUsed: string[];
    modulesUsedLabels: string[];
    modulesUnused: string[];
    modulesUnusedLabels: string[];
    lastModuleUsed: string | null;
    lastModuleUsedLabel: string | null;
    moduleActivity: Array<{
      logSource: string;
      label: string;
      activityCount: number;
      lastUsedAt: number | null;
    }>;
    moduleBreakdown: Array<{
      logSource: string;
      label: string;
      totalActivityCount: number;
      lastUsedAt: number | null;
      features: Array<{
        logEvent: string;
        label: string;
        activityCount: number;
        lastUsedAt: number | null;
      }>;
    }>;
  };
  automation: {
    activeWorkflowCount: number;
    executionsCompleted: number;
    executionsFailed: number;
    failureRate: number;
    lastExecutionAt: number | null;
  };
  healthHistory: Array<{
    date: number;
    healthScore: number;
    stickinessRatio: number;
    dau: number;
    mau: number;
    source?: 'snapshot' | 'computed';
  }>;
  activityTimeline: Array<{
    date: number;
    activityCount: number;
    uniqueUsers: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    activityCount: number;
    distinctModules: number;
    lastActivityAt: number | null;
    lastModuleUsed?: string | null;
    lastModuleLabel?: string | null;
  }>;
  inactiveUsers: Array<{
    userId: string;
    userName: string;
    lastActivityAt: number | null;
    daysSinceLastActive: number | null;
    lastModuleUsed?: string | null;
    lastModuleLabel?: string | null;
  }>;
  onboarding: {
    milestones: Array<{
      milestoneKey: string;
      achievedAt: number | null;
      daysToAchieve: number | null;
    }>;
    missingMilestones: string[];
  };
  alerts: Array<{
    alertId: string;
    ruleName: string;
    severity: string;
    description: string | null;
    firstDetectedAt: number | null;
    entityType: string | null;
  }>;
}

export interface ActivityLogItem {
  activityId: string;
  userId?: string;
  organizationId?: string;
  logEvent?: string;
  logMessage?: string;
  logDescription?: string;
  logType?: string;
  logSource?: string;
  createdBy?: string;
  createdAt?: number;
  [key: string]: unknown;
}

export interface AutopilotAlertItem {
  alertId: string;
  ruleName: string;
  severity: 'WARNING' | 'ALERT' | 'ESCALATED' | string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED' | string;
  alertDescription?: string | null;
  firstDetectedAt?: number | null;
  organizationId?: string;
  entityType?: string | null;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  code: string;
  message: string;
  body: T;
  error?: string;
}

export type HealthBucketFilter = 'all' | 'healthy' | 'at-risk' | 'critical' | 'attention';

export interface DashboardFilter {
  searchQuery: string;
  healthBucket: HealthBucketFilter;
  healthTrend: 'all' | 'improving' | 'stable' | 'declining';
  onlyPaidOrgs: boolean;
  moduleFilter: string;
  countryFilter: string;
}
