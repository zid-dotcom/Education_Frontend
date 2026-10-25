const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || fallbackMessage);
  }
  return resData;
};

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/**
 * Staff Login: POST /auth/staff-login
 * @param {{ staff_code: string, password: string }} data
 */
export async function staffLoginApi(data) {
  const response = await fetch(`${API_BASE_URL}/auth/staff-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Staff login failed. Invalid credentials or access denied.');
}

/**
 * Get My Staff Profile: GET /staff/me
 * @param {string} token
 */
export async function getMyStaffProfileApi(token) {
  const response = await fetch(`${API_BASE_URL}/staff/me`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, 'Failed to fetch staff profile.');
}

/**
 * Get My Staff Dashboard: GET /staff/dashboard
 * @param {string} token
 */
export async function getMyStaffDashboardApi(token) {
  const response = await fetch(`${API_BASE_URL}/staff/dashboard`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, 'Failed to fetch staff dashboard data.');
}

/**
 * Get My Course Students: GET /staff/courses/{course_id}/students
 * @param {number|string} courseId
 * @param {string} token
 */
export async function getMyCourseStudentsApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/students`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, `Failed to fetch students for course #${courseId}.`);
}

/**
 * Get Course Assignments: GET /staff/courses/{course_id}/assignments
 * @param {number|string} courseId
 * @param {string} token
 */
export async function getMyCourseAssignmentsApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/assignments`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, `Failed to fetch assignments for course #${courseId}.`);
}

/**
 * Create Course Assignment: POST /staff/courses/{course_id}/assignments
 * @param {number|string} courseId
 * @param {{ title: string, description: string, due_date?: string, student_ids?: number[] }} data
 * @param {string} token
 */
export async function createCourseAssignmentApi(courseId, data, token) {
  const response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/assignments`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to create course assignment.');
}

/**
 * Add or edit marks: PUT /staff/assignments/{assignment_id}/marks
 * @param {number|string} assignmentId
 * @param {{ marks_obtained: number, feedback?: string }} data
 * @param {string} token
 */
export async function gradeAssignmentMarksApi(assignmentId, data, token) {
  const response = await fetch(`${API_BASE_URL}/staff/assignments/${assignmentId}/marks`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to update assignment marks.');
}

/**
 * List assignments that have been marked: GET /staff/courses/{course_id}/verified-assignments
 * @param {number|string} courseId
 * @param {string} token
 */
export async function getCourseVerifiedAssignmentsApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/verified-assignments`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, `Failed to fetch verified assignments for course #${courseId}.`);
}

/**
 * Update My Staff Documents: PUT /staff/me/documents
 * Accepts FormData for multipart/form-data with file uploads and document numbers
 * @param {FormData} formData
 * @param {string} token
 */
export async function updateMyStaffDocumentsApi(formData, token) {
  const response = await fetch(`${API_BASE_URL}/staff/me/documents`, {
    method: 'PUT',
    headers: {
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Note: do not set Content-Type header so browser sets multipart boundary automatically
    },
    body: formData,
  });

  return parseResponse(response, 'Failed to update staff documents.');
}

/**
 * Get My Attendance: GET /staff-attendance/my
 * @param {string} token
 * @param {string} [date] Optional YYYY-MM-DD
 */
export async function getMyStaffAttendanceApi(token, date = null) {
  const url = date
    ? `${API_BASE_URL}/staff-attendance/my?attendance_date=${encodeURIComponent(date)}`
    : `${API_BASE_URL}/staff-attendance/my`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, 'Failed to fetch staff attendance.');
}

/**
 * Staff create an announcement for a course assigned to them: POST /staff/courses/{course_id}/announcements
 * The message can include information such as an exam time.
 * @param {number|string} courseId
 * @param {{ title: string, message: string, scheduled_event_time?: string, event_time?: string, exam_time?: string }} data
 * @param {string} token
 */
export async function createCourseAnnouncementApi(courseId, data, token) {
  const response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/announcements`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to create course announcement.');
}

/**
 * Fetch announcements for a course assigned to staff: GET /staff/courses/{course_id}/announcements
 * @param {number|string} courseId
 * @param {string} token
 */
export async function getStaffCourseAnnouncementsApi(courseId, token) {
  let response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/announcements`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  if (response.status === 404) {
    // Fallback to student course announcements endpoint if staff-specific GET isn't present
    response = await fetch(`${API_BASE_URL}/student/courses/${courseId}/announcements`, {
      method: 'GET',
      headers: getHeaders(token),
    });
  }

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || `Failed to fetch announcements for course #${courseId}.`);
  }

  return Array.isArray(resData) ? resData : resData?.announcements || [];
}

/**
 * Staff view announcements: GET /announcements/staff/branch
 * Global announcements and announcements for the staff member's branch, targeted to staff, all, or legacy both.
 * Fallback: GET /staff/announcements
 * @param {string} token
 */
export async function getStaffAnnouncementsApi(token) {
  let response = await fetch(`${API_BASE_URL}/announcements/staff/branch`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  if (response.status === 404) {
    response = await fetch(`${API_BASE_URL}/staff/announcements`, {
      method: 'GET',
      headers: getHeaders(token),
    });
  }

  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || 'Failed to fetch staff announcements.');
  }

  return Array.isArray(resData) ? resData : resData?.announcements || [];
}

/**
 * Update Staff Announcement: PUT /staff/announcements/{announcement_id}
 * @param {number|string} announcementId
 * @param {Object} data - { title, message, scheduled_event_time }
 * @param {string} token
 */
export async function updateStaffAnnouncementApi(announcementId, data, token) {
  const response = await fetch(`${API_BASE_URL}/staff/announcements/${announcementId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  return parseResponse(response, `Failed to update announcement #${announcementId}.`);
}

/**
 * Delete Staff Announcement: DELETE /staff/announcements/{announcement_id}
 * @param {number|string} announcementId
 * @param {string} token
 */
export async function deleteStaffAnnouncementApi(announcementId, token) {
  const response = await fetch(`${API_BASE_URL}/staff/announcements/${announcementId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  return parseResponse(response, `Failed to delete announcement #${announcementId}.`);
}


