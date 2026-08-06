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
      const res = await fetch('/api/paymaster-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'CREATE_DISCOUNT_COUPON',
          couponCode: formData.couponCode,
          discountUnit: 'PERCENTAGE',
          discountValue: Number(formData.discountValue),
          isRecurringDiscount: formData.isRecurringDiscount,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.code === 'DISCOUNT_COUPON_CREATED') {
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
      } else {
        throw new Error(data?.error || data?.message || 'Failed to create discount coupon.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while creating the discount coupon.');
    } finally {
      setIsSubmitting(false);
    }
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
          Create Discount Coupon
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Configure and manage promotional discount coupons for subscriptions.
        </p>
      </div>

      {/* Main Grid aligned identical to sales dashboard */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Form Column (3/5 width) */}
        <div className="lg:col-span-3">
          <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-400" />
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
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 15"
                    className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl pl-4 pr-10 py-3.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-600"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                    %
                  </div>
                </div>
              </div>

              {/* Recurring Discount */}
              <div className="flex flex-col justify-center">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-rose-400" />
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
                      className="w-4.5 h-4.5 text-rose-500 bg-[#080d15] border-slate-700/80 focus:ring-rose-500 focus:ring-offset-[#0b1120]"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Yes <span className="text-xs text-slate-500 block"></span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="isRecurringDiscount"
                      value="false"
                      checked={formData.isRecurringDiscount === false}
                      onChange={handleChange}
                      className="w-4.5 h-4.5 text-rose-500 bg-[#080d15] border-slate-700/80 focus:ring-rose-500 focus:ring-offset-[#0b1120]"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      No <span className="text-xs text-slate-500 block"></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button & Messages */}
              <div className="pt-6 border-t border-slate-800/80 space-y-4">
                {error && (
                  <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex gap-2 items-center animate-fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {isSuccess ? (
                  <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    Discount Coupon Created Successfully!
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
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
          <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Quick Tips
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                Coupon codes must be alphanumeric (e.g. SUMMER26).
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                Discount value is specified as a percentage only (0% to 100%).
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                A recurring discount applies to all subsequent subscription billing cycles.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
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
