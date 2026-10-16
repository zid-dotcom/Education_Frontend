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

const authOptions = (token, method = 'GET') => ({
  method,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  credentials: 'include',
});

export async function getBranchAdminPurchasesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/purchases`, authOptions(token));
  return parseResponse(response, 'Failed to load purchase history.');
}

export async function getBranchAdminPendingPurchasesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/pending`, authOptions(token));
  return parseResponse(response, 'Failed to load pending purchases.');
}

export async function getBranchAdminApprovedPurchasesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/approved`, authOptions(token));
  return parseResponse(response, 'Failed to load approved purchases.');
}

export async function getBranchAdminRejectedPurchasesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/rejected`, authOptions(token));
  return parseResponse(response, 'Failed to load rejected purchases.');
}

export async function approveBranchAdminPurchaseApi(enrollmentId, token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/${enrollmentId}/approve`, authOptions(token, 'PUT'));
  return parseResponse(response, 'Failed to approve purchase.');
}