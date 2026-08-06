import React, { useMemo, useState } from 'react';
import { AccountSummary, DashboardFilter, PaymasterOrganization } from '../shared/types/dashboard';
import {
  formatRelativeTime,
  getSuggestedCsAction,
  healthToneClasses,
  moduleLabel,
} from '../shared/customer-success/formatters';
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Zap,
  Mail,
  Copy,
  Check,
  Building,
  HeartPulse,
} from 'lucide-react';

interface AccountsTableProps {
  accounts: AccountSummary[];
  filter: DashboardFilter;
  onFilterChange: (updated: Partial<DashboardFilter>) => void;
  onSelectAccount: (account: AccountSummary) => void;
  onDraftEmailForAccount: (account: AccountSummary) => void;
  paidOrgsMap: Map<string, PaymasterOrganization>;
}

const CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
  border: '1px solid rgba(51,65,85,0.6)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

export const AccountsTable: React.FC<AccountsTableProps> = ({
  accounts,
  filter,
  onFilterChange,
  onSelectAccount,
  onDraftEmailForAccount,
  paidOrgsMap,
}) => {
  const [sortField, setSortField] = useState<'healthScore' | 'organizationName' | 'lastActivityAt' | 'riskScore'>('healthScore');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const countries = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => { if (a.countryCode) set.add(a.countryCode); });
    return Array.from(set).sort();
  }, [accounts]);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (filter.onlyPaidOrgs && paidOrgsMap.size > 0) {
      const isPaid = paidOrgsMap.has(acc.organizationId) || Boolean(acc.isPaidPlan);
      if (!isPaid) return false;
    }
    if (filter.healthBucket === 'attention') {
      if (acc.healthBucket !== 'at-risk' && acc.healthBucket !== 'critical') return false;
    } else if (filter.healthBucket !== 'all' && acc.healthBucket !== filter.healthBucket) {
      return false;
    }
    if (filter.healthTrend !== 'all' && acc.healthTrend !== filter.healthTrend) return false;
    if (filter.countryFilter && (acc.countryCode || '') !== filter.countryFilter) return false;
    if (filter.moduleFilter !== 'all' && filter.moduleFilter) {
      if (!(acc.modulesUsed || []).includes(filter.moduleFilter)) return false;
    }
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      const name = (acc.organizationName || '').toLowerCase();
      const id = acc.organizationId.toLowerCase();
      const email = (acc.emailAddress || '').toLowerCase();
      const number = (acc.accountNumber || '').toLowerCase();
      if (!name.includes(q) && !id.includes(q) && !email.includes(q) && !number.includes(q)) return false;
    }
    return true;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    let valA: string | number = a[sortField] as string | number;
    let valB: string | number = b[sortField] as string | number;
    if (sortField === 'organizationName') {
      valA = (a.organizationName || a.organizationId).toLowerCase();
      valB = (b.organizationName || b.organizationId).toLowerCase();
    } else if (sortField === 'lastActivityAt') {
      valA = a.lastActivityAt || 0;
      valB = b.lastActivityAt || 0;
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'healthScore' | 'organizationName' | 'lastActivityAt' | 'riskScore') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === 'organizationName'); }
  };

  const bucketCounts = {
    all: accounts.length,
    healthy: accounts.filter((a) => a.healthBucket === 'healthy').length,
    atRisk: accounts.filter((a) => a.healthBucket === 'at-risk').length,
    critical: accounts.filter((a) => a.healthBucket === 'critical').length,
    attention: accounts.filter((a) => a.healthBucket === 'at-risk' || a.healthBucket === 'critical').length,
  };

  const pills = [
    { id: 'all' as const, label: `All (${bucketCounts.all})`, activeColor: '#0ea5e9', activeBg: 'rgba(14,165,233,0.15)' },
    { id: 'attention' as const, label: `Focus (${bucketCounts.attention})`, activeColor: '#f59e0b', activeBg: 'rgba(245,158,11,0.15)' },
    { id: 'healthy' as const, label: `Healthy (${bucketCounts.healthy})`, activeColor: '#10b981', activeBg: 'rgba(16,185,129,0.15)' },
    { id: 'at-risk' as const, label: `At risk (${bucketCounts.atRisk})`, activeColor: '#f59e0b', activeBg: 'rgba(245,158,11,0.15)' },
    { id: 'critical' as const, label: `Critical (${bucketCounts.critical})`, activeColor: '#f43f5e', activeBg: 'rgba(244,63,94,0.15)' },
  ] as const;

  return (
    <div style={CARD_STYLE} className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(14,165,233,0.1)' }}>
                <Building className="w-4 h-4 text-sky-400" />
              </div>
              <h2 className="text-base font-bold text-slate-100">Customer accounts</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-8">
              Showing <strong className="text-slate-300">{sortedAccounts.length}</strong> of {accounts.length} · click a row for the full account picture
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filter.healthTrend}
              onChange={(e) => onFilterChange({ healthTrend: e.target.value as DashboardFilter['healthTrend'] })}
              className="text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
              style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.8)' }}
            >
              <option value="all">All trends</option>
              <option value="improving">Improving</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>

            {countries.length > 0 && (
              <select
                value={filter.countryFilter}
                onChange={(e) => onFilterChange({ countryFilter: e.target.value })}
                className="text-xs rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none"
                style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.8)' }}
              >
                <option value="">All countries</option>
                {countries.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-xl w-fit"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.4)' }}>
          {pills.map((pill) => {
            const isActive = filter.healthBucket === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => onFilterChange({ healthBucket: pill.id })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={isActive
                  ? { background: pill.activeBg, color: pill.activeColor, border: `1px solid ${pill.activeColor}33` }
                  : { color: '#64748b', border: '1px solid transparent' }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-400">
          <thead className="text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800"
            style={{ background: 'rgba(15,23,42,0.6)', color: '#64748b' }}>
            <tr>
              <th onClick={() => handleSort('organizationName')} className="py-3 px-4 cursor-pointer hover:text-slate-300 transition-colors">
                <div className="flex items-center gap-1">Customer <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => handleSort('healthScore')} className="py-3 px-4 cursor-pointer hover:text-slate-300 transition-colors">
                <div className="flex items-center gap-1">Health <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="py-3 px-4">Engagement</th>
              <th className="py-3 px-4">Modules</th>
              <th className="py-3 px-4">Suggested next step</th>
              <th onClick={() => handleSort('lastActivityAt')} className="py-3 px-4 cursor-pointer hover:text-slate-300 transition-colors">
                <div className="flex items-center gap-1">Last active <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedAccounts.length > 0 ? (
              sortedAccounts.map((account) => {
                const paidOrg = paidOrgsMap.get(account.organizationId);
                const isPaid = paidOrgsMap.size === 0 || paidOrg != null || account.isPaidPlan;
                const healthScore = Math.round(account.healthScore || 0);

                return (
                  <tr
                    key={account.organizationId}
                    onClick={() => onSelectAccount(account)}
                    className="border-b border-slate-800/60 transition-all cursor-pointer group"
                    style={{ borderBottomColor: 'rgba(51,65,85,0.3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,165,233,0.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 text-white"
                          style={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)' }}>
                          {(account.organizationName || 'O')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-200 group-hover:text-sky-300 transition-colors text-[13px]">
                              {account.organizationName || 'Unnamed organization'}
                            </span>
                            {isPaid && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-md"
                                style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                                <Zap className="w-2.5 h-2.5 fill-amber-400" /> Paid
                              </span>
                            )}
                            {account.countryCode && (
                              <span className="text-[10px] font-semibold text-slate-600">{account.countryCode}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-600 font-mono text-[11px]">
                            <span className="truncate max-w-[140px]">{account.accountNumber || account.organizationId}</span>
                            <button
                              onClick={(e) => handleCopyId(e, account.organizationId)}
                              title="Copy organization ID"
                              className="p-0.5 hover:text-slate-300 transition-colors"
                            >
                              {copiedId === account.organizationId ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {paidOrg?.subscriptionValidTill && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 bg-slate-800/50 w-fit px-2 py-0.5 rounded-md border border-slate-700/50">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }}></span>
                              <span>Renews {new Date(paidOrg.subscriptionValidTill).toLocaleDateString()}</span>
                              <span className="opacity-70 border-l border-slate-600 pl-1.5 ml-0.5">
                                {Math.ceil((paidOrg.subscriptionValidTill - Date.now()) / 86400000)} days left
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Health */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border"
                          style={{
                            background: healthScore >= 70 ? 'rgba(16,185,129,0.1)' : healthScore >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
                            borderColor: healthScore >= 70 ? 'rgba(16,185,129,0.35)' : healthScore >= 40 ? 'rgba(245,158,11,0.35)' : 'rgba(244,63,94,0.35)',
                            color: healthScore >= 70 ? '#34d399' : healthScore >= 40 ? '#fbbf24' : '#f87171',
                          }}>
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>{healthScore}</span>
                        </div>
                        {account.healthTrend === 'improving' ? (
                          <span title="Improving"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /></span>
                        ) : account.healthTrend === 'declining' ? (
                          <span title="Declining"><TrendingDown className="w-3.5 h-3.5 text-rose-400" /></span>
                        ) : (
                          <span title="Stable"><Minus className="w-3.5 h-3.5 text-slate-600" /></span>
                        )}
                        {(account.openAlertsCritical ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-0.5"
                            style={{ background: 'rgba(244,63,94,0.12)', color: '#f87171', border: '1px solid rgba(244,63,94,0.25)' }}>
                            <AlertTriangle className="w-3 h-3" />
                            {account.openAlertsCritical}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Engagement */}
                    <td className="py-3.5 px-4">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="font-semibold text-slate-300">{Math.round((account.stickinessRatio || 0) * 100)}%</span>
                          <span className="text-slate-600">DAU {account.dau || 0}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(Math.round((account.stickinessRatio || 0) * 100), 100)}%`,
                              background: 'linear-gradient(90deg, #0ea5e9, #0d9488)',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Modules */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {account.modulesUsed?.length ? (
                          account.modulesUsed.slice(0, 3).map((mod) => (
                            <span key={mod} className="px-1.5 py-0.5 text-[10px] font-medium rounded-md"
                              style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.5)' }}>
                              {moduleLabel(mod)}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-[11px] italic">No modules yet</span>
                        )}
                        {(account.modulesUsed?.length || 0) > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md"
                            style={{ background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)' }}>
                            +{account.modulesUsed.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Suggested action */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <span className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {getSuggestedCsAction(account)}
                      </span>
                    </td>

                    {/* Last active */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {formatRelativeTime(account.lastActivityAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDraftEmailForAccount(account)}
                          title="Draft a check-in email"
                          className="p-1.5 rounded-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(14,165,233,0.08)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.15)' }}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectAccount(account)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all hover:scale-105"
                          style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.6)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,165,233,0.8)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                          Open
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-2xl" style={{ background: 'rgba(30,41,59,0.5)' }}>
                      <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No accounts match these filters</p>
                    <button
                      onClick={() => onFilterChange({ healthBucket: 'all', healthTrend: 'all', countryFilter: '', moduleFilter: 'all', searchQuery: '' })}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
