import React from 'react';
import { PortfolioSummary, DailyTrendItem } from '../shared/types/dashboard';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Info } from 'lucide-react';

interface HealthDistributionChartProps {
  summary: PortfolioSummary | null;
  dailyTrend: DailyTrendItem[];
  onSelectBucket?: (bucket: 'all' | 'healthy' | 'at-risk' | 'critical') => void;
}

const CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
  border: '1px solid rgba(51,65,85,0.6)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

export const HealthDistributionChart: React.FC<HealthDistributionChartProps> = ({
  summary,
  dailyTrend,
  onSelectBucket,
}) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 skeleton h-72 rounded-2xl" />
        <div className="lg:col-span-7 skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  const { distribution } = summary;

  const pieData = [
    { name: 'Healthy (≥70)', value: distribution.healthy, color: '#10b981', bucket: 'healthy' as const },
    { name: 'At Risk (40–69)', value: distribution.atRisk, color: '#f59e0b', bucket: 'at-risk' as const },
    { name: 'Critical (<40)', value: distribution.critical, color: '#f43f5e', bucket: 'critical' as const },
  ].filter((item) => item.value > 0);

  const formattedTrendData = (dailyTrend || []).map((item) => {
    const d = new Date(item.date);
    const dateStr = !isNaN(d.getTime())
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : 'Day';
    return {
      dateStr,
      avgHealthScore: Math.round(item.avgHealthScore || 0),
      avgStickinessPct: Math.round((item.avgStickiness || 0) * 100),
      orgCount: item.orgCount,
    };
  });

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(51,65,85,0.8)',
    borderRadius: 10,
    color: '#e2e8f0',
    fontSize: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Pie chart */}
      <div className="lg:col-span-5 p-5" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(14,165,233,0.1)' }}>
              <PieIcon className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Health distribution</h3>
          </div>
          <span className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-300" onClick={() => onSelectBucket?.('all')}>
            Click a slice to filter
          </span>
        </div>

        <div className="h-52 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                dataKey="value"
                onClick={(_data, index) => {
                  const item = pieData[index];
                  if (item) onSelectBucket?.(item.bucket);
                }}
                className="cursor-pointer"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.9} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: any) => [`${value} Accounts`, 'Count']}
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-white">{summary.totalAccounts}</span>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Accounts</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800">
          {[
            { label: 'Healthy', count: distribution.healthy, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', bucket: 'healthy' as const },
            { label: 'At Risk', count: distribution.atRisk, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', bucket: 'at-risk' as const },
            { label: 'Critical', count: distribution.critical, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.25)', bucket: 'critical' as const },
          ].map((b) => (
            <button
              key={b.bucket}
              onClick={() => onSelectBucket?.(b.bucket)}
              className="p-2 rounded-xl text-left transition-all hover:scale-[1.04]"
              style={{ background: b.bg, border: `1px solid ${b.border}` }}
            >
              <div className="text-base font-black" style={{ color: b.color }}>{b.count}</div>
              <div className="text-[10px] font-medium text-slate-400">{b.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trend line chart */}
      <div className="lg:col-span-7 p-5" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(14,165,233,0.1)' }}>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Portfolio trend</h3>
          </div>
          <span className="text-[11px] text-slate-500">Last {formattedTrendData.length > 0 ? `${formattedTrendData.length} days` : '14 days'}</span>
        </div>

        <div className="h-56 w-full">
          {formattedTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                <XAxis dataKey="dateStr" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                  formatter={(value: any, name: any) => [
                    name === 'avgHealthScore' ? `${value}/100` : `${value}%`,
                    name === 'avgHealthScore' ? 'Avg Health Score' : 'Engagement (DAU/MAU)',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="avgHealthScore"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 1.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgStickinessPct"
                  stroke="#0d9488"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 2.5, fill: '#0d9488', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#0d9488', stroke: '#fff', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-8">
              <div className="p-3 rounded-full" style={{ background: 'rgba(14,165,233,0.08)' }}>
                <TrendingUp className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No trend data yet</p>
              <p className="text-xs text-slate-600 max-w-xs">
                Trends appear after the daily health snapshot job runs. Account pages still show live scores.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: '#0ea5e9' }} />
              <span>Avg health</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: '#0d9488', borderTop: '2px dashed #0d9488', height: 0 }} />
              <span>Engagement</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-600">
            <Info className="w-3 h-3" />
            <span>UTC daily snapshots</span>
          </div>
        </div>
      </div>
    </div>
  );
};
