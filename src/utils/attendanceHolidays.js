/**
 * Utility to merge attendance records with declared branch holidays.
 *
 * 1. If an attendance record falls on a holiday date, it attaches `holidayReason`
 *    so the row can show a holiday reason badge alongside the employee's status.
 * 2. If a holiday has no attendance records marked (e.g. branch is closed on Diwali),
 *    it inserts a standalone holiday row so the holiday and its reason appear in the chronological log.
 * 3. All items are sorted descending by date.
 */
export const mergeRecordsWithHolidays = (records = [], holidays = [], defaultRole = 'Staff') => {
  const safeRecords = Array.isArray(records) ? records : [];
  const safeHolidays = Array.isArray(holidays) ? holidays : [];

  if (safeHolidays.length === 0) return safeRecords;

  const holidayMap = new Map();
  safeHolidays.forEach((h) => {
    const d = String(h.date || h.holiday_date || '').slice(0, 10);
    if (d) holidayMap.set(d, h);
  });

  // Annotate existing records with holiday reason if marked on a holiday date
  const annotatedRecords = safeRecords.map((r) => {
    const d = String(r.date || r.attendance_date || r.marked_at || '').slice(0, 10);
    const h = holidayMap.get(d);
    return h ? { ...r, holidayReason: h.reason } : r;
  });

  // Dates that have at least one attendance record
  const recordedDates = new Set(
    safeRecords.map((r) => String(r.date || r.attendance_date || r.marked_at || '').slice(0, 10))
  );

  // Standalone holiday rows for holidays without marked attendance
  const standaloneHolidayRows = [];
  safeHolidays.forEach((h, idx) => {
    const d = String(h.date || h.holiday_date || '').slice(0, 10);
    if (d && !recordedDates.has(d)) {
      standaloneHolidayRows.push({
        id: `holiday-${d}-${h.id || idx}`,
        isHoliday: true,
        staff_name: 'Branch Holiday',
        name: 'Branch Holiday',
        branch_admin_name: 'Branch Holiday',
        role: 'Declared Holiday',
        date: d,
        attendance_date: d,
        check_in: '—',
        check_out: '—',
        time_in: '—',
        time_out: '—',
        status: `Holiday: ${h.reason || 'Closed'}`,
        holidayReason: h.reason,
        marked_at: null,
      });
    }
  });

  // Sort combined entries chronologically (newest date first)
  return [...annotatedRecords, ...standaloneHolidayRows].sort((a, b) => {
    const da = String(a.date || a.attendance_date || a.marked_at || '').slice(0, 10);
    const db = String(b.date || b.attendance_date || b.marked_at || '').slice(0, 10);
    return db.localeCompare(da);
  });
};

