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

export function getStoredBranches() {
  try {
    const storedBranches = JSON.parse(localStorage.getItem('adminBranches') || '[]');
    return Array.isArray(storedBranches) ? storedBranches : [];
  } catch {
    return [];
  }
}

export function storeBranch(branch) {
  const branches = [...getStoredBranches().filter((item) => item.id !== branch.id), branch];
  localStorage.setItem('adminBranches', JSON.stringify(branches));
  return branches;
}

export function storeBranches(branches) {
  const normalizedBranches = Array.isArray(branches) ? branches : [];
  localStorage.setItem('adminBranches', JSON.stringify(normalizedBranches));
  return normalizedBranches;
}

export function removeStoredBranch(branchId) {
  const branches = getStoredBranches().filter((branch) => String(branch.id) !== String(branchId));
  localStorage.setItem('adminBranches', JSON.stringify(branches));
  return branches;
}

export async function getBranchesApi(token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return parseResponse(response, 'Failed to fetch branches.');
}

export async function createBranchApi(data, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to create branch.');
}

export async function getBranchApi(branchId, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/${branchId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return parseResponse(response, 'Failed to fetch branch.');
}

export async function updateBranchApi(branchId, data, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/${branchId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to update branch.');
}

export async function deleteBranchApi(branchId, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/${branchId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return parseResponse(response, 'Failed to delete branch.');
}

export async function createBranchAdminApi(data, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to create branch admin.');
}

export async function getBranchAdminsApi(token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/admins`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return parseResponse(response, 'Failed to fetch branch admins.');
}

export async function getBranchAdminApi(adminId, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/admins/${adminId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return parseResponse(response, 'Failed to fetch branch admin.');
}

export async function updateBranchAdminApi(adminId, data, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/admins/${adminId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Failed to update branch admin.');
}

export async function deleteBranchAdminApi(adminId, token) {
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/admins/${adminId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  return parseResponse(response, 'Failed to delete branch admin.');
}
