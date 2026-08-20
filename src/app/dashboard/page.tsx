"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartPulse,
  LogOut,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { performCompleteLogout } from '@/services/authService';

export default function DashboardPortalPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            return;
          }
        }

        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (refreshRes.ok) {
          setIsAuthenticated(true);
          return;
        }

        window.location.href = '/login';
      } catch {
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    performCompleteLogout();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1D6FD8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dashboard = {
    id: 'customer-success',
    title: 'Customer Dashboard',
    description: 'Analyze real-time customer health, track product adoption trends, monitor critical alerts, and draft AI-powered emails to clients.',
    icon: HeartPulse,
    status: 'Active',
    path: '/dashboard/customer-success',
    tagline: '32 paid accounts active'
  };

  const Icon = dashboard.icon;

  return (
    <div className="w-full h-full text-[#000000] antialiased font-sans flex flex-col">
      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#1D6FD8]/10 flex items-center justify-center mb-6 border border-[#E5E7EB] shadow-sm">
          <LayoutGrid className="w-10 h-10 text-[#1D6FD8]" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] tracking-tight mb-4">
          Welcome to Admin Portal
        </h2>
        <p className="text-[#000000] text-sm sm:text-base max-w-lg">
          You are securely logged in. Please select a module from the vertical sidebar on the left to begin managing your workspace and client lifecycles.
        </p>
      </main>
    </div>
  );
}
