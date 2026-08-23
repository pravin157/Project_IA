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
    <div className="rounded-2xl p-4 border bg-white border-[#E5E7EB] shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl shrink-0"
            style={{ background: 'rgba(29, 111, 216, 0.1)', border: '1px solid rgba(29, 111, 216, 0.25)' }}>
            <Zap className="w-5 h-5 fill-[#1D6FD8] text-[#1D6FD8]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-[#000000]">Paid All-in-One customers</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full"
                style={{ background: isLoading ? '#F3F4F6' : 'rgba(16,185,129,0.1)', color: isLoading ? '#6B7280' : '#10B981', border: '1px solid', borderColor: isLoading ? '#E5E7EB' : 'rgba(16,185,129,0.2)' }}>
                {isLoading ? 'Syncing…' : 'Live'}
              </span>
            </div>
            <p className="text-xs text-[#000000]/70 mt-0.5 max-w-2xl">
              Focused on paying customers so your team can prioritize real renewal and adoption risk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[11px] text-[#000000]/50 block">In portfolio</span>
            <span className="text-lg font-extrabold text-[#1D6FD8]">
              {paidOrgsCount || totalOrgsCount}{' '}
              <span className="text-xs text-[#000000]/50 font-normal">paid accounts</span>
            </span>
          </div>

          <button
            onClick={onToggleOnlyPaidOrgs}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 border"
            style={onlyPaidOrgs
              ? { background: '#1D6FD8', color: '#ffffff', borderColor: '#1D6FD8', fontWeight: 700 }
              : { background: 'white', color: '#000000', borderColor: '#E5E7EB' }}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{onlyPaidOrgs ? 'Paid only (on)' : 'Show paid only'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
