"use client";

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';

// Dummy data for companies
const MOCK_COMPANIES = [
  { id: '1', name: 'Acme Corporation', plan: 'Enterprise Plan', expiresAt: '2026-08-15' },
  { id: '2', name: 'Globex Inc', plan: 'Professional Plan', expiresAt: '2026-09-01' },
  { id: '3', name: 'Soylent Corp', plan: 'Starter Plan', expiresAt: '2026-08-05' },
  { id: '4', name: 'Initech', plan: 'Enterprise Plan', expiresAt: '2026-11-20' },
  { id: '5', name: 'Massive Dynamic', plan: 'Professional Plan', expiresAt: '2026-12-31' },
];

export default function SalesDashboardPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [extensionDate, setExtensionDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Find the currently selected company details
  const selectedCompany = useMemo(() => {
    return MOCK_COMPANIES.find(c => c.id === selectedCompanyId) || null;
  }, [selectedCompanyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !extensionDate) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedCompanyId('');
        setExtensionDate('');
      }, 3000);
    }, 1500);
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
                    onChange={(e) => {
                      setSelectedCompanyId(e.target.value);
                      setIsSuccess(false);
                    }}
                    required
                    className="w-full appearance-none bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  >
                    <option value="" disabled>Choose a client...</option>
                    {MOCK_COMPANIES.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Field 2: Current Subscription (Read Only) */}
              <div className={`transition-all duration-300 ${selectedCompany ? 'opacity-100 h-auto' : 'opacity-40 pointer-events-none'}`}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Current Subscription
                </label>
                <div className="bg-[#080d15] border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm">
                      {selectedCompany ? selectedCompany.plan : 'No plan selected'}
                    </div>
                    <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Expires: {selectedCompany ? new Date(selectedCompany.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '--/--/----'}
                    </div>
                  </div>
                  {selectedCompany && (
                    <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </div>
                  )}
                </div>
              </div>

              {/* Field 3: Extend Subscription Date */}
              <div className={`transition-all duration-300 ${selectedCompany ? 'opacity-100 h-auto' : 'opacity-40 pointer-events-none'}`}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Extend To Date
                </label>
                <input
                  type="date"
                  required={!!selectedCompany}
                  value={extensionDate}
                  min={selectedCompany ? selectedCompany.expiresAt : undefined}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all custom-calendar-icon"
                />
              </div>

              {/* Submit Button & Success Message */}
              <div className="pt-2">
                {isSuccess ? (
                  <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    Subscription Extended Successfully!
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!selectedCompany || !extensionDate || isSubmitting}
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

        {/* Info Column
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
                Once confirmed, the client will automatically receive an email receipt.
              </li>
            </ul>
          </div>
        </div> */}

      </div>
      
      {/* Custom styles for native date picker icon to blend with dark mode */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-calendar-icon::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
        .custom-calendar-icon::-webkit-calendar-picker-indicator:hover {
          opacity: 0.8;
        }
      `}} />
    </div>
  );
}
