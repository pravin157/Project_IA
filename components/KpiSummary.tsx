import React from 'react';
import { PortfolioSummary, HealthBucketFilter } from '../types';
import {
  Users,
  HeartPulse,
  AlertTriangle,
  Flame,
  Activity,
  Bell,
} from 'lucide-react';

interface KpiSummaryProps {
  summary: PortfolioSummary | null;
  filteredCount: number;
  totalPaidCount: number;
  onlyPaidOrgs: boolean;
  onFilterClick?: (filter: HealthBucketFilter) => void;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({
  summary,
  filteredCount,
  totalPaidCount,
  onlyPaidOrgs,
  onFilterClick,
}) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const {
    totalAccounts,
    avgHealthScore,
    avgStickiness,
    accountsNeedingAttention,
    churnRiskOrgs,
    totalCriticalAlerts,
    distribution,
  } = summary;

  const stickinessPercent = Math.round((avgStickiness || 0) * 100);

  const cards = [
    {
      key: 'total',
      label: 'Accounts',
      value: filteredCount,
      suffix: onlyPaidOrgs ? 'paid' : `of ${totalAccounts}`,
      hint: totalPaidCount > 0 ? `${totalPaidCount} All-in-One` : 'Portfolio total',
      icon: Users,
      accent: '#0ea5e9',
      accentBg: 'rgba(14,165,233,0.1)',
      onClick: () => onFilterClick?.('all'),
    },
    {
      key: 'health',
      label: 'Avg Health',
      value: Math.round(avgHealthScore),
      suffix: '/ 100',
      hint: avgHealthScore >= 70 ? 'Portfolio healthy' : avgHealthScore >= 40 ? 'Needs monitoring' : 'Needs CS focus',
      icon: HeartPulse,
      accent: avgHealthScore >= 70 ? '#10b981' : avgHealthScore >= 40 ? '#f59e0b' : '#f43f5e',
      accentBg: avgHealthScore >= 70 ? 'rgba(16,185,129,0.1)' : avgHealthScore >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
    },
    {
      key: 'attention',
      label: 'Need Focus',
      value: accountsNeedingAttention,
      suffix: 'accounts',
      hint: `${distribution.critical} critical · ${distribution.atRisk} at risk`,
      icon: AlertTriangle,
      accent: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.1)',
      onClick: () => onFilterClick?.('attention'),
    },
    {
      key: 'churn',
      label: 'Inactive Risk',
      value: churnRiskOrgs,
      suffix: 'orgs',
      hint: 'Quiet for 14+ days',
      icon: Flame,
      accent: '#f43f5e',
      accentBg: 'rgba(244,63,94,0.1)',
    },
    {
      key: 'stickiness',
      label: 'Engagement',
      value: `${stickinessPercent}%`,
      suffix: 'DAU/MAU',
      hint: 'Daily team return rate',
      icon: Activity,
      accent: '#0d9488',
      accentBg: 'rgba(13,148,136,0.1)',
    },
    {
      key: 'alerts',
      label: 'Critical Alerts',
      value: totalCriticalAlerts,
      suffix: 'open',
      hint: 'Operational flags',
      icon: Bell,
      accent: totalCriticalAlerts > 0 ? '#f43f5e' : '#8b5cf6',
      accentBg: totalCriticalAlerts > 0 ? 'rgba(244,63,94,0.1)' : 'rgba(139,92,246,0.1)',
      onClick: totalCriticalAlerts > 0 ? () => onFilterClick?.('attention') : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            onClick={card.onClick}
            className={`relative rounded-2xl p-4 border transition-all duration-200 animate-fade-in overflow-hidden ${card.onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''}`}
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
              borderColor: 'rgba(51,65,85,0.6)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Glow orb */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-2xl pointer-events-none"
              style={{ background: card.accent }} />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className="p-1.5 rounded-lg" style={{ background: card.accentBg }}>
                <Icon className="w-3.5 h-3.5" style={{ color: card.accent }} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl font-black" style={{ color: card.accent }}>{card.value}</span>
              <span className="text-[11px] text-slate-500">{card.suffix}</span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">{card.hint}</div>
          </div>
        );
      })}
    </div>
  );
};
