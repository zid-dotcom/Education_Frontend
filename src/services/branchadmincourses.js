const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  let data;
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => '');
    throw new Error(text || fallbackMessage || `Request failed with status ${response.status}`);
  }
  if (!response.ok) {
    let detail = data?.detail || data?.message || data?.error;
    if (Array.isArray(detail)) {
      detail = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((p) => p !== 'body').join(' -> ')
            : '';
          return loc ? `${loc}: ${item.msg || JSON.stringify(item)}` : (item.msg || JSON.stringify(item));
        })
        .join('; ');
    } else if (typeof detail === 'object' && detail !== null) {
      detail = JSON.stringify(detail);
    }
    throw new Error(detail || fallbackMessage || `Request failed with status ${response.status}`);
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
