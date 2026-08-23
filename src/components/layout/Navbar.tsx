import {
  Building2,
  Sparkles,
  RefreshCw,
  Search,
  Settings,
  Zap,
  MonitorPlay,
  LogOut,
} from 'lucide-react';
import { performCompleteLogout } from '@/services/authService';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  paidOrgsCount: number;
  totalOrgsCount: number;
  lastRefreshedAt: number | null;
  onOpenAiAssistant: () => void;
  onOpenSettings: () => void;
  onlyPaidOrgs: boolean;
  onToggleOnlyPaidOrgs: () => void;
  onOpenPresentation: () => void;
  hasPresentationData: boolean;
}


export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  paidOrgsCount,
  totalOrgsCount,
  lastRefreshedAt,
  onOpenAiAssistant,
  onOpenSettings,
  onlyPaidOrgs,
  onToggleOnlyPaidOrgs,
  onOpenPresentation,
  hasPresentationData,
}) => {
  const refreshedLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E7EB] shadow-sm bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md shrink-0 bg-[#1D6FD8] text-white shadow-[#1D6FD8]/25">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-extrabold tracking-tight text-[#000000]">IntoAEC CS Hub</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border bg-white border-[#E5E7EB] text-[#000000]">
                  Customer Success
                </span>
                {/* Live indicator */}
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#000000]/70">
                  <span className="status-dot" />
                  {isLoading ? 'Syncing…' : refreshedLabel ? `Updated ${refreshedLabel}` : 'Live'}
                </span>
              </div>
              <p className="text-[11px] text-[#000000]/70 truncate hidden sm:block">
                Portfolio health for paid All-in-One accounts
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#000000]/50" />
              <input
                type="text"
                placeholder="Search by name, account #, email, or ID…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-[#000000] placeholder-[#000000]/50 focus:outline-none transition-all bg-white border border-[#E5E7EB] focus:border-[#1D6FD8] focus:ring-2 focus:ring-[#1D6FD8]/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 text-[#000000]">
            <button
              onClick={onToggleOnlyPaidOrgs}
              title="Show only paid All-in-One customers"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={onlyPaidOrgs
                ? { background: 'rgba(29,111,216,0.1)', borderColor: '#1D6FD8', color: '#1D6FD8' }
                : { background: 'white', borderColor: '#E5E7EB', color: '#000000' }}
            >
              <Zap className={`w-3.5 h-3.5 ${onlyPaidOrgs ? 'fill-amber-400 text-amber-400' : 'text-[#000000]/50'}`} />
              <span>Paid</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E5E7EB] text-[#000000]">
                {paidOrgsCount > 0 ? paidOrgsCount : totalOrgsCount}
              </span>
            </button>

            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 bg-[#1D6FD8] hover:bg-[#1565C0] shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Ask CS Copilot</span>
            </button>

            {/* CEO Presentation button */}
            <button
              onClick={onOpenPresentation}
              title={hasPresentationData ? 'Open CEO presentation' : 'Load data first'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 relative group"
              style={hasPresentationData
                ? { background: '#1D6FD8', color: '#fff' }
                : { background: 'white', color: '#000000', opacity: 0.5, border: '1px solid #E5E7EB', cursor: 'not-allowed' }}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Present</span>
              {/* Tooltip */}
              {!hasPresentationData && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Load data first
                </span>
              )}
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh portfolio"
              className="p-2 rounded-lg text-[#000000]/70 border border-[#E5E7EB] bg-white transition-all disabled:opacity-50 hover:text-[#000000]"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1D6FD8]' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              title="Connection settings"
              className="p-2 rounded-lg text-[#000000]/70 border border-[#E5E7EB] bg-white transition-all hover:text-[#000000]"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => performCompleteLogout()}
              title="Log out completely"
              className="p-2 rounded-lg text-[#000000]/70 border border-[#E5E7EB] bg-white transition-all hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#000000]/50" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-[#000000] placeholder-[#000000]/50 focus:outline-none bg-white border border-[#E5E7EB]"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
