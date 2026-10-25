import React from 'react';
import { MapPin, ChevronDown, Building2, Phone, Mail } from 'lucide-react';

const BranchCourseSelector = ({ branches = [], selectedBranchId, onBranchChange, theme = 'website' }) => {
  const selectedBranch = branches.find((branch) => String(branch.id) === String(selectedBranchId));
  const isStudent = theme === 'student';

  if (isStudent) {
    return (
      <div className="rounded-2xl border border-[#E3DDD0] bg-white p-5 sm:p-6 shadow-2xs transition">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EDE4] text-[#9C6B2E] border border-[#E3DDD0]">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                  Location Selection
                </span>
                <h3 className="text-base font-extrabold text-[#17140F] leading-tight">
                  Choose your branch
                </h3>
              </div>
            </div>
            <p className="mt-2 text-xs text-[#5B5346] font-normal">
              Select a campus to browse available courses and schedules.
            </p>
          </div>

          <label className="relative block w-full sm:max-w-md">
            <span className="mb-1.5 block text-xs font-bold text-[#17140F]">Campus Branch</span>
            <Building2 className="pointer-events-none absolute bottom-3.5 left-3.5 h-4 w-4 text-[#8A8175]" />
            <select
              value={selectedBranchId || ''}
              onChange={(event) => onBranchChange(event.target.value)}
              className="w-full appearance-none rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] py-2.5 pl-10 pr-9 text-xs font-semibold text-[#17140F] outline-none transition hover:border-[#9C6B2E]/50 focus:border-[#9C6B2E] focus:bg-white cursor-pointer"
            >
              <option value="">Select your branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}{branch.location ? ` - ${branch.location}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-[#8A8175]" />
          </label>
        </div>

        {selectedBranch && (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E3DDD0] pt-4 text-xs text-[#5B5346]">
            <span className="font-extrabold text-[#17140F] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {selectedBranch.name}
            </span>
            {selectedBranch.location && (
              <span className="inline-flex items-center gap-1 text-[#5B5346]">
                <MapPin className="h-3 w-3 text-[#9C6B2E]" /> {selectedBranch.location}
              </span>
            )}
            {selectedBranch.phone && (
              <span className="inline-flex items-center gap-1 text-[#5B5346]">
                <Phone className="h-3 w-3 text-[#9C6B2E]" /> {selectedBranch.phone}
              </span>
            )}
            {selectedBranch.email && (
              <span className="inline-flex items-center gap-1 text-[#5B5346]">
                <Mail className="h-3 w-3 text-[#9C6B2E]" /> {selectedBranch.email}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Original Website Theme (Unchanged for public website)
  return (
    <div className="rounded-2xl border border-amber-300 bg-[#fffdfa] p-4 sm:p-5 shadow-xs transition hover:border-amber-400">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fbf4ea] text-[#aa8c63]">
              <MapPin className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Choose your branch</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">Select a branch to view its available courses.</p>
        </div>

        <label className="relative block w-full sm:max-w-xs">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Branch</span>
          <Building2 className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-[#aa8c63]" />
          <select
            value={selectedBranchId || ''}
            onChange={(event) => onBranchChange(event.target.value)}
            className="w-full appearance-none rounded-xl border border-amber-200 bg-white py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-800 outline-none transition hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 cursor-pointer"
          >
            <option value="">Select your branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}{branch.location ? ` - ${branch.location}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-[#aa8c63]" />
        </label>
      </div>

      {selectedBranch && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-amber-100 pt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">{selectedBranch.name}</span>
          {selectedBranch.location && <span>{selectedBranch.location}</span>}
          {selectedBranch.phone && <span>{selectedBranch.phone}</span>}
          {selectedBranch.email && <span>{selectedBranch.email}</span>}
        </div>
      )}
    </div>
  );
};

export default BranchCourseSelector;