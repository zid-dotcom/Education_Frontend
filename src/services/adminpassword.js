const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  const resData = await response.json();

  if (!response.ok) {
    const detail = Array.isArray(resData.detail)
      ? resData.detail.map((item) => item.msg).join(', ')
      : resData.detail;
    throw new Error(detail || fallbackMessage);
  }

  return resData;
};

/**
 * Change the authenticated super-admin password.
 * @param {{ current_password: string, new_password: string }} data
 * @param {string} token
 */
export async function changeAdminPasswordApi(data, token) {
  const response = await fetch(`${API_BASE_URL}/auth/super-admin/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to change admin password.');
}
