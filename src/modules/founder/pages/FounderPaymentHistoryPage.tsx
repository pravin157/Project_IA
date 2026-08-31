"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Search,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Layers,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { salesService } from '@/services/salesService';
import { organizationService } from '@/services/organizationService';

interface PaymentHistoryItem {
  sphId: string;
  organizationId: string;
  paymentGateway: string;
  planId: string;
  planName: string;
  paymentMethodId: string;
  paymentGatewayReferenceId: string;
  paymentTransactionStatus: string;
  createdBy: string;
  paidAt?: string | number;
  amount?: number;
  frequency?: number;
  receiptId: string;
  externalUrl?: string;
  createdAt: string | number;
  updatedAt: string | number;
  name?: string;
  email?: string;
  organizationName?: string;
  orgName?: string;
}

interface OrganizationOption {
  organizationId: string;
  organizationName: string;
  accountId?: string;
}

const CURRENCY_MAP: Record<string, string> = {
  IN: '₹',
  US: '$',
  GB: '£',
  CA: '$',
  AU: '$',
  SG: '$',
  AE: 'AED ',
  MY: 'RM ',
  ZA: 'R ',
  MX: '$',
  GLOBAL: '$'
};

const getCurrencySymbol = (countryCode: string) => {
  return CURRENCY_MAP[countryCode?.toUpperCase()] || '$';
};

export default function FounderPaymentHistoryPage() {
  // Data State
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // Filter States
  const [searchParam, setSearchParam] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Custom Dropdown / Combobox State
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

  const selectedOrgDisplayName = useMemo(() => {
    if (!selectedOrgId) return '';
    const org = organizations.find(o => o.organizationId === selectedOrgId);
    if (!org) return selectedOrgId;
    return org.organizationName + (org.accountId ? ` (${org.accountId})` : '');
  }, [selectedOrgId, organizations]);

  const orgInputDisplayValue = isOrgDropdownOpen
    ? orgSearchQuery
    : (selectedOrgDisplayName || '');

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drawer States
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [isLoadingLineItems, setIsLoadingLineItems] = useState(false);

  // Load organizations on mount
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const orgs = await organizationService.getOrganizations();
        setOrganizations(orgs || []);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };
    fetchOrgs();
  }, []);

  // Fetch paginated table payment history
  const fetchPaymentHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filtersObj: any = {
        pageNumber,
        rowsPerPage
      };

      if (searchParam.trim()) {
        filtersObj.searchParam = searchParam.trim();
      }
      if (selectedOrgId) {
        filtersObj.organizationId = selectedOrgId;
      }
      if (statusFilter) {
        filtersObj.paymentTransactionStatus = statusFilter;
      }
      if (startDateStr) {
        filtersObj.startDate = new Date(startDateStr).getTime();
      }
      if (endDateStr) {
        // End of the selected day
        filtersObj.endDate = new Date(`${endDateStr}T23:59:59.999Z`).getTime();
      }

      const data = await salesService.getPaymentHistory(filtersObj);
      setPayments(data.result || []);
      setTotalCount(data.totalCount || 0);
      setPageCount(data.pageCount || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching payment history.');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run search/filter fetch
  useEffect(() => {
    fetchPaymentHistory();
  }, [pageNumber, rowsPerPage, selectedOrgId, statusFilter, startDateStr, endDateStr]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageNumber(1);
    fetchPaymentHistory();
  };

  const handleClearFilters = () => {
    setSearchParam('');
    setSelectedOrgId('');
    setStatusFilter('');
    setStartDateStr('');
    setEndDateStr('');
    setPageNumber(1);
    setOrgSearchQuery('');
  };

  // Drawer detail actions
  const handleOpenDrawer = async (payment: PaymentHistoryItem) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
    setIsLoadingLineItems(true);
    setLineItems([]);

    try {
      const items = await salesService.getReceiptLineItems(payment.sphId);
      setLineItems(items || []);
    } catch (err) {
      console.error('Error fetching line items:', err);
    } finally {
      setIsLoadingLineItems(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPayment(null);
    setLineItems([]);
  };

  // Copy helper
  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${type}-${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format Helper functions
  const formatDate = (epochStrOrNum: any) => {
    if (!epochStrOrNum) return 'N/A';
    const epoch = Number(epochStrOrNum);
    if (isNaN(epoch)) return String(epochStrOrNum);
    return new Date(epoch).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDisplayName = (name?: string): string => {
    if (!name) return '';
    return name
      .replace(/\bnull\b/gi, '')
      .replace(/\bundefined\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getOrgName = (paymentOrId: PaymentHistoryItem | string) => {
    if (typeof paymentOrId === 'object' && paymentOrId !== null) {
      const directName = formatDisplayName(paymentOrId.organizationName || paymentOrId.orgName);
      if (directName) return directName;

      const cleanOrgId = (paymentOrId.organizationId || '').trim().toLowerCase();
      if (cleanOrgId && organizations.length > 0) {
        const org = organizations.find(o =>
          (o.organizationId && o.organizationId.trim().toLowerCase() === cleanOrgId) ||
          (o.accountId && o.accountId.trim().toLowerCase() === cleanOrgId) ||
          ((o as any).id && String((o as any).id).trim().toLowerCase() === cleanOrgId) ||
          ((o as any).orgId && String((o as any).orgId).trim().toLowerCase() === cleanOrgId)
        );
        if (org) {
          const orgNameResolved = formatDisplayName(org.organizationName || (org as any).name);
          if (orgNameResolved) return orgNameResolved;
        }
      }

      const paymentName = formatDisplayName(paymentOrId.name);
      if (paymentName) {
        return paymentName;
      }

      const rawId = paymentOrId.organizationId;
      if (rawId && /^[0-9a-fA-F-]{36}$/.test(rawId.trim())) {
        return `Organization (${rawId.trim().substring(0, 8)}...)`;
      }
      return rawId || 'N/A';
    }

    const cleanOrgId = (paymentOrId || '').trim().toLowerCase();
    if (cleanOrgId && organizations.length > 0) {
      const org = organizations.find(o =>
        (o.organizationId && o.organizationId.trim().toLowerCase() === cleanOrgId) ||
        (o.accountId && o.accountId.trim().toLowerCase() === cleanOrgId) ||
        ((o as any).id && String((o as any).id).trim().toLowerCase() === cleanOrgId) ||
        ((o as any).orgId && String((o as any).orgId).trim().toLowerCase() === cleanOrgId)
      );
      if (org) {
        const orgNameResolved = formatDisplayName(org.organizationName || (org as any).name);
        if (orgNameResolved) return orgNameResolved;
      }
    }

    if (typeof paymentOrId === 'string' && /^[0-9a-fA-F-]{36}$/.test(paymentOrId.trim())) {
      return `Organization (${paymentOrId.trim().substring(0, 8)}...)`;
    }

    return paymentOrId || 'N/A';
  };

  const getOrgAccountId = (orgId: string) => {
    if (!orgId) return '';
    const cleanOrgId = orgId.trim().toLowerCase();
    const org = organizations.find(o =>
      (o.organizationId && o.organizationId.trim().toLowerCase() === cleanOrgId) ||
      (o.accountId && o.accountId.trim().toLowerCase() === cleanOrgId) ||
      ((o as any).id && String((o as any).id).trim().toLowerCase() === cleanOrgId) ||
      ((o as any).orgId && String((o as any).orgId).trim().toLowerCase() === cleanOrgId)
    );
    return org && org.accountId ? `Account: ${org.accountId}` : '';
  };

  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 overflow-y-auto bg-slate-50 text-slate-800 relative">

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3"
            style={{ background: 'rgba(25,118,210,0.1)', color: '#1976D2', border: '1px solid rgba(25,118,210,0.2)' }}>
            <Layers className="w-3.5 h-3.5" />
            Founder Module
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 flex items-center gap-3">
            Subscription Payment History
            {isLoading && (
              <RotateCw className="w-5 h-5 text-[#1976D2] animate-spin" />
            )}
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Audit payment receipts, track transaction status, and filter payment history by organizations and date ranges.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={() => { fetchPaymentHistory(); }}
            disabled={isLoading}
            className="p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-slate-200 disabled:opacity-50 shadow-sm flex items-center justify-center"
            title="Refresh payment history"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/dashboard/sales/receipt"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-sm transition-all duration-200 shadow-md shadow-[#1976D2]/25"
          >
            Create Manual Receipt
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Error Alert */}
        {error && (
          <div className="w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex gap-2 items-center animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters and Search Accordion */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">

            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Receipt ID, Gateway Ref..."
                value={searchParam}
                onChange={(e) => setSearchParam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#1976D2] focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Organization Searchable Dropdown */}
            <div className="lg:col-span-3 relative" ref={orgDropdownRef}>
              <input
                ref={orgInputRef}
                type="text"
                role="combobox"
                aria-expanded={isOrgDropdownOpen}
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="All Organizations"
                value={orgInputDisplayValue}
                onChange={(e) => {
                  setOrgSearchQuery(e.target.value);
                  if (!isOrgDropdownOpen) setIsOrgDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsOrgDropdownOpen(true);
                  setOrgSearchQuery('');
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-3.5 pr-10 py-3 outline-none focus:border-[#1976D2] focus:bg-white transition-all cursor-pointer font-medium placeholder:text-slate-500 truncate"
              />

              {/* Chevron Icon */}
              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className={`w-4 h-4 transition-transform duration-200 ${isOrgDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>

              {/* Dropdown Menu - Constrained to parent box width */}
              {isOrgDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <div className="py-1">
                    {/* All Organizations option */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedOrgId('');
                        setIsOrgDropdownOpen(false);
                        setOrgSearchQuery('');
                        orgInputRef.current?.blur();
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-slate-100 flex flex-col min-w-0 ${!selectedOrgId ? 'bg-sky-50 text-[#1976D2] font-semibold' : 'text-slate-700'
                        }`}
                    >
                      <span className="truncate w-full block font-medium">All Organizations</span>
                    </button>

                    {filteredOrgs.length === 0 ? (
                      <div className="px-3.5 py-2.5 text-xs text-slate-400">No organizations found</div>
                    ) : (
                      filteredOrgs.map(org => (
                        <button
                          key={org.organizationId}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedOrgId(org.organizationId);
                            setIsOrgDropdownOpen(false);
                            setOrgSearchQuery('');
                            orgInputRef.current?.blur();
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-slate-100 flex flex-col min-w-0 ${selectedOrgId === org.organizationId ? 'bg-sky-50 text-[#1976D2] font-semibold' : 'text-slate-700'
                            }`}
                        >
                          <span className="truncate w-full block font-medium">
                            {org.organizationName || `Unnamed (${org.organizationId.substring(0, 8)})`}
                          </span>
                          {org.accountId && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate w-full block">
                              Account ID: {org.accountId}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-3 outline-none focus:border-[#1976D2] focus:bg-white transition-all cursor-pointer font-medium"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Date Range Group */}
            <div className="lg:col-span-3 flex gap-2">
              <div className="relative w-full">
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-3 outline-none focus:border-[#1976D2] focus:bg-white transition-all font-mono"
                  title="Start Date"
                />
              </div>
              <div className="relative w-full">
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-3 outline-none focus:border-[#1976D2] focus:bg-white transition-all font-mono"
                  title="End Date"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="lg:col-span-12 flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-xs transition-all shadow-sm shadow-[#1976D2]/10 flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Apply Filters
              </button>
            </div>

          </form>
        </div>

        {/* Payments Table Component */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading transaction history...</p>
            </div>
          ) : payments.length > 0 ? (
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="py-4 px-6 whitespace-nowrap">Receipt ID</th>
                      <th className="py-4 px-6 whitespace-nowrap">Organization</th>
                      <th className="py-4 px-6 whitespace-nowrap">Plan Info</th>
                      <th className="py-4 px-6 whitespace-nowrap">Gateway / Reference</th>
                      <th className="py-4 px-6 whitespace-nowrap">Paid Date</th>
                      <th className="py-4 px-6 text-right whitespace-nowrap">Amount</th>
                      <th className="py-4 px-6 text-center whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((payment) => {
                      const amountFormatted = payment.amount ? (payment.amount / 100).toFixed(2) : '0.00';
                      const gateway = payment.paymentGateway || 'MANUAL';

                      // Status color logic
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {payment.paymentTransactionStatus || 'PENDING'}
                        </span>
                      );
                      if (payment.paymentTransactionStatus === 'SUCCESS' || payment.paymentTransactionStatus === 'PAYMENT_SUCCEEDED') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Success
                          </span>
                        );
                      } else if (payment.paymentTransactionStatus === 'FAILED') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Failed
                          </span>
                        );
                      }

                      const receiptUrl = payment.receiptId
                        ? `https://app.intoaec.ai/subscription/receipt?receiptId=${payment.receiptId}`
                        : '#';

                      return (
                        <tr key={payment.sphId} className="hover:bg-slate-50/80 transition-all">
                          {/* Receipt ID */}
                          <td className="py-4 px-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {payment.receiptId ? (
                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#1976D2] hover:underline inline-flex items-center gap-1 font-bold"
                                title="View Receipt"
                              >
                                {payment.receiptId}
                                <ExternalLink className="w-3 h-3 text-[#1976D2]/70" />
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>

                          {/* Organization */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                {getOrgName(payment)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {getOrgAccountId(payment.organizationId) || (payment.organizationId ? `ID: ${payment.organizationId.length > 16 ? payment.organizationId.substring(0, 16) + '...' : payment.organizationId}` : '')}
                              </span>
                            </div>
                          </td>

                          {/* Plan Info */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{payment.planName}</span>
                              <span className="text-[10px] text-slate-500">
                                {payment.frequency ? `${payment.frequency} Month(s)` : ''}
                              </span>
                            </div>
                          </td>

                          {/* Gateway / Reference */}
                          <td className="py-4 px-6 font-mono">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500 bg-[#1976D2]/10 text-[#1976D2] border border-[#1976D2]/20 px-1.5 py-0.5 rounded w-max">
                                {gateway}
                              </span>
                              {payment.paymentGatewayReferenceId && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 group">
                                  <span>{payment.paymentGatewayReferenceId.substring(0, 16)}...</span>
                                  <button
                                    onClick={() => handleCopyText(payment.paymentGatewayReferenceId, 'ref')}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 transition-all text-slate-500"
                                    title="Copy reference ID"
                                  >
                                    <Clipboard className="w-3 h-3" />
                                  </button>
                                  {copiedId === `ref-${payment.paymentGatewayReferenceId}` && (
                                    <span className="text-[9px] text-emerald-600 font-sans">Copied!</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Paid Date */}
                          <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-955">
                            {getCurrencySymbol('US')}{amountFormatted}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 text-center">
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                <div className="text-slate-500 text-xs">
                  Showing <span className="font-semibold text-slate-700">{((pageNumber - 1) * rowsPerPage) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(pageNumber * rowsPerPage, totalCount)}</span> of <span className="font-semibold text-slate-700">{totalCount}</span> entries
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span>Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPageNumber(1); }}
                      className="bg-white border border-slate-300 rounded px-2 py-1 outline-none text-slate-700 cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                      disabled={pageNumber === 1}
                      className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-600">
                      Page <span className="font-semibold">{pageNumber}</span> of {pageCount || 1}
                    </span>
                    <button
                      onClick={() => setPageNumber(p => Math.min(p + 1, pageCount))}
                      disabled={pageNumber >= pageCount}
                      className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <CreditCard className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No payment transaction records found</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  No payment events match the selected filter configuration. Adjust the filters or click clear filters to view all records.
                </p>
                {(searchParam || selectedOrgId || statusFilter || startDateStr || endDateStr) && (
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-xs transition-all"
                  >
                    Clear Search Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Transaction Details Slide-over Drawer */}
      {isDrawerOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Overlay */}
            <div
              onClick={handleCloseDrawer}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              {/* Panel */}
              <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-all duration-300 ease-in-out border-l border-slate-200 flex flex-col h-full animate-slide-in">

                {/* Drawer Header */}
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Transaction Detail</h2>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{selectedPayment.receiptId || 'Receipt Record'}</p>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                  {/* Amount / Status Overview */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Paid Amount</span>
                      <h3 className="text-2xl font-black text-slate-955 mt-0.5 font-mono">
                        {getCurrencySymbol('US')}{selectedPayment.amount ? (selectedPayment.amount / 100).toFixed(2) : '0.00'}
                      </h3>
                    </div>
                    <div>
                      {selectedPayment.paymentTransactionStatus === 'SUCCESS' || selectedPayment.paymentTransactionStatus === 'PAYMENT_SUCCEEDED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          SUCCESS
                        </span>
                      ) : selectedPayment.paymentTransactionStatus === 'FAILED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          FAILED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {selectedPayment.paymentTransactionStatus || 'PENDING'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                      Payment Parameters
                    </h4>

                    <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Payment Gateway</span>
                        <span className="font-bold text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200 w-max inline-block">
                          {selectedPayment.paymentGateway}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Billing Tenure</span>
                        <span className="font-semibold text-slate-800">
                          {selectedPayment.frequency ? `${selectedPayment.frequency} Month(s)` : 'N/A'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block mb-0.5">Gateway Reference ID</span>
                        <div className="flex items-center gap-2 group">
                          <span className="font-mono text-slate-800 bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] select-all break-all w-full block">
                            {selectedPayment.paymentGatewayReferenceId || 'N/A'}
                          </span>
                          {selectedPayment.paymentGatewayReferenceId && (
                            <button
                              onClick={() => handleCopyText(selectedPayment.paymentGatewayReferenceId, 'ref_drawer')}
                              className="p-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                              title="Copy Reference"
                            >
                              <Clipboard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {copiedId === 'ref_drawer-' + selectedPayment.paymentGatewayReferenceId && (
                          <span className="text-[10px] text-emerald-600 block mt-1">Copied successfully!</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Transaction ID</span>
                        <span className="font-mono text-slate-800 font-medium">#{selectedPayment.sphId.split('-')[0]}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Created By</span>
                        <span className="font-semibold text-slate-800">{selectedPayment.createdBy || 'SYSTEM'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Paid On Time</span>
                        <span className="font-medium text-slate-800">{formatDate(selectedPayment.paidAt || selectedPayment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#1976D2]" />
                      Organization & Customer
                    </h4>

                    <div className="text-xs space-y-2">
                      <div className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Organization Name</span>
                          <span className="font-extrabold text-slate-900">{getOrgName(selectedPayment)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <div>Org UUID: <span className="text-slate-600">{selectedPayment.organizationId.substring(0, 18)}...</span></div>
                          <button
                            onClick={() => handleCopyText(selectedPayment.organizationId, 'org_uuid')}
                            className="text-[#1976D2] hover:underline font-bold font-sans"
                          >
                            Copy ID
                          </button>
                        </div>
                        {copiedId === `org_uuid-${selectedPayment.organizationId}` && (
                          <span className="text-[9px] text-emerald-600 font-sans block">Copied Organization ID!</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {selectedPayment.name && formatDisplayName(selectedPayment.name) && (
                          <div>
                            <span className="text-slate-400 block mb-0.5">Billing Name</span>
                            <span className="font-semibold text-slate-800">{formatDisplayName(selectedPayment.name)}</span>
                          </div>
                        )}
                        {selectedPayment.email && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block mb-0.5">Billing Email</span>
                            <span className="font-mono text-slate-800 break-all">{selectedPayment.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Entitled Items / Line Items */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#1976D2]" />
                      Subscription Line Items
                    </h4>

                    {isLoadingLineItems ? (
                      <div className="py-6 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-slate-400">Fetching receipt items...</span>
                      </div>
                    ) : lineItems.length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {lineItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50/20 text-xs">
                            <div className="max-w-[70%]">
                              <p className="font-semibold text-slate-800 break-words">{item.description}</p>
                              {item.quantity > 1 && (
                                <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                              )}
                            </div>
                            <div className="text-right font-mono font-bold text-slate-900">
                              {item.isDiscount ? '-' : ''}${Number(item.amount).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-xs text-slate-400">No itemized details exist or gateway transaction</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Animations styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

    </div>
  );
}
