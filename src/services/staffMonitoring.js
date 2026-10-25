const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = (token) => {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const parseResponse = async (res, defaultError) => {
  if (!res.ok) {
    let detail = defaultError;
    try {
      const err = await res.json();
      detail = err.detail || err.message || defaultError;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
};

/**
 * Branch Admin: returns staff and activity for the authenticated branch admin's branch only.
 * Supports offset and limit.
 * GET /staff-monitoring/branch-admin
 */
export async function getBranchAdminStaffMonitoringApi({ offset = 0, limit = 100 } = {}, token) {
  const params = new URLSearchParams();
  if (offset !== undefined && offset !== null) params.append('offset', String(offset));
  if (limit !== undefined && limit !== null) params.append('limit', String(limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/staff-monitoring/branch-admin${query}`, {
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load branch staff monitoring data.');
}

/**
 * Super Admin: returns branches for a branch selector.
 * GET /staff-monitoring/super-admin/branches
 */
export async function getSuperAdminMonitoringBranchesApi(token) {
  const res = await fetch(`${API_BASE_URL}/staff-monitoring/super-admin/branches`, {
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load monitoring branches.');
}

/**
 * Super Admin: returns staff across all branches or filtered by branch_id.
 * Supports branch_id, offset, and limit.
 * GET /staff-monitoring/super-admin
 * GET /staff-monitoring/super-admin?branch_id=2
 */
export async function getSuperAdminStaffMonitoringApi({ branch_id, offset = 0, limit = 100 } = {}, token) {
  const params = new URLSearchParams();
  if (branch_id && branch_id !== 'all') {
    params.append('branch_id', String(branch_id));
  }
  if (offset !== undefined && offset !== null) params.append('offset', String(offset));
  if (limit !== undefined && limit !== null) params.append('limit', String(limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/staff-monitoring/super-admin${query}`, {
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load super admin staff monitoring data.');
}
