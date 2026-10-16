const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch all assignments assigned to the authenticated student, including
 * submission status, marks, and feedback.
 * Endpoint: GET /student/assignments
 * @param {string} token
 * @returns {Promise<{ total_assignments: number, assignments: Array }>}
 */
export async function getStudentAssignmentsApi(token) {
  const response = await fetch(`${API_BASE_URL}/student/assignments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || 'Failed to fetch assignments.');
  }

  return resData;
}

/**
 * Submit an assignment PDF as multipart form field 'file'.
 * Endpoint: POST /student/assignments/{assignment_id}/submit
 * @param {number|string} assignmentId
 * @param {File|FormData} fileOrFormData
 * @param {string} token
 * @returns {Promise<any>}
 */
export async function submitStudentAssignmentApi(assignmentId, fileOrFormData, token) {
  let body;
  if (fileOrFormData instanceof FormData) {
    body = fileOrFormData;
  } else {
    body = new FormData();
    body.append('file', fileOrFormData);
  }

  const response = await fetch(`${API_BASE_URL}/student/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || 'Failed to submit assignment.');
  }

  return resData;
}
