import React from 'react';
import { RefreshCw, Menu, Search, X } from 'lucide-react';

const StaffHeader = ({
  title,
  loading,
  refreshing,
  onRefresh,
  user,
  profileData,
  onOpenSidebar,
  searchQuery = '',
  setSearchQuery,
  searchPlaceholder = 'Search courses, students, assignments...',
}) => {
  return (
    <header className="flex items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-4">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden shrink-0 rounded-2xl p-2.5 bg-white text-[#17140F] border border-[#E3DDD0] shadow-xs hover:bg-[#F1EDE4] transition cursor-pointer"
            title="Open Menu"
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="relative flex-1 min-w-0">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-[#9C6B2E] text-white flex items-center justify-center pointer-events-none shadow-xs">
            <Search className="h-4 w-4 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-12 pr-10 py-2.5 rounded-2xl bg-white border border-[#E3DDD0] text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/20 shadow-xs transition-all truncate"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery && setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Date & Refresh */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
        <span className="hidden lg:block text-xs font-semibold text-[#5B5346] bg-white/90 border border-[#E3DDD0] px-3.5 py-2 rounded-xl shadow-2xs">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || refreshing}
          className="rounded-2xl p-2.5 bg-white border border-[#E3DDD0] text-[#5B5346] hover:text-[#9C6B2E] hover:bg-[#F1EDE4] transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          title="Refresh Data"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading || refreshing ? 'animate-spin text-[#9C6B2E]' : ''}`}
          />
        </button>
      </div>
    </header>
  );
};

export default StaffHeader;
