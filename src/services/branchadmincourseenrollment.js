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
            ? item.loc.filter((part) => part !== 'body').join(' -> ')
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

export async function getBranchAdminCourseSummaryApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/course-summary`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load course enrollment summary.');
}

export async function getBranchAdminCourseEnrollmentsApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/course/${courseId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load course enrollments.');
}

export async function updateBranchAdminCourseEnrollmentApi(courseId, enrollmentId, data, token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/course/${courseId}/${enrollmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to update course enrollment.');
}