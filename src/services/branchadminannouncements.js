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

export async function getBranchAnnouncementsApi(token) {
  const response = await fetch(`${API_BASE_URL}/branch-announcements/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load branch announcements.');
}

/**
 * Branch admin: announcements targeted to them
 * GET /announcements/branch-admin/branch
 */
export async function getBranchAdminTargetedAnnouncementsApi(token) {
  const response = await fetch(`${API_BASE_URL}/announcements/branch-admin/branch`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load announcements for branch admin.');
}

export async function getBranchAnnouncementApi(announcementId, token) {
  const response = await fetch(`${API_BASE_URL}/branch-announcements/${announcementId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load announcement.');
}

export async function createBranchAnnouncementApi(formData, token) {
  const response = await fetch(`${API_BASE_URL}/branch-announcements/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  });
  return parseResponse(response, 'Failed to create branch announcement.');
}

export async function updateBranchAnnouncementApi(announcementId, formData, token) {
  const response = await fetch(`${API_BASE_URL}/branch-announcements/${announcementId}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  });
  return parseResponse(response, 'Failed to update branch announcement.');
}

export async function deleteBranchAnnouncementApi(announcementId, token) {
  const response = await fetch(`${API_BASE_URL}/branch-announcements/${announcementId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to delete branch announcement.');
}
