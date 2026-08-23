import React from 'react';
import { ActivityLogItem } from '@/types/dashboard';
import { formatRelativeTime, moduleLabel } from '../utils/formatters';
import { Activity, Clock, User, RefreshCw } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLogItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="rounded-2xl p-5 border bg-white border-[#E5E7EB] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(29, 111, 216, 0.1)' }}>
              <Activity className="w-4 h-4 text-[#1D6FD8]" />
            </div>
            <h3 className="text-sm font-bold text-[#000000]">Recent customer activity</h3>
          </div>
          <p className="text-xs text-[#000000]/70 mt-0.5 ml-8">Latest product actions across the portfolio</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border border-[#E5E7EB] bg-white hover:border-[#1D6FD8] text-[#1D6FD8] hover:bg-[#1D6FD8]/5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {activities.length > 0 ? (
          activities.map((act, idx) => (
            <div
              key={act.activityId || idx}
              className="p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all bg-white border-[#E5E7EB] hover:border-[#1D6FD8] shadow-sm"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: 'rgba(29, 111, 216, 0.1)' }}>
                  <User className="w-3.5 h-3.5 text-[#1D6FD8]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#000000]">
                      {act.logEvent || act.logMessage || 'Customer event'}
                    </span>
                    {act.logSource && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-md font-medium bg-white text-[#000000] border border-[#E5E7EB]">
                        {moduleLabel(String(act.logSource))}
                      </span>
                    )}
                  </div>
                  <p className="text-[#000000]/70 mt-0.5 truncate">
                    {act.logDescription ||
                      (act.organizationId
                        ? `Org ${String(act.organizationId).slice(0, 8)}…`
                        : 'Portfolio activity')}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#000000]/50 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(act.createdAt as number | string | null)}
              </span>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5E7EB]">
              <Activity className="w-8 h-8 text-[#000000]/40" />
            </div>
            <p className="text-sm text-[#000000]/60">
              {isLoading ? 'Loading activity…' : 'No recent activity yet. Open an account to see its feed.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
