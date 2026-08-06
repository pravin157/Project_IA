import { AccountSummary } from '../types/dashboard';

/** Product module display labels (AECAutopilot logSource keys). */
export const MODULE_LABELS: Record<string, string> = {
  INDENT: 'Indent',
  RFQ: 'RFQ',
  PO: 'Purchase Order',
  WO: 'Work Order',
  TASK: 'Tasks',
  SCHEDULE: 'Schedule',
  LEAD_MANAGER: 'Lead Manager',
  USERHUB: 'User Hub',
  AUTOMATION: 'Automation',
  AEC_AUTOPILOT: 'Autopilot',
  PROCUREMENT: 'Procurement',
  PROPOSAL: 'Proposals',
  QUESTIONNAIRE: 'Questionnaire',
};

export function moduleLabel(key: string | null | undefined): string {
  if (!key) return '—';
  return MODULE_LABELS[key] ?? key.replace(/_/g, ' ');
}

/** API often returns epoch ms as strings — normalize for Date math. */
export function toEpochMs(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function formatRelativeTime(value: number | string | null | undefined): string {
  const epochMs = toEpochMs(value);
  if (!epochMs) return 'No recent activity';
  const diffMs = Date.now() - epochMs;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 0) return 'Just now';
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} mo ago`;
  return new Date(epochMs).toLocaleDateString();
}

export function formatDate(value: number | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  const epochMs = toEpochMs(value);
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString(undefined, opts ?? { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(value: number | string | null | undefined): string {
  const epochMs = toEpochMs(value);
  if (!epochMs) return '—';
  const d = new Date(epochMs);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function healthBucketFromScore(score: number): 'healthy' | 'at-risk' | 'critical' {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'at-risk';
  return 'critical';
}

export function healthBucketLabel(bucket: string): string {
  switch (bucket) {
    case 'healthy':
      return 'Healthy';
    case 'at-risk':
      return 'At risk';
    case 'critical':
      return 'Critical';
    default:
      return bucket;
  }
}

export function healthToneClasses(scoreOrBucket: number | string): string {
  const bucket =
    typeof scoreOrBucket === 'number' ? healthBucketFromScore(scoreOrBucket) : scoreOrBucket;
  if (bucket === 'healthy') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300/50';
  }
  if (bucket === 'at-risk') {
    return 'bg-amber-100 text-amber-800 border-amber-300/50';
  }
  return 'bg-rose-100 text-rose-800 border-rose-300/50';
}

/** One clear next step a CS owner can take. */
export function getSuggestedCsAction(account: AccountSummary): string {
  const lastActive = toEpochMs(account.lastActivityAt);
  const inactive =
    !lastActive || Date.now() - lastActive > 14 * 24 * 60 * 60 * 1000;

  if ((account.openAlertsCritical ?? 0) > 0) {
    return 'Review open critical alerts with the customer today';
  }
  if (account.healthBucket === 'critical') {
    return 'Book a health-review call this week';
  }
  if (account.healthTrend === 'declining') {
    return 'Check in — health score is declining';
  }
  if (inactive) {
    return 'Re-engage — little or no activity in 14+ days';
  }
  if ((account.modulesUsed?.length ?? 0) < 3) {
    return 'Offer a short walkthrough to grow module adoption';
  }
  if (account.healthBucket === 'at-risk') {
    return 'Monitor weekly and offer help on unused modules';
  }
  return 'Keep the relationship warm — account looks healthy';
}

export function onboardingMilestoneLabel(key: string): string {
  switch (key) {
    case 'FIRST_LOGIN':
      return 'First team login';
    case 'FIRST_WORKFLOW_PUBLISHED':
      return 'First published workflow';
    case 'FIRST_PO_ACCEPTED':
      return 'First purchase order accepted';
    case 'FIRST_AUTOMATION_EXECUTION':
      return 'First automation run';
    default:
      return key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
