"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Globe,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Loader2
} from 'lucide-react';
import { salesService } from '@/services/salesService';

export interface ReceiptData {
  id: string;
  aecId: string;
  dateTime: string;
  amount: string | number;
  duration: string;
  numberOfUsers: string | number;
  countryCode: string;
  currencySymbol?: string;
  currencyCode?: string;
  planName: string;
  createdAt: string;
}

const DEFAULT_PLANS = [
  'All in One Plan'
];

const DURATION_OPTIONS = [
  'Monthly',
  'Annually',
  'Half Yearly',
  'Quarterly'
];

const DEFAULT_COUNTRIES = [
  { code: 'US', name: 'United States (US)' },
  { code: 'IN', name: 'India (IN)' },
  { code: 'GB', name: 'United Kingdom (GB)' },
  { code: 'CA', name: 'Canada (CA)' },
  { code: 'AU', name: 'Australia (AU)' },
  { code: 'SG', name: 'Singapore (SG)' },
  { code: 'AE', name: 'United Arab Emirates (AE)' },
  { code: 'MY', name: 'Malaysia (MY)' },
  { code: 'ZA', name: 'South Africa (ZA)' },
  { code: 'MX', name: 'Mexico (MX)' }
];

export default function ReceiptGeneratorPage() {
  // Get current local date and time formatted for datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    aecId: '',
    dateTime: getCurrentDateTime(),
    amount: '',
    duration: 'Annually',
    numberOfUsers: '10',
    countryCode: 'US',
    planName: 'All in One Plan'
  });

  const [countryOptions, setCountryOptions] = useState(DEFAULT_COUNTRIES);


  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [countryName, setCountryName] = useState<string>('United States');
  const [isLoadingGateway, setIsLoadingGateway] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptHistory, setReceiptHistory] = useState<ReceiptData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Organization verification states
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [isLoadingOrg, setIsLoadingOrg] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState(false);

  const handleVerifyOrganization = async (accountIdToVerify?: string) => {
    const targetId = accountIdToVerify || formData.aecId;
    if (!targetId.trim()) {
      setOrgError('Please enter an AEC ID first.');
      return;
    }

    setIsLoadingOrg(true);
    setOrgError(null);
    setOrgSuccess(false);
    setOrganizations([]);
    setSelectedOrganizationId('');

    try {
      const response = await salesService.getOrganizationByAccountId(targetId.trim());

      if (!response) {
        setOrgError('Organization API failure: No response received from server.');
        return;
      }

      let org = null;
      if (response.status === 200 && response.body) {
        org = response.body;
      } else if (response.body) {
        org = response.body;
      } else if (response.organizationId) {
        org = response;
      }

      if (!org || !org.organizationId) {
        setOrgError('Empty organization response: No valid organization details or organizationId found.');
        return;
      }

      setOrganizations([org]);
      setSelectedOrganizationId(org.organizationId);
      setOrgSuccess(true);

      const orgCountryCode = (org.countryCode || org.country || '').toUpperCase();
      if (orgCountryCode) {
        setCountryOptions(prev => {
          if (!prev.some(opt => opt.code === orgCountryCode)) {
            return [...prev, { code: orgCountryCode, name: `${orgCountryCode} (Auto-detected)` }];
          }
          return prev;
        });
        setFormData(prev => ({ ...prev, countryCode: orgCountryCode }));
      }

    } catch (err: any) {
      console.error('Error verifying organization:', err);
      setOrgError(err.message || 'Network error: Failed to reach the organization service.');
    } finally {
      setIsLoadingOrg(false);
    }
  };

  // Fetch Payment Gateway & Currency details whenever countryCode (2 chars) changes
  useEffect(() => {
    if (formData.countryCode.length === 2) {
      let isMounted = true;
      setIsLoadingGateway(true);

      salesService.getPaymentGatewayDetails(formData.countryCode)
        .then((details) => {
          if (!isMounted) return;
          if (details && details.currencySymbol) {
            setCurrencySymbol(details.currencySymbol);
            if (details.currencyCode) setCurrencyCode(details.currencyCode);
            if (details.countryName) setCountryName(details.countryName);
          } else {
            // Fallback to default
            setCurrencySymbol('$');
            setCurrencyCode('USD');
            setCountryName('');
          }
        })
        .catch((err) => {
          console.error('Error fetching payment gateway details:', err);
          if (isMounted) {
            setCurrencySymbol('$');
            setCurrencyCode('USD');
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingGateway(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [formData.countryCode]);

  // Load receipt history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('intoaec_receipt_history');
      if (saved) {
        setReceiptHistory(JSON.parse(saved));
      } else {
        // Initial sample receipts
        const initialSample: ReceiptData[] = [
          {
            id: 'REC-2026-88101',
            aecId: 'AEC-3078',
            dateTime: '2026-08-07T10:30',
            amount: 4999.00,
            duration: 'Annually',
            numberOfUsers: 25,
            countryCode: 'US',
            currencySymbol: '$',
            currencyCode: 'USD',
            planName: 'All in One Plan',
            createdAt: new Date().toISOString()
          },
          {
            id: 'REC-2026-88095',
            aecId: 'AEC-3104',
            dateTime: '2026-08-06T14:15',
            amount: 149999.00,
            duration: 'Quarterly',
            numberOfUsers: 10,
            countryCode: 'IN',
            currencySymbol: '₹',
            currencyCode: 'INR',
            planName: 'All in One Plan',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setReceiptHistory(initialSample);
        localStorage.setItem('intoaec_receipt_history', JSON.stringify(initialSample));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveHistory = (newList: ReceiptData[]) => {
    setReceiptHistory(newList);
    try {
      localStorage.setItem('intoaec_receipt_history', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'aecId') {
      setOrganizations([]);
      setOrgSuccess(false);
      setOrgError(null);
      setSelectedOrganizationId('');
    }

    if (name === 'countryCode') {
      // Restrict strictly to 2 characters uppercase
      const sanitized = value.toUpperCase().slice(0, 2);
      setFormData(prev => ({ ...prev, countryCode: sanitized }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    setIsSuccess(false);
    setError(null);
  };

  // Helper to format date-time string to "DD-MM-YYYY HH:mm:ss" format
  const formatPaidOn = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return dateTimeStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateTimeStr;
    }
  };

  const mapDuration = (duration: string) => {
    switch (duration) {
      case 'Annually':
        return 'ANNUAL';
      case 'Monthly':
        return 'MONTHLY';
      case 'Quarterly':
        return 'QUARTERLY';
      case 'Half Yearly':
        return 'HALF_YEARLY';
      default:
        return duration.toUpperCase();
    }
  };

  const mapPlanName = (planName: string) => {
    return planName.toUpperCase().replace(/\s+/g, '_');
  };

  const handleGenerateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);
    setError(null);

    // Validation checks as required by Prompt
    if (!selectedOrganizationId) {
      setError('Organization selection missing. Please select an organization first.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.dateTime) {
      setError('Payment date and time is required.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount Paid greater than 0.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.duration) {
      setError('Duration is required.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.numberOfUsers || Number(formData.numberOfUsers) <= 0) {
      setError('Number of users must be at least 1.');
      setIsSubmitting(false);
      return;
    }

    if (formData.countryCode.length !== 2) {
      setError('Country code must be exactly 2 characters (e.g. US, IN, GB).');
      setIsSubmitting(false);
      return;
    }

    if (!formData.planName) {
      setError('Plan name is required.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.aecId.trim()) {
      setError('AEC ID (AEC Number) is required.');
      setIsSubmitting(false);
      return;
    }

    const selectedOrg = organizations.find(org => org.organizationId === selectedOrganizationId);

    const receiptData = {
      organizationId: selectedOrganizationId,
      paidOn: formatPaidOn(formData.dateTime),
      amountPaid: Number(formData.amount),
      duration: mapDuration(formData.duration),
      numUsers: Number(formData.numberOfUsers),
      country: formData.countryCode.toUpperCase(),
      planName: mapPlanName(formData.planName),
      aecNumber: formData.aecId.trim(),
      name: selectedOrg?.organizationName || '',
      email: selectedOrg?.emailAddress || ''
    };

    try {
      // Call CREATE_MANUAL_RECEIPT API
      const response = await salesService.createManualReceipt(receiptData);

      if (!response) {
        throw new Error('Invalid receipt API response: No response received.');
      }

      // Extract generated receipt ID if available, otherwise throw error
      if (!response.body || !response.body.receiptId) {
        throw new Error('Invalid receipt API response: Missing response.body.receiptId.');
      }

      const receiptId = response.body.receiptId;
      const receiptUrl = `https://app.aecplayhouse.com/subscription/receipt?receiptId=${receiptId}`;

      const newReceipt: ReceiptData = {
        id: receiptId,
        aecId: formData.aecId.trim(),
        dateTime: formData.dateTime,
        amount: Number(formData.amount),
        duration: formData.duration,
        numberOfUsers: Number(formData.numberOfUsers),
        countryCode: formData.countryCode.toUpperCase(),
        planName: formData.planName,
        currencySymbol,
        currencyCode,
        createdAt: new Date().toISOString()
      };

      const updatedHistory = [newReceipt, ...receiptHistory];
      saveHistory(updatedHistory);

      setIsSuccess(true);

      // Only open the generated receipt in a new tab after it has been created successfully
      window.open(receiptUrl, "_blank");

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error generating manual receipt:', err);
      setError(err.message || 'Failed to generate manual receipt via the Admin API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = receiptHistory.filter(item => item.id !== id);
    saveHistory(updated);
  };

  const filteredHistory = receiptHistory.filter(item =>
    item.aecId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.countryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.planName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-10 overflow-y-auto bg-slate-50 text-slate-800">

      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3"
              style={{ background: 'rgba(25,118,210,0.1)', color: '#1976D2', border: '1px solid rgba(25,118,210,0.2)' }}>
              <FileText className="w-3.5 h-3.5" />
              Sales Module &bull; Receipt Generator
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 flex items-center gap-3">
              Receipt Generation
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold tracking-normal">
                Live Engine
              </span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">
              Generate and archive official payment receipts with automatic currency symbol detection.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-[#1976D2]/10 blur-3xl rounded-full pointer-events-none" />

          <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1976D2]" />
              Receipt Details Form
            </h2>
            <span className="text-xs text-slate-400 font-medium">All fields required</span>
          </div>

          <form onSubmit={handleGenerateReceipt} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* 1. AEC ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#1976D2]" />
                  AEC ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="aecId"
                    value={formData.aecId}
                    onChange={handleChange}
                    required
                    placeholder="e.g. AEC-3078"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all placeholder:text-slate-400 font-mono shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyOrganization()}
                    disabled={isLoadingOrg || !formData.aecId.trim()}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-bold text-slate-700 rounded-xl transition-all flex items-center gap-1.5 shrink-0 border border-slate-200"
                  >
                    {isLoadingOrg ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1976D2]" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-[#1976D2]" />
                    )}
                    Verify
                  </button>
                </div>

                {/* Status messages for Organization API */}
                {isLoadingOrg && (
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 animate-fade-in">
                    <Loader2 className="w-3 h-3 animate-spin text-[#1976D2]" />
                    Verifying organization ID...
                  </p>
                )}

                {orgError && (
                  <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1.5 animate-fade-in">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    {orgError}
                  </p>
                )}

                {orgSuccess && organizations.length > 0 && (
                  <div className="mt-3 space-y-2.5 animate-fade-in">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Organization Verified
                      </p>
                      <div className="text-[10px] text-slate-600 font-mono space-y-0.5">
                        {organizations[0]?.organizationName && (
                          <div>Name: <span className="text-slate-900 font-bold">{organizations[0]?.organizationName}</span></div>
                        )}
                        <div>Account ID: <span className="text-slate-800">{organizations[0]?.accountId}</span></div>
                        <div>Org ID: <span className="text-slate-800">{organizations[0]?.organizationId}</span></div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#1976D2]" />
                        Select Organization for Receipt
                      </label>
                      <select
                        value={selectedOrganizationId}
                        onChange={(e) => setSelectedOrganizationId(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all font-mono cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>-- Select Organization --</option>
                        {organizations.map((org) => (
                          <option key={org.organizationId} value={org.organizationId}>
                            {org.organizationName || org.organizationId} (Account: {org.accountId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Date and Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1976D2]" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all shadow-sm"
                />
              </div>

              {/* 3. Country Code Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#1976D2]" />
                    Country Code
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Dropdown</span>
                </div>
                <div className="relative">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer font-mono shadow-sm"
                  >
                    {countryOptions.map((opt) => (
                      <option key={opt.code} value={opt.code} className="bg-white text-slate-900">
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow / Loading indicator */}
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none gap-2 text-slate-400">
                    {isLoadingGateway ? (
                      <Loader2 className="w-4 h-4 text-[#1976D2] animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    )}
                  </div>
                </div>
                {countryName && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>Detected Country:</span>
                    <strong className="text-slate-900">{countryName}</strong>
                  </p>
                )}
              </div>


              {/* 4. Amount with Dynamic Currency Symbol */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#1976D2]" />
                    Amount ({currencySymbol})
                  </label>
                  <span className="text-[10px] text-[#1976D2] font-mono font-bold bg-[#1976D2]/10 px-1.5 py-0.5 rounded border border-[#1976D2]/20">
                    {currencyCode} ({currencySymbol})
                  </span>
                </div>
                <div className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 flex items-center gap-2.5 focus-within:border-[#1976D2] focus-within:ring-2 focus-within:ring-[#1976D2]/20 transition-all shadow-sm">
                  <span className="text-[#1976D2] font-bold text-sm shrink-0 select-none font-mono">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 2499.00"
                    className="w-full bg-transparent text-slate-900 text-sm outline-none placeholder:text-slate-400 font-mono p-0 m-0 border-none focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* 5. Duration Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1976D2]" />
                  Duration
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer shadow-sm"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-white text-slate-900">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Number of Users */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1976D2]" />
                  Number of Users
                </label>
                <input
                  type="number"
                  name="numberOfUsers"
                  value={formData.numberOfUsers}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g. 10"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all placeholder:text-slate-400 font-mono shadow-sm"
                />
              </div>

            </div>

            {/* 7. Plan Name Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1976D2]" />
                Plan Name
              </label>
              <select
                name="planName"
                value={formData.planName}
                onChange={handleChange}
                required
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all cursor-pointer font-medium shadow-sm"
              >
                {DEFAULT_PLANS.map((plan) => (
                  <option key={plan} value={plan} className="bg-white text-slate-900">
                    {plan}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1976D2]" />
                Select subscriber entitlement plan. Default is <span className="text-[#1976D2] font-bold">All in One Plan</span>.
              </p>
            </div>

            {/* Submit & Error display */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              {error && (
                <div className="w-full p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {isSuccess ? (
                <div className="w-full py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Receipt Generated & Saved to History!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] active:scale-[0.98] text-white font-bold text-sm transition-all duration-200 shadow-md shadow-[#1976D2]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Generate & Save Receipt
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>

      {/* Generated Receipt History Table */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1976D2]" />
                Receipt Archive & History
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View and manage previously generated sales receipts with currency symbols.
              </p>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search AEC ID, Plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-4 py-2 outline-none focus:border-[#1976D2] transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold bg-slate-50">
                  <th className="py-3 px-4">Receipt ID</th>
                  <th className="py-3 px-4">AEC ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Users</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1976D2]">
                        <a
                          href={`https://app.aecplayhouse.com/subscription/receipt?receiptId=${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.id}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-900 font-bold">
                        {item.aecId}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.dateTime ? new Date(item.dateTime).toLocaleString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {item.planName}
                      </td>
                      <td className="py-3.5 px-4 text-amber-700 font-medium">
                        {item.duration}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.numberOfUsers}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-bold">
                          {item.countryCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-right">
                        {item.currencySymbol || '$'}{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          title="Delete Receipt"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No receipts found matching search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

