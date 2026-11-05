import React from "react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarCheck,
  CalendarDays,
  Briefcase,
} from "lucide-react";

/**
 * Modern Dynamic Attendance Summary Strip
 * Cards:
 * 1. Total Records (Cream / Neutral)
 * 2. Present (Green)
 * 3. Half Day (Amber)
 * 4. Absent (Red)
 * 5. Leave (Blue)
 * 6. Working Days (Slate / Navy - optional)
 * 7. Total Holidays (Amber / Warm Gold - optional)
 */
const AttendanceSummaryCards = ({
  total = 0,
  present = 0,
  halfDay = 0,
  absent = 0,
  leave = 0,
  totalWorkingDays,
  totalHolidays,
  loading = false,
  totalLabel = "Total Records",
}) => {
  const cards = [
    {
      id: "total",
      label: totalLabel,
      value: total,
      subtext: "All logged entries",
      icon: ClipboardList,
      bg: "bg-[#fcfbf9]",
      border: "border-[#e5dfd3]",
      iconBg: "bg-[#f4eee2]",
      iconColor: "text-[#9c6b2e]",
      textColor: "text-[#1c1917]",
      accentBorder: "#9c6b2e",
    },
    {
      id: "present",
      label: "Present days",
      value: present,
      subtext: "Full duty marked",
      icon: CheckCircle2,
      bg: "bg-[#f0faf3]",
      border: "border-[#bbf0cd]",
      iconBg: "bg-[#dcfce7]",
      iconColor: "text-[#15803d]",
      textColor: "text-[#14532d]",
      accentBorder: "#16a34a",
    },
    {
      id: "half_day",
      label: "Half Day",
      value: halfDay,
      subtext: "0.5 day duty",
      icon: Clock,
      bg: "bg-[#fef9ed]",
      border: "border-[#fde3a2]",
      iconBg: "bg-[#fef3c7]",
      iconColor: "text-[#b45309]",
      textColor: "text-[#78350f]",
      accentBorder: "#f59e0b",
    },
    {
      id: "absent",
      label: "Absent days",
      value: absent,
      subtext: "Unrecorded / absent",
      icon: XCircle,
      bg: "bg-[#fef2f2]",
      border: "border-[#fecaca]",
      iconBg: "bg-[#fee2e2]",
      iconColor: "text-[#dc2626]",
      textColor: "text-[#7f1d1d]",
      accentBorder: "#ef4444",
    },
    {
      id: "leave",
      label: "Leave days",
      value: leave,
      subtext: "Approved leave",
      icon: CalendarCheck,
      bg: "bg-[#fef2f2]",
      border: "border-[#fecaca]",
      iconBg: "bg-[#fee2e2]",
      iconColor: "text-[#dc2626]",
      textColor: "text-[#7f1d1d]",
      accentBorder: "#ef4444",
    },
    ...(totalWorkingDays !== undefined && totalWorkingDays !== null
      ? [
          {
            id: "working_days",
            label: "Working Days",
            value: totalWorkingDays,
            subtext: "Official duty days",
            icon: Briefcase,
            bg: "bg-[#f8fafc]",
            border: "border-[#cbd5e1]",
            iconBg: "bg-[#e2e8f0]",
            iconColor: "text-[#334155]",
            textColor: "text-[#0f172a]",
            accentBorder: "#64748b",
          },
        ]
      : []),
    ...(totalHolidays !== undefined && totalHolidays !== null
      ? [
          {
            id: "total_holidays",
            label: "Total Holidays",
            value: totalHolidays,
            subtext: "Declared closures",
            icon: CalendarDays,
            bg: "bg-[#faf5ec]",
            border: "border-[#ebd8b6]",
            iconBg: "bg-[#f5ebd8]",
            iconColor: "text-[#9c6b2e]",
            textColor: "text-[#784f1b]",
            accentBorder: "#9c6b2e",
          },
        ]
      : []),
  ];

  const gridClass =
    cards.length >= 7
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5"
      : cards.length === 6
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4"
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4";

  if (loading) {
    return (
      <div className={gridClass}>
        {cards.map((c) => (
          <div
            key={c.id}
            className={`rounded-2xl p-4 sm:p-5 border ${c.border} ${c.bg} animate-pulse flex flex-col justify-between h-[126px]`}
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-black/10 rounded-full" />
              <div className="h-9 w-9 rounded-xl bg-black/10" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-14 bg-black/15 rounded-md" />
              <div className="h-3 w-24 bg-black/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`group relative overflow-hidden rounded-2xl border ${card.border} ${card.bg} p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between`}
          >
            {/* Top Row: Label and Icon */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <div
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor} shadow-2xs transition-transform duration-200 group-hover:scale-105 shrink-0`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
              </div>
            </div>

            {/* Bottom Row: Stat Number and Subtext */}
            <div className="mt-3">
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.textColor}`}
              >
                {Number(card.value || 0).toLocaleString()}
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceSummaryCards;

