"use client";

import React, { useState } from 'react';
import {
  Tag,
  Hash,
  Percent,
  Repeat,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { salesService } from '@/services/salesService';

export default function DiscountModulePage() {
  const [formData, setFormData] = useState({
    couponCode: '',
    discountValue: '',
    isRecurringDiscount: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (type === 'radio' && name === 'isRecurringDiscount') {
      val = value === 'true';
    }
    setFormData(prev => ({ ...prev, [name]: val }));
    setIsSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);
    setError(null);

    try {
      await salesService.createDiscount({
        couponCode: formData.couponCode,
        discountUnit: 'PERCENTAGE',
        discountValue: Number(formData.discountValue),
        isRecurringDiscount: formData.isRecurringDiscount,
      });

      setIsSuccess(true);
      // Reset form
      setFormData({
        couponCode: '',
        discountValue: '',
        isRecurringDiscount: false,
      });

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while creating the discount coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 overflow-y-auto bg-slate-50 text-slate-800">

      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4"
          style={{ background: 'rgba(25,118,210,0.1)', color: '#1976D2', border: '1px solid rgba(25,118,210,0.2)' }}>
          <Tag className="w-3.5 h-3.5" />
          Discount Module
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Create Discount Coupon
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Configure and manage promotional discount coupons for subscriptions.
        </p>
      </div>

      {/* Main Grid aligned identical to sales dashboard */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Form Column (3/5 width) */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-[#1976D2]/10 blur-3xl rounded-full pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[#1976D2]" />
                  Coupon Code
                </label>
                <input
                  type="text"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9]+"
                  title="Alphanumeric characters only"
                  placeholder="e.g. SUMMER26"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3.5 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all uppercase placeholder:text-slate-400 placeholder:normal-case shadow-sm"
                />
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#1976D2]" />
                  Discount Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 15"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all placeholder:text-slate-400 shadow-sm"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                    %
                  </div>
                </div>
              </div>

              {/* Recurring Discount */}
              <div className="flex flex-col justify-center">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-[#1976D2]" />
                  Recurring Discount
                </label>
                <div className="flex flex-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="isRecurringDiscount"
                      value="true"
                      checked={formData.isRecurringDiscount === true}
                      onChange={handleChange}
                      className="w-4.5 h-4.5 text-[#1976D2] bg-white border-slate-300 focus:ring-[#1976D2]"
                    />
                    <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                      Yes
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="isRecurringDiscount"
                      value="false"
                      checked={formData.isRecurringDiscount === false}
                      onChange={handleChange}
                      className="w-4.5 h-4.5 text-[#1976D2] bg-white border-slate-300 focus:ring-[#1976D2]"
                    />
                    <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                      No
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button & Messages */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                {error && (
                  <div className="w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex gap-2 items-center animate-fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {isSuccess ? (
                  <div className="w-full py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Discount Coupon Created Successfully!
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
                        Create Coupon
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>

        {/* Info Column (2/5 width) identical to sales dashboard */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <h3 className="text-slate-900 font-extrabold mb-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#1976D2]" />
              Quick Tips
            </h3>
            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] mt-1.5 shrink-0" />
                Coupon codes must be alphanumeric (e.g. SUMMER26).
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] mt-1.5 shrink-0" />
                Discount value is specified as a percentage only (0% to 100%).
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] mt-1.5 shrink-0" />
                A recurring discount applies to all subsequent subscription billing cycles.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] mt-1.5 shrink-0" />
                Non-recurring discounts apply only to the first billing cycle.
              </li>
            </ul>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}} />
    </div>
  );
}
