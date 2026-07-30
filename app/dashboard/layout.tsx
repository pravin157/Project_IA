"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  TrendingUp,
  Megaphone,
  Rocket,
  ChevronDown,
  ChevronRight,
  LogOut,
  LayoutGrid,
  Menu,
  X
} from 'lucide-react';
import { performCompleteLogout } from '@/utils/logout';

// Define the menu structure
type SubMenuItem = {
  title: string;
  path: string;
};

type MenuItem = {
  title: string;
  icon: React.ElementType;
  submenu?: SubMenuItem[];
};

const menuItems: MenuItem[] = [
  {
    title: 'Sales',
    icon: TrendingUp,
    submenu: [] // Structured for future additions
  },
  {
    title: 'Customer Success',
    icon: Users,
    submenu: [
      {
        title: 'Customer Dashboard',
        path: '/dashboard/customer-success',
      }
    ]
  },
  {
    title: 'Marketing',
    icon: Megaphone,
    submenu: []
  },
  {
    title: 'Founder',
    icon: Rocket,
    submenu: []
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // State for expanded menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Customer: false,
  });

  // State for mobile sidebar visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-expand menus based on current pathname
  useEffect(() => {
    if (pathname.includes('/dashboard/customer-success')) {
      setExpandedMenus((prev) => ({ ...prev, Customer: true }));
    }
  }, [pathname]);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleLogout = () => {
    performCompleteLogout();
  };

  return (
    <div className="flex h-screen w-full bg-[#080d15] text-slate-300 font-sans overflow-hidden selection:bg-sky-500 selection:text-white">

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-[#0b1120] border-r border-slate-800/60 shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 shrink-0 flex items-center px-6 border-b border-slate-800/60 bg-[#080d15]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg shadow-sky-500/20">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-none">IntoAEC Admin</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Portal</p>
            </div>
          </div>
          <button
            className="ml-auto md:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <div className="mb-4 px-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Modules
          </div>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isExpanded = expandedMenus[item.title];
              const hasSubmenu = item.submenu !== undefined;

              return (
                <li key={item.title} className="flex flex-col">
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isExpanded ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Submenu */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isExpanded ? 'max-h-60 opacity-100 mt-1.5' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <ul className="pl-10 pr-2 py-1 space-y-1 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-800">
                      {item.submenu && item.submenu.length > 0 ? (
                        item.submenu.map((sub) => {
                          const isActive = pathname === sub.path;
                          return (
                            <li key={sub.path} className="relative">
                              <Link
                                href={sub.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                  block px-3 py-2 rounded-md text-xs font-medium transition-colors relative z-10
                                  ${isActive
                                    ? 'text-white bg-slate-800/80 shadow-sm border border-slate-700/50 before:absolute before:-left-[21px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-sky-400 before:rounded-r-full'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}
                                `}
                              >
                                {sub.title}
                              </Link>
                            </li>
                          );
                        })
                      ) : (
                        <li className="relative">
                          <span className="block px-3 py-2 text-[11px] font-medium text-slate-600 italic">
                            Coming soon
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 shrink-0 border-t border-slate-800/60 bg-[#080d15]/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080d15]">
        {/* Mobile Header */}
        <header className="md:hidden shrink-0 h-16 flex items-center justify-between px-4 border-b border-slate-800/60 bg-[#0b1120] shadow-sm relative z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-500 to-teal-500">
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-sm font-black tracking-tight text-white">Admin Portal</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto custom-scrollbar relative z-0">
          {children}
        </main>
      </div>

    </div>
  );
}
