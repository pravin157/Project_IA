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
  Clock,
  ArrowRight
} from 'lucide-react';

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
      const res = await fetch('/api/paymaster-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'GET_DISCOUNT_COUPONS' })
      });
      
      const data = await res.json();
      
      if (res.ok && data?.code === 'DISCOUNT_COUPONS_RETRIEVED') {
        setCoupons(data.body || []);
      } else {
        throw new Error(data?.message || 'Failed to retrieve discount coupons.');
      }
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
      const res = await fetch('/api/paymaster-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'DELETE_DISCOUNT_COUPON',
          couponId: coupon.couponId,
          couponCode: coupon.couponCode
        })
      });

      const data = await res.json();

      if (res.ok && data?.code === 'DISCOUNT_COUPON_DELETED') {
        setSuccessMessage(`Coupon "${coupon.couponCode}" deleted successfully.`);
        // Remove from list
        setCoupons(prev => prev.filter(c => c.couponId !== coupon.couponId));
        setDeletingId(null);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        throw new Error(data?.error || data?.message || 'Failed to delete coupon.');
      }
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
    <div className="w-full h-full p-6 sm:p-8 lg:p-12 overflow-y-auto">
      
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3"
            style={{ background: 'rgba(236,72,153,0.1)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.2)' }}>
            <Tag className="w-3.5 h-3.5" />
            Sales Module
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Discount Coupons
          </h1>
          <p className="text-slate-400 text-sm">
            View, search, and manage promotional discount coupons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            disabled={isLoading}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all border border-slate-700/50 disabled:opacity-50"
            title="Refresh coupons list"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/dashboard/sales/discount"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.2)]"
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
          <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex gap-2 items-center animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex gap-2 items-center animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080d15] border border-slate-700/80 text-white text-sm rounded-xl pl-11 pr-4 py-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Coupons Table/Grid */}
        <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading discount coupons...</p>
            </div>
          ) : filteredCoupons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800"
                  style={{ background: 'rgba(15,23,42,0.6)', color: '#64748b' }}>
                  <tr>
                    <th className="py-4 px-6">Coupon Code</th>
                    <th className="py-4 px-6">Discount Value</th>
                    <th className="py-4 px-6">Recurring status</th>
                    <th className="py-4 px-6">Created At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCoupons.map((coupon) => {
                    const isConfirmingDelete = deletingId === coupon.couponId;
                    
                    return (
                      <tr key={coupon.couponId} className="hover:bg-slate-800/20 transition-all">
                        {/* Coupon Code */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                              <Hash className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-200 tracking-wide text-sm uppercase">
                              {coupon.couponCode}
                            </span>
                          </div>
                        </td>

                        {/* Discount Value */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Percent className="w-4 h-4 text-amber-400" />
                            <span className="font-semibold text-slate-300 text-sm">
                              {coupon.couponDiscountValue}%
                            </span>
                          </div>
                        </td>

                        {/* Recurring */}
                        <td className="py-4 px-6">
                          {coupon.isRecurringDiscount ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)' }}>
                              <Repeat className="w-3 h-3" /> Yes (All cycles)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/50">
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
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-[10px] tracking-wide uppercase transition-all disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                disabled={isDeleting}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[10px] tracking-wide uppercase transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(coupon.couponId)}
                              className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700/30 hover:border-red-500/20 transition-all active:scale-95"
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
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <Tag className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-400">No discount coupons found</h3>
                <p className="text-slate-600 text-xs max-w-sm mx-auto">
                  {searchQuery ? 'Try adjusting your search query or search term.' : 'There are no discount coupons created yet. Click "Create Coupon" to add one.'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/dashboard/sales/discount"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all"
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
