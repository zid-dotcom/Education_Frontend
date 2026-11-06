/**
 * Default date range helpers for date filtering across all portals.
 *
 * For any given date (e.g. today is 06-11-2026):
 * - From Date: 1st day of the current month (e.g. '2026-11-01' -> 01-11-2026)
 * - To Date: Today's date (e.g. '2026-11-06' -> 06-11-2026), auto-calculated and advancing daily.
 * - Next month (e.g. in Dec 2026): From Date auto-changes to 01-12-2026 and To Date to today.
 */

export const getDefaultFromDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export const getDefaultToDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDefaultDateRange = (from, to) => {
  return from === getDefaultFromDate() && to === getDefaultToDate();
};

