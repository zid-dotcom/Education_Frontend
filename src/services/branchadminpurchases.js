const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  let data = null;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(response.statusText || fallbackMessage);
    }
    return [];
  }
  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data?.detail;
    throw new Error(detail || data?.message || fallbackMessage);
  }
  return data;
};

const authOptions = (token, method = 'GET') => ({
  method,
  headers: {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '69420',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  credentials: 'include',
});

export async function getBranchAdminPurchasesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/purchases`, authOptions(token));
  if (response.status === 404) return [];
  return parseResponse(response, 'Failed to load purchase history.');
}

export async function getBranchAdminPendingPurchasesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/pending`, authOptions(token));
  if (response.status === 404) return [];
  return parseResponse(response, 'Failed to load pending purchases.');
}

export async function getBranchAdminApprovedPurchasesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/approved`, authOptions(token));
  if (response.status === 404) return [];
  return parseResponse(response, 'Failed to load approved purchases.');
}

export async function getBranchAdminRejectedPurchasesApi(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/rejected`, authOptions(token));
    if (response.status === 404) {
      return [];
    }
    return parseResponse(response, 'Failed to load rejected purchases.');
  } catch {
    return [];
  }
}

export async function approveBranchAdminPurchaseApi(enrollmentId, token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/${enrollmentId}/approve`, authOptions(token, 'PUT'));
  return parseResponse(response, 'Failed to approve purchase.');
}