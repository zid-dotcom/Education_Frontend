import React from 'react';
import { RefreshCw, Menu, Building2 } from 'lucide-react';

const StaffHeader = ({
  title,
  loading,
  refreshing,
  onRefresh,
  user,
  profileData,
  branchName = '',
  branchLocation = '',
  onOpenSidebar,
  onNavigateProfile,
  searchQuery = '',
  setSearchQuery,
  searchPlaceholder = 'Search courses, students, assignments...',
}) => {
  const resolvedBranchName =
    branchName ||
    profileData?.branch?.name ||
    profileData?.branch?.branch_name ||
    profileData?.branch_name ||
    user?.branch_name ||
    user?.branch?.name ||
    '';

  const resolvedBranchLocation =
    branchLocation ||
    profileData?.branch?.location ||
    profileData?.branch?.branch_location ||
    profileData?.location ||
    user?.location ||
    user?.branch_location ||
    '';

  const displayName =
    profileData?.name ||
    profileData?.full_name ||
    user?.name ||
    user?.full_name ||
    'Faculty Member';

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-4 pb-1">
      {/* Left: Mobile Menu + Portal Identity (Eyebrow: STAFF PORTAL, Heading: Page Title) */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden shrink-0 rounded-2xl p-2.5 bg-white text-[#17140F] border border-[#E3DDD0] shadow-2xs hover:bg-[#F1EDE4] transition cursor-pointer"
            title="Open Menu"
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9C6B2E] block">
            Staff Portal
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#17140F] tracking-tight truncate leading-tight mt-0.5">
            {title || 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Right side: Branch Info Badge + Date + Refresh + User Profile Pill */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Branch Name & Location Badge */}
        {(resolvedBranchName || resolvedBranchLocation) && (
          <div className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-white border border-[#E3DDD0] px-3.5 py-2 shadow-2xs">
            <div className="h-6 w-6 rounded-xl bg-[#F7EFE0] text-[#9C6B2E] border border-[#E8DBBE] flex items-center justify-center shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="truncate max-w-[180px] lg:max-w-xs">{resolvedBranchName || 'Main Branch'}</span>
              {resolvedBranchLocation && (
                <>
                  <span className="text-slate-300 font-normal">•</span>
                  <span className="text-slate-500 font-medium truncate max-w-[120px]">{resolvedBranchLocation}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Live Date Badge */}
        <span className="hidden xl:inline-flex items-center text-xs font-semibold text-[#5B5346] bg-white border border-[#E3DDD0] px-3.5 py-2 rounded-2xl shadow-2xs">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || refreshing}
          className="rounded-2xl p-2.5 bg-white border border-[#E3DDD0] text-[#5B5346] hover:text-[#9C6B2E] hover:bg-[#F1EDE4] transition shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
          title="Refresh Data"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading || refreshing ? 'animate-spin text-[#9C6B2E]' : ''}`}
          />
        </button>

        {/* Faculty Profile Pill / Avatar */}
        <button
          type="button"
          onClick={() => {
            if (typeof onNavigateProfile === 'function') {
              onNavigateProfile();
            }
          }}
          className="flex items-center gap-2.5 pl-1.5 pr-2.5 sm:pr-3 py-1 bg-white border border-[#E3DDD0] rounded-2xl hover:bg-[#F1EDE4] transition shadow-2xs cursor-pointer group"
          title="View Faculty Profile"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black shadow-xs ring-1 ring-[#E3DDD0] shrink-0"
            style={{ background: "#17140F", color: "#F4B942" }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-left leading-tight min-w-0">
            <span className="block text-xs font-bold text-slate-900 truncate max-w-[120px] group-hover:text-[#9C6B2E] transition-colors">
              {displayName}
            </span>
            <span className="block text-[10px] font-medium text-slate-400">
              Faculty
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default StaffHeader;
