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

export async function getBranchStaffApi(token) {
  const response = await fetch(`${API_BASE_URL}/branch-admin/staff`, authOptions(token));
  return parseResponse(response, 'Failed to load branch staff.');
}

export async function getBranchStaffMemberApi(staffId, token) {
  const response = await fetch(`${API_BASE_URL}/branch-admin/staff/${staffId}`, authOptions(token));
  return parseResponse(response, 'Failed to load staff member.');
}

export async function createBranchStaffApi(payload, token) {
  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff`,
    authOptions(token, { method: 'POST', body: JSON.stringify(payload) }),
  );
  return parseResponse(response, 'Failed to create staff member.');
}

export async function updateBranchStaffApi(staffId, payload, token) {
  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff/${staffId}`,
    authOptions(token, { method: 'PUT', body: JSON.stringify(payload) }),
  );
  return parseResponse(response, 'Failed to update staff member.');
}

export async function deleteBranchStaffApi(staffId, token) {
  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff/${staffId}`,
    authOptions(token, { method: 'DELETE' }),
  );
  return parseResponse(response, 'Failed to delete staff member.');
}

/**
 * Change staff member active/inactive status:
 * PATCH /branch-admin/staff/{staff_id}/status
 */
export async function updateBranchAdminStaffStatusApi(staffId, status, token) {
  const formattedStatus = String(status).toLowerCase() === 'active' ? 'Active' : 'Inactive';
  const query = `?status=${encodeURIComponent(formattedStatus)}`;
  const response = await fetch(`${API_BASE_URL}/branch-admin/staff/${staffId}/status${query}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      status: formattedStatus,
      is_active: formattedStatus === 'Active',
    }),
  });
  return parseResponse(response, 'Failed to update staff status.');
}

export async function markStaffAttendanceApi(payload, token) {
  const response = await fetch(
    `${API_BASE_URL}/staff-attendance/mark`,
    authOptions(token, { method: 'POST', body: JSON.stringify(payload) }),
  );
  return parseResponse(response, 'Failed to mark staff attendance.');
}

/**
 * Branch admin viewing staff attendance
 * GET /staff-attendance
 * Filters:
 * - month (e.g. '2026-10')
 * - date_from & date_to (e.g. '2026-10-01' and '2026-10-31')
 * - attendance_date (single date fallback)
 */
export async function getStaffAttendanceApi(token, paramsOrDate) {
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

  const response = await fetch(`${API_BASE_URL}/staff-attendance${query}`, authOptions(token));
  return parseResponse(response, 'Failed to load staff attendance.');
}

export async function updateStaffAttendanceApi(attendanceId, payload, token) {
  const response = await fetch(
    `${API_BASE_URL}/staff-attendance/${attendanceId}`,
    authOptions(token, { method: 'PUT', body: JSON.stringify(payload) }),
  );
  return parseResponse(response, 'Failed to update staff attendance.');
}

export {
  getBranchStaffVerificationApi,
  getBranchStaffVerificationPendingApi,
  getBranchStaffVerificationApprovedApi,
  getBranchStaffVerificationRejectedApi,
  approveStaffVerificationApi,
  rejectStaffVerificationApi,
} from './branchadminstaffverification';
