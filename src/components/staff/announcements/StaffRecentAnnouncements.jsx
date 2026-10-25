import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  BookOpen,
  Building2,
  Clock,
  User,
  ArrowRight,
  Eye,
  Loader2,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { formatAnnouncementDateTime, isNewOrRecent } from '../../../utils/announcements';

const StaffRecentAnnouncements = ({
  announcements = [],
  loading = false,
  onSelectAnnouncement,
  onNavigateToTab,
}) => {
  const [showViewAllMenu, setShowViewAllMenu] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'institution' | 'course'

  // Filter announcements by selected filter
  const filteredAnnouncements = useMemo(() => {
    if (filterType === 'all') return announcements;
    return announcements.filter((a) => a.type === filterType);
  }, [announcements, filterType]);

  // Display the latest 6 announcements
  const recentList = filteredAnnouncements.slice(0, 6);

  const institutionCount = useMemo(
    () => announcements.filter((a) => a.type === 'institution').length,
    [announcements]
  );
  const courseCount = useMemo(
    () => announcements.filter((a) => a.type === 'course').length,
    [announcements]
  );

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Counter */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1EDE4] text-[#9C6B2E]">
            <Megaphone className="h-4 w-4 stroke-[2.2]" />
          </div>
          <h2 className="text-sm font-bold text-[#17140F] tracking-tight">
            Recent Announcements
          </h2>
          <span className="text-[11px] font-bold text-[#9C6B2E] bg-[#F1EDE4] px-2.5 py-0.5 rounded-full border border-[#E3DDD0]">
            {filteredAnnouncements.length}
          </span>
        </div>

        {/* Filter Tabs & View All Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pills */}
          <div className="inline-flex items-center gap-1 bg-[#FAF8F4] p-1 rounded-2xl border border-[#E3DDD0]">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#9C6B2E] text-white shadow-2xs'
                  : 'text-[#5B5346] hover:text-[#17140F] hover:bg-[#F1EDE4]'
              }`}
            >
              All ({announcements.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('institution')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                filterType === 'institution'
                  ? 'bg-[#9C6B2E] text-white shadow-2xs'
                  : 'text-[#5B5346] hover:text-[#17140F] hover:bg-[#F1EDE4]'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Institution ({institutionCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('course')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                filterType === 'course'
                  ? 'bg-[#9C6B2E] text-white shadow-2xs'
                  : 'text-[#5B5346] hover:text-[#17140F] hover:bg-[#F1EDE4]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Course ({courseCount})</span>
            </button>
          </div>

          {/* View All Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowViewAllMenu((prev) => !prev)}
              className="text-xs font-bold text-[#9C6B2E] hover:text-[#855923] flex items-center gap-1 group cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-[#E3DDD0] hover:border-[#9C6B2E]/50 shadow-2xs transition-all"
              aria-expanded={showViewAllMenu}
            >
              <span>View All</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showViewAllMenu ? 'rotate-180' : ''}`} />
            </button>

            {showViewAllMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowViewAllMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl border border-[#E3DDD0] bg-white p-1.5 shadow-xl z-30 sa-rise">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewAllMenu(false);
                      if (typeof onNavigateToTab === 'function') {
                        onNavigateToTab('announcements');
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#17140F] rounded-xl hover:bg-[#FAF8F4] hover:text-[#9C6B2E] transition cursor-pointer text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#9C6B2E]" />
                      <span>Course Announcements</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-[#9C6B2E] group-hover:translate-x-0.5 transition" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowViewAllMenu(false);
                      if (typeof onNavigateToTab === 'function') {
                        onNavigateToTab('institution_announcements');
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#17140F] rounded-xl hover:bg-[#FAF8F4] hover:text-[#9C6B2E] transition cursor-pointer text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-700" />
                      <span>Institution Announcements</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-[#9C6B2E] group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid / List */}
      {loading && recentList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#E3DDD0] text-center flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#9C6B2E] mb-2" />
          <p className="text-xs font-medium">Loading announcements...</p>
        </div>
      ) : recentList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#E3DDD0] text-center text-slate-400 shadow-sm">
          <Megaphone className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-bold text-[#17140F]">No Announcements Found</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            {filterType === 'all'
              ? "You're all caught up! New notices and classroom updates will appear here automatically."
              : `No ${filterType} announcements found at this time.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentList.map((ann, idx) => {
            const isCourse = ann.type === 'course';
            const isRecent = isNewOrRecent(ann);
            const previewMsg = (ann.message || ann.content || '').trim();

            const rawEventTime =
              ann.scheduled_event_time ||
              ann.event_time ||
              ann.exam_time ||
              ann.scheduled_time;

            let formattedEventTime = null;
            if (rawEventTime) {
              try {
                const d = new Date(rawEventTime);
                if (!isNaN(d.getTime())) {
                  formattedEventTime = d.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
              } catch {}
            }

            return (
              <div
                key={ann.uniqueId || `${ann.type}-${ann.id}-${idx}`}
                className="bg-white rounded-3xl border border-[#E3DDD0] p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-md hover:border-[#9C6B2E]/50 group"
              >
                <div>
                  {/* Card Top Row: Badges & Indicators */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {/* Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border ${
                          isCourse
                            ? 'bg-[#F1EDE4] text-[#9C6B2E] border-[#E3DDD0]'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {isCourse ? (
                          <BookOpen className="h-3 w-3 text-[#9C6B2E]" />
                        ) : (
                          <Building2 className="h-3 w-3 text-amber-700" />
                        )}
                        <span>{isCourse ? 'Course' : 'Institution'}</span>
                      </span>

                      {/* Course Title (only for course announcements; no Branch #1 for institution) */}
                      {isCourse && ann.course_title && (
                        <span
                          className="text-[11px] font-bold text-[#5B5346] bg-[#FAF8F4] border border-[#E3DDD0] px-2 py-0.5 rounded-md truncate max-w-[150px] sm:max-w-[190px]"
                          title={ann.course_title}
                        >
                          {ann.course_title}
                        </span>
                      )}
                    </div>

                    {/* New/Recent Badge */}
                    {isRecent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        New
                      </span>
                    )}
                  </div>

                  {/* Announcement Title */}
                  <h3
                    onClick={() => onSelectAnnouncement && onSelectAnnouncement(ann)}
                    className="font-bold text-sm sm:text-base text-[#17140F] group-hover:text-[#9C6B2E] transition-colors leading-snug line-clamp-2 cursor-pointer mb-2"
                    title={ann.title}
                  >
                    {ann.title}
                  </h3>

                  {/* Message Short Preview (2 lines truncated) */}
                  <p className="text-xs text-[#5B5346] leading-relaxed line-clamp-2 mb-3">
                    {previewMsg || 'No additional details provided.'}
                  </p>
                </div>

                {/* Card Bottom Area: Metadata & Clickable Action */}
                <div className="pt-3 border-t border-[#E3DDD0]/70 flex flex-col gap-2.5">
                  {/* Event Time Pill if present */}
                  {formattedEventTime && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9C6B2E] bg-[#F1EDE4] px-2 py-1 rounded-lg">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span className="truncate">Event: {formattedEventTime}</span>
                    </div>
                  )}

                  {/* Metadata Row: Source & Published Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[130px]" title={ann.publisher || 'Administration'}>
                      {ann.publisher ? `By: ${ann.publisher}` : (isCourse ? 'Course Faculty' : 'Campus Admin')}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 font-medium text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatAnnouncementDateTime(ann.created_at)}
                    </span>
                  </div>

                  {/* Clickable Action: View Announcement */}
                  <button
                    type="button"
                    onClick={() => onSelectAnnouncement && onSelectAnnouncement(ann)}
                    className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF8F4] hover:bg-[#F1EDE4] hover:text-[#9C6B2E] text-slate-700 border border-[#E3DDD0] py-2 px-3 text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#9C6B2E]" />
                    <span>View Announcement</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffRecentAnnouncements;
