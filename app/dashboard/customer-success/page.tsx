"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PortfolioAnalyticsBody,
  AccountSummary,
  DashboardFilter,
  PaymasterOrganization,
  ActivityLogItem,
} from '@/types';
import {
  fetchPaidOrganizations,
  fetchPortfolioAnalytics,
  fetchActivities,
} from '@/services/api';
import { Navbar } from '@/components/Navbar';
import { KpiSummary } from '@/components/KpiSummary';
import { PaymasterBanner } from '@/components/PaymasterBanner';
import { HealthDistributionChart } from '@/components/HealthDistributionChart';
import { AccountsTable } from '@/components/AccountsTable';
import { ModuleAdoptionCard } from '@/components/ModuleAdoptionCard';
import { AccountDetailModal } from '@/components/AccountDetailModal';
import { CsAiAssistantModal } from '@/components/CsAiAssistantModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ActivityFeed } from '@/components/ActivityFeed';
import { AttentionQueue } from '@/components/AttentionQueue';
import { CeoPresentationModal } from '@/components/CeoPresentationModal';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const REFRESH_MS = 5 * 60 * 1000;

export default function CustomerSuccessDashboardPage() {
  const [data, setData] = useState<PortfolioAnalyticsBody | null>(null);
  const [paidOrgs, setPaidOrgs] = useState<PaymasterOrganization[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [loadSourceHint, setLoadSourceHint] = useState<string | null>(null);

  const [customApiKey, setCustomApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [aiContextData, setAiContextData] = useState<unknown>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountSummary | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if the access token is valid via server-side verification
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            return;
          }
        }

        // Access token expired — try to refresh
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (refreshRes.ok) {
          setIsAuthenticated(true);
          return;
        }

        // Both tokens invalid — redirect to login
        window.location.href = '/login';
      } catch {
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, []);

  const [filter, setFilter] = useState<DashboardFilter>({
    searchQuery: '',
    healthBucket: 'all',
    healthTrend: 'all',
    onlyPaidOrgs: true,
    moduleFilter: 'all',
    countryFilter: '',
  });

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    setLoadSourceHint('Loading paid customers and health scores…');

    try {
      const paidList = await fetchPaidOrganizations();
      setPaidOrgs(paidList);
      if (paidList.length > 0) {
        setLoadSourceHint(
          `Found ${paidList.length} paid accounts — building portfolio (may take a minute)…`
        );
      }

      const analytics = await fetchPortfolioAnalytics(14, true, true, customApiKey || undefined);
      setData(analytics);
      setLastRefreshedAt(Date.now());

      if (!analytics || analytics.accounts.length === 0) {
        setError(
          paidList.length === 0
            ? 'No paid All-in-One organizations were found. Check Paymaster sync or try again.'
            : 'Paid organizations were found, but no health data came back yet. Try refresh in a few minutes.'
        );
      }

      const logs = await fetchActivities(undefined, 15, customApiKey || undefined);
      setActivities(logs);
      setLoadSourceHint(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(
        `Could not load the CS dashboard: ${err instanceof Error ? err.message : String(err)}`
      );
      setLoadSourceHint(null);
    } finally {
      setIsLoading(false);
    }
  }, [customApiKey, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = window.setInterval(() => {
      loadDashboardData();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [isAuthenticated, loadDashboardData]);

  const paidOrgsMap = useMemo(() => {
    const map = new Map<string, PaymasterOrganization>();
    paidOrgs.forEach((org) => {
      if (org.organizationId) map.set(org.organizationId, org);
    });
    return map;
  }, [paidOrgs]);

  const handleFilterChange = (updated: Partial<DashboardFilter>) => {
    setFilter((prev) => ({ ...prev, ...updated }));
  };

  const handleDraftEmailForAccount = (accountSummary: AccountSummary) => {
    const name = accountSummary.organizationName || 'Customer Organization';
    const prompt = `Draft an empathetic, friendly CS check-in email for "${name}" (Organization ID: ${accountSummary.organizationId}).
Health Score: ${accountSummary.healthScore}/100 (${accountSummary.healthBucket}).
Modules Used: ${accountSummary.modulesUsed.join(', ') || 'None'}.
Please keep the tone helpful, non-technical, and focused on offering a 15-minute product walkthrough or health review.`;

    setAiInitialPrompt(prompt);
    setAiContextData(accountSummary);
    setIsAiModalOpen(true);
  };

  const handleOpenAiWithAccountModal = (orgName: string, orgId: string, score: number) => {
    const prompt = `Draft a personalized CS outreach email for "${orgName}" (ID: ${orgId}) with a current health score of ${score}/100. Provide clear recommendations to boost feature adoption.`;
    setAiInitialPrompt(prompt);
    setAiContextData({ orgName, orgId, score });
    setIsAiModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080d15] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const accounts = data?.accounts || [];

  return (
    <div className="min-h-screen text-slate-100 antialiased selection:bg-sky-500 selection:text-white pb-12" style={{ background: '#080d15' }}>
      <Navbar
        searchQuery={filter.searchQuery}
        onSearchChange={(q) => handleFilterChange({ searchQuery: q })}
        onRefresh={loadDashboardData}
        isLoading={isLoading}
        paidOrgsCount={paidOrgs.length}
        totalOrgsCount={data?.summary?.totalAccounts || 0}
        lastRefreshedAt={lastRefreshedAt}
        onOpenAiAssistant={() => {
          setAiInitialPrompt('');
          setAiContextData(data?.summary);
          setIsAiModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onlyPaidOrgs={filter.onlyPaidOrgs}
        onToggleOnlyPaidOrgs={() => handleFilterChange({ onlyPaidOrgs: !filter.onlyPaidOrgs })}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        hasPresentationData={!!data}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {error && (
          <div className="p-4 rounded-2xl text-xs flex items-start justify-between gap-3 animate-fade-in"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color: '#fca5a5' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
              <span>{error}</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 rounded-lg font-bold text-[11px] shrink-0 transition-all active:scale-95"
              style={{ background: 'rgba(244,63,94,0.2)', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' }}
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && loadSourceHint && (
          <div className="p-3 rounded-2xl text-xs flex items-center gap-2 animate-pulse"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#7dd3fc' }}>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: '#38bdf8' }} />
            <span>{loadSourceHint}</span>
          </div>
        )}

        <PaymasterBanner
          paidOrgsCount={paidOrgs.length}
          totalOrgsCount={data?.summary?.totalAccounts || 0}
          onlyPaidOrgs={filter.onlyPaidOrgs}
          onToggleOnlyPaidOrgs={() => handleFilterChange({ onlyPaidOrgs: !filter.onlyPaidOrgs })}
          isLoading={isLoading}
        />

        <KpiSummary
          summary={data?.summary || null}
          filteredCount={accounts.length}
          totalPaidCount={paidOrgs.length || accounts.length}
          onlyPaidOrgs={filter.onlyPaidOrgs}
          onFilterClick={(bucket) => handleFilterChange({ healthBucket: bucket })}
        />

        {!isLoading && accounts.length > 0 && (
          <AttentionQueue
            accounts={accounts}
            onSelectAccount={setSelectedAccount}
            onShowAllAttention={() => handleFilterChange({ healthBucket: 'attention' })}
          />
        )}

        <HealthDistributionChart
          summary={data?.summary || null}
          dailyTrend={data?.dailyTrend || []}
          onSelectBucket={(bucket) => handleFilterChange({ healthBucket: bucket })}
        />

        <AccountsTable
          accounts={accounts}
          filter={filter}
          onFilterChange={handleFilterChange}
          onSelectAccount={setSelectedAccount}
          onDraftEmailForAccount={handleDraftEmailForAccount}
          paidOrgsMap={paidOrgsMap}
        />

        <ModuleAdoptionCard
          moduleUsageSummary={data?.moduleUsageSummary || []}
          totalAccountsCount={data?.summary?.totalAccounts || 0}
        />

        <ActivityFeed
          activities={activities}
          isLoading={isLoading}
          onRefresh={loadDashboardData}
        />
      </main>

      {selectedAccount && (
        <AccountDetailModal
          accountSummary={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          onDraftEmail={handleOpenAiWithAccountModal}
          customApiKey={customApiKey || undefined}
          isPaidPlan={paidOrgsMap.has(selectedAccount.organizationId) || selectedAccount.isPaidPlan}
        />
      )}

      <CsAiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialPrompt={aiInitialPrompt}
        contextData={aiContextData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customApiKey={customApiKey}
        onSaveApiKey={(newKey) => setCustomApiKey(newKey)}
      />

      <CeoPresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        data={data}
        paidOrgsCount={paidOrgs.length}
      />
    </div>
  );
}
