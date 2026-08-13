"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  X
} from 'lucide-react';
import { salesService } from '@/services/salesService';

export default function SalesDashboardPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [extensionDate, setExtensionDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [orgsError, setOrgsError] = useState<string | null>(null);

  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('IN');
  const [currentPlanName, setCurrentPlanName] = useState<string>('');

  const selectedCompanyName = useMemo(() => {
    const org = organizations.find(o => o.organizationId === selectedCompanyId);
    return org ? org.organizationName : '';
  }, [selectedCompanyId, organizations]);

  // Fetch all organizations when the page loads
  useEffect(() => {
    const fetchOrgs = async () => {
      setIsLoadingOrgs(true);
      setOrgsError(null);
      try {
        const orgs = await salesService.getOrganizations();
        // Sort alphabetically by organizationName
        const sorted = orgs.sort((a: any, b: any) => {
          const nameA = (a.organizationName || '').toLowerCase();
          const nameB = (b.organizationName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setOrganizations(sorted);
      } catch (err: any) {
        console.error(err);
        setOrgsError(err.message || 'Failed to load companies.');
      } finally {
        setIsLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  // Fetch plans by country code
  const fetchPlans = async (country: string) => {
    if (!country) return;
    setIsLoadingPlans(true);
    setPlansError(null);
    try {
      const data = await salesService.getAllPlans(country.toUpperCase());
      setPlans(data || []);
    } catch (err: any) {
      console.error(err);
      setPlansError(err.message || 'Failed to load subscription plans.');
      setPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Trigger plans fetch when countryCode or selectedCompanyId changes
  useEffect(() => {
    if (selectedCompanyId && countryCode) {
      fetchPlans(countryCode);
    } else {
      setPlans([]);
    }
  }, [countryCode, selectedCompanyId]);

  // Fetch subscription details for the selected company
  const handleSelectCompany = async (orgId: string) => {
    setSelectedCompanyId(orgId);
    setIsSuccess(false);
    setExtensionDate('');
    setSubscriptionError(null);
    setCurrentPlanName('');

    if (!orgId) {
      setCurrentSubscription(null);
      setPlans([]);
      return;
    }

    setIsLoadingSubscription(true);
    setCurrentSubscription(null);

    try {
      const sub = await salesService.getSubscriptionDetails(orgId);
      setCurrentSubscription(sub);

      const org = organizations.find(o => o.organizationId === orgId);
      const code = org?.countryCode || org?.country || 'IN';
      setCountryCode(code.toUpperCase());

      if (sub && sub.subscriptionPlanId) {
        try {
          const plan = await salesService.getSubscriptionPlanById(sub.subscriptionPlanId);
          if (plan) {
            setCurrentPlanName(plan.displayName || plan.planName || 'N/A');
          } else {
            setCurrentPlanName('N/A');
          }
        } catch (planErr) {
          console.error(planErr);
          // Try lookup in already loaded plans
          const matchedPlan = plans.find(p => p.planId === sub.subscriptionPlanId);
          if (matchedPlan) {
            setCurrentPlanName(matchedPlan.displayName || matchedPlan.planName);
          } else {
            setCurrentPlanName('N/A');
          }
        }
      } else {
        setCurrentPlanName('No Active Plan');
      }
    } catch (err: any) {
      console.error(err);
      setSubscriptionError(err.message || 'Failed to load subscription details.');
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Fallback to update plan name from plans list if getSubscriptionPlanById wasn't set or as fallback
  useEffect(() => {
    if (currentSubscription?.subscriptionPlanId && (!currentPlanName || currentPlanName === 'N/A' || currentPlanName === 'Loading plan name...') && plans.length > 0) {
      const matchedPlan = plans.find((p: any) => p.planId === currentSubscription.subscriptionPlanId);
      if (matchedPlan) {
        setCurrentPlanName(matchedPlan.displayName || matchedPlan.planName);
      }
    }
  }, [plans, currentSubscription, currentPlanName]);


  // Helper to format timestamp
  const formatTimestamp = (ts: string | number | null | undefined) => {
    if (!ts) return 'N/A';
    const val = typeof ts === 'string' ? Number(ts) : ts;
    if (isNaN(val)) return 'N/A';
    return new Date(val).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper to get min extension date
  const getMinExtensionDate = (validTill: string | number | null | undefined) => {
    if (!validTill) return undefined;
    const val = typeof validTill === 'string' ? Number(validTill) : validTill;
    if (isNaN(val)) return undefined;
    // Add 1 day to the current expiry date for the input type="date" min attribute
    const d = new Date(val + 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !extensionDate || !currentSubscription) return;

    setIsSubmitting(true);
    setIsSuccess(false);
    setSubscriptionError(null);

    try {
      await salesService.extendSubscription({
        organizationId: selectedCompanyId,
        subscriptionId: currentSubscription.organizationSubscriptionId,
        extendedToDate: extensionDate
      });
      setIsSuccess(true);
      setShowSuccessModal(true);
      // Refresh subscription details
      await handleSelectCompany(selectedCompanyId);
      // Reset success indicator after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setSubscriptionError(err.message || 'An error occurred while extending the subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 overflow-y-auto">

      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Briefcase className="w-3.5 h-3.5" />
          Sales Operations
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Subscription Management
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Update and extend client billing cycles securely.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Form Column */}
        <div className="lg:col-span-3">
          <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-sky-500/10 blur-3xl rounded-full pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

              {/* Field 1: Company Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  Select Company
                </label>
                <div className="relative">
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleSelectCompany(e.target.value)}
                    required
                    className="w-full appearance-none bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    disabled={isLoadingOrgs}
                  >
                    <option value="" disabled>
                      {isLoadingOrgs ? 'Loading companies...' : 'Choose a client...'}
                    </option>
                    {organizations.map(company => (
                      <option key={company.organizationId} value={company.organizationId}>
                        {company.organizationName || `Unnamed (${company.organizationId.substring(0, 8)})`}
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Field 1.5: Organization Plan Name */}
              {selectedCompanyId && (
                <div className="transition-all duration-300 animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Organization Plan Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={isLoadingSubscription ? 'Loading plan name...' : currentPlanName || 'No Active Plan'}
                    className="w-full bg-[#080d15] border border-slate-700/80 text-slate-300 text-sm rounded-xl px-4 py-3.5 outline-none cursor-not-allowed select-all"
                    placeholder="No active subscription plan"
                  />
                </div>
              )}


              {/* Field 2: Current Subscription Details */}
              <div className="transition-all duration-300">
                {isLoadingSubscription ? (
                  <div className="bg-[#080d15] border border-slate-700/80 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                    <span className="text-slate-400 text-xs font-medium">Fetching subscription details...</span>
                  </div>
                ) : selectedCompanyId && !currentSubscription ? (
                  <div className="bg-[#080d15] border border-red-500/20 rounded-xl p-6 text-center text-slate-400 text-sm">
                    <CreditCard className="w-8 h-8 text-red-400 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-slate-300">No subscription found</p>
                    <p className="text-xs text-slate-500 mt-1">This organization does not have an active billing plan.</p>
                  </div>
                ) : currentSubscription ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Current Subscription
                    </label>
                    <div className="bg-[#080d15] border border-slate-700/80 rounded-xl p-5 space-y-4 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">PLAN ID</span>
                          <span className="text-white font-mono text-xs bg-[#0b1120] border border-slate-800 px-2.5 py-1 rounded-md">
                            {currentSubscription.subscriptionPlanId || 'N/A'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {currentSubscription.isSubscriptionPlanActive && !currentSubscription.isDeactivated ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                          {currentSubscription.isFreeTrial && (
                            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                              Free Trial
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80 text-xs">
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Valid From</span>
                          <span className="text-slate-300">{formatTimestamp(currentSubscription.subscriptionValidFrom)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Expires At</span>
                          <span className="text-slate-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatTimestamp(currentSubscription.subscriptionValidTill)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Billing Tenure</span>
                          <span className="text-slate-300 capitalize">{currentSubscription.paymentTenure || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Auto Debit</span>
                          <span className="text-slate-300">
                            {currentSubscription.isRecurringAutoDebit ? 'Enabled (Recurring)' : 'Disabled'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Licenses Allocated</span>
                          <span className="text-slate-300">{currentSubscription.licenseCount ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-0.5 font-medium">Licenses Used</span>
                          <span className="text-slate-300">{currentSubscription.licenseCountUsed ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#080d15]/50 border border-slate-800/80 rounded-xl p-4 text-center text-slate-500 text-xs">
                    Select a company to load subscription details.
                  </div>
                )}
              </div>

              {/* Field 3: Extend Subscription Date */}
              <div className={`transition-all duration-300 ${currentSubscription ? 'opacity-100 h-auto' : 'opacity-40 pointer-events-none'}`}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Extend To Date
                </label>
                <input
                  type="date"
                  required={!!currentSubscription}
                  value={extensionDate}
                  min={getMinExtensionDate(currentSubscription?.subscriptionValidTill)}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all custom-calendar-icon"
                />
              </div>

              {/* Submit Button & Notifications */}
              <div className="pt-2 space-y-4">
                {subscriptionError && (
                  <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex gap-2 animate-fade-in">
                    <span className="font-bold">Error:</span>
                    <span>{subscriptionError}</span>
                  </div>
                )}
                {orgsError && (
                  <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex gap-2 animate-fade-in">
                    <span className="font-bold">Error:</span>
                    <span>{orgsError}</span>
                  </div>
                )}

                {isSuccess ? (
                  <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    Subscription Extended Successfully!
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!currentSubscription || !extensionDate || isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirm Extension
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Quick Tips
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                Select a company to view their currently active subscription details.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                The extension date must be strictly after the current expiration date.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                Once confirmed, the client's subscription expiry date will immediately update.
              </li>
            </ul>
          </div>

          {/* Available Plans Card */}
          {selectedCompanyId && (
            <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-sky-400" />
                  Available Billing Plans
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Country</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    className="w-12 bg-[#080d15] border border-slate-700/80 text-white text-xs rounded px-2 py-1 outline-none text-center font-bold font-mono focus:border-sky-500 transition-all uppercase"
                  />
                </div>
              </div>

              {isLoadingPlans ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2.5">
                  <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
                  <span className="text-slate-500 text-xs">Loading plans...</span>
                </div>
              ) : plansError ? (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {plansError}
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-6">
                  No plans found for country code "{countryCode}".
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {plans.map((plan: any) => (
                    <div key={plan.planId} className="bg-[#080d15] border border-slate-800 rounded-xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-700 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-white font-bold text-xs block group-hover:text-sky-400 transition-colors">
                            {plan.displayName || plan.planName}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">
                            ID: {plan.planId.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold text-xs block">
                            {plan.currency === 'INR' ? '₹' : plan.currency === 'USD' ? '$' : plan.currency}
                            {Number(plan.billingValue).toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                            {plan.billingType || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {plan.planDesc && (
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {plan.planDesc}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          Period: {plan.billingPeriod} Days
                        </span>
                        {plan.taxPercentage > 0 && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-medium">
                            Tax: {plan.taxPercentage}%
                          </span>
                        )}
                        {plan.isCustom && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                            Custom
                          </span>
                        )}
                      </div>

                      {/* Display plan access modules */}
                      {plan.planAccess && plan.planAccess.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Features Access</span>
                          <div className="flex flex-wrap gap-1">
                            {plan.planAccess.map((access: any, idx: number) => (
                              <span 
                                key={idx} 
                                className={`text-[8px] px-1.5 py-0.5 rounded font-mono ${
                                  access.hasAccess || access.hasAccess === undefined 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {access.module}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Success Modal Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Subscription Extended!</h2>
              <p className="text-slate-400 text-sm mb-6">
                The billing plan for <span className="text-sky-400 font-semibold">{selectedCompanyName}</span> has been successfully updated.
              </p>
              <div className="bg-[#080d15] border border-slate-800 rounded-xl p-4 w-full mb-6 text-left space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">New Expiry Date</span>
                  <span className="text-emerald-400 font-semibold">{formatTimestamp(currentSubscription?.subscriptionValidTill)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-800/80 pt-2.5">
                  <span className="text-slate-500">Plan ID</span>
                  <span className="text-slate-300 font-mono">{currentSubscription?.subscriptionPlanId || 'N/A'}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom styles for native date picker icon to blend with dark mode */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-calendar-icon::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
        .custom-calendar-icon::-webkit-calendar-picker-indicator:hover {
          opacity: 0.8;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.10);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.20);
        }
      `}} />
    </div>
  );
}
