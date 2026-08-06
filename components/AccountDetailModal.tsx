import React, { useEffect, useState } from 'react';
import { AccountDetailBody, AccountSummary, ActivityLogItem } from '../shared/types/dashboard';
import { fetchAccountDetail, fetchActivities } from '../client/api/customer-success';
import {
  formatDate,
  formatRelativeTime,
  getSuggestedCsAction,
  healthToneClasses,
  moduleLabel,
  onboardingMilestoneLabel,
} from '../shared/customer-success/formatters';
import {
  X,
  HeartPulse,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Copy,
  Check,
  Zap,
  Activity,
  Clock,
  Globe,
  RefreshCw,
  Award,
  Workflow,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from 'recharts';

interface AccountDetailModalProps {
  accountSummary: AccountSummary | null;
  onClose: () => void;
  onDraftEmail: (orgName: string, orgId: string, healthScore: number) => void;
  customApiKey?: string;
  isPaidPlan?: boolean;
}

type TabId = 'overview' | 'adoption' | 'team' | 'activity' | 'onboarding';

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  accountSummary,
  onClose,
  onDraftEmail,
  customApiKey,
  isPaidPlan,
}) => {
  const [detail, setDetail] = useState<AccountDetailBody | null>(null);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    if (!accountSummary) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);
    setDetail(null);
    setActivities([]);
    setActiveTab('overview');
    setExpandedModule(null);

    Promise.all([
      fetchAccountDetail(accountSummary.organizationId, 30, 14, 14, customApiKey),
      fetchActivities(accountSummary.organizationId, 20, customApiKey),
    ])
      .then(([data, logs]) => {
        if (!mounted) return;
        if (data) setDetail(data);
        else setError('Could not load the full account picture. Showing portfolio snapshot only.');
        setActivities(logs);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load account details');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [accountSummary?.organizationId, customApiKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!accountSummary) return null;

  const healthScore = Math.round(detail?.health?.healthScore ?? accountSummary.healthScore ?? 0);
  const healthBucket = detail?.health?.healthBucket ?? accountSummary.healthBucket ?? 'critical';
  const orgName =
    detail?.profile?.organizationName || accountSummary.organizationName || 'Customer';
  const alertCount = detail?.alerts?.length ?? 0;
  const suggestion = getSuggestedCsAction(accountSummary);

  const handleCopyId = () => {
    navigator.clipboard.writeText(accountSummary.organizationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: Array<{ id: TabId; label: string; badge?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'adoption', label: 'Adoption', badge: detail?.adoption?.modulesUsed?.length },
    { id: 'team', label: 'People' },
    { id: 'activity', label: 'Activity', badge: activities.length || undefined },
    { id: 'onboarding', label: 'Onboarding & alerts', badge: alertCount || undefined },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-3 rounded-xl bg-sky-600 text-white font-extrabold text-xl shadow-md shrink-0">
              {orgName[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 truncate">{orgName}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${healthToneClasses(healthScore)}`}>
                  Health {healthScore}/100 · {healthBucket}
                </span>
                {(isPaidPlan || accountSummary.isPaidPlan) && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-900 border border-amber-300/40">
                    <Zap className="w-3 h-3 fill-amber-500" /> Paid
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-mono flex items-center gap-1">
                  {accountSummary.accountNumber || accountSummary.organizationId}
                  <button onClick={handleCopyId} className="hover:text-slate-800" title="Copy ID">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
                {accountSummary.emailAddress && <span>· {accountSummary.emailAddress}</span>}
                {detail?.profile?.countryCode && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {detail.profile.countryCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onDraftEmail(orgName, accountSummary.organizationId, healthScore)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Draft email
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 bg-amber-50/70 text-xs text-amber-950 flex items-start gap-2 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Suggested next step:</strong> {suggestion}
          </span>
        </div>

        <div className="flex border-b border-slate-200 px-4 bg-white overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
              <p className="text-sm font-medium">Loading account details…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  {error}
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: 'Health score',
                        value: `${healthScore}/100`,
                        sub: `Trend: ${detail?.health?.healthTrend || accountSummary.healthTrend}`,
                      },
                      {
                        label: 'Daily engagement',
                        value: `${Math.round(((detail?.health?.stickinessRatio ?? accountSummary.stickinessRatio) || 0) * 100)}%`,
                        sub: `DAU ${detail?.health?.dau ?? accountSummary.dau} · MAU ${detail?.health?.mau ?? accountSummary.mau}`,
                      },
                      {
                        label: 'Active users (30d)',
                        value: detail?.health?.activeUsers30d ?? accountSummary.mau ?? 0,
                        sub: 'People who used the product',
                      },
                      {
                        label: 'Automations',
                        value: detail?.automation?.activeWorkflowCount ?? accountSummary.activeWorkflowCount ?? 0,
                        sub: detail?.automation
                          ? `${Math.round((detail.automation.failureRate || 0) * 100)}% fail rate`
                          : 'Active workflows',
                      },
                    ].map((card) => (
                      <div key={card.label} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-400 font-semibold block">{card.label}</span>
                        <span className="text-2xl font-bold text-slate-900 mt-1 block">{card.value}</span>
                        <span className="text-[11px] text-slate-500 mt-1 block">{card.sub}</span>
                      </div>
                    ))}
                  </div>

                  {detail?.automation && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                        <Workflow className="w-4 h-4 text-sky-600" />
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Completed runs</div>
                          <div className="text-sm font-bold">{detail.automation.executionsCompleted}</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Failed runs</div>
                          <div className="text-sm font-bold">{detail.automation.executionsFailed}</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold">Last automation</div>
                          <div className="text-sm font-bold">
                            {formatRelativeTime(detail.automation.lastExecutionAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
                        Health history
                      </h4>
                      <div className="h-48">
                        {detail?.healthHistory?.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={detail.healthHistory.map((item) => ({
                                dateStr: formatDate(item.date, { month: 'short', day: 'numeric' }),
                                score: item.healthScore,
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                              <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={11} />
                              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                              <RechartsTooltip />
                              <Line type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={3} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                            No health history yet
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-600" />
                        Activity timeline
                      </h4>
                      <div className="h-48">
                        {detail?.activityTimeline?.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={detail.activityTimeline.map((item) => ({
                                dateStr: formatDate(item.date, { month: 'short', day: 'numeric' }),
                                activityCount: item.activityCount,
                                uniqueUsers: item.uniqueUsers,
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                              <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={11} />
                              <YAxis stroke="#94a3b8" fontSize={11} />
                              <RechartsTooltip />
                              <Bar dataKey="activityCount" fill="#0d9488" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                            No activity timeline yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'adoption' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h4 className="text-sm font-bold text-emerald-900">
                          Adopted ({detail?.adoption?.modulesUsed?.length || 0})
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(detail?.adoption?.modulesUsedLabels?.length
                          ? detail.adoption.modulesUsedLabels
                          : (detail?.adoption?.modulesUsed || accountSummary.modulesUsed || []).map(moduleLabel)
                        ).map((lbl, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            {lbl}
                          </span>
                        ))}
                        {!detail?.adoption?.modulesUsed?.length && !accountSummary.modulesUsed?.length && (
                          <span className="text-xs text-slate-400 italic">None adopted yet</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="w-5 h-5 text-amber-500" />
                        <h4 className="text-sm font-bold text-amber-900">
                          Unused — upsell opportunity ({detail?.adoption?.modulesUnused?.length || 0})
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(detail?.adoption?.modulesUnusedLabels || []).map((lbl, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold">
                            {lbl}
                          </span>
                        ))}
                        {!detail?.adoption?.modulesUnused?.length && (
                          <span className="text-xs text-emerald-700 font-medium">All tracked modules are in use</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {detail?.adoption?.moduleBreakdown?.length ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Module breakdown</h4>
                      {detail.adoption.moduleBreakdown.map((mod) => (
                        <button
                          key={mod.logSource}
                          type="button"
                          onClick={() =>
                            setExpandedModule(expandedModule === mod.logSource ? null : mod.logSource)
                          }
                          className="w-full text-left p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-sky-300"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{mod.label || moduleLabel(mod.logSource)}</span>
                            <span className="text-sky-600 font-mono">
                              {mod.totalActivityCount} actions · last {formatRelativeTime(mod.lastUsedAt)}
                            </span>
                          </div>
                          {expandedModule === mod.logSource && mod.features?.length > 0 && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                              {mod.features.map((feat) => (
                                <div
                                  key={feat.logEvent}
                                  className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200"
                                >
                                  <span>{feat.label || feat.logEvent}</span>
                                  <span className="font-mono font-semibold">{feat.activityCount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-600" />
                      Power users (champions)
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Activity</th>
                            <th className="p-2.5">Modules</th>
                            <th className="p-2.5">Last active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail?.topUsers?.length ? (
                            detail.topUsers.map((user) => (
                              <tr key={user.userId}>
                                <td className="p-2.5 font-bold text-slate-900">{user.userName || user.userId}</td>
                                <td className="p-2.5 font-mono text-sky-600 font-bold">{user.activityCount}</td>
                                <td className="p-2.5">{user.distinctModules}</td>
                                <td className="p-2.5 text-slate-500">{formatRelativeTime(user.lastActivityAt)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                                No power-user data yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Inactive users (14+ days)
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-rose-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-rose-50 text-rose-800 uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Days quiet</th>
                            <th className="p-2.5">Last module</th>
                            <th className="p-2.5">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100">
                          {detail?.inactiveUsers?.length ? (
                            detail.inactiveUsers.map((user) => (
                              <tr key={user.userId}>
                                <td className="p-2.5 font-bold text-slate-900">{user.userName || user.userId}</td>
                                <td className="p-2.5 font-bold text-rose-600">
                                  {user.daysSinceLastActive != null ? `${user.daysSinceLastActive}d` : '—'}
                                </td>
                                <td className="p-2.5 text-slate-500">
                                  {user.lastModuleLabel || moduleLabel(user.lastModuleUsed)}
                                </td>
                                <td className="p-2.5">
                                  <button
                                    onClick={() =>
                                      onDraftEmail(orgName, accountSummary.organizationId, healthScore)
                                    }
                                    className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-semibold hover:bg-rose-200"
                                  >
                                    Nudge
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-emerald-600 font-semibold">
                                No inactive users detected — nice!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Recent product activity for this account (useful before a customer call).
                  </p>
                  {activities.length ? (
                    activities.map((act, idx) => (
                      <div
                        key={act.activityId || idx}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">
                              {act.logEvent || act.logMessage || 'Customer event'}
                            </span>
                            {act.logSource && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-200 text-slate-600 font-medium">
                                {moduleLabel(String(act.logSource))}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 mt-0.5">
                            {act.logDescription || 'Activity recorded in Autopilot'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatRelativeTime(act.createdAt as number | string | null)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      No recent activity logs for this account.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'onboarding' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-sky-600" />
                      Onboarding milestones
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(detail?.onboarding?.milestones || []).map((m) => (
                        <div
                          key={m.milestoneKey}
                          className={`p-3 rounded-lg border flex items-center justify-between ${
                            m.achievedAt
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {m.achievedAt ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold">{onboardingMilestoneLabel(m.milestoneKey)}</span>
                          </div>
                          <span className="text-[11px] font-mono">
                            {m.achievedAt ? `${m.daysToAchieve ?? 1}d to achieve` : 'Pending'}
                          </span>
                        </div>
                      ))}
                      {!detail?.onboarding?.milestones?.length && (
                        <p className="text-xs text-slate-400 italic col-span-2">No onboarding milestones returned.</p>
                      )}
                    </div>
                    {detail?.onboarding?.missingMilestones?.length ? (
                      <p className="text-xs text-amber-800 mt-3">
                        Still missing: {detail.onboarding.missingMilestones.map(onboardingMilestoneLabel).join(', ')}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Open operational alerts
                    </h4>
                    {detail?.alerts?.length ? (
                      <div className="space-y-2">
                        {detail.alerts.map((alert) => (
                          <div
                            key={alert.alertId}
                            className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-rose-900">{alert.ruleName}</span>
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-200 text-rose-800">
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {alert.description || 'Operational warning triggered'}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {alert.firstDetectedAt ? formatDate(alert.firstDetectedAt) : 'Active'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold text-center">
                        No open operational alerts for this account.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Snapshot:{' '}
            {detail?.snapshotDate
              ? formatDate(detail.snapshotDate)
              : detail?.hasSnapshot === false
                ? 'Live computation (no daily snapshot yet)'
                : '—'}
            {detail?.health?.lastActivityAt
              ? ` · Last activity ${formatRelativeTime(detail.health.lastActivityAt)}`
              : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
