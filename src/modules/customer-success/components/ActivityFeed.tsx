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
    <div className="rounded-2xl p-5 border"
      style={{
        background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
        borderColor: 'rgba(51,65,85,0.6)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(14,165,233,0.1)' }}>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Recent customer activity</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">Latest product actions across the portfolio</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(14,165,233,0.08)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.15)' }}
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
              className="p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all hover:border-slate-700"
              style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(51,65,85,0.4)' }}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: 'rgba(14,165,233,0.1)' }}>
                  <User className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-200">
                      {act.logEvent || act.logMessage || 'Customer event'}
                    </span>
                    {act.logSource && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-md font-medium"
                        style={{ background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(51,65,85,0.5)' }}>
                        {moduleLabel(String(act.logSource))}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-0.5 truncate">
                    {act.logDescription ||
                      (act.organizationId
                        ? `Org ${String(act.organizationId).slice(0, 8)}…`
                        : 'Portfolio activity')}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-600 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(act.createdAt as number | string | null)}
              </span>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(30,41,59,0.5)' }}>
              <Activity className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-sm text-slate-600">
              {isLoading ? 'Loading activity…' : 'No recent activity yet. Open an account to see its feed.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
