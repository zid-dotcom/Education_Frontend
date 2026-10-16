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