const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let detail = data.detail || fallbackMessage;
    if (Array.isArray(detail)) {
      detail = detail.map((item) => (item.msg ? `${item.loc?.join('.') || ''}: ${item.msg}` : JSON.stringify(item))).join(', ');
    } else if (typeof detail === 'object') {
      detail = JSON.stringify(detail);
    }
    throw new Error(detail || fallbackMessage);
  }
  return data;
};

/**
 * 1. Submit a course review (Student only)
 * POST /student/reviews
 * @param {{ course_id: number, review: string, rating?: number }} reviewData
 * @param {string} token
 */
export async function createStudentReviewApi(reviewData, token) {
  const response = await fetch(`${API_BASE_URL}/student/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      course_id: Number(reviewData.course_id),
      review: reviewData.review?.trim(),
      ...(reviewData.rating ? { rating: Number(reviewData.rating) } : {}),
    }),
  });
  return parseResponse(response, 'Failed to submit course review.');
}

/**
 * 2. Get reviews submitted by the authenticated student
 * GET /student/reviews
 * @param {string} token
 */
export async function getStudentReviewsApi(token) {
  const response = await fetch(`${API_BASE_URL}/student/reviews`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to fetch student reviews.');
}

/**
 * 3. Get reviews for the authenticated branch admin's branch
 * GET /branch-admin/reviews?course_id=...
 * @param {number|string} [courseId]
 * @param {string} token
 */
export async function getBranchAdminReviewsApi(courseId = '', token) {
  const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
  const response = await fetch(`${API_BASE_URL}/branch-admin/reviews${query}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to fetch branch reviews.');
}

/**
 * 4. Get reviews across all branches for Super Admin
 * GET /super-admin/reviews?branch_id=...
 * @param {number|string} [branchId]
 * @param {string} token
 */
export async function getSuperAdminReviewsApi(branchId = '', token) {
  const query = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : '';
  const response = await fetch(`${API_BASE_URL}/super-admin/reviews${query}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to fetch super admin reviews.');
}

/**
 * 5. Get public approved course reviews
 * GET /public/reviews?limit=...
 * @param {number} [limit=20]
 */
export async function getPublicReviewsApi(limit = 20) {
  const query = limit ? `?limit=${encodeURIComponent(limit)}` : '';
  const response = await fetch(`${API_BASE_URL}/public/reviews${query}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
    },
  });
  return parseResponse(response, 'Failed to fetch public reviews.');
}

