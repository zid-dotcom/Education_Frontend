const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  let data;
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => '');
    throw new Error(text || fallbackMessage || `Request failed with status ${response.status}`);
  }
  if (!response.ok) {
    let detail = data?.detail || data?.message || data?.error;
    if (Array.isArray(detail)) {
      detail = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((p) => p !== 'body').join(' -> ')
            : '';
          return loc ? `${loc}: ${item.msg || JSON.stringify(item)}` : (item.msg || JSON.stringify(item));
        })
        .join('; ');
    } else if (typeof detail === 'object' && detail !== null) {
      detail = JSON.stringify(detail);
    }
    throw new Error(detail || fallbackMessage || `Request failed with status ${response.status}`);
  }
  return data;
};

const authOptions = (token, options = {}) => ({
  ...options,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  },
  credentials: 'include',
});

/**
 * 1. Create branch holiday (Branch admin only)
 * POST /holidays
 * @param {{ date: string, reason: string }} payload - e.g. { date: '2026-10-02', reason: 'Gandhi Jayanti' }
 * @param {string} token
 */
export async function createHolidayApi(payload, token) {
  const response = await fetch(
    `${API_BASE_URL}/holidays`,
    authOptions(token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  );
  return parseResponse(response, 'Failed to create branch holiday.');
}

/**
 * 2. Get holidays
 * Branch admin: GET /holidays
 * Super admin: GET /holidays?branch_id=1
 * Filters:
 * - month (e.g. '2026-10')
 * - date_from ('2026-10-01') & date_to ('2026-10-31')
 * @param {string} token
 * @param {{ branch_id?: number|string, month?: string, date_from?: string, date_to?: string }} [params]
 */
export async function getHolidaysApi(token, params = {}) {
  const queryParams = new URLSearchParams();
  if (params?.branch_id !== undefined && params?.branch_id !== null && params?.branch_id !== '') {
    queryParams.append('branch_id', params.branch_id);
  }
  if (params?.month) {
    queryParams.append('month', params.month);
  }
  let dateFrom = params?.date_from;
  let dateTo = params?.date_to;
  if (dateFrom && dateTo && dateFrom > dateTo) {
    const temp = dateFrom;
    dateFrom = dateTo;
    dateTo = temp;
  }
  if (dateFrom) {
    queryParams.append('date_from', dateFrom);
  }
  if (dateTo) {
    queryParams.append('date_to', dateTo);
  }

  const qs = queryParams.toString();
  const url = `${API_BASE_URL}/holidays${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, authOptions(token, { method: 'GET' }));
  return parseResponse(response, 'Failed to load holidays.');
}

/**
 * Super admin viewing holidays for a specific branch
 * GET /holidays?branch_id={branch_id}&...
 */
export async function getSuperAdminBranchHolidaysApi(branchId, token, params = {}) {
  return getHolidaysApi(token, { ...params, branch_id: branchId });
}

