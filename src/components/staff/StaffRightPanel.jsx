import React from 'react';
import {
  Bell,
  BookOpen,
  Users,
  FileText,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const StaffRightPanel = ({
  user,
  profileData,
  branchName,
  branchLocation,
  assignedCourses = [],
  courseStudents = [],
  assignments = [],
  dashboardData,
  onOpenNewAssignment,
  setActiveTab,
}) => {
  const staffName = profileData?.name || user?.name || 'Faculty';
  const staffInitial = staffName.charAt(0).toUpperCase();

  const totalCourses = assignedCourses.length || dashboardData?.total_courses || 0;
  const totalStudents =
    dashboardData?.total_students ??
    dashboardData?.students_count ??
    courseStudents.length ??
    0;
  const totalAssignments =
    dashboardData?.total_assignments ??
    dashboardData?.assignments_count ??
    assignments.length ??
    0;

  return (
    <aside className="w-full bg-white rounded-3xl p-5 2xl:p-6 flex flex-col gap-5 border border-[#E3DDD0] shadow-sm">
      {/* Top Header: Notifications & Staff Profile Greeting */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E3DDD0]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('announcements')}
            className="relative p-2 rounded-xl text-slate-500 hover:text-[#9C6B2E] hover:bg-[#F1EDE4] transition-colors"
            title="Announcements & Notices"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#9C6B2E] ring-2 ring-white" />
          </button>
        </div>

        <div
          onClick={() => setActiveTab && setActiveTab('profile')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="View Profile"
        >
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium leading-none">Hi,</p>
            <p className="text-sm font-bold text-slate-800 group-hover:text-[#9C6B2E] transition-colors leading-tight mt-0.5">
              {staffName.split(' ')[0]}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#9C6B2E] to-[#B88746] p-0.5 shadow-sm">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#9C6B2E]">
              {staffInitial}
            </div>
          </div>
        </div>
      </div>

      {/* Semi-Circle Progress Arc Gauge (inspired by reference's 42.4 GB capacity gauge) */}
      <div className="bg-[#FAF8F4] rounded-2xl p-5 flex flex-col items-center relative overflow-hidden border border-[#E3DDD0]">
        <div className="w-48 h-24 relative flex items-end justify-center">
          <svg viewBox="0 0 160 80" className="w-full h-full overflow-visible">
            {/* Background Arc */}
            <path
              d="M 15 80 A 65 65 0 0 1 145 80"
              fill="none"
              stroke="#E3DDD0"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Multi-color arc segments */}
            <path
              d="M 15 80 A 65 65 0 0 1 45 35"
              fill="none"
              stroke="#EF4444"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 46 34 A 65 65 0 0 1 100 20"
              fill="none"
              stroke="#9C6B2E"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 101 21 A 65 65 0 0 1 130 50"
              fill="none"
              stroke="#F4B942"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 131 51 A 65 65 0 0 1 145 80"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Center Big Stat */}
        <div className="text-center mt-2">
          <p className="text-2xl font-black text-slate-800 tracking-tight">
            {totalStudents} Students
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            Across {totalCourses} Assigned Course{totalCourses !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Academic Resource Breakdown (matching reference's file category rows) */}
      <div className="space-y-3.5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Academic Summary
        </p>

        {/* Row 1: Courses */}
        <div
          onClick={() => setActiveTab && setActiveTab('courses')}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F1EDE4] cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-bold">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-[#9C6B2E] transition-colors">
                Assigned Courses
              </p>
              <p className="text-[11px] text-slate-400">Active Curriculum</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {totalCourses}
          </span>
        </div>

        {/* Row 2: Enrolled Students */}
        <div
          onClick={() => setActiveTab && setActiveTab('courses')}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F1EDE4] cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#F1EDE4] text-[#9C6B2E] flex items-center justify-center font-bold">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-[#9C6B2E] transition-colors">
                Enrolled Students
              </p>
              <p className="text-[11px] text-slate-400">Active Batches</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {totalStudents}
          </span>
        </div>

        {/* Row 3: Course Assignments */}
        <div
          onClick={() => setActiveTab && setActiveTab('assignments')}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F1EDE4] cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-[#9C6B2E] transition-colors">
                Assignments
              </p>
              <p className="text-[11px] text-slate-400">Course Tasks</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {totalAssignments}
          </span>
        </div>

        {/* Row 4: Verified Documents */}
        <div
          onClick={() => setActiveTab && setActiveTab('documents')}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F1EDE4] cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-[#9C6B2E] transition-colors">
                Staff Credentials
              </p>
              <p className="text-[11px] text-slate-400">KYC & Documents</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#9C6B2E] bg-[#F1EDE4] px-2 py-0.5 rounded-md">
            Verified
          </span>
        </div>
      </div>

      {/* Bottom Action Card (matching reference's 'Upgrade to PRO' illustration card) */}
      <div className="mt-auto bg-gradient-to-br from-[#FAF8F4] to-[#F1EDE4] rounded-2xl p-5 border border-[#E3DDD0] text-center relative overflow-hidden">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-white shadow-xs border border-[#E3DDD0] flex items-center justify-center text-[#9C6B2E] mb-3">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h4 className="text-xs font-bold text-slate-800">
          {branchName ? `Aurum FX ${branchName}` : 'Faculty Portal'}
        </h4>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
          {branchLocation || 'Manage your classroom, students, and course tasks.'}
        </p>
        <button
          type="button"
          onClick={onOpenNewAssignment}
          className="mt-4 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#9C6B2E] to-[#855923] hover:from-[#855923] hover:to-[#6E4717] shadow-sm shadow-[#9C6B2E]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>+ New Assignment</span>
        </button>
      </div>
    </aside>
  );
};

export default StaffRightPanel;
