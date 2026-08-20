"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  Users,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { salesService } from '@/services/salesService';

export default function SalesDashboardPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  const [selectedPlanDisplayName, setSelectedPlanDisplayName] = useState<string>('');
  const [allocatedLicenses, setAllocatedLicenses] = useState<number | string>('');
  const [extensionDate, setExtensionDate] = useState<string>('');
  const [paymentTenure, setPaymentTenure] = useState<string>('MONTHLY');

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

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const orgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
        setOrgSearchQuery('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOrgs = useMemo(() => {
    if (!orgSearchQuery.trim()) return organizations;
    const query = orgSearchQuery.toLowerCase();
    return organizations.filter(org =>
      (org.organizationName || '').toLowerCase().includes(query) ||
      (org.accountId || '').toLowerCase().includes(query) ||
      (org.organizationId || '').toLowerCase().includes(query)
    );
  }, [organizations, orgSearchQuery]);

  const selectedCompanyName = useMemo(() => {
    const org = organizations.find(o => o.organizationId === selectedCompanyId);
    return org ? org.organizationName : '';
  }, [selectedCompanyId, organizations]);

  // Combobox display value: while typing show query, otherwise show selected name (or empty for placeholder)
  const orgInputDisplayValue = isOrgDropdownOpen
    ? orgSearchQuery
    : (selectedCompanyName || '');

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
    if (!country) return [];
    setIsLoadingPlans(true);
    setPlansError(null);
    try {
      const data = await salesService.getAllPlans(country.toUpperCase());
      const fetchedPlans = data || [];
      setPlans(fetchedPlans);
      return fetchedPlans;
    } catch (err: any) {
      console.error(err);
      setPlansError(err.message || 'Failed to load subscription plans.');
      setPlans([]);
      return [];
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Fetch subscription details for the selected company
  const handleSelectCompany = async (orgId: string) => {
    setSelectedCompanyId(orgId);
    setIsSuccess(false);
    setExtensionDate('');
    setSubscriptionError(null);
    setSelectedPlanId('');
    setSelectedPlanName('');
    setSelectedPlanDisplayName('');
    setAllocatedLicenses('');
    setPaymentTenure('MONTHLY');

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
      const upperCode = code.toUpperCase();
      setCountryCode(upperCode);

      // Populate allocated licenses
      if (sub && sub.licenseCount !== undefined) {
        setAllocatedLicenses(sub.licenseCount);
      } else if (sub && sub.licenseCountAllocated !== undefined) {
        setAllocatedLicenses(sub.licenseCountAllocated);
      } else {
        setAllocatedLicenses(0);
      }

      // Populate payment tenure
      if (sub && sub.paymentTenure) {
        let pt = sub.paymentTenure.toUpperCase();
        if (pt === 'ANNUALLY') pt = 'ANNUAL';
        if (pt === 'HALF YEARLY') pt = 'HALF_YEARLY';
        setPaymentTenure(pt);
      } else {
        setPaymentTenure('MONTHLY');
      }

      // Fetch plans for org country
      const availablePlans = await fetchPlans(upperCode);

      if (sub && sub.subscriptionPlanId) {
        setSelectedPlanId(sub.subscriptionPlanId);
        try {
          const plan = await salesService.getSubscriptionPlanById(sub.subscriptionPlanId);
          if (plan) {
            setSelectedPlanName(plan.planName || 'N/A');
            setSelectedPlanDisplayName(plan.displayName || plan.planName || 'N/A');
          } else {
            const matched = availablePlans.find((p: any) => p.planId === sub.subscriptionPlanId);
            setSelectedPlanName(matched ? matched.planName : (sub.planName || 'N/A'));
            setSelectedPlanDisplayName(matched ? (matched.displayName || matched.planName) : (sub.planName || 'N/A'));
          }
        } catch (planErr) {
          console.error(planErr);
          const matched = availablePlans.find((p: any) => p.planId === sub.subscriptionPlanId);
          setSelectedPlanName(matched ? matched.planName : (sub.planName || 'N/A'));
          setSelectedPlanDisplayName(matched ? (matched.displayName || matched.planName) : (sub.planName || 'N/A'));
        }
      } else {
        setSelectedPlanName('');
        setSelectedPlanDisplayName('No Active Plan');
      }
    } catch (err: any) {
      console.error(err);
      setSubscriptionError(err.message || 'Failed to load subscription details.');
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Synchronize plan name if plans finish loading later
  useEffect(() => {
    if (selectedPlanId && (!selectedPlanDisplayName || selectedPlanDisplayName === 'N/A') && plans.length > 0) {
      const matchedPlan = plans.find((p: any) => p.planId === selectedPlanId);
      if (matchedPlan) {
        setSelectedPlanName(matchedPlan.planName);
        setSelectedPlanDisplayName(matchedPlan.displayName || matchedPlan.planName);
      }
    }
  }, [plans, selectedPlanId, selectedPlanDisplayName]);

  // Helper to format timestamp
  const formatTimestamp = (ts: string | number | null | undefined) => {
    if (!ts) return 'N/A';
    const val = typeof ts === 'string' ? Number(ts) : ts;
    if (isNaN(val) || val <= 0) return 'N/A';
    return new Date(val).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to get min extension date
  const getMinExtensionDate = (validTill: string | number | null | undefined) => {
    if (!validTill) return undefined;
    const val = typeof validTill === 'string' ? Number(validTill) : validTill;
    if (isNaN(val) || val <= 0) return undefined;
    const d = new Date(val + 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const matchedPlan = plans.find((p: any) => p.planId === planId);
    if (matchedPlan) {
      setSelectedPlanName(matchedPlan.planName);
      setSelectedPlanDisplayName(matchedPlan.displayName || matchedPlan.planName);
    }
  };

  // Validation helpers
  const licenseCountUsed = currentSubscription?.licenseCountUsed ?? 0;
  const numAllocated = Number(allocatedLicenses);
  const isLicenseCountInvalid = Boolean(
    currentSubscription && (isNaN(numAllocated) || numAllocated < licenseCountUsed || numAllocated < 1)
  );

  const currentTillTs = currentSubscription ? Number(currentSubscription.subscriptionValidTill || 0) : 0;
  const isExtensionDateInvalid = Boolean(
    extensionDate && currentTillTs > 0 && new Date(extensionDate).getTime() <= currentTillTs
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscriptionError(null);

    if (!selectedCompanyId) {
      setSubscriptionError('Please select an organization.');
      return;
    }

    if (!currentSubscription) {
      setSubscriptionError('No active subscription loaded for selected organization.');
      return;
    }

    if (!selectedPlanId) {
      setSubscriptionError('Selected subscription plan is invalid.');
      return;
    }

    if (isLicenseCountInvalid) {
      setSubscriptionError(`Allocated licenses cannot be lower than the licenses already in use (${licenseCountUsed}).`);
      return;
    }

    if (isExtensionDateInvalid) {
      setSubscriptionError('Subscription expiry date must be later than the current expiry date.');
      return;
    }

    const validFrom = Number(currentSubscription.subscriptionValidFrom || currentSubscription.validFrom || Date.now());
    const validTill = extensionDate
      ? new Date(extensionDate).getTime()
      : Number(currentSubscription.subscriptionValidTill || currentSubscription.validTill || Date.now());

    let finalTenure = paymentTenure || currentSubscription?.paymentTenure || 'MONTHLY';
    finalTenure = finalTenure.toUpperCase().trim();
    if (finalTenure === 'ANNUALLY' || finalTenure === 'YEARLY') finalTenure = 'ANNUAL';
    if (finalTenure === 'HALF YEARLY') finalTenure = 'HALF_YEARLY';
    if (!['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL'].includes(finalTenure)) {
      finalTenure = 'MONTHLY'; // Fallback to safe default if completely unknown
    }

    const recurringAutoDebit = Boolean(
      currentSubscription.isRecurringAutoDebit ?? currentSubscription.recurringAutoDebit ?? false
    );

    const payload = {
      organizationId: selectedCompanyId,
      planId: selectedPlanId,
      planName: selectedPlanName, // Exact internal planName required by Paymaster DB (e.g. ALL_IN_ONE_PLAN)
      validFrom,
      validTill,
      licenseCount: numAllocated,
      paymentTenure: finalTenure,
      recurringAutoDebit
    };

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      await salesService.updateSubscription(payload);
      setIsSuccess(true);
      setShowSuccessModal(true);
      // Refresh subscription details from backend to ensure DB state reflection
      await handleSelectCompany(selectedCompanyId);
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setSubscriptionError(err.message || 'Failed to update organization subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 overflow-y-auto bg-slate-50 text-[#000000]">

      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4 bg-white border border-[#E5E7EB] text-[#000000] shadow-sm">
          <Briefcase className="w-3.5 h-3.5 text-[#1D6FD8]" />
          Sales Operations
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-tight mb-2">
          Subscription Management
        </h1>
        <p className="text-[#000000] text-sm sm:text-base">
          Manage client subscription plans, license allocations, payment tenures, and billing expiry dates.
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Form Column */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300">

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

              {/* Field 1: Organization Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#000000] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#1D6FD8]" />
                  Organization
                </label>
                <div className="relative" ref={orgDropdownRef}>
                  {/* Combobox: single input that is both the trigger and the search field */}
                  <input
                    ref={orgInputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={isOrgDropdownOpen}
                    aria-autocomplete="list"
                    autoComplete="off"
                    disabled={isLoadingOrgs}
                    placeholder={isLoadingOrgs ? 'Loading organizations...' : 'Select an organization...'}
                    value={orgInputDisplayValue}
                    onChange={(e) => {
                      setOrgSearchQuery(e.target.value);
                      if (!isOrgDropdownOpen) setIsOrgDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsOrgDropdownOpen(true);
                      // Clear display so user types into an empty field
                      setOrgSearchQuery('');
                    }}
                    className="w-full appearance-none bg-white border border-[#E5E7EB] text-[#000000] text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:border-[#1D6FD8] focus:ring-2 focus:ring-[#1D6FD8]/20 transition-all placeholder:text-[#000000]/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  />

                  {/* Chevron icon */}
                  <div className="absolute top-3.5 right-4 flex items-center pointer-events-none text-[#1D6FD8]">
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isOrgDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>

                  {/* Dropdown list - rendered in-flow so outer container expands naturally */}
                  {isOrgDropdownOpen && (
                    <div className="mt-2 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar animate-scale-up z-20">
                      <div className="py-1">
                        {filteredOrgs.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-[#000000]">No organizations found</div>
                        ) : (
                          filteredOrgs.map(company => (
                            <button
                              key={company.organizationId}
                              type="button"
                              onMouseDown={(e) => {
                                // Use onMouseDown so the selection fires before onBlur closes the dropdown
                                e.preventDefault();
                                handleSelectCompany(company.organizationId);
                                setIsOrgDropdownOpen(false);
                                setOrgSearchQuery('');
                                orgInputRef.current?.blur();
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-slate-50 flex flex-col min-w-0 ${selectedCompanyId === company.organizationId ? 'bg-[#1D6FD8]/10 text-[#1D6FD8] font-bold' : 'text-[#000000]'
                                }`}
                            >
                              <span className="truncate w-full block">
                                {company.organizationName || `Unnamed (${company.organizationId.substring(0, 8)})`}
                              </span>
                              {company.accountId && (
                                <span className="text-[10px] text-[#000000]/70 font-mono mt-0.5 truncate w-full block">
                                  Account ID: {company.accountId}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Form Fields (Visible when org is selected) */}
              {isLoadingSubscription ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#1D6FD8]/30 border-t-[#1D6FD8] rounded-full animate-spin" />
                  <span className="text-[#000000] text-xs font-medium">Fetching organization subscription details...</span>
                </div>
              ) : selectedCompanyId && !currentSubscription ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center text-[#000000] text-sm">
                  <CreditCard className="w-8 h-8 text-[#1D6FD8] mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-[#000000]">No Subscription Found</p>
                  <p className="text-xs text-[#000000] mt-1">This organization does not have an active subscription record.</p>
                </div>
              ) : currentSubscription ? (
                <div className="space-y-6 animate-fade-in">

                  {/* Field 2: Organization Plan Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-[#000000] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#1D6FD8]" />
                      Organization Plan
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPlanId}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        disabled={isLoadingPlans || plans.length === 0}
                        className="w-full appearance-none bg-white border border-[#E5E7EB] text-[#000000] text-sm rounded-xl px-4 py-3.5 outline-none focus:border-[#1D6FD8] focus:ring-2 focus:ring-[#1D6FD8]/20 transition-all disabled:opacity-75 shadow-sm"
                      >
                        {isLoadingPlans ? (
                          <option value="">Loading plans...</option>
                        ) : plans.length === 0 ? (
                          <option value={selectedPlanId}>{selectedPlanDisplayName || 'Current Plan'}</option>
                        ) : (
                          <>
                            {selectedPlanId && !plans.some(p => p.planId === selectedPlanId) && (
                              <option value={selectedPlanId}>{selectedPlanDisplayName || selectedPlanId}</option>
                            )}
                            {plans.map((p: any) => {
                              const rawName = p.displayName || p.planName || '';
                              const baseName = rawName.split(' - ')[0].trim();
                              return (
                                <option key={p.planId} value={p.planId}>
                                  {baseName}
                                </option>
                              );
                            })}
                          </>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#1D6FD8]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Field 3: Payment Tenure Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-[#000000] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1D6FD8]" />
                      Payment Tenure
                    </label>
                    <div className="relative">
                      <select
                        value={paymentTenure}
                        onChange={(e) => setPaymentTenure(e.target.value)}
                        disabled={isLoadingSubscription || !currentSubscription}
                        className="w-full appearance-none bg-white border border-[#E5E7EB] text-[#000000] text-sm rounded-xl px-4 py-3.5 outline-none focus:border-[#1D6FD8] focus:ring-2 focus:ring-[#1D6FD8]/20 transition-all font-semibold uppercase shadow-sm"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="HALF_YEARLY">Half-Yearly</option>
                        <option value="ANNUAL">Annual</option>
                        {paymentTenure && !['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL'].includes(paymentTenure) && (
                          <option value={paymentTenure}>{paymentTenure}</option>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#1D6FD8]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Field 4: Allocated Licenses */}
                  <div>
                    <label className="block text-xs font-semibold text-[#000000] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#1D6FD8]" />
                      Allocated Licenses
                    </label>
                    <input
                      type="number"
                      min={licenseCountUsed || 1}
                      value={allocatedLicenses}
                      onChange={(e) => setAllocatedLicenses(e.target.value)}
                      placeholder="Enter license count"
                      className={`w-full bg-white border ${isLicenseCountInvalid ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#1D6FD8] focus:ring-[#1D6FD8]/20'
                        } text-[#000000] text-sm rounded-xl px-4 py-3.5 outline-none focus:ring-2 transition-all shadow-sm placeholder:text-[#000000]/60`}
                    />
                    <div className="flex items-center justify-between text-xs mt-2 px-1">
                      <span className="text-[#000000]">
                        Licenses Used: <strong className="text-[#000000]">{licenseCountUsed}</strong> <span className="text-[#000000]/70">(read-only)</span>
                      </span>
                      {isLicenseCountInvalid && (
                        <span className="text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          Cannot be lower than used ({licenseCountUsed})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Field 5: Expiry Dates */}
                  <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
                    <div className="flex justify-between items-center bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-xs">
                      <span className="text-[#000000] font-medium">Current Subscription Expiry</span>
                      <span className="text-[#000000] font-semibold flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#1D6FD8]" />
                        {formatTimestamp(currentSubscription.subscriptionValidTill)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#000000] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1D6FD8]" />
                        Extend Subscription Until
                      </label>
                      <input
                        type="date"
                        value={extensionDate}
                        min={getMinExtensionDate(currentSubscription.subscriptionValidTill)}
                        onChange={(e) => setExtensionDate(e.target.value)}
                        className={`w-full bg-white border ${isExtensionDateInvalid ? 'border-rose-500 focus:border-rose-500' : 'border-[#E5E7EB] focus:border-[#1D6FD8]'
                          } text-[#000000] text-sm rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#1D6FD8]/20 transition-all custom-calendar-icon shadow-sm`}
                      />
                      {isExtensionDateInvalid && (
                        <p className="text-rose-600 text-xs font-medium mt-1.5 px-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          Expiry date must be later than current expiry date.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center text-[#000000] text-xs">
                  Select an organization above to manage subscription details.
                </div>
              )}

              {/* Error & Success Messages & Submit Button */}
              <div className="pt-2 space-y-4">
                {subscriptionError && (
                  <div className="w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{subscriptionError}</span>
                  </div>
                )}
                {orgsError && (
                  <div className="w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{orgsError}</span>
                  </div>
                )}

                {isSuccess ? (
                  <div className="w-full py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Subscription Updated Successfully!
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      !currentSubscription ||
                      !selectedCompanyId ||
                      !selectedPlanId ||
                      isLicenseCountInvalid ||
                      isExtensionDateInvalid ||
                      isSubmitting
                    }
                    className="w-full py-3.5 rounded-full bg-[#1D6FD8] hover:bg-[#1565C0] active:scale-[0.98] text-[#FFFFFF] font-bold text-sm transition-all duration-200 shadow-md shadow-[#1D6FD8]/25 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Update Subscription
                        <ArrowRight className="w-4 h-4 text-[#FFFFFF]" />
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
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm space-y-4">
            <h3 className="text-[#000000] font-extrabold flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-[#1D6FD8]" />
              Subscription Management Guidelines
            </h3>
            <ul className="space-y-3 text-xs text-[#000000] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D6FD8] mt-1.5 shrink-0" />
                Select an organization to load its active subscription and plan options.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D6FD8] mt-1.5 shrink-0" />
                Changing the organization plan or payment tenure updates the backend payload dynamically.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D6FD8] mt-1.5 shrink-0" />
                Allocated license count cannot be set lower than the licenses currently in use.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D6FD8] mt-1.5 shrink-0" />
                Extending subscription expiry is optional; if left unchanged, the current expiry date is maintained.
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Success Modal Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-[#000000]/60 hover:text-[#000000] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#000000] mb-2">Subscription Updated!</h2>
              <p className="text-[#000000] text-sm mb-6">
                The subscription details for <span className="text-[#1D6FD8] font-bold">{selectedCompanyName}</span> have been successfully saved.
              </p>
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 w-full mb-6 text-left space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#000000]/70">Plan Name</span>
                  <span className="text-[#000000] font-bold">{selectedPlanDisplayName || selectedPlanName || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#E5E7EB] pt-2.5">
                  <span className="text-[#000000]/70">Payment Tenure</span>
                  <span className="text-[#1D6FD8] font-bold uppercase">{paymentTenure}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#E5E7EB] pt-2.5">
                  <span className="text-[#000000]/70">Allocated Licenses</span>
                  <span className="text-[#000000] font-bold">{allocatedLicenses}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-[#E5E7EB] pt-2.5">
                  <span className="text-[#000000]/70">Expiry Date</span>
                  <span className="text-emerald-700 font-bold">{formatTimestamp(currentSubscription?.subscriptionValidTill)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 rounded-full bg-[#1D6FD8] hover:bg-[#1565C0] text-[#FFFFFF] font-bold text-sm transition-all shadow-md shadow-[#1D6FD8]/25"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom calendar icon styling & keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-calendar-icon::-webkit-calendar-picker-indicator {
          filter: none;
          opacity: 0.6;
          cursor: pointer;
        }
        .custom-calendar-icon::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
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
      `}} />
    </div>
  );
}
