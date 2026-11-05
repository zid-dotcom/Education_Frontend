/**
 * Default date range helpers for date filtering across all portals.
 *
 * For any given date (e.g. 04-11-2026):
 * - From Date: 1st day of the current month (e.g. '2026-11-01' -> 01-11-2026)
 * - To Date: 1st day of the following month (e.g. '2026-12-01' -> 01-12-2026)
 *   providing a standard 1-month window format as required.
 */

export const getDefaultFromDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export const getDefaultToDate = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const day = String(nextMonth.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDefaultDateRange = (from, to) => {
  return from === getDefaultFromDate() && to === getDefaultToDate();
};

