const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  const resData = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(resData.detail)
      ? resData.detail.map((item) => item.msg).join(', ')
      : resData.detail;
    throw new Error(detail || fallbackMessage);
  }
  return resData;
};

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  'ngrok-skip-browser-warning': '69420',
});

const getHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'ngrok-skip-browser-warning': '69420',
});

// ─── Enquiries ───────────────────────────────────────────────────────────────
export async function getSuperAdminRecordsEnquiriesApi(token, params = {}) {
  const query = new URLSearchParams();
  if (params.offset !== undefined) query.set('offset', params.offset);
  if (params.limit !== undefined) query.set('limit', params.limit);
  const qStr = query.toString();
  const url = qStr
    ? `${API_BASE_URL}/super-admin/records/enquiries?${qStr}`
    : `${API_BASE_URL}/super-admin/records/enquiries`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load all enquiries.');
}

export async function getSuperAdminEnquiryBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/enquiries/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load enquiry branches.');
}

export async function getSuperAdminBranchEnquiriesApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/enquiries/branches/${branchId}`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch enquiries.');
}

// ─── Courses ─────────────────────────────────────────────────────────────────
export async function getSuperAdminCourseBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/courses/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load course branches.');
}

export async function getSuperAdminBranchCoursesApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/courses/branches/${branchId}`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch courses.');
}

export async function getSuperAdminBranchCourseApi(branchId, courseId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/courses/branches/${branchId}/${courseId}`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load course details.');
}

export async function createSuperAdminBranchCourseApi(branchId, formData, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/courses/branches/${branchId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseResponse(res, 'Failed to create course.');
}

export async function createBulkSuperAdminBranchCourseApi(formData, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/courses/branches/bulk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseResponse(res, 'Failed to create bulk courses.');
}

export async function updateSuperAdminBranchCourseApi(branchId, courseId, formData, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/courses/branches/${branchId}/${courseId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseResponse(res, 'Failed to update course.');
}

export async function deleteSuperAdminBranchCourseApi(branchId, courseId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/courses/branches/${branchId}/${courseId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to delete course.');
}

// ─── Enrollments ─────────────────────────────────────────────────────────────
export async function getSuperAdminEnrollmentBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/enrollments/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load enrollment branches.');
}

export async function getSuperAdminBranchEnrollmentCoursesApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/enrollments/branches/${branchId}/courses`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch courses.');
}

export async function getSuperAdminCourseStudentsApi(branchId, courseId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/enrollments/branches/${branchId}/courses/${courseId}/students`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load course students.');
}

export async function updateSuperAdminBranchStudentApi(branchId, enrollmentId, data, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/enrollments/branches/${branchId}/students/${enrollmentId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return parseResponse(res, 'Failed to update student enrollment.');
}

// ─── Announcements ────────────────────────────────────────────────────────────
export async function getSuperAdminAnnouncementBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/announcements/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load announcement branches.');
}

export async function getSuperAdminBranchAnnouncementsApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/announcements/branches/${branchId}`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch announcements.');
}

export async function createSuperAdminBranchAnnouncementApi(branchId, formData, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/announcements/branches/${branchId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseResponse(res, 'Failed to create announcement.');
}

export async function updateSuperAdminBranchAnnouncementApi(branchId, announcementId, formData, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/announcements/branches/${branchId}/${announcementId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return parseResponse(res, 'Failed to update announcement.');
}

export async function deleteSuperAdminBranchAnnouncementApi(branchId, announcementId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/announcements/branches/${branchId}/${announcementId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to delete announcement.');
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export async function getSuperAdminStaffBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/staff/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load staff branches.');
}

export async function getSuperAdminBranchStaffApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/staff/branches/${branchId}/staff`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch staff.');
}

export async function getSuperAdminStaffBranchCoursesApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/staff/branches/${branchId}/courses`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load staff courses.');
}

export async function createSuperAdminBranchStaffApi(branchId, data, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/staff/branches/${branchId}/staff`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return parseResponse(res, 'Failed to create staff member.');
}

export async function updateSuperAdminBranchStaffApi(branchId, staffId, data, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/staff/branches/${branchId}/staff/${staffId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return parseResponse(res, 'Failed to update staff member.');
}

export async function deleteSuperAdminBranchStaffApi(branchId, staffId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/staff/branches/${branchId}/staff/${staffId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to delete staff member.');
}

// ─── Profit ───────────────────────────────────────────────────────────────────
export const BACKEND_SUPPORTS_PROFIT_DATE_RANGE = false;

export function buildProfitDateQuery(dateOrRange) {
  if (!dateOrRange) return '';
  if (typeof dateOrRange === 'string') {
    return `?date=${encodeURIComponent(dateOrRange)}`;
  }
  const { fromDate, toDate, date } = dateOrRange;
  if (BACKEND_SUPPORTS_PROFIT_DATE_RANGE) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }
  // Single-date fallback: backend currently accepts single `date` parameter
  const singleDate = fromDate || date || toDate;
  return singleDate ? `?date=${encodeURIComponent(singleDate)}` : '';
}

export async function getSuperAdminProfitBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/profit/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load profit branches.');
}

export async function getSuperAdminBranchProfitApi(branchId, token, dateOrRange = null) {
  const query = buildProfitDateQuery(dateOrRange);
  const url = `${API_BASE_URL}/super-admin/profit/branches/${branchId}${query}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch profit.');
}

export async function getSuperAdminBranchTodayProfitApi(branchId, token, date = null) {
  const url = date 
    ? `${API_BASE_URL}/super-admin/profit/branches/${branchId}/today-profit?date=${date}`
    : `${API_BASE_URL}/super-admin/profit/branches/${branchId}/today-profit`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, "Failed to load today's profit.");
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export const BACKEND_SUPPORTS_ATTENDANCE_DATE_RANGE = false;

export function buildAttendanceDateQuery(dateOrRange) {
  if (!dateOrRange) return '';
  if (typeof dateOrRange === 'string') {
    return `?attendance_date=${encodeURIComponent(dateOrRange)}`;
  }
  const { fromDate, toDate, date } = dateOrRange;
  if (BACKEND_SUPPORTS_ATTENDANCE_DATE_RANGE) {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }
  // Single-date fallback: backend currently accepts single `attendance_date` parameter
  const singleDate = fromDate || date || toDate;
  return singleDate ? `?attendance_date=${encodeURIComponent(singleDate)}` : '';
}

export async function getSuperAdminAttendanceBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/attendance/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load attendance branches.');
}

export async function getSuperAdminBranchStaffAttendanceApi(branchId, token, dateOrRange = null) {
  const query = buildAttendanceDateQuery(dateOrRange);
  const url = `${API_BASE_URL}/super-admin/attendance/branches/${branchId}/staff${query}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load staff attendance.');
}

export async function getSuperAdminBranchAdminAttendanceApi(branchId, token, dateOrRange = null) {
  const query = buildAttendanceDateQuery(dateOrRange);
  const url = `${API_BASE_URL}/super-admin/attendance/branches/${branchId}/branch-admins${query}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load admin attendance.');
}

// ─── Purchases ────────────────────────────────────────────────────────────────
export async function getSuperAdminPurchaseBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/enrollments/super-admin/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load purchase branches.');
}

export async function getSuperAdminPendingPurchasesApi(token, branchId) {
  const url = branchId
    ? `${API_BASE_URL}/enrollments/super-admin/pending?branch_id=${branchId}`
    : `${API_BASE_URL}/enrollments/super-admin/pending`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load pending purchases.');
}

export async function getSuperAdminApprovedPurchasesApi(token, branchId) {
  const url = branchId
    ? `${API_BASE_URL}/enrollments/super-admin/approved?branch_id=${branchId}`
    : `${API_BASE_URL}/enrollments/super-admin/approved`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load approved purchases.');
}

export async function getSuperAdminPurchaseHistoryApi(token, branchId) {
  const url = branchId
    ? `${API_BASE_URL}/enrollments/super-admin/history?branch_id=${branchId}`
    : `${API_BASE_URL}/enrollments/super-admin/history`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load purchase history.');
}

export async function approvePurchaseAsSuperAdminApi(enrollmentId, token) {
  const res = await fetch(`${API_BASE_URL}/enrollments/super-admin/${enrollmentId}/approve`, {
    method: 'PUT',
    headers: authHeaders(token),
  });
  return parseResponse(res, 'Failed to approve purchase.');
}

export async function rejectPurchaseAsSuperAdminApi(enrollmentId, reason, token) {
  const res = await fetch(`${API_BASE_URL}/enrollments/super-admin/${enrollmentId}/reject`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return parseResponse(res, 'Failed to reject purchase.');
}

export async function getSuperAdminRejectedPurchasesApi(token, branchId) {
  const url = branchId
    ? `${API_BASE_URL}/enrollments/super-admin/rejected?branch_id=${branchId}`
    : `${API_BASE_URL}/enrollments/super-admin/rejected`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load rejected purchases.');
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getSuperAdminDashboardOverviewApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/dashboard/overview`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load dashboard overview.');
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function getSuperAdminUnreadMessagesCountApi(token) {
  const res = await fetch(`${API_BASE_URL}/messages/unread-count`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load unread messages count.');
}

export async function getSuperAdminConversationApi(conversationId, token) {
  const res = await fetch(`${API_BASE_URL}/messages/super-admin/${conversationId}`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load conversation messages.');
}

export async function replySuperAdminMessageApi(conversationId, message, token) {
  const res = await fetch(`${API_BASE_URL}/messages/super-admin/${conversationId}/reply`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ message }),
  });
  return parseResponse(res, 'Failed to send reply.');
}
export async function getSuperAdminRecordBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/records/branches`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load record branches.');
}

export async function getSuperAdminAllDueStudentsApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/records/due-students`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load due students.');
}

export async function getSuperAdminBranchDueStudentsApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/records/branches/${branchId}/due-students`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch due students.');
}

export async function getSuperAdminAllStudentsApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/records/students`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load all students.');
}

export async function getSuperAdminBranchStudentsApi(branchId, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/records/branches/${branchId}/students`, { headers: getHeaders(token) });
  return parseResponse(res, 'Failed to load branch students.');
}
