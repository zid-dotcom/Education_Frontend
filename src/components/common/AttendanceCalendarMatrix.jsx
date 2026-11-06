import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar,
  CalendarCheck,
  Search,
  Check,
  X,
  Clock,
  FileText,
  Loader2,
  Filter,
  User,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Flame,
  Activity,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/**
 * Normalizes attendance status string to a standard key:
 * 'present', 'absent', 'half_day', 'leave'
 */
export const normalizeStatus = (status) => {
  const s = String(status || "").toLowerCase().trim().replace(/[-\s]/g, "_");
  if (s === "half_day" || s === "halfday" || s === "late" || s === "h") return "half_day";
  if (s === "leave" || s === "excused" || s === "on_leave" || s === "l") return "leave";
  if (s === "absent" || s === "a") return "absent";
  if (s === "present" || s === "p") return "present";
  return s || "";
};

export const STATUS_CONFIG = {
  present: {
    key: "present",
    apiValue: "Present",
    label: "Present",
    bg: "#e6f7ec",
    border: "#a9e6bf",
    text: "#1e6b37",
    dot: "#22c55e",
    icon: Check,
  },
  absent: {
    key: "absent",
    apiValue: "Absent",
    label: "Absent",
    bg: "#feecee",
    border: "#fca5ad",
    text: "#b91c1c",
    dot: "#ef4444",
    icon: X,
  },
  half_day: {
    key: "half_day",
    apiValue: "Half Day",
    label: "Half Day",
    bg: "#fef7e6",
    border: "#fde096",
    text: "#b45309",
    dot: "#f59e0b",
    icon: Clock,
  },
  leave: {
    key: "leave",
    apiValue: "Leave",
    label: "Leave / Excused",
    bg: "#eef2fe",
    border: "#b9cbfd",
    text: "#3730a3",
    dot: "#6366f1",
    icon: FileText,
  },
};

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

/**
 * Animated Executive Insights for Personal (Single Person) Attendance
 * Provides real-time duty status, an animated Swiss minimalist chronometer dial with
 * complete 1-12 numerals, and precision timekeeping that fully fits the available space.
 */
const SinglePersonAttendanceInsights = ({ monthStats, people, monthLabel, todayStr }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const personName = people[0]?.name || "Branch Administrator";

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Hour hand: 30 deg per hour + 0.5 deg per minute
  const hourDeg = (hours + minutes / 60) * 30;
  // Minute hand: 6 deg per minute + 0.1 deg per second
  const minuteDeg = (minutes + seconds / 60) * 6;
  // Second hand: 6 deg per second (starts at 12 o'clock when 0)
  const secondDeg = seconds * 6;

  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Precise positions for 12 clock numerals around a 200x200 SVG (center: 100, 100, radius: 68)
  const clockNumerals = [
    { n: 12, x: 100, y: 32, cardinal: true },
    { n: 1, x: 134, y: 41, cardinal: false },
    { n: 2, x: 159, y: 66, cardinal: false },
    { n: 3, x: 168, y: 100, cardinal: true },
    { n: 4, x: 159, y: 134, cardinal: false },
    { n: 5, x: 134, y: 159, cardinal: false },
    { n: 6, x: 100, y: 168, cardinal: true },
    { n: 7, x: 66, y: 159, cardinal: false },
    { n: 8, x: 41, y: 134, cardinal: false },
    { n: 9, x: 32, y: 100, cardinal: true },
    { n: 10, x: 41, y: 66, cardinal: false },
    { n: 11, x: 66, y: 41, cardinal: false },
  ];

  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Full-Width Executive Chronometer & Duty Station Card with Expanded Vertical Space */}
      <div className="w-full rounded-2xl border border-[#e3ddd0] bg-white p-5 sm:p-8 lg:p-10 shadow-xs flex flex-col justify-between min-h-[440px] sm:min-h-[480px] lg:min-h-[520px] space-y-6 sm:space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0ebe1] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#9c6b2e]" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9c6b2e]">
                Executive Time & Attendance Register
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Duty Chronometer & Station
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Real-time office timekeeping & verified administrator attendance tracking
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <span>Active Duty Live</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] text-xs font-bold text-slate-700">
              <User className="h-3.5 w-3.5 text-[#9c6b2e]" />
              <span>{personName}</span>
            </div>
          </div>
        </div>

        {/* Main Body: Prominent Swiss Dial + Expanded Digital Chronometer */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-evenly gap-8 py-4">
          {/* Large Luxury Swiss Dial */}
          <div className="flex items-center justify-center shrink-0">
            <div className="relative h-56 w-56 sm:h-72 sm:w-72 lg:h-80 lg:w-80 filter drop-shadow-md">
              <svg viewBox="0 0 200 200" className="w-full h-full select-none">
                {/* Dial Face Outer Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="96"
                  fill="#faf8f4"
                  stroke="#d5cdbd"
                  strokeWidth="2.5"
                />
                {/* Inner Bezel Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="91"
                  fill="none"
                  stroke="#ede7dc"
                  strokeWidth="1"
                />
                {/* Inner Decorative Subdial Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="52"
                  fill="none"
                  stroke="#efe9dd"
                  strokeWidth="1"
                  strokeDasharray="2,3"
                />

                {/* 60 Minute/Hour Bezel Ticks */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const isHour = i % 5 === 0;
                  const isCardinal = i % 15 === 0;
                  if (isHour) {
                    return (
                      <line
                        key={i}
                        x1="100"
                        y1="4"
                        x2="100"
                        y2={isCardinal ? "12" : "9"}
                        stroke={isCardinal ? "#9c6b2e" : "#64748b"}
                        strokeWidth={isCardinal ? "2.5" : "1.5"}
                        strokeLinecap="round"
                        transform={`rotate(${i * 6} 100 100)`}
                      />
                    );
                  }
                  return (
                    <line
                      key={i}
                      x1="100"
                      y1="4"
                      x2="100"
                      y2="7"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeLinecap="round"
                      transform={`rotate(${i * 6} 100 100)`}
                    />
                  );
                })}

                {/* Complete 1 to 12 Numerals */}
                {clockNumerals.map((item) => (
                  <text
                    key={item.n}
                    x={item.x}
                    y={item.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={item.cardinal ? "11" : "8.5"}
                    fontWeight={item.cardinal ? "800" : "600"}
                    fill={item.cardinal ? "#9c6b2e" : "#475569"}
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {item.n}
                  </text>
                ))}

                {/* Brand & Subtext inside Clock */}
                <text
                  x="100"
                  y="78"
                  textAnchor="middle"
                  fontSize="6.5"
                  fontWeight="800"
                  fill="#9c6b2e"
                  letterSpacing="1.5"
                >
                  AURUM FX
                </text>
                <text
                  x="100"
                  y="85"
                  textAnchor="middle"
                  fontSize="4.5"
                  fontWeight="600"
                  fill="#94a3b8"
                  letterSpacing="1"
                >
                  CHRONOMETER
                </text>
                <text
                  x="100"
                  y="124"
                  textAnchor="middle"
                  fontSize="5"
                  fontWeight="700"
                  fill="#64748b"
                  letterSpacing="0.8"
                >
                  {monthLabel ? monthLabel.toUpperCase() : "ATTENDANCE"}
                </text>

                {/* Hour Hand (Thick, Charcoal, Points to exact hour) */}
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="54"
                  stroke="#17140f"
                  strokeWidth="4"
                  strokeLinecap="round"
                  transform={`rotate(${hourDeg} 100 100)`}
                />

                {/* Minute Hand (Sleek, Long, Points to exact minute) */}
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke="#334155"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  transform={`rotate(${minuteDeg} 100 100)`}
                />

                {/* Second Hand (Gold Needle, points straight to current second) */}
                <line
                  x1="100"
                  y1="106"
                  x2="100"
                  y2="16"
                  stroke="#9c6b2e"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  transform={`rotate(${secondDeg} 100 100)`}
                />

                {/* Center Cap Hub */}
                <circle cx="100" cy="100" r="4.5" fill="#9c6b2e" />
                <circle cx="100" cy="100" r="1.8" fill="#ffffff" />
              </svg>
            </div>
          </div>

          {/* Expanded Digital Chronometer & Date Display */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-[#9c6b2e] text-xs font-extrabold uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5" />
              Standard Branch Office Time
            </div>

            <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 font-mono tracking-tight select-none">
              {timeString}
            </div>

            <div className="text-base sm:text-lg font-semibold text-slate-600">
              {dateString}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Synchronized IST
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                09:00 AM – 06:00 PM General Shift
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#9c6b2e]" />
                Administrator Verified Station
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Strip */}
        <div className="pt-5 border-t border-[#f0ebe1] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#9c6b2e]" />
            <span>Aurum FX Administrator Attendance Register & Verification</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400">
            Auto-updates continuously with precision timekeeping
          </div>
        </div>
      </div>
    </div>
  );
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * AttendanceCalendarMatrix Component
 * Reusable full-month attendance spreadsheet/matrix grid matching the user's design image.
 */
const AttendanceCalendarMatrix = ({
  people = [],
  records = [],
  attendanceRecords, // alias support
  onSaveStatus, // async (personId, dateStr, newStatus, existingRecord)
  onMonthChange, // optional (newMonthDate) => void
  initialDate = null,
  title = "Staff Attendance",
  subtitle = "Monthly attendance tracking and register",
  isSinglePerson = false,
  savingKey = null, // key of cell currently saving e.g. `${personId}_${dateStr}`
  isStaffPage = false,
  fullWidth = false,
  allowPastUpdates = false, // When false, only TODAY's attendance can be marked or updated
  holidays = [],
}) => {
  const isExpandedLayout = isStaffPage || fullWidth;
  const todayStr = getToday();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (initialDate) {
      const parsed = new Date(initialDate);
      if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Determine single-person view mode (e.g., My Attendance page)
  const singlePersonMode = Boolean(
    isSinglePerson || (Array.isArray(people) && people.length === 1)
  );

  // Floating Popover state for marking status
  const [activeCell, setActiveCell] = useState(null); // { personId, personName, dateStr, dayNum, dayName, currentStatus, record, holiday, top, left, ... }
  const popoverRef = useRef(null);

  // Responsive mobile screen detection
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Month navigation helpers
  const year = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth(); // 0 to 11

  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear - 3; y <= currentYear + 3; y++) {
      list.push(y);
    }
    if (!list.includes(year)) {
      list.push(year);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [year]);

  const monthLabel = currentMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleMonthYearChange = (newYear, newMonthIdx) => {
    const nextDate = new Date(newYear, newMonthIdx, 1);
    setCurrentMonthDate(nextDate);
    setActiveCell(null);
    if (typeof onMonthChange === "function") {
      onMonthChange(nextDate);
    }
  };

  const prevMonth = () => {
    const nextDate = new Date(year, monthIndex - 1, 1);
    setCurrentMonthDate(nextDate);
    setActiveCell(null);
    if (typeof onMonthChange === "function") {
      onMonthChange(nextDate);
    }
  };

  const nextMonth = () => {
    const nextDate = new Date(year, monthIndex + 1, 1);
    setCurrentMonthDate(nextDate);
    setActiveCell(null);
    if (typeof onMonthChange === "function") {
      onMonthChange(nextDate);
    }
  };

  const goToToday = () => {
    const d = new Date();
    const nextDate = new Date(d.getFullYear(), d.getMonth(), 1);
    setCurrentMonthDate(nextDate);
    setActiveCell(null);
    if (typeof onMonthChange === "function") {
      onMonthChange(nextDate);
    }
  };

  // Robust holiday list extraction supporting both array and wrapped object ({ holidays: [...] })
  const holidaysList = useMemo(() => {
    if (Array.isArray(holidays)) return holidays;
    if (Array.isArray(holidays?.holidays)) return holidays.holidays;
    if (Array.isArray(holidays?.data)) return holidays.data;
    return [];
  }, [holidays]);

  const holidaysMap = useMemo(() => {
    const map = {};
    holidaysList.forEach((h) => {
      if (!h) return;
      const rawDate = h.date || h.holiday_date || h.day;
      const d = typeof rawDate === "string" ? rawDate.trim().slice(0, 10) : "";
      if (d) {
        map[d] = {
          ...h,
          date: d,
          reason: h.reason || h.title || h.name || "Declared Holiday",
        };
      }
    });
    return map;
  }, [holidaysList]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    const count = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const dayNum = i + 1;
      const dateObj = new Date(year, monthIndex, dayNum);
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayName = dateObj
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      const isSunday = dateObj.getDay() === 0;
      const isSaturday = dateObj.getDay() === 6;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const isPast = dateStr < todayStr;
      const holiday = holidaysMap[dateStr] || (isSunday ? { date: dateStr, reason: "Sunday", type: "sunday" } : null);
      return {
        dayNum,
        dateStr,
        dayName,
        isSunday,
        isSaturday,
        isWeekend: isSunday || isSaturday,
        isToday,
        isFuture,
        isPast,
        holiday,
      };
    });
  }, [year, monthIndex, todayStr, holidaysMap]);

  // Count declared holidays in the current month
  const declaredHolidaysCount = useMemo(() => {
    return daysInMonth.filter((d) => Boolean(d.holiday)).length;
  }, [daysInMonth]);

  // Unified list of records supporting records and attendanceRecords prop aliases
  const recordsList = useMemo(() => {
    if (Array.isArray(records) && records.length > 0) return records;
    if (Array.isArray(attendanceRecords) && attendanceRecords.length > 0) return attendanceRecords;
    if (Array.isArray(records)) return records;
    if (Array.isArray(attendanceRecords)) return attendanceRecords;
    return [];
  }, [records, attendanceRecords]);

  // Fast lookup map for records: key = `${personId}_${dateStr}` and dateStr for single person
  const recordsMap = useMemo(() => {
    const map = new Map();
    recordsList.forEach((rec) => {
      if (!rec) return;
      const rawDate = rec.date || rec.attendance_date || rec.marked_at;
      const dateStr = rawDate ? String(rawDate).slice(0, 10) : "";
      if (!dateStr) return;

      const pId =
        rec.staff_id ??
        rec.person_id ??
        rec.user_id ??
        rec.branch_admin_id ??
        rec.admin_id;

      if (pId !== undefined && pId !== null && pId !== "") {
        map.set(`${String(pId)}_${dateStr}`, rec);
      }
      if (rec.staff_code) {
        map.set(`${String(rec.staff_code)}_${dateStr}`, rec);
      }
      if (rec.email) {
        map.set(`${String(rec.email).toLowerCase()}_${dateStr}`, rec);
      }
      if (singlePersonMode) {
        map.set(dateStr, rec);
        if (people?.[0]?.id) {
          map.set(`${String(people[0].id)}_${dateStr}`, rec);
        }
      }
    });
    return map;
  }, [recordsList, singlePersonMode, people]);

  const getRecordForPerson = (person, dateStr) => {
    if (!person) return undefined;
    const pId = person.id ?? "single";
    let specificRecord = recordsMap.get(`${String(pId)}_${dateStr}`);
    if (specificRecord) return specificRecord;
    if (person.staff_code) {
      specificRecord = recordsMap.get(`${String(person.staff_code)}_${dateStr}`);
      if (specificRecord) return specificRecord;
    }
    if (person.email) {
      specificRecord = recordsMap.get(`${String(person.email).toLowerCase()}_${dateStr}`);
      if (specificRecord) return specificRecord;
    }
    if (singlePersonMode) {
      return recordsMap.get(dateStr);
    }
    return undefined;
  };

  // Filtered people by search query
  const filteredPeople = useMemo(() => {
    let list = Array.isArray(people) ? people : [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.role && p.role.toLowerCase().includes(q))
      );
    }
    if (selectedRole !== "all") {
      list = list.filter(
        (p) => String(p.role || "").toLowerCase() === selectedRole.toLowerCase()
      );
    }
    return list;
  }, [people, searchQuery, selectedRole]);

  // Overall statistics for the selected month
  const monthStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let halfDay = 0;

    daysInMonth.forEach(({ dateStr, holiday }) => {
      if (holiday) return;
      people.forEach((p) => {
        const rec = getRecordForPerson(p, dateStr);
        if (rec) {
          const norm = normalizeStatus(rec.status);
          if (norm === "present") present++;
          else if (norm === "absent") absent++;
          else if (norm === "half_day") halfDay++;
        }
      });
    });

    const totalMarked = present + absent + halfDay;
    const rate =
      totalMarked > 0
        ? Math.round(((present + halfDay * 0.5) / totalMarked) * 100)
        : 100;

    return {
      present,
      absent,
      halfDay,
      totalMarked,
      rate,
    };
  }, [daysInMonth, people, recordsMap]);

  // Close popover when clicking outside (deferred so current click doesn't close it)
  useEffect(() => {
    if (!activeCell) return;

    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setActiveCell(null);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    }, 80);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [activeCell]);

  // Handle cell click
  const handleCellClick = (e, person, day) => {
    // Declared branch holidays are strictly read-only! No attendance can be marked or altered.
    if (day.holiday) return;
    // Only TODAY's attendance can be marked or updated. Yesterday and past dates cannot be updated!
    if (!day.isToday && !allowPastUpdates) return;
    if (day.isFuture) return; // Tomorrow and future dates are strictly read-only!
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const existing = getRecordForPerson(person, day.dateStr);

    const rect = e.currentTarget.getBoundingClientRect();
    const currentStatus = existing ? normalizeStatus(existing.status) : "";

    setActiveCell({
      personId: person.id,
      personName: person.name,
      dateStr: day.dateStr,
      dayNum: day.dayNum,
      dayName: day.dayName,
      currentStatus,
      record: existing,
      holiday: day.holiday,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    });
  };

  // Mark status action
  const handleSelectStatus = async (statusKey) => {
    if (!activeCell || !onSaveStatus) return;
    const { personId, dateStr, record } = activeCell;
    // Guard: Only TODAY can be marked or updated!
    if (dateStr !== todayStr && !allowPastUpdates) return;
    if (dateStr > todayStr) return; // Guard: Future dates are strictly read-only!

    const config = STATUS_CONFIG[statusKey];
    const apiValue = config ? config.apiValue : statusKey;

    setActiveCell(null); // Close popover immediately
    try {
      await onSaveStatus(personId, dateStr, apiValue, record);
    } catch (err) {
      console.error("Failed to mark attendance:", err);
    }
  };

  // Clear / remove status
  const handleClearStatus = async () => {
    if (!activeCell || !onSaveStatus) return;
    const { personId, dateStr, record } = activeCell;
    // Guard: Only TODAY can be cleared!
    if (dateStr !== todayStr && !allowPastUpdates) return;
    setActiveCell(null);
    try {
      await onSaveStatus(personId, dateStr, null, record);
    } catch (err) {
      console.error("Failed to clear attendance:", err);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* MAIN CONTAINER (Left Summary Panel + Right Calendar Matrix Grid) */}
      <div className={`w-full ${isExpandedLayout ? "flex flex-col xl:flex-row gap-6 items-start" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}`}>
        {/* ========================================================= */}
        {/* LEFT SUMMARY PANEL (MATCHING DESIGN SIDEBAR)              */}
        {/* ========================================================= */}
        <div className={`${isExpandedLayout ? "w-full xl:w-[380px] 2xl:w-[420px] shrink-0 space-y-6 xl:sticky xl:top-[108px]" : "lg:col-span-3 space-y-5"}`}>
          {/* Header Card */}
          <div className={`rounded-2xl border border-[#e3ddd0] bg-white shadow-xs ${isExpandedLayout ? "p-6 sm:p-7 space-y-6" : "p-5"}`}>
            <div className="flex items-center gap-3.5">
              <div className={`flex shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/70 text-[#9c6b2e] ${isExpandedLayout ? "h-14 w-14" : "h-11 w-11 rounded-xl"}`}>
                <CalendarDays className={isExpandedLayout ? "h-7 w-7" : "h-5 w-5"} />
              </div>
              <div className="min-w-0">
                <h3 className={`font-extrabold text-slate-900 truncate tracking-tight ${isExpandedLayout ? "text-lg sm:text-xl" : "text-base font-bold"}`}>
                  {title}
                </h3>
                <p className={`text-slate-500 truncate font-medium ${isExpandedLayout ? "text-xs sm:text-sm mt-0.5" : "text-xs"}`}>{subtitle}</p>
              </div>
            </div>

            {/* Quick Status Legend Filter */}
            <div className={`pt-5 border-t border-[#f0ebe1] ${isExpandedLayout ? "space-y-3.5" : "space-y-2.5"}`}>
              {isExpandedLayout && (
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Monthly Status Overview
                </div>
              )}
              <div className={`flex items-center justify-between text-xs font-semibold text-slate-700 ${isExpandedLayout ? "p-3.5 rounded-xl bg-[#faf8f4] border border-[#efe9dd]" : ""}`}>
                <span className="flex items-center gap-3">
                  <span className={`flex items-center justify-center rounded-lg bg-[#e6f7ec] border border-[#a9e6bf] text-[#1e6b37] ${isExpandedLayout ? "h-8 w-8" : "h-5 w-5 rounded-md"}`}>
                    <Check className={isExpandedLayout ? "h-4 w-4" : "h-3 w-3"} strokeWidth={2.8} />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Present</div>
                    {isExpandedLayout && <div className="text-[11px] text-slate-400 font-medium">Full day attendance</div>}
                  </div>
                </span>
                <span className={`font-black bg-[#e6f7ec] border border-[#a9e6bf] ${isExpandedLayout ? "text-base text-emerald-800 px-3.5 py-1 rounded-full" : "text-xs text-emerald-700 px-2 py-0.5 rounded-full"}`}>
                  {monthStats.present}
                </span>
              </div>
              <div className={`flex items-center justify-between text-xs font-semibold text-slate-700 ${isExpandedLayout ? "p-3.5 rounded-xl bg-[#faf8f4] border border-[#efe9dd]" : ""}`}>
                <span className="flex items-center gap-3">
                  <span className={`flex items-center justify-center rounded-lg bg-[#feecee] border border-[#fca5ad] text-[#b91c1c] ${isExpandedLayout ? "h-8 w-8" : "h-5 w-5 rounded-md"}`}>
                    <X className={isExpandedLayout ? "h-4 w-4" : "h-3 w-3"} strokeWidth={2.8} />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Absent</div>
                    {isExpandedLayout && <div className="text-[11px] text-slate-400 font-medium">Absence recorded</div>}
                  </div>
                </span>
                <span className={`font-black bg-[#feecee] border border-[#fca5ad] ${isExpandedLayout ? "text-base text-rose-800 px-3.5 py-1 rounded-full" : "text-xs text-rose-700 px-2 py-0.5 rounded-full"}`}>
                  {monthStats.absent}
                </span>
              </div>
              <div className={`flex items-center justify-between text-xs font-semibold text-slate-700 ${isExpandedLayout ? "p-3.5 rounded-xl bg-[#faf8f4] border border-[#efe9dd]" : ""}`}>
                <span className="flex items-center gap-3">
                  <span className={`flex items-center justify-center rounded-lg bg-[#fef7e6] border border-[#fde096] text-[#b45309] ${isExpandedLayout ? "h-8 w-8" : "h-5 w-5 rounded-md"}`}>
                    <Clock className={isExpandedLayout ? "h-4 w-4" : "h-3 w-3"} strokeWidth={2.8} />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Half Day</div>
                    {isExpandedLayout && <div className="text-[11px] text-slate-400 font-medium">Half day shift</div>}
                  </div>
                </span>
                <span className={`font-black bg-[#fef7e6] border border-[#fde096] ${isExpandedLayout ? "text-base text-amber-800 px-3.5 py-1 rounded-full" : "text-xs text-amber-700 px-2 py-0.5 rounded-full"}`}>
                  {monthStats.halfDay}
                </span>
              </div>
              {declaredHolidaysCount > 0 && (
                <div className={`flex items-center justify-between text-xs font-semibold text-slate-700 ${isExpandedLayout ? "p-3.5 rounded-xl bg-[#fef6e7] border border-[#edd194]" : "p-1 rounded-lg bg-[#fef6e7]/60"}`}>
                  <span className="flex items-center gap-3">
                    <span className={`flex items-center justify-center rounded-lg bg-[#fef4e2] border border-[#ecd299] text-[#87501a] ${isExpandedLayout ? "h-8 w-8" : "h-5 w-5 rounded-md"}`}>
                      <CalendarCheck className={isExpandedLayout ? "h-4 w-4" : "h-3 w-3"} strokeWidth={2.5} />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Branch Holidays</div>
                      {isExpandedLayout && <div className="text-[11px] text-slate-500 font-medium">Declared holidays this month</div>}
                    </div>
                  </span>
                  <span className={`font-black bg-[#fae7be] border border-[#ecd299] ${isExpandedLayout ? "text-base text-[#7a440e] px-3.5 py-1 rounded-full" : "text-xs text-[#7a440e] px-2 py-0.5 rounded-full"}`}>
                    {declaredHolidaysCount}
                  </span>
                </div>
              )}
            </div>

            {isExpandedLayout && (
              <div className="pt-4 border-t border-[#f0ebe1] flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{isSinglePerson ? "Account Profile" : "Total Active Staff"}</span>
                <span className="font-extrabold text-slate-800 bg-[#faf8f4] px-3 py-1 rounded-lg border border-[#e3ddd0]">
                  {isSinglePerson ? (people[0]?.name || "Branch Administrator") : `${people.length} Members`}
                </span>
              </div>
            )}
          </div>

          {/* Monthly Record Card */}
          <div className={`rounded-2xl border border-[#e3ddd0] bg-white shadow-xs ${isExpandedLayout ? "p-6 sm:p-7 space-y-6" : "p-5 space-y-4"}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Attendance Record
                </span>
                <span className={`font-extrabold text-[#9c6b2e] ${isExpandedLayout ? "text-base sm:text-lg" : "text-xs"}`}>
                  {monthLabel}
                </span>
              </div>
              {isExpandedLayout && (
                <span className="text-xs font-bold text-[#9c6b2e] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  Monthly Summary
                </span>
              )}
            </div>

            <div className={`grid grid-cols-3 ${isExpandedLayout ? "gap-3" : "gap-2"}`}>
              <div className={`rounded-2xl border border-emerald-200/80 bg-emerald-50/60 text-center flex flex-col justify-center items-center shadow-2xs ${isExpandedLayout ? "py-5 px-2.5 sm:py-6 sm:px-3" : "p-2 sm:p-2.5"}`}>
                <div className={`font-black text-emerald-700 ${isExpandedLayout ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
                  {monthStats.present}
                </div>
                <div className={`font-bold text-emerald-800 leading-tight mt-1 ${isExpandedLayout ? "text-[11px] sm:text-xs" : "text-[10px] sm:text-[11px]"}`}>
                  Days Present
                </div>
              </div>
              <div className={`rounded-2xl border border-rose-200/80 bg-rose-50/60 text-center flex flex-col justify-center items-center shadow-2xs ${isExpandedLayout ? "py-5 px-2.5 sm:py-6 sm:px-3" : "p-2 sm:p-2.5"}`}>
                <div className={`font-black text-rose-700 ${isExpandedLayout ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
                  {monthStats.absent}
                </div>
                <div className={`font-bold text-rose-800 leading-tight mt-1 ${isExpandedLayout ? "text-[11px] sm:text-xs" : "text-[10px] sm:text-[11px]"}`}>
                  Days Absent
                </div>
              </div>
              <div className={`rounded-2xl border border-amber-200/80 bg-amber-50/60 text-center flex flex-col justify-center items-center shadow-2xs ${isExpandedLayout ? "py-5 px-2.5 sm:py-6 sm:px-3" : "p-2 sm:p-2.5"}`}>
                <div className={`font-black text-amber-700 ${isExpandedLayout ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
                  {monthStats.halfDay}
                </div>
                <div className={`font-bold text-amber-800 leading-tight mt-1 ${isExpandedLayout ? "text-[11px] sm:text-xs" : "text-[10px] sm:text-[11px]"}`}>
                  Half Days
                </div>
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div className={`border-t border-[#f0ebe1] ${isExpandedLayout ? "pt-4 space-y-2.5" : "pt-2 space-y-1.5"}`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Monthly Compliance</span>
                <span className={`text-emerald-700 font-extrabold ${isExpandedLayout ? "text-sm sm:text-base" : ""}`}>
                  {monthStats.rate}%
                </span>
              </div>
              <div className={`w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200 ${isExpandedLayout ? "h-3.5" : "h-2.5"}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, monthStats.rate))}%` }}
                />
              </div>
            </div>

            {/* Extra summary metrics to fill vertical space nicely on staff page */}
            {isExpandedLayout && (
              <div className="pt-4 border-t border-[#f0ebe1] space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-semibold">
                  <span>Total Marked Shifts</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {monthStats.totalMarked}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-semibold">
                  <span>Present Shift Ratio</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {monthStats.totalMarked > 0
                      ? `${Math.round(((monthStats.present + monthStats.halfDay * 0.5) / monthStats.totalMarked) * 100)}%`
                      : "100%"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: CALENDAR MATRIX SPREADSHEET + INSIGHTS     */}
        {/* ========================================================= */}
        <div className={`${isExpandedLayout ? "flex-1 min-w-0 w-full flex flex-col gap-6" : "lg:col-span-9 flex flex-col gap-6"}`}>
          <div className="rounded-2xl border border-[#e3ddd0] bg-white shadow-xs overflow-hidden flex flex-col">
          {/* Top Control Bar: Month, Month Selector, Search, Navigation */}
          <div className="p-4 sm:p-5 border-b border-[#e3ddd0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Month Title + Month/Year Selection Controls */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAF8F4] border border-[#e3ddd0] text-[#9c6b2e] shrink-0">
                <Calendar className="h-4 w-4" />
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {monthLabel}
              </h2>

              {/* Month & Year Selection Stepper & Dropdowns */}
              <div className="flex items-center gap-1 bg-[#FAF8F4] border border-[#e3ddd0] p-1 rounded-xl shadow-2xs">
                {/* Previous Month */}
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                  title="Previous month"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Month Dropdown */}
                <div className="relative">
                  <select
                    value={monthIndex}
                    onChange={(e) => handleMonthYearChange(year, Number(e.target.value))}
                    className="appearance-none bg-white border border-[#ded8cb] hover:border-[#9c6b2e] rounded-lg pl-2 pr-6 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-[#9c6b2e] cursor-pointer"
                    aria-label="Select month"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                </div>

                {/* Year Dropdown */}
                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => handleMonthYearChange(Number(e.target.value), monthIndex)}
                    className="appearance-none bg-white border border-[#ded8cb] hover:border-[#9c6b2e] rounded-lg pl-2 pr-6 py-1 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-[#9c6b2e] cursor-pointer"
                    aria-label="Select year"
                  >
                    {yearsList.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                </div>

                {/* Next Month */}
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                  title="Next month"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Today / This Month Reset (only if not viewing current month) */}
                {(year !== new Date().getFullYear() || monthIndex !== new Date().getMonth()) && (
                  <button
                    type="button"
                    onClick={goToToday}
                    className="ml-0.5 px-2 py-1 rounded-lg bg-white border border-[#ded8cb] text-[11px] font-bold text-[#9c6b2e] hover:bg-[#f3ede1] transition cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Jump to current month"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>

            {/* Right Controls: Search Staff */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isSinglePerson && (
                <div className="relative w-full sm:w-auto">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name..."
                    className="w-full sm:w-44 pl-9 pr-3 py-1.5 rounded-lg border border-[#e3ddd0] bg-[#FAF8F4] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#9c6b2e] focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* HORIZONTALLY SCROLLABLE MATRIX TABLE                      */}
          {/* ========================================================= */}
          <div className="relative overflow-x-auto w-full">
            <table className="w-full border-collapse text-left">
              {/* Table Header: Names Column + Day Columns (MON 2, TUE 3...) */}
              <thead>
                <tr className="border-b border-[#e3ddd0] bg-[#faf8f4] text-slate-600 select-none">
                  {/* Left Column: Name */}
                  <th className="sticky left-0 z-20 bg-[#faf8f4] py-4 px-4 text-xs font-extrabold uppercase tracking-wider text-slate-700 min-w-[200px] sm:min-w-[230px] border-r border-[#e3ddd0]">
                    {isSinglePerson ? "Staff Profile" : "Staff Name"}
                  </th>

                  {/* Date Columns */}
                  {daysInMonth.map((day) => (
                    <th
                      key={day.dateStr}
                      className={`py-3 px-1.5 text-center border-r border-[#efe9dd] last:border-r-0 ${
                        day.holiday
                          ? "min-w-[100px] sm:min-w-[120px] bg-[#fef4e2] font-extrabold ring-1 ring-[#e5af4b]/70"
                          : day.isToday
                          ? "min-w-[54px] sm:min-w-[62px] bg-amber-100/70 font-extrabold ring-1 ring-amber-400/50"
                          : day.isFuture
                          ? "min-w-[54px] sm:min-w-[62px] bg-slate-50/50 opacity-60"
                          : day.isWeekend
                          ? "min-w-[54px] sm:min-w-[62px] bg-[#f5f1e8]/60"
                          : "min-w-[54px] sm:min-w-[62px]"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] sm:text-[11px] font-bold tracking-tight uppercase ${
                            day.holiday
                              ? "text-[#87501a] font-extrabold"
                              : day.isToday
                              ? "text-amber-900 font-extrabold"
                              : day.isFuture
                              ? "text-slate-400"
                              : day.isWeekend
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span
                          className={`text-xs sm:text-sm mt-0.5 inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full font-bold ${
                            day.holiday && day.isToday
                              ? "bg-[#9c6b2e] text-white shadow-xs ring-2 ring-[#e5af4b]"
                              : day.holiday
                              ? "bg-[#eac478] text-[#5c3408] font-black shadow-xs ring-1 ring-[#cfa24b]"
                              : day.isToday
                              ? "bg-[#9c6b2e] text-white shadow-xs ring-2 ring-amber-300"
                              : day.isFuture
                              ? "text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {day.dayNum}
                        </span>
                        {day.holiday ? (
                          <div className="flex flex-col items-center mt-1 leading-tight gap-0.5 w-full px-0.5">
                            <span
                              className={`w-full px-1.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-tight text-center truncate ${
                                day.isToday
                                  ? "bg-[#87501a] text-amber-100 shadow-2xs"
                                  : "bg-[#fae7be] text-[#7a440e] border border-[#ecd299]"
                              }`}
                              title={`Declared Branch Holiday: ${day.holiday.reason || 'Public Holiday'}${day.isToday ? ' (Today)' : ''}`}
                            >
                              {day.holiday.reason || "Holiday"}
                            </span>
                            {day.isToday && (
                              <span className="text-[7px] font-extrabold uppercase tracking-widest text-[#9c6b2e]">
                                Today
                              </span>
                            )}
                          </div>
                        ) : day.isToday ? (
                          <span className="mt-0.5 text-[8px] font-extrabold uppercase tracking-widest text-[#9c6b2e]">
                            Today
                          </span>
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#efe9dd]">
                {filteredPeople.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth.length + 1}
                      className="py-12 px-6 text-center text-sm text-slate-500"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredPeople.map((person) => {
                    const personId = person.id || "single";
                    const initials = (person.name || "ST")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={personId}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Sticky Left Column: Staff Name & Avatar */}
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-3 px-4 border-r border-[#e3ddd0] shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1ede4] border border-[#e3ddd0] text-xs font-bold text-[#7a531f]">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-xs sm:text-sm font-bold text-slate-900">
                                {person.name}
                              </div>
                              <div className="truncate text-[11px] text-slate-500">
                                {person.role || person.email || "Staff"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date Cells */}
                        {daysInMonth.map((day) => {
                          const cellKey = `${String(person.id)}_${day.dateStr}`;
                          const record = getRecordForPerson(person, day.dateStr);
                          const rawStatus = record?.status;
                          const norm = normalizeStatus(rawStatus);
                          const config = STATUS_CONFIG[norm];
                          const isSavingThis = savingKey === cellKey;
                          const isSelected =
                            activeCell &&
                            String(activeCell.personId) === String(person.id) &&
                            activeCell.dateStr === day.dateStr;
                          const canEdit = !day.holiday && (day.isToday || allowPastUpdates) && !day.isFuture;

                          return (
                            <td
                              key={day.dateStr}
                              className={`p-2 text-center border-r border-[#efe9dd] last:border-r-0 ${
                                day.holiday
                                  ? "bg-[#fef9ee]"
                                  : day.isToday
                                  ? "bg-amber-50/50"
                                  : day.isFuture
                                  ? "bg-slate-50/40"
                                  : day.isWeekend
                                  ? "bg-[#faf8f4]/40"
                                  : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (canEdit && !day.holiday) {
                                    handleCellClick(e, person, day);
                                  }
                                }}
                                disabled={day.holiday || !canEdit || isSavingThis}
                                title={
                                  day.holiday
                                    ? `${person.name} - Branch Holiday: "${day.holiday.reason || 'Declared Holiday'}"`
                                    : day.isFuture
                                    ? `${person.name} - ${day.dayName} ${day.dayNum} ${monthLabel} (Future date - Read only)`
                                    : !day.isToday && !allowPastUpdates
                                    ? `${person.name} - ${day.dayName} ${day.dayNum} ${monthLabel}: ${
                                        config ? config.label : "Unmarked"
                                      } (Past date - Locked, cannot edit)`
                                    : `${person.name} - Today ${day.dayName} ${day.dayNum} ${monthLabel}: ${
                                        config ? config.label : "Click to mark/update"
                                      }`
                                }
                                className={`h-9 w-9 sm:h-10 sm:w-10 mx-auto rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                                  day.holiday
                                    ? "cursor-not-allowed select-none border border-[#ecd299] bg-[#fef4e2] text-[#87501a] shadow-2xs"
                                    : config
                                    ? `shadow-2xs ${canEdit ? "cursor-pointer transform active:scale-95 hover:scale-105" : "cursor-default select-none"}`
                                    : canEdit
                                    ? "cursor-pointer transform active:scale-95 hover:scale-105 border border-[#e3ddd0] bg-white hover:border-[#9c6b2e]/60 hover:bg-amber-50/40 text-slate-300 hover:text-slate-500"
                                    : "cursor-not-allowed select-none border border-slate-200/50 bg-slate-50/40 text-slate-300"
                                } ${
                                  isSelected
                                    ? "ring-2 ring-[#9c6b2e] ring-offset-1"
                                    : ""
                                }`}
                                style={
                                  config && !day.holiday
                                    ? {
                                        background: config.bg,
                                        borderColor: config.border,
                                        borderWidth: "1px",
                                        color: config.text,
                                        opacity: day.isFuture ? 0.6 : 1,
                                      }
                                    : undefined
                                }
                              >
                                {isSavingThis ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                                ) : day.holiday ? (
                                  <div className="flex flex-col items-center justify-center leading-none text-center px-0.5 select-none pointer-events-none">
                                    <CalendarCheck className="h-3.5 w-3.5 text-[#9c6b2e]" strokeWidth={2.4} />
                                    <span
                                      className="text-[7.5px] font-black uppercase text-[#87501a] tracking-tighter mt-0.5"
                                      title={`Holiday: ${day.holiday.reason || 'Holiday'}`}
                                    >
                                      Off
                                    </span>
                                  </div>
                                ) : config ? (
                                  <config.icon className="h-4 w-4" strokeWidth={2.6} />
                                ) : canEdit ? (
                                  <span className="opacity-0 group-hover:opacity-60 text-xs text-slate-400">
                                    +
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-300">
                                    —
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* BOTTOM FOOTER & LEGEND (MATCHING SCREENSHOT)              */}
          {/* ========================================================= */}
          <div className="p-4 border-t border-[#e3ddd0] bg-[#faf8f4] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-700">
              Showing {filteredPeople.length}{" "}
              {filteredPeople.length === 1 ? "member" : "members"}
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e6f7ec] border border-[#a9e6bf] text-emerald-700">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
                Present
              </span>

              <span className="flex items-center gap-1.5 text-rose-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#feecee] border border-[#fca5ad] text-rose-700">
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </span>
                Absent
              </span>

              <span className="flex items-center gap-1.5 text-amber-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#fef7e6] border border-[#fde096] text-amber-700">
                  <Clock className="h-3 w-3" strokeWidth={2.5} />
                </span>
                Half Day
              </span>

              <span className="flex items-center gap-1.5 text-amber-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#fef4e2] border border-[#ecd299] text-[#87501a]">
                  <CalendarCheck className="h-3 w-3" strokeWidth={2.5} />
                </span>
                Branch Holiday
              </span>
            </div>
          </div>
        </div>

        {/* Attractive CSS/Animated Insights for Personal Attendance (Single Person) */}
        {isSinglePerson && (
          <SinglePersonAttendanceInsights
            monthStats={monthStats}
            people={people}
            monthLabel={monthLabel}
            todayStr={todayStr}
          />
        )}
      </div>
    </div>

      {/* ========================================================= */}
      {/* FLOATING ACTION POPOVER / MOBILE BOTTOM SHEET              */}
      {/* ========================================================= */}
      {activeCell && (
        isMobile ? (
          /* Mobile Centered Action Modal with Dimmed Backdrop */
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setActiveCell(null)}
          >
            <div
              ref={popoverRef}
              className="w-full max-w-sm rounded-2xl border border-amber-300 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="min-w-0 pr-2">
                  <div className="truncate text-base font-extrabold text-slate-900">
                    {activeCell.personName}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {activeCell.dayName}, {activeCell.dayNum} {monthLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCell(null)}
                  className="text-slate-400 hover:text-slate-600 rounded-full p-1.5 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Holiday Notice Banner if declared holiday */}
              {activeCell.holiday && (
                <div className="mb-3 flex items-center gap-2.5 p-2.5 rounded-xl bg-[#fef6e7] border border-[#edd194] text-amber-900 text-xs font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#fae7be] text-[#87501a] shrink-0">
                    <CalendarCheck className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#87501a]">Declared Branch Holiday</div>
                    <div className="truncate text-xs font-bold text-slate-800">{activeCell.holiday.reason || "Official Holiday"}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectStatus("present")}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activeCell.currentStatus === "present"
                      ? "bg-[#e6f7ec] text-emerald-800 border-2 border-emerald-400 shadow-sm"
                      : "bg-[#f4fbf6] hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span>Mark Present</span>
                  </span>
                  {activeCell.currentStatus === "present" && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      Current
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStatus("absent")}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activeCell.currentStatus === "absent"
                      ? "bg-[#feecee] text-rose-800 border-2 border-rose-400 shadow-sm"
                      : "bg-[#fff5f5] hover:bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
                      <X className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span>Mark Absent</span>
                  </span>
                  {activeCell.currentStatus === "absent" && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      Current
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStatus("half_day")}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    activeCell.currentStatus === "half_day"
                      ? "bg-[#fef7e6] text-amber-800 border-2 border-amber-400 shadow-sm"
                      : "bg-[#fffdf5] hover:bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                      <Clock className="h-4 w-4" strokeWidth={2.8} />
                    </span>
                    <span>Mark Half Day</span>
                  </span>
                  {activeCell.currentStatus === "half_day" && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Current
                    </span>
                  )}
                </button>

                {activeCell.record && (
                  <button
                    type="button"
                    onClick={handleClearStatus}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-rose-600 py-3 border-t border-slate-100 mt-2 cursor-pointer transition"
                  >
                    Clear Entry
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Floating Popover with Smart Clamping */
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              left: Math.max(16, Math.min(window.innerWidth - 260, activeCell.left - 60)),
              top:
                activeCell.top + 250 > window.innerHeight
                  ? Math.max(16, activeCell.top - 220)
                  : activeCell.top + 38,
              zIndex: 9999,
            }}
            className="rounded-2xl border border-amber-300 bg-white p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 w-60 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="min-w-0 pr-2">
                <div className="truncate text-xs font-bold text-slate-900">
                  {activeCell.personName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {activeCell.dayName}, {activeCell.dayNum} {monthLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCell(null)}
                className="text-slate-400 hover:text-slate-600 rounded-md p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Holiday Notice Banner if declared holiday */}
            {activeCell.holiday && (
              <div className="mb-2 flex items-center gap-2 p-2 rounded-xl bg-[#fef6e7] border border-[#edd194] text-amber-900 text-xs font-semibold">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#fae7be] text-[#87501a] shrink-0">
                  <CalendarCheck className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#87501a]">Branch Holiday</div>
                  <div className="truncate text-[11px] font-bold text-slate-800">{activeCell.holiday.reason || "Official Holiday"}</div>
                </div>
              </div>
            )}

            {/* Quick Mark Options */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleSelectStatus("present")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCell.currentStatus === "present"
                    ? "bg-[#e6f7ec] text-emerald-800 border border-emerald-300 shadow-2xs"
                    : "hover:bg-emerald-50 text-emerald-700"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                Mark Present
              </button>

              <button
                type="button"
                onClick={() => handleSelectStatus("absent")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCell.currentStatus === "absent"
                    ? "bg-[#feecee] text-rose-800 border border-rose-300 shadow-2xs"
                    : "hover:bg-rose-50 text-rose-700"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-rose-700">
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                Mark Absent
              </button>

              <button
                type="button"
                onClick={() => handleSelectStatus("half_day")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCell.currentStatus === "half_day"
                    ? "bg-[#fef7e6] text-amber-800 border border-amber-300 shadow-2xs"
                    : "hover:bg-amber-50 text-amber-700"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                Mark Half Day
              </button>

              {activeCell.record && (
                <button
                  type="button"
                  onClick={handleClearStatus}
                  className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600 pt-1.5 border-t border-slate-100 mt-1 cursor-pointer"
                >
                  Clear Entry
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default AttendanceCalendarMatrix;

