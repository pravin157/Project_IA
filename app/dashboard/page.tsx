"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartPulse,
  LogOut,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';

export default function DashboardPortalPage() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
  };

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
    <div className="min-h-screen text-slate-100 antialiased font-sans flex flex-col pb-12" style={{ background: '#080d15' }}>
      
      {/* Header / Navbar */}
      <header className="border-b" style={{ background: 'rgba(8,13,21,0.95)', borderColor: 'rgba(51,65,85,0.4)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0d9488)' }}>
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-tight">IntoAEC Admin Hub</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Control Panel Portal</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.6)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244,63,94,0.1)';
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(30,41,59,0.8)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)';
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center">
        
        {/* Welcome Section */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3"
            style={{ background: 'rgba(14,165,233,0.08)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            Administrator Session Active
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Select Workspace Console</h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-2xl">
            Choose a specialized workspace dashboard below to manage client lifecycles and analyze operational metrics.
          </p>
        </div>

        {/* Console Centered Layout */}
        <div className="flex justify-center sm:justify-start">
          <div
            onClick={() => router.push(dashboard.path)}
            className="group relative w-full max-w-lg rounded-2xl p-8 border cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
              borderColor: 'rgba(51, 65, 85, 0.6)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0ea5e9';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(14,165,233,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.6)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-xl transition-colors group-hover:bg-sky-500/10"
                  style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.6)' }}>
                  <Icon className="w-6 h-6 text-sky-400 group-hover:text-sky-300" />
                </div>
                
                {/* Active Status Badge */}
                <span className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {dashboard.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                {dashboard.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">{dashboard.tagline}</p>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                {dashboard.description}
              </p>
            </div>

            <div className="mt-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300">
              <span>Enter Console</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
