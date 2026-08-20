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
import { performCompleteLogout } from '@/services/authService';

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
    submenu: [
      {
        title: 'Sales Dashboard',
        path: '/dashboard/sales',
      },
      {
        title: 'Receipt Generation',
        path: '/dashboard/sales/receipt',
      },
      {
        title: 'Discount Module',
        path: '/dashboard/sales/discount',
      },
      {
        title: 'Coupons List',
        path: '/dashboard/sales/coupons',
      }
    ]
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
    Sales: true,
  });

  // State for mobile sidebar visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-expand menus based on current pathname
  useEffect(() => {
    if (pathname.includes('/dashboard/customer-success')) {
      setExpandedMenus((prev) => ({ ...prev, Customer: true }));
    }
    if (pathname.includes('/dashboard/sales')) {
      setExpandedMenus((prev) => ({ ...prev, Sales: true }));
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
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden selection:bg-[#1976D2] selection:text-white">

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-white border-r border-slate-200/80 shadow-lg md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 shrink-0 flex items-center px-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1976D2] text-white shadow-md shadow-[#1976D2]/25">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">IntoAEC Admin</h1>
              <p className="text-[10px] text-[#1976D2] font-bold uppercase tracking-widest mt-1">Portal</p>
            </div>
          </div>
          <button
            className="ml-auto md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <div className="mb-3 px-2 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
            Modules
          </div>
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const isExpanded = expandedMenus[item.title];
              const hasSubmenu = item.submenu !== undefined;

              return (
                <li key={item.title} className="flex flex-col">
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                      ${isExpanded ? 'bg-[#1976D2]/10 text-[#1976D2]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${isExpanded ? 'text-[#1976D2]' : 'text-slate-400'}`} />
                      <span>{item.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#1976D2]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Submenu */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isExpanded ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <ul className="pl-9 pr-2 py-1 space-y-1 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-200">
                      {item.submenu && item.submenu.length > 0 ? (
                        item.submenu.map((sub) => {
                          const isActive = pathname === sub.path;
                          return (
                            <li key={sub.path} className="relative">
                              <Link
                                href={sub.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                  block px-3 py-2 rounded-lg text-xs font-semibold transition-all relative z-10
                                  ${isActive
                                    ? 'text-white bg-[#1976D2] shadow-sm shadow-[#1976D2]/25'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
                                `}
                              >
                                {sub.title}
                              </Link>
                            </li>
                          );
                        })
                      ) : (
                        <li className="relative">
                          <span className="block px-3 py-2 text-[11px] font-medium text-slate-400 italic">
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
        <div className="p-4 shrink-0 border-t border-slate-100 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Mobile Header */}
        <header className="md:hidden shrink-0 h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white shadow-sm relative z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1976D2] text-white">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900">Admin Portal</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
