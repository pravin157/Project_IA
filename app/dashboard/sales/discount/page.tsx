"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  Tag, 
  Hash, 
  Percent, 
  Repeat,
  ArrowRight, 
  CheckCircle2,
  Briefcase
} from 'lucide-react';

export default function DiscountModulePage() {
  const [formData, setFormData] = useState({
    organizationName: '',
    discountName: '',   
    discountCode: '',
    discountPercentage: '',
    isRecurring: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    setIsSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          organizationName: '',
          discountName: '',
          discountCode: '',
          discountPercentage: '',
          isRecurring: false
        });
      }, 3000);
    }, 1500);
  };

  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 overflow-y-auto">
      
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4"
          style={{ background: 'rgba(236,72,153,0.1)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.2)' }}>
          <Tag className="w-3.5 h-3.5" />
          Discount Module
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Create Discount
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Configure and manage promotional discounts for your clients.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Organization Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  Organization Name
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Discount Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Discount Name
                </label>
                <input
                  type="text"
                  name="discountName"
                  value={formData.discountName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Summer Sale 2026"
                  className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Discount Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-400" />
                  Discount Code
                </label>
                <input
                  type="text"
                  name="discountCode"
                  value={formData.discountCode}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9]+"
                  title="Alphanumeric characters only"
                  placeholder="e.g. SUMMER26"
                  className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3.5 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all uppercase placeholder:text-slate-600 placeholder:normal-case"
                />
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  Discount Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 15"
                    className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                    %
                  </div>
                </div>
              </div>

              {/* Recurring Discount */}
              <div className="flex flex-col justify-center">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-rose-400" />
                  Billing Cycle
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <div className="w-12 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 transition-colors"></div>
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    Recurring Discount
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button & Success Message */}
            <div className="pt-6 border-t border-slate-800/80">
              {isSuccess ? (
                <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5" />
                  Discount Created Successfully!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto md:px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none ml-auto"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Discount
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
