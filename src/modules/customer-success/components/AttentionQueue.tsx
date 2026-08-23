import React from 'react';
import { AccountSummary } from '@/types/dashboard';
import { getSuggestedCsAction, healthToneClasses, moduleLabel } from '../utils/formatters';
import { AlertTriangle, ChevronRight, ClipboardList, Flame } from 'lucide-react';

interface AttentionQueueProps {
  accounts: AccountSummary[];
  onSelectAccount: (account: AccountSummary) => void;
  onShowAllAttention: () => void;
}

export const AttentionQueue: React.FC<AttentionQueueProps> = ({
  accounts,
  onSelectAccount,
  onShowAllAttention,
}) => {
  const priority = accounts
    .filter(
      (a) =>
        a.healthBucket === 'critical' ||
        a.healthBucket === 'at-risk' ||
        (a.openAlertsCritical ?? 0) > 0 ||
        a.healthTrend === 'declining'
    )
    .sort((a, b) => {
      const rank = (x: AccountSummary) => {
        let r = x.healthScore;
        if ((x.openAlertsCritical ?? 0) > 0) r -= 20;
        if (x.healthTrend === 'declining') r -= 10;
        return r;
      };
      return rank(a) - rank(b);
    })
    .slice(0, 5);

  if (priority.length === 0) {
    return (
      <div className="rounded-2xl p-4 flex items-start gap-3 border bg-[#ECFDF5] border-emerald-200 shadow-sm">
        <div className="p-2 rounded-xl shrink-0 bg-emerald-100">
          <ClipboardList className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-800">Today's focus queue looks clear 🎉</h3>
          <p className="text-xs text-emerald-700 mt-0.5">
            No critical, at-risk, or declining accounts right now. Keep nurturing healthy customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl p-4 sm:p-5 border bg-white border-[#E5E7EB] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0" style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.2)' }}>
            <Flame className="w-4 h-4 text-[#d97706]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#000000]">Needs your attention today</h3>
            <p className="text-xs text-[#000000]/70 mt-0.5">
              Highest-priority paid accounts — open one to see what to do next
            </p>
          </div>
        </div>
        <button
          onClick={onShowAllAttention}
          className="text-xs font-bold text-[#1D6FD8] hover:text-[#1565C0] transition-colors self-start sm:self-auto"
        >
          View all needing focus →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {priority.map((account) => {
          const score = Math.round(account.healthScore || 0);
          const isCritical = account.healthBucket === 'critical';
          return (
            <button
              key={account.organizationId}
              type="button"
              onClick={() => onSelectAccount(account)}
              className="text-left p-3.5 rounded-xl border transition-all group hover:scale-[1.02] bg-white border-[#E5E7EB] hover:border-[#1D6FD8] shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#000000] truncate group-hover:text-[#1D6FD8] transition-colors">
                    {account.organizationName || 'Unnamed organization'}
                  </div>
                  <div className="text-[11px] text-[#000000]/60 mt-0.5 truncate">
                    {account.accountNumber || account.countryCode || 'Paid customer'}
                    {account.lastModuleUsed ? ` · ${moduleLabel(account.lastModuleUsed)}` : ''}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                  style={{
                    background: isCritical ? 'rgba(225,29,72,0.1)' : 'rgba(217,119,6,0.1)',
                    borderColor: isCritical ? 'rgba(225,29,72,0.2)' : 'rgba(217,119,6,0.2)',
                    color: isCritical ? '#e11d48' : '#d97706',
                  }}>
                  {score}
                </span>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-[#000000]/80">
                <AlertTriangle className="w-3.5 h-3.5 text-[#d97706] shrink-0 mt-0.5" />
                <span className="leading-snug">{getSuggestedCsAction(account)}</span>
              </div>

              <div className="mt-3 flex items-center justify-end text-[11px] font-bold text-[#1D6FD8] group-hover:text-[#1565C0] transition-colors">
                Open account
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
