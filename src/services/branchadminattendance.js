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

export async function getBranchAdminAttendanceApi(token, attendanceDate) {
  const query = attendanceDate ? `?attendance_date=${encodeURIComponent(attendanceDate)}` : '';
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
