import {
  Building2,
  Sparkles,
  RefreshCw,
  Search,
  Settings,
  Zap,
  MonitorPlay,
} from 'lucide-react';

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
    <header className="sticky top-0 z-30 border-b border-slate-800/80 shadow-2xl"
      style={{ background: 'rgba(8, 13, 21, 0.92)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)', boxShadow: '0 0 16px rgba(14,165,233,0.35)' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold tracking-tight text-white">IntoAEC CS Hub</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                  style={{ background: 'rgba(14,165,233,0.12)', borderColor: 'rgba(14,165,233,0.3)', color: '#7dd3fc' }}>
                  Customer Success
                </span>
                {/* Live indicator */}
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="status-dot" />
                  {isLoading ? 'Syncing…' : refreshedLabel ? `Updated ${refreshedLabel}` : 'Live'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                Portfolio health for paid All-in-One accounts
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, account #, email, or ID…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(51, 65, 85, 0.8)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(14,165,233,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.8)')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleOnlyPaidOrgs}
              title="Show only paid All-in-One customers"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={onlyPaidOrgs
                ? { background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', color: '#fcd34d' }
                : { background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(51,65,85,0.8)', color: '#94a3b8' }}
            >
              <Zap className={`w-3.5 h-3.5 ${onlyPaidOrgs ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
              <span>Paid</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#fcd34d' }}>
                {paidOrgsCount > 0 ? paidOrgsCount : totalOrgsCount}
              </span>
            </button>

            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', boxShadow: '0 0 12px rgba(14,165,233,0.25)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Ask CS Copilot</span>
            </button>

            {/* CEO Presentation button */}
            <button
              onClick={onOpenPresentation}
              title={hasPresentationData ? 'Open CEO presentation' : 'Load data first'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 relative group"
              style={hasPresentationData
                ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', boxShadow: '0 0 12px rgba(124,58,237,0.3)' }
                : { background: 'rgba(30,41,59,0.8)', color: '#475569', border: '1px solid rgba(51,65,85,0.6)', cursor: 'not-allowed' }}
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
              className="p-2 rounded-lg text-slate-400 border transition-all disabled:opacity-50 hover:text-white"
              style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(51,65,85,0.8)' }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              title="Connection settings"
              className="p-2 rounded-lg text-slate-400 border transition-all hover:text-white"
              style={{ background: 'rgba(30,41,59,0.8)', borderColor: 'rgba(51,65,85,0.8)' }}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
              style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.8)' }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
