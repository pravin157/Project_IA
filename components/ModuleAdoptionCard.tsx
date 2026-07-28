import React from 'react';
import { ModuleUsageSummaryItem } from '../types';
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
    <div className="rounded-2xl p-5 border"
      style={{
        background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
        borderColor: 'rgba(51,65,85,0.6)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Module adoption</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">
            Where teams spend time — and where you can coach unused products
          </p>
        </div>
        <div className="text-xs" style={{ color: '#a78bfa' }}>
          <span className="font-bold">{moduleUsageSummary.length}</span>
          <span className="text-slate-500"> modules in use</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleUsageSummary.map((mod) => {
          const adoptionPct = totalAccountsCount > 0 ? Math.round((mod.orgCount / totalAccountsCount) * 100) : 0;
          const barColor = adoptionPct >= 60 ? '#10b981' : adoptionPct >= 30 ? '#f59e0b' : '#0ea5e9';
          const badgeStyle = adoptionPct >= 60
            ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
            : adoptionPct >= 30
            ? { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }
            : { background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)' };

          return (
            <div key={mod.logSource}
              className="p-4 rounded-xl border transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(51,65,85,0.4)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.4)'; }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-slate-100 truncate">{mod.label || mod.logSource}</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full shrink-0" style={badgeStyle}>
                  {adoptionPct}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(30,41,59,0.8)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(adoptionPct, 4)}%`, background: barColor }}
                />
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between mb-3">
                <span>Used by <strong className="text-slate-300">{mod.orgCount}</strong> accounts</span>
                <span style={{ color: adoptionPct >= 50 ? '#34d399' : '#64748b' }}>
                  {adoptionPct >= 50 ? 'Popular' : 'Growth potential'}
                </span>
              </div>

              {mod.topFeatures?.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Top features</span>
                  {mod.topFeatures.slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[160px] text-slate-400" title={feat.label || feat.logEvent}>
                        {feat.label || feat.logEvent}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 shrink-0 ml-2">{feat.activityCount.toLocaleString()}</span>
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
