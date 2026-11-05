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
    let { fromDate, toDate, date } = dateOrRange;
    if (fromDate && toDate && fromDate > toDate) {
      const tmp = fromDate;
      fromDate = toDate;
      toDate = tmp;
    }
    const params = new URLSearchParams();
    if (fromDate && toDate && fromDate === toDate) {
      params.append('date', fromDate);
      params.append('from_date', fromDate);
      params.append('to_date', fromDate);
    } else {
      if (fromDate) {
        params.append('from_date', fromDate);
        params.append('date_from', fromDate);
      }
      if (toDate) {
        params.append('to_date', toDate);
        params.append('date_to', toDate);
      }
      if (date) params.append('date', date);
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
