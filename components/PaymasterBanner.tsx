import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

interface PaymasterBannerProps {
  paidOrgsCount: number;
  totalOrgsCount: number;
  onlyPaidOrgs: boolean;
  onToggleOnlyPaidOrgs: () => void;
  isLoading?: boolean;
}

export const PaymasterBanner: React.FC<PaymasterBannerProps> = ({
  paidOrgsCount,
  totalOrgsCount,
  onlyPaidOrgs,
  onToggleOnlyPaidOrgs,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl p-4 border"
      style={{
        background: 'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(15,23,42,0.9) 100%)',
        borderColor: 'rgba(245,158,11,0.2)',
        boxShadow: '0 0 0 1px rgba(245,158,11,0.05), 0 4px 24px rgba(0,0,0,0.3)',
      }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-100">Paid All-in-One customers</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full"
                style={{ background: isLoading ? 'rgba(51,65,85,0.4)' : 'rgba(16,185,129,0.15)', color: isLoading ? '#64748b' : '#34d399', border: '1px solid', borderColor: isLoading ? 'rgba(51,65,85,0.4)' : 'rgba(16,185,129,0.3)' }}>
                {isLoading ? 'Syncing…' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Focused on paying customers so your team can prioritize real renewal and adoption risk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">In portfolio</span>
            <span className="text-lg font-extrabold text-amber-300">
              {paidOrgsCount || totalOrgsCount}{' '}
              <span className="text-xs text-slate-500 font-normal">paid accounts</span>
            </span>
          </div>

          <button
            onClick={onToggleOnlyPaidOrgs}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            style={onlyPaidOrgs
              ? { background: 'rgba(245,158,11,0.85)', color: '#0f172a', fontWeight: 700 }
              : { background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.8)' }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{onlyPaidOrgs ? 'Paid only (on)' : 'Show paid only'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
