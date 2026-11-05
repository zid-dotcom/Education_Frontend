const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage = 'Request failed.') => {
  let resData;
  try {
    resData = await response.json();
  } catch {
    resData = null;
  }

  if (!response.ok) {
    const detail = resData?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
      : typeof detail === 'string'
      ? detail
      : fallbackMessage;
    throw new Error(message || fallbackMessage);
  }

  return resData;
};

const getHeaders = (token, isJson = true) => ({
  ...(isJson ? { 'Content-Type': 'application/json' } : {}),
  Accept: 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  'ngrok-skip-browser-warning': '69420',
});

/**
 * Branch Admin: Create a new expense for the logged-in admin's branch.
 * POST /branch-admin/expenses
 * @param {{ item: string, cost: number }} payload
 * @param {string} token
 */
export async function createBranchAdminExpenseApi(payload, token) {
  const item = String(payload?.item || '').trim();
  const cost = Number(payload?.cost);

  if (!item) {
    throw new Error('Expense item name is required.');
  }
  if (isNaN(cost) || cost <= 0) {
    throw new Error('Expense cost must be greater than 0.');
  }

  const response = await fetch(`${API_BASE_URL}/branch-admin/expenses`, {
    method: 'POST',
    headers: getHeaders(token, true),
    body: JSON.stringify({ item, cost }),
  });

  return parseResponse(response, 'Failed to create branch expense.');
}

/**
 * Branch Admin: List that branch's expenses, optionally filtered by dates.
 * GET /branch-admin/expenses?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 * @param {{ from_date?: string, to_date?: string, fromDate?: string, toDate?: string }} [filters]
 * @param {string} token
 */
export async function getBranchAdminExpensesApi(filters = {}, token) {
  const params = new URLSearchParams();
  const from = filters.from_date || filters.fromDate || filters.date_from;
  const to = filters.to_date || filters.toDate || filters.date_to;

  if (from) {
    params.append('from_date', from);
    params.append('date_from', from);
    params.append('start_date', from);
    params.append('fromDate', from);
  }
  if (to) {
    params.append('to_date', to);
    params.append('date_to', to);
    params.append('end_date', to);
    params.append('toDate', to);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/branch-admin/expenses${query}`, {
    method: 'GET',
    headers: getHeaders(token, false),
  });

  return parseResponse(response, 'Failed to load branch expenses.');
}

/**
 * Super Admin: View expenses across branches, or filter by branch_id and dates.
 * GET /super-admin/expenses?branch_id=ID&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 * @param {{ branch_id?: number|string, branchId?: number|string, from_date?: string, to_date?: string, fromDate?: string, toDate?: string, date_from?: string, date_to?: string }} [filters]
 * @param {string} token
 */
export async function getSuperAdminExpensesApi(filters = {}, token) {
  const params = new URLSearchParams();
  const branchId = filters.branch_id || filters.branchId;
  const from = filters.from_date || filters.fromDate || filters.date_from;
  const to = filters.to_date || filters.toDate || filters.date_to;

  if (branchId && branchId !== 'all') {
    params.append('branch_id', String(branchId));
  }
  if (from) {
    params.append('from_date', from);
    params.append('date_from', from);
    params.append('start_date', from);
    params.append('fromDate', from);
  }
  if (to) {
    params.append('to_date', to);
    params.append('date_to', to);
    params.append('end_date', to);
    params.append('toDate', to);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/super-admin/expenses${query}`, {
    method: 'GET',
    headers: getHeaders(token, false),
  });

  return parseResponse(response, 'Failed to load expenses report.');
}

// Aliases for convenience
export const createBranchExpenseApi = createBranchAdminExpenseApi;
export const getBranchExpensesApi = getBranchAdminExpensesApi;
