import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Users,
  HeartPulse,
  Layers,
  Flame,
  Activity,
  Zap,
  Calendar,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { PortfolioAnalyticsBody, AccountSummary } from '../shared/types/dashboard';
import { moduleLabel } from '../shared/customer-success/formatters';

interface CeoPresentationProps {
  isOpen: boolean;
  onClose: () => void;
  data: PortfolioAnalyticsBody | null;
  paidOrgsCount: number;
  meetingDate?: string;
}

const SLIDE_DURATION = 12000; // 12 seconds per slide in auto-play

// ── Helper ─────────────────────────────────────────────────────────────────
function healthColor(score: number) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#f43f5e';
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  const color = healthColor(score);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

// ── Slide: Title / Executive Summary ──────────────────────────────────────
function SlideTitle({ data, paidOrgsCount, meetingDate }: { data: PortfolioAnalyticsBody; paidOrgsCount: number; meetingDate: string }) {
  const s = data.summary;
  const date = meetingDate || new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="flex flex-col h-full justify-between">
      {/* Top */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0d9488)', boxShadow: '0 0 24px rgba(14,165,233,0.4)' }}>
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sky-400 text-sm font-semibold tracking-widest uppercase">IntoAEC</p>
              <h1 className="text-3xl font-black text-white leading-tight">Customer Success Review</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400 text-sm">{date}</span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[11px] uppercase tracking-widest text-slate-600 mb-1">Portfolio at a glance</div>
          <div className="text-4xl font-black text-white">{paidOrgsCount || s.totalAccounts}</div>
          <div className="text-sm text-slate-400">Paid accounts</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        {[
          { label: 'Avg Health Score', value: `${Math.round(s.avgHealthScore)}`, suffix: '/100', color: healthColor(s.avgHealthScore), icon: HeartPulse },
          { label: 'Need CS Focus', value: s.accountsNeedingAttention, suffix: 'accounts', color: '#f59e0b', icon: AlertTriangle },
          { label: 'Churn Risk', value: s.churnRiskOrgs, suffix: 'orgs', color: '#f43f5e', icon: Flame },
          { label: 'Daily Engagement', value: `${Math.round((s.avgStickiness || 0) * 100)}%`, suffix: 'DAU/MAU', color: '#0d9488', icon: Activity },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-2xl p-4 border relative overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.7)', borderColor: 'rgba(51,65,85,0.5)' }}>
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-15 pointer-events-none"
                style={{ background: kpi.color }} />
              <div className="p-2 rounded-xl w-fit mb-2" style={{ background: `${kpi.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Distribution bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-semibold">Health distribution</span>
          <span>{s.totalAccounts} accounts total</span>
        </div>
        <div className="flex h-5 w-full rounded-full overflow-hidden gap-0.5">
          {s.distribution.healthy > 0 && (
            <div className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
              style={{ width: `${(s.distribution.healthy / s.totalAccounts) * 100}%`, background: '#10b981' }}>
              {s.distribution.healthy}
            </div>
          )}
          {s.distribution.atRisk > 0 && (
            <div className="flex items-center justify-center text-[10px] font-bold text-white"
              style={{ width: `${(s.distribution.atRisk / s.totalAccounts) * 100}%`, background: '#f59e0b' }}>
              {s.distribution.atRisk}
            </div>
          )}
          {s.distribution.critical > 0 && (
            <div className="flex items-center justify-center text-[10px] font-bold text-white"
              style={{ width: `${(s.distribution.critical / s.totalAccounts) * 100}%`, background: '#f43f5e' }}>
              {s.distribution.critical}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-500" /> Healthy ≥70</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-500" /> At Risk 40–69</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-rose-500" /> Critical &lt;40</span>
        </div>
      </div>
    </div>
  );
}

// ── Slide: Health Deep Dive ────────────────────────────────────────────────
function SlideHealth({ data }: { data: PortfolioAnalyticsBody }) {
  const s = data.summary;
  const pieData = [
    { name: 'Healthy', value: s.distribution.healthy, color: '#10b981' },
    { name: 'At Risk', value: s.distribution.atRisk, color: '#f59e0b' },
    { name: 'Critical', value: s.distribution.critical, color: '#f43f5e' },
  ].filter(d => d.value > 0);

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: '#0f172a', border: '1px solid rgba(51,65,85,0.8)',
    borderRadius: 10, color: '#e2e8f0', fontSize: 12,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(14,165,233,0.1)' }}>
            <HeartPulse className="w-6 h-6 text-sky-400" />
          </div>
          Portfolio Health Deep Dive
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">Breakdown across {s.totalAccounts} active accounts</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                </Pie>
                <RechartsTooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{Math.round(s.avgHealthScore)}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">avg score</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col justify-center gap-4">
          {[
            { label: 'Healthy accounts', count: s.distribution.healthy, pct: s.totalAccounts > 0 ? Math.round(s.distribution.healthy / s.totalAccounts * 100) : 0, color: '#10b981' },
            { label: 'At-risk accounts', count: s.distribution.atRisk, pct: s.totalAccounts > 0 ? Math.round(s.distribution.atRisk / s.totalAccounts * 100) : 0, color: '#f59e0b' },
            { label: 'Critical accounts', count: s.distribution.critical, pct: s.totalAccounts > 0 ? Math.round(s.distribution.critical / s.totalAccounts * 100) : 0, color: '#f43f5e' },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-semibold text-slate-300">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg" style={{ color: row.color }}>{row.count}</span>
                  <span className="text-slate-600 text-xs">({row.pct}%)</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${row.pct}%`, background: row.color, boxShadow: `0 0 8px ${row.color}66` }} />
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
            {[
              { label: 'Improving', value: s.trends?.improving ?? 0, color: '#10b981' },
              { label: 'Stable', value: s.trends?.stable ?? 0, color: '#64748b' },
              { label: 'Declining', value: s.trends?.declining ?? 0, color: '#f43f5e' },
              { label: 'Automation score', value: `${Math.round(s.avgAutomationScore || 0)}%`, color: '#8b5cf6' },
            ].map((t) => (
              <div key={t.label} className="text-center p-2 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.4)' }}>
                <div className="text-xl font-black" style={{ color: t.color }}>{t.value}</div>
                <div className="text-[10px] text-slate-600 uppercase tracking-wider">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Slide: Portfolio Trend ─────────────────────────────────────────────────
function SlideTrend({ data }: { data: PortfolioAnalyticsBody }) {
  const trend = (data.dailyTrend || []).map((item) => {
    const d = new Date(item.date);
    return {
      dateStr: !isNaN(d.getTime()) ? `${d.getMonth() + 1}/${d.getDate()}` : 'Day',
      avgHealthScore: Math.round(item.avgHealthScore || 0),
      avgStickinessPct: Math.round((item.avgStickiness || 0) * 100),
      orgCount: item.orgCount,
    };
  });

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: '#0f172a', border: '1px solid rgba(51,65,85,0.8)',
    borderRadius: 10, color: '#e2e8f0', fontSize: 12,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(14,165,233,0.1)' }}>
            <TrendingUp className="w-6 h-6 text-sky-400" />
          </div>
          Portfolio Trend
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">
          {trend.length > 0 ? `${trend.length}-day rolling health & engagement` : 'Daily snapshots will appear here after the first run'}
        </p>
      </div>

      <div className="flex-1">
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="pHealthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pEngGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.35)" />
              <XAxis dataKey="dateStr" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={tooltipStyle}
                formatter={(v: any, n: any) => [n === 'avgHealthScore' ? `${v}/100` : `${v}%`, n === 'avgHealthScore' ? 'Avg Health' : 'Engagement']} />
              <Area type="monotone" dataKey="avgHealthScore" stroke="#0ea5e9" strokeWidth={3}
                fill="url(#pHealthGrad)" dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="avgStickinessPct" stroke="#0d9488" strokeWidth={2.5}
                strokeDasharray="6 4" fill="url(#pEngGrad)"
                dot={{ r: 3, fill: '#0d9488', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="p-6 rounded-3xl" style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <TrendingUp className="w-12 h-12 text-slate-700" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-500">No trend data yet</p>
              <p className="text-sm text-slate-600 mt-1">Will populate after daily health snapshot job runs</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
        <span className="flex items-center gap-2"><span className="w-5 h-0.5 inline-block rounded" style={{ background: '#0ea5e9' }} /> Avg Health Score</span>
        <span className="flex items-center gap-2"><span className="w-5 h-0 inline-block border-t-2 border-dashed" style={{ borderColor: '#0d9488' }} /> Daily Engagement</span>
      </div>
    </div>
  );
}

// ── Slide: Accounts Needing Attention ─────────────────────────────────────
function SlideAttention({ data }: { data: PortfolioAnalyticsBody }) {
  const critical = data.accounts
    .filter(a => a.healthBucket === 'critical' || a.healthBucket === 'at-risk' || (a.openAlertsCritical ?? 0) > 0)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 6);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          Accounts Needing Attention
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">
          {critical.length > 0 ? `${critical.length} highest-priority accounts for CS outreach` : 'No critical or at-risk accounts — portfolio is healthy!'}
        </p>
      </div>

      {critical.length > 0 ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-auto">
          {critical.map((acc) => {
            const score = Math.round(acc.healthScore || 0);
            const isCritical = acc.healthBucket === 'critical';
            const accentColor = isCritical ? '#f43f5e' : '#f59e0b';
            return (
              <div key={acc.organizationId} className="rounded-2xl p-4 border"
                style={{ background: 'rgba(15,23,42,0.8)', borderColor: isCritical ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)' }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-100 truncate">{acc.organizationName || 'Unnamed org'}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">{acc.accountNumber || acc.organizationId}</div>
                  </div>
                  <div className="relative shrink-0">
                    <ScoreRing score={score} size={52} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black" style={{ color: accentColor }}>{score}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase"
                    style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40` }}>
                    {isCritical ? 'Critical' : 'At Risk'}
                  </span>
                  {(acc.openAlertsCritical ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                      style={{ background: 'rgba(244,63,94,0.1)', color: '#f87171', border: '1px solid rgba(244,63,94,0.25)' }}>
                      <AlertTriangle className="w-3 h-3" /> {acc.openAlertsCritical} alerts
                    </span>
                  )}
                  {acc.countryCode && (
                    <span className="text-[10px] text-slate-600">{acc.countryCode}</span>
                  )}
                </div>
                {acc.modulesUsed?.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-600 truncate">
                    Modules: {acc.modulesUsed.slice(0, 3).map(m => moduleLabel(m)).join(' · ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-6xl">🎉</div>
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-300">All clear!</p>
            <p className="text-sm text-slate-500 mt-1">No critical or at-risk accounts — great work by the CS team.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Slide: Module Adoption ─────────────────────────────────────────────────
function SlideModules({ data }: { data: PortfolioAnalyticsBody }) {
  const modules = (data.moduleUsageSummary || []).slice(0, 6);
  const total = data.summary.totalAccounts;
  const COLORS = ['#0ea5e9', '#0d9488', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

  const barData = modules.map((m, i) => ({
    name: m.label || m.logSource,
    adoption: total > 0 ? Math.round((m.orgCount / total) * 100) : 0,
    orgCount: m.orgCount,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Layers className="w-6 h-6 text-violet-400" />
          </div>
          Module Adoption
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">
          {modules.length} modules active across {total} accounts — where teams spend their time
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        {barData.map((m) => (
          <div key={m.name}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-semibold text-slate-300 truncate max-w-[60%]">{m.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs">{m.orgCount} accounts</span>
                <span className="font-black text-base" style={{ color: m.color, minWidth: 42, textAlign: 'right' }}>{m.adoption}%</span>
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(m.adoption, 2)}%`, background: m.color, boxShadow: `0 0 8px ${m.color}55` }} />
            </div>
          </div>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">No module data available yet</p>
        </div>
      )}
    </div>
  );
}

// ── Slide: Next Steps / Action Plan ───────────────────────────────────────
function SlideNextSteps({ data }: { data: PortfolioAnalyticsBody }) {
  const s = data.summary;
  const actions = [
    {
      priority: 'Urgent',
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.08)',
      border: 'rgba(244,63,94,0.25)',
      text: `Immediate outreach to ${s.distribution.critical} critical account${s.distribution.critical !== 1 ? 's' : ''} — risk of churn`,
      show: s.distribution.critical > 0,
    },
    {
      priority: 'High',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.25)',
      text: `Schedule health reviews for ${s.distribution.atRisk} at-risk account${s.distribution.atRisk !== 1 ? 's' : ''} this week`,
      show: s.distribution.atRisk > 0,
    },
    {
      priority: 'High',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.25)',
      text: `Re-engage ${s.churnRiskOrgs} org${s.churnRiskOrgs !== 1 ? 's' : ''} with 14+ days of user inactivity`,
      show: s.churnRiskOrgs > 0,
    },
    {
      priority: 'Medium',
      color: '#0ea5e9',
      bg: 'rgba(14,165,233,0.08)',
      border: 'rgba(14,165,233,0.25)',
      text: 'Coach underutilised modules to deepen product stickiness and reduce churn surface',
      show: true,
    },
    {
      priority: 'Growth',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.25)',
      text: `Identify expansion candidates from ${s.distribution.healthy} healthy accounts — upsell and referral campaigns`,
      show: s.distribution.healthy > 0,
    },
  ].filter(a => a.show);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(14,165,233,0.1)' }}>
            <Zap className="w-6 h-6 text-sky-400" />
          </div>
          Recommended Actions
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">CS priorities for this week based on portfolio data</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        {actions.map((a, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border transition-all"
            style={{ background: a.bg, borderColor: a.border }}>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider shrink-0"
              style={{ background: `${a.color}25`, color: a.color, border: `1px solid ${a.color}50` }}>
              {a.priority}
            </span>
            <p className="text-slate-200 text-sm leading-relaxed">{a.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          <span className="text-sm text-slate-400">Data from IntoAEC CS Hub · <span className="text-slate-500 text-xs">Updated live</span></span>
        </div>
        <span className="text-xs text-slate-600">Confidential — CS Team Review</span>
      </div>
    </div>
  );
}

// ── Main Presentation Component ────────────────────────────────────────────
export const CeoPresentationModal: React.FC<CeoPresentationProps> = ({
  isOpen,
  onClose,
  data,
  paidOrgsCount,
  meetingDate,
}) => {
  const [slide, setSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [progress, setProgress] = useState(0);

  const slides = [
    { id: 'summary', label: 'Executive Summary', icon: BarChart2 },
    { id: 'health', label: 'Health Deep Dive', icon: HeartPulse },
    { id: 'trend', label: 'Portfolio Trend', icon: TrendingUp },
    { id: 'attention', label: 'Needs Attention', icon: Flame },
    { id: 'modules', label: 'Module Adoption', icon: Layers },
    { id: 'actions', label: 'Action Plan', icon: Zap },
  ];

  const goNext = useCallback(() => setSlide((s) => Math.min(s + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      else if (e.key === 'Escape') onClose();
      else if (e.key === ' ') { e.preventDefault(); setAutoPlay(a => !a); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev, onClose]);

  // Auto-play progress
  useEffect(() => {
    if (!isOpen || !autoPlay) { setProgress(0); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        setProgress(0);
        setSlide((s) => {
          if (s >= slides.length - 1) { setAutoPlay(false); return s; }
          return s + 1;
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen, autoPlay, slide, slides.length]);

  // Reset slide on open
  useEffect(() => { if (isOpen) { setSlide(0); setAutoPlay(false); setProgress(0); } }, [isOpen]);

  if (!isOpen || !data) return null;

  const dateStr = meetingDate || new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#050a12' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{ background: 'rgba(8,13,21,0.95)', borderColor: 'rgba(51,65,85,0.5)', backdropFilter: 'blur(20px)' }}>
        {/* Brand + slide info */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0ea5e9,#0d9488)' }}>
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100">IntoAEC CS Hub — CEO Presentation</p>
            <p className="text-[11px] text-slate-600">{dateStr}</p>
          </div>
        </div>

        {/* Slide dots */}
        <div className="hidden md:flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => { setSlide(i); setProgress(0); }}
              className="transition-all"
              title={s.label}>
              <div className="rounded-full transition-all duration-300"
                style={{
                  width: i === slide ? 24 : 8,
                  height: 8,
                  background: i === slide ? '#0ea5e9' : i < slide ? 'rgba(14,165,233,0.4)' : 'rgba(51,65,85,0.6)',
                }} />
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAutoPlay(a => !a); setProgress(0); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={autoPlay
              ? { background: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)' }
              : { background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(51,65,85,0.6)' }}
          >
            {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoPlay ? 'Pause' : 'Auto-play'}</span>
          </button>
          <button onClick={onClose}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(51,65,85,0.6)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-play progress bar */}
      {autoPlay && (
        <div className="h-0.5 shrink-0" style={{ background: 'rgba(51,65,85,0.4)' }}>
          <div className="h-full transition-none" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#0ea5e9,#0d9488)' }} />
        </div>
      )}

      {/* Slide content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col w-52 shrink-0 border-r py-4 px-3 gap-1"
          style={{ borderColor: 'rgba(51,65,85,0.4)', background: 'rgba(8,13,21,0.8)' }}>
          {slides.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === slide;
            return (
              <button key={s.id} onClick={() => { setSlide(i); setProgress(0); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium"
                style={isActive
                  ? { background: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)' }
                  : { color: '#475569', border: '1px solid transparent' }}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{s.label}</span>
                {i < slide && <span className="ml-auto text-[10px] text-emerald-500">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Main slide */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 sm:p-10 overflow-auto">
            <div className="max-w-5xl mx-auto h-full" style={{ minHeight: 400 }}>
              {slide === 0 && <SlideTitle data={data} paidOrgsCount={paidOrgsCount} meetingDate={dateStr} />}
              {slide === 1 && <SlideHealth data={data} />}
              {slide === 2 && <SlideTrend data={data} />}
              {slide === 3 && <SlideAttention data={data} />}
              {slide === 4 && <SlideModules data={data} />}
              {slide === 5 && <SlideNextSteps data={data} />}
            </div>
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t shrink-0"
            style={{ borderColor: 'rgba(51,65,85,0.4)', background: 'rgba(8,13,21,0.8)' }}>
            <button onClick={goPrev} disabled={slide === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.6)' }}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">{slide + 1} / {slides.length}</span>
              <span className="text-xs font-semibold text-slate-400">{slides[slide].label}</span>
              <span className="hidden sm:block text-[11px] text-slate-700">← → to navigate · Space to play</span>
            </div>

            <button onClick={goNext} disabled={slide === slides.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={slide < slides.length - 1
                ? { background: 'linear-gradient(135deg,#0ea5e9,#0d9488)', color: '#fff', boxShadow: '0 0 12px rgba(14,165,233,0.25)' }
                : { background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.6)' }}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
