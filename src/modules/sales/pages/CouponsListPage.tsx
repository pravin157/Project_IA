"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  Hash,
  Percent,
  Repeat,
  Trash2,
  Plus,
  Search,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { salesService } from '@/services/salesService';

interface Coupon {
  couponId: string;
  couponCode: string;
  couponDiscountValue: number;
  couponDiscountUnit: 'PERCENTAGE' | 'AMOUNT';
  isRecurringDiscount: boolean;
  createdBy: string;
  createdAt: string | number;
}

export default function CouponsListPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await salesService.getCoupons();
      setCoupons(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching discount coupons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (coupon: Coupon) => {
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await salesService.deleteCoupon({
        couponId: coupon.couponId,
        couponCode: coupon.couponCode
      });
      setSuccessMessage(`Coupon "${coupon.couponCode}" deleted successfully.`);
      // Remove from list
      setCoupons(prev => prev.filter(c => c.couponId !== coupon.couponId));
      setDeletingId(null);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to delete coupon "${coupon.couponCode}".`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter coupons based on search query
  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon =>
      coupon.couponCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [coupons, searchQuery]);

  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 overflow-y-auto bg-slate-50 text-slate-800">

      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3"
            style={{ background: 'rgba(25,118,210,0.1)', color: '#1976D2', border: '1px solid rgba(25,118,210,0.2)' }}>
            <Tag className="w-3.5 h-3.5" />
            Sales Module
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Discount Coupons
          </h1>
          <p className="text-slate-500 text-sm">
            View, search, and manage promotional discount coupons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            disabled={isLoading}
            className="p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-slate-200 disabled:opacity-50 shadow-sm"
            title="Refresh coupons list"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/dashboard/sales/discount"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-sm transition-all duration-200 shadow-md shadow-[#1976D2]/20"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Alerts */}
        {error && (
          <div className="w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex gap-2 items-center animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex gap-2 items-center animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Coupons Table/Grid */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading discount coupons...</p>
            </div>
          ) : filteredCoupons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="py-4 px-6">Coupon Code</th>
                    <th className="py-4 px-6">Discount Value</th>
                    <th className="py-4 px-6">Recurring status</th>
                    <th className="py-4 px-6">Created At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCoupons.map((coupon) => {
                    const isConfirmingDelete = deletingId === coupon.couponId;

                    return (
                      <tr key={coupon.couponId} className="hover:bg-slate-50 transition-all">
                        {/* Coupon Code */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-[#1976D2]/10 border border-[#1976D2]/20 text-[#1976D2]">
                              <Hash className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-900 tracking-wide text-sm uppercase">
                              {coupon.couponCode}
                            </span>
                          </div>
                        </td>

                        {/* Discount Value */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Percent className="w-4 h-4 text-[#1976D2]" />
                            <span className="font-bold text-slate-800 text-sm">
                              {coupon.couponDiscountValue}%
                            </span>
                          </div>
                        </td>

                        {/* Recurring */}
                        <td className="py-4 px-6">
                          {coupon.isRecurringDiscount ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: 'rgba(25,118,210,0.1)', color: '#1976D2', border: '1px solid rgba(25,118,210,0.2)' }}>
                              <Repeat className="w-3 h-3" /> Yes (All cycles)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              No (First cycle only)
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-6 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {coupon.createdAt ? new Date(Number(coupon.createdAt)).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {isConfirmingDelete ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] text-slate-500">Are you sure?</span>
                              <button
                                onClick={() => handleDelete(coupon)}
                                disabled={isDeleting}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] tracking-wide uppercase transition-all disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                disabled={isDeleting}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] tracking-wide uppercase transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(coupon.couponId)}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all active:scale-95"
                              title="Delete coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <Tag className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No discount coupons found</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  {searchQuery ? 'Try adjusting your search query or search term.' : 'There are no discount coupons created yet. Click "Create Coupon" to add one.'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/dashboard/sales/discount"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-xs transition-all"
                  >
                    Create a coupon
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
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
