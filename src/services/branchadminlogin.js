const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response) => {
  const data = await response.json();
 
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data.detail;
    throw new Error(detail || 'Branch admin login failed. Invalid credentials.');
  }

  return data;
};

/**
 * Authenticate a branch administrator.
 * The response contains the bearer token and branch administrator identity.
 * @param {{ branch_admin_id: string, password: string }} data
 */
export async function branchAdminLoginApi(data) {
  const payload = {
    branch_admin_id: (data?.branch_admin_id || data?.branchAdminId || data?.email || '').trim(),
    password: data?.password,
  };
  const response = await fetch(`${API_BASE_URL}/auth/branch-admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export function getBranchAdminToken(response) {
  if (typeof response === 'string') return response;
  return response?.access_token || response?.token || '';
}
