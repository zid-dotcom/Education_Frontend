const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = (token) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * GET /profile/
 * Fetch the authenticated student user profile
 */
export async function getStudentProfileApi(token) {
  const res = await fetch(`${API_BASE_URL}/profile/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getHeaders(token),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch student profile.');
  }
  return data;
}

/**
 * PUT /profile/
 * Update the authenticated student user profile with multipart/form-data
 * Fields: name, email, phone, parent_name, parent_phone, highest_qualification, address, image (optional)
 */
export async function updateStudentProfileApi(formData, token) {
  const res = await fetch(`${API_BASE_URL}/profile/`, {
    method: 'PUT',
    headers: getHeaders(token), // Browser automatically sets Content-Type to multipart/form-data with boundary
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let errorMsg = 'Failed to update student profile.';
    if (typeof data.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data.detail)) {
      errorMsg = data.detail.map((err) => err.msg || err).join(', ');
    }
    throw new Error(errorMsg);
  }
  return data;
}
