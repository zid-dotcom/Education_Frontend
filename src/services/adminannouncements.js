const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || fallbackMessage);
  }

  return resData;
};

/**
 * Fetch announcements for the admin announcements page.
 * GET /announcements/admin/global
 * @param {string} token
 */
export async function getAnnouncementsApi(token) {
  let response = await fetch(`${API_BASE_URL}/announcements/admin/global`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    response = await fetch(`${API_BASE_URL}/announcements/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  return parseResponse(response, 'Failed to fetch announcements.');
}

/**
 * Create an announcement (Admin only).
 * @param {FormData} formData
 * @param {string} token
 */
export async function createAnnouncementApi(formData, token) {
  const response = await fetch(`${API_BASE_URL}/announcements/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response, 'Failed to create announcement.');
}

/**
 * Update an announcement (Admin only).
 * @param {number|string} announcementId
 * @param {FormData} formData
 * @param {string} token
 */
export async function updateAnnouncementApi(announcementId, formData, token) {
  const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response, 'Failed to update announcement.');
}

/**
 * Delete an announcement (Admin only).
 * @param {number|string} announcementId
 * @param {string} token
 */
export async function deleteAnnouncementApi(announcementId, token) {
  const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return parseResponse(response, 'Failed to delete announcement.');
}
