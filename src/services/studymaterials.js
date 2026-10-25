const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = (token, isMultipart = false) => ({
  'ngrok-skip-browser-warning': '69420',
  ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const parseResponse = async (response, defaultErrorMsg) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    let errorMsg = defaultErrorMsg || 'Request failed.';
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map((item) => item.msg || item).join(', ');
      } else if (typeof data.detail === 'string') {
        errorMsg = data.detail;
      }
    } else if (data?.message) {
      errorMsg = data.message;
    }
    throw new Error(errorMsg);
  }

  return data;
};

// ==========================================
// STAFF ENDPOINTS
// ==========================================

/**
 * Upload a study material PDF for a course taught by staff
 * Endpoint: POST /staff/courses/{course_id}/study-materials
 * Form fields:
 *  - title (required)
 *  - file (required PDF, max 10 MB)
 *  - description (optional)
 * @param {number|string} courseId
 * @param {{ title: string, description?: string, file: File }} data
 * @param {string} token
 */
export async function uploadStaffStudyMaterialApi(courseId, data, token) {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description && data.description.trim()) {
    formData.append('description', data.description.trim());
  }
  formData.append('file', data.file);

  const response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/study-materials`, {
    method: 'POST',
    headers: getHeaders(token, true),
    body: formData,
  });

  return parseResponse(response, 'Failed to upload study material.');
}

/**
 * List study materials for a course the staff member teaches,
 * including uploader details and download links.
 * Endpoint: GET /staff/courses/{course_id}/study-materials
 * @param {number|string} courseId
 * @param {string} token
 */
export async function getStaffCourseStudyMaterialsApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/staff/courses/${courseId}/study-materials`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, `Failed to fetch study materials for course #${courseId}.`);
}

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

/**
 * List study materials for all the student's approved courses.
 * Endpoint: GET /student/study-materials
 * @param {string} token
 */
export async function getStudentAllStudyMaterialsApi(token) {
  const response = await fetch(`${API_BASE_URL}/student/study-materials`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, 'Failed to fetch study materials.');
}

/**
 * List study materials for one approved course.
 * Endpoint: GET /student/study-materials/courses/{course_id}
 * @param {number|string} courseId
 * @param {string} token
 */
export async function getStudentCourseStudyMaterialsApi(courseId, token) {
  const response = await fetch(`${API_BASE_URL}/student/study-materials/courses/${courseId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  return parseResponse(response, `Failed to fetch study materials for course #${courseId}.`);
}

/**
 * Securely redirect / download a study material PDF.
 * Endpoint: GET /student/study-materials/{material_id}/download
 * Handles both redirect/direct download URL JSON and binary blob download.
 * @param {number|string} materialId
 * @param {string} token
 * @param {string} [suggestedFileName]
 */
export async function downloadStudentStudyMaterialApi(materialId, token, suggestedFileName = 'study-material.pdf') {
  const response = await fetch(`${API_BASE_URL}/student/study-materials/${materialId}/download`, {
    method: 'GET',
    headers: getHeaders(token),
    redirect: 'follow',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let msg = 'Failed to download study material.';
    if (errorData?.detail) {
      msg = Array.isArray(errorData.detail)
        ? errorData.detail.map((i) => i.msg || i).join(', ')
        : errorData.detail;
    }
    throw new Error(msg);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    const downloadUrl = data?.download_url || data?.url || data?.link;
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return { success: true, url: downloadUrl };
    }
  }

  // Handle blob
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  // Trigger download in browser
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = suggestedFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 10000);

  return { success: true, blob };
}
