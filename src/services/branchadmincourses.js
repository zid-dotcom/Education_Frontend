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

export async function getMyCoursesApi(token) {
  const response = await fetch(`${API_BASE_URL}/courses/branch-admin/my-courses`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load branch courses.');
}

export async function getMyCourseApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/courses/branch-admin/${courseId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load course.');
}

export async function createBranchCourseApi(formData, token) {
  const response = await fetch(`${API_BASE_URL}/courses/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  });
  return parseResponse(response, 'Failed to create course.');
}

export async function updateBranchCourseApi(courseId, formData, token) {
  const response = await fetch(`${API_BASE_URL}/courses/branch-admin/${courseId}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  });
  return parseResponse(response, 'Failed to update course.');
}

export async function deleteBranchCourseApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/courses/branch-admin/${courseId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to delete course.');
}
