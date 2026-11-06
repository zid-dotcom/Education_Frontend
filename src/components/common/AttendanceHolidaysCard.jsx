import React from 'react';
import { Calendar, CalendarDays } from 'lucide-react';

const formatDisplayDate = (date) => {
  if (!date) return '—';
  try {
    const dStr = String(date).slice(0, 10);
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Intl.DateTimeFormat('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(y, m - 1, d));
      }
    }
    return String(date);
  } catch (e) {
    return String(date);
  }
};

const getTodayStr = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const AttendanceHolidaysCard = ({ holidays = [], title = "Declared Holidays in Selected Period" }) => {
  if (!Array.isArray(holidays) || holidays.length === 0) return null;

  const todayStr = getTodayStr();
  const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };

  return (
    <div
      className="rounded-2xl border bg-white p-4 sm:p-5 shadow-xs"
      style={{ borderColor: '#e3ddd0' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#f1ede4]">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#9c6b2e]" />
          <h4 className="text-sm font-bold text-slate-900 tracking-tight" style={serif}>
            {title}
          </h4>
          <span className="rounded-full bg-[#faf5ec] border border-[#ebd8b6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#9c6b2e]">
            {holidays.length} {holidays.length === 1 ? 'Holiday' : 'Holidays'}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Official closures and declared holidays with scheduled reason
        </p>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {holidays.map((h, i) => {
          const hDate = String(h.date || h.holiday_date || '').slice(0, 10);
          const isUpcoming = hDate > todayStr;
          const isToday = hDate === todayStr;

          let weekday = '—';
          try {
            weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(
              new Date(`${hDate}T00:00:00`)
            );
          } catch {}

          return (
            <div
              key={h.id ?? `${hDate}-${i}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#ebd8b6] bg-gradient-to-r from-[#faf6ee] to-[#fdfbf7] shadow-2xs hover:border-[#9c6b2e]/50 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-white border border-[#ebd8b6] text-[#9c6b2e] flex items-center justify-center font-bold text-xs shadow-2xs">
                  {weekday}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {formatDisplayDate(hDate)}
                  </div>
                  <div className="text-[11px] font-extrabold text-[#9c6b2e] truncate capitalize">
                    {h.reason || 'Declared Holiday'}
                  </div>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isToday
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                    : isUpcoming
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {isToday ? 'Today' : isUpcoming ? 'Upcoming' : 'Past'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceHolidaysCard;

