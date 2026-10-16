const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data.detail;
    throw new Error(detail || 'Failed to load branch profit.');
  }
  return data;
};

export async function getBranchAdminProfitApi(token, date) {
  const query = date ? `?${new URLSearchParams({ date })}` : '';
  const response = await fetch(`${API_BASE_URL}/branch-admin/profit${query}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  return parseResponse(response);
}