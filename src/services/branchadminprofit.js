const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data.detail;
    throw new Error(detail || 'Failed to load branch revenue.');
  }
  return data;
};

export async function getBranchAdminProfitApi(token, dateOrRange = null) {
  let query = '';
  if (typeof dateOrRange === 'string') {
    query = `?date=${encodeURIComponent(dateOrRange)}`;
  } else if (dateOrRange && typeof dateOrRange === 'object') {
    const params = new URLSearchParams();
    if (dateOrRange.fromDate && dateOrRange.toDate && dateOrRange.fromDate === dateOrRange.toDate) {
      params.append('date', dateOrRange.fromDate);
    } else {
      if (dateOrRange.fromDate) params.append('from_date', dateOrRange.fromDate);
      if (dateOrRange.toDate) params.append('to_date', dateOrRange.toDate);
      if (dateOrRange.date) params.append('date', dateOrRange.date);
      else if (dateOrRange.fromDate) params.append('date', dateOrRange.fromDate);
    }
    const qs = params.toString();
    query = qs ? `?${qs}` : '';
  }

  const response = await fetch(`${API_BASE_URL}/branch-admin/profit${query}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  return parseResponse(response);
}
