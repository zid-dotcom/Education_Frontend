const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data.detail;
    throw new Error(detail || fallbackMessage);
  }
  return data;
};

const authOptions = (token, options = {}) => ({
  ...options,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  },
  credentials: 'include',
});

const toApiStatus = (status) => {
  const statusMap = {
    present: 'Present',
    absent: 'Absent',
    half_day: 'Half Day',
    leave: 'Leave',
  };
  return statusMap[String(status || '').toLowerCase().replace(/[-\s]/g, '_')] || status;
};

export async function markBranchAdminAttendanceApi(payload, token) {
  const apiPayload = { ...payload, status: toApiStatus(payload.status) };
  const response = await fetch(
    `${API_BASE_URL}/branch-admin-attendance/mark`,
    authOptions(token, { method: 'POST', body: JSON.stringify(apiPayload) }),
  );
  return parseResponse(response, 'Failed to mark your attendance.');
}

/**
 * Branch admin viewing own attendance
 * GET /branch-admin-attendance/my
 * Filters:
 * - month (e.g. '2026-10')
 * - date_from & date_to (e.g. '2026-10-01' and '2026-10-31')
 * - attendance_date (single date fallback)
 */
export async function getBranchAdminAttendanceApi(token, paramsOrDate) {
  let query = '';
  if (typeof paramsOrDate === 'string' && paramsOrDate) {
    if (paramsOrDate.length === 7 && paramsOrDate.includes('-')) {
      query = `?month=${encodeURIComponent(paramsOrDate)}`;
    } else {
      query = `?attendance_date=${encodeURIComponent(paramsOrDate)}`;
    }
  } else if (paramsOrDate && typeof paramsOrDate === 'object') {
    const qp = new URLSearchParams();
    if (paramsOrDate.month) qp.append('month', paramsOrDate.month);
    let dFrom = paramsOrDate.date_from;
    let dTo = paramsOrDate.date_to;
    if (dFrom && dTo && dFrom > dTo) {
      const temp = dFrom;
      dFrom = dTo;
      dTo = temp;
    }
    if (dFrom) qp.append('date_from', dFrom);
    if (dTo) qp.append('date_to', dTo);
    if (paramsOrDate.attendance_date && !dFrom) {
      qp.append('attendance_date', paramsOrDate.attendance_date);
    }
    const qs = qp.toString();
    if (qs) query = `?${qs}`;
  }

  const response = await fetch(
    `${API_BASE_URL}/branch-admin-attendance/my${query}`,
    authOptions(token),
  );
  return parseResponse(response, 'Failed to load your attendance.');
}

export async function updateBranchAdminAttendanceApi(attendanceId, payload, token) {
  const apiPayload = { ...payload, status: toApiStatus(payload.status) };
  const response = await fetch(
    `${API_BASE_URL}/branch-admin-attendance/${attendanceId}`,
    authOptions(token, { method: 'PUT', body: JSON.stringify(apiPayload) }),
  );
  return parseResponse(response, 'Failed to update your attendance.');
}
