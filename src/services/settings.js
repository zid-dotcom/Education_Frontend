const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch public institute contact settings
 */
export async function getSettingsApi() {
  const response = await fetch(`${API_BASE_URL}/settings/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to fetch institute settings.');
  }

  return resData;
}

/**
 * Update institute contact settings (Admin only)
 * @param {Object} data { address, phone, alt_phone, email, admissions_email, working_hours }
 * @param {string} token
 */
export async function updateSettingsApi(data, token) {
  const response = await fetch(`${API_BASE_URL}/settings/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to update institute settings.');
  }

  return resData;
}
