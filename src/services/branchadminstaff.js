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

export async function markStaffAttendanceApi(payload, token) {
  const response = await fetch(
    `${API_BASE_URL}/staff-attendance/mark`,
    authOptions(token, { method: 'POST', body: JSON.stringify(payload) }),
  );
  return parseResponse(response, 'Failed to mark staff attendance.');
}

export async function getStaffAttendanceApi(token, attendanceDate) {
  const query = attendanceDate ? `?attendance_date=${encodeURIComponent(attendanceDate)}` : '';
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