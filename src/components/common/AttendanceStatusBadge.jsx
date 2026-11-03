import React from "react";
import { CheckCircle2, Clock, XCircle, CalendarCheck, HelpCircle } from "lucide-react";

/**
 * Standardize attendance status to one of:
 * 'present' | 'half_day' | 'absent' | 'leave'
 */
export const normalizeAttendanceStatus = (status) => {
  const s = String(status || "").toLowerCase().trim().replace(/[-\s]/g, "_");
  if (s === "half_day" || s === "halfday" || s === "late") return "half_day";
  if (s === "leave" || s === "excused" || s === "on_leave") return "leave";
  if (s === "absent") return "absent";
  if (s === "present") return "present";
  return s || "present";
};

export const ATTENDANCE_STATUS_CONFIG = {
  present: {
    key: "present",
    label: "Present",
    bg: "#e6f7ec",
    border: "#a9e6bf",
    text: "#1e6b37",
    dot: "#22c55e",
    icon: CheckCircle2,
  },
  half_day: {
    key: "half_day",
    label: "Half Day",
    bg: "#fef7e6",
    border: "#fde096",
    text: "#b45309",
    dot: "#f59e0b",
    icon: Clock,
  },
  absent: {
    key: "absent",
    label: "Absent",
    bg: "#feecee",
    border: "#fca5ad",
    text: "#b91c1c",
    dot: "#ef4444",
    icon: XCircle,
  },
  leave: {
    key: "leave",
    label: "Leave",
    bg: "#eef2fe",
    border: "#b9cbfd",
    text: "#3730a3",
    dot: "#6366f1",
    icon: CalendarCheck,
  },
};

export const AttendanceStatusBadge = ({ status, className = "" }) => {
  const key = normalizeAttendanceStatus(status);
  const cfg = ATTENDANCE_STATUS_CONFIG[key] || {
    key: "unknown",
    label: status || "Unknown",
    bg: "#f1ede4",
    border: "#ded7c8",
    text: "#5c5446",
    dot: "#8a8175",
    icon: HelpCircle,
  };

  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors select-none ${className}`}
      style={{
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
      <span>{cfg.label}</span>
    </span>
  );
};

export default AttendanceStatusBadge;

