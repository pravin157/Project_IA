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
      <div className="rounded-2xl p-4 flex items-start gap-3 border"
        style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
        <div className="p-2 rounded-xl shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <ClipboardList className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-emerald-300">Today's focus queue looks clear 🎉</h3>
          <p className="text-xs text-emerald-500/80 mt-0.5">
            No critical, at-risk, or declining accounts right now. Keep nurturing healthy customers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl p-4 sm:p-5 border"
      style={{
        background: 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.95) 100%)',
        borderColor: 'rgba(245,158,11,0.2)',
        boxShadow: '0 0 0 1px rgba(245,158,11,0.05), 0 4px 24px rgba(0,0,0,0.3)',
      }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Needs your attention today</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Highest-priority paid accounts — open one to see what to do next
            </p>
          </div>
        </div>
        <button
          onClick={onShowAllAttention}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors self-start sm:self-auto"
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
              className="text-left p-3.5 rounded-xl border transition-all group hover:scale-[1.02]"
              style={{
                background: 'rgba(15,23,42,0.8)',
                borderColor: isCritical ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = isCritical ? 'rgba(244,63,94,0.6)' : 'rgba(245,158,11,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = isCritical ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)'; }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-100 truncate group-hover:text-sky-300 transition-colors">
                    {account.organizationName || 'Unnamed organization'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {account.accountNumber || account.countryCode || 'Paid customer'}
                    {account.lastModuleUsed ? ` · ${moduleLabel(account.lastModuleUsed)}` : ''}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                  style={{
                    background: isCritical ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
                    borderColor: isCritical ? 'rgba(244,63,94,0.35)' : 'rgba(245,158,11,0.35)',
                    color: isCritical ? '#f87171' : '#fbbf24',
                  }}>
                  {score}
                </span>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-400">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{getSuggestedCsAction(account)}</span>
              </div>

              <div className="mt-3 flex items-center justify-end text-[11px] font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
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
