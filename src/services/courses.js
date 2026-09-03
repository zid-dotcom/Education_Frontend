const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch all active courses
 */
export async function getAllCoursesApi() {
  const response = await fetch(`${API_BASE_URL}/courses/`);
  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to fetch courses.');
  }

  return resData;
}

/**
 * Fetch single course by ID
 */
export async function getCourseByIdApi(courseId) {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Course not found.');
  }

  return resData;
}

/**
 * Add a new course (Admin only)
 * Expects FormData object containing title, description, price, duration, category, level, curriculum (JSON string), image file
 */
export async function addCourseApi(formData, token) {
  const response = await fetch(`${API_BASE_URL}/courses/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to create course.');
  }

  return resData;
}

/**
 * Update an existing course (Admin only)
 */
export async function updateCourseApi(courseId, formData, token) {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to update course.');
  }

  return resData;
}

/**
 * Delete a course (Admin only)
 */
export async function deleteCourseApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to delete course.');
  }

  return resData;
}
