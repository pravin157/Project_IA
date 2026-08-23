import React from 'react';
import { ModuleUsageSummaryItem } from '@/types/dashboard';
import { Layers } from 'lucide-react';

interface ModuleAdoptionCardProps {
  moduleUsageSummary: ModuleUsageSummaryItem[];
  totalAccountsCount: number;
}

export const ModuleAdoptionCard: React.FC<ModuleAdoptionCardProps> = ({
  moduleUsageSummary,
  totalAccountsCount,
}) => {
  if (!moduleUsageSummary || moduleUsageSummary.length === 0) return null;

  return (
    <div className="rounded-2xl p-5 border bg-white border-[#E5E7EB] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(124,58,237,0.1)' }}>
              <Layers className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <h3 className="text-sm font-bold text-[#000000]">Module adoption</h3>
          </div>
          <p className="text-xs text-[#000000]/70 mt-0.5 ml-8">
            Where teams spend time — and where you can coach unused products
          </p>
        </div>
        <div className="text-xs text-[#7C3AED]">
          <span className="font-bold">{moduleUsageSummary.length}</span>
          <span className="text-[#000000]/60 ml-1">modules in use</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleUsageSummary.map((mod) => {
          const adoptionPct = totalAccountsCount > 0 ? Math.round((mod.orgCount / totalAccountsCount) * 100) : 0;
          const barColor = adoptionPct >= 60 ? '#059669' : adoptionPct >= 30 ? '#d97706' : '#1D6FD8';
          const badgeStyle = adoptionPct >= 60
            ? { background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }
            : adoptionPct >= 30
            ? { background: 'rgba(217,119,6,0.1)', color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' }
            : { background: 'rgba(29,111,216,0.1)', color: '#1D6FD8', border: '1px solid rgba(29,111,216,0.2)' };

          return (
            <div key={mod.logSource}
              className="p-4 rounded-xl border transition-all hover:scale-[1.02] bg-white border-[#E5E7EB] hover:border-[#7C3AED] shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-[#000000] truncate">{mod.label || mod.logSource}</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full shrink-0" style={badgeStyle}>
                  {adoptionPct}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full overflow-hidden mb-2 bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(adoptionPct, 4)}%`, background: barColor }}
                />
              </div>

              <div className="text-xs text-[#000000]/60 flex items-center justify-between mb-3">
                <span>Used by <strong className="text-[#000000]">{mod.orgCount}</strong> accounts</span>
                <span style={{ color: adoptionPct >= 50 ? '#059669' : '#000000', opacity: adoptionPct >= 50 ? 1 : 0.6 }}>
                  {adoptionPct >= 50 ? 'Popular' : 'Growth potential'}
                </span>
              </div>

              {mod.topFeatures?.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[#E5E7EB]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#000000]/40">Top features</span>
                  {mod.topFeatures.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[160px] text-[#000000]/80" title={feat.label || feat.logEvent}>
                        {feat.label || feat.logEvent}
                      </span>
                      <span className="font-mono text-[11px] text-[#000000]/50 shrink-0 ml-2">{feat.activityCount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
