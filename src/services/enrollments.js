const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch the authenticated student's enrollments.
 * @param {string} token
 */
export async function getMyEnrollmentsApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': '69420',
    },
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to fetch your enrollments.');
  }

  return resData;
}

/**
 * Create an enrollment for the authenticated student.
 * @param {Object} enrollmentData
 * @param {string} token
 */
export async function createEnrollmentApi(enrollmentData, token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(enrollmentData),
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to create enrollment.');
  }

  return resData;
}

