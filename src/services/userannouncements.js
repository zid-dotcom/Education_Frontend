const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/**
 * Students view announcements for all their approved courses: GET /student/announcements
 * @param {string} token
 */
export async function getStudentAnnouncementsApi(token) {
  let response = await fetch(`${API_BASE_URL}/student/announcements`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  // Fallback to general announcements endpoint if not found
  if (response.status === 404) {
    response = await fetch(`${API_BASE_URL}/announcements/`, {
      method: 'GET',
      headers: getHeaders(token),
    });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || 'Failed to fetch student announcements.');
  }

  return Array.isArray(resData) ? resData : resData?.announcements || [];
}

/**
 * Students view announcements for one specific course they're enrolled in:
 * GET /student/courses/{course_id}/announcements
 * Each announcement includes its title, message, staff name, and any scheduled event time.
 * @param {number|string} courseId
 * @param {string} token
 */
export async function getStudentCourseAnnouncementsApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/student/courses/${courseId}/announcements`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || `Failed to fetch announcements for course #${courseId}.`);
  }

  return Array.isArray(resData) ? resData : resData?.announcements || [];
}

// Backward compatibility alias for existing dashboard & layout counters
export const getUserAnnouncementsApi = getStudentAnnouncementsApi;

