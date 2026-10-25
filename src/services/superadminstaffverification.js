const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg || item).join(', ')
      : data?.detail;
    throw new Error(detail || fallbackMessage);
  }
  return data;
};

const authOptions = (token, options = {}) => {
  const headers = {
    'ngrok-skip-browser-warning': '69420',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return {
    ...options,
    headers,
    credentials: 'include',
  };
};

/**
 * GET /super-admin/staff-verification or GET /super-admin/staff-verification/pending
 * Pending documents
 */
export async function getSuperAdminStaffVerificationPendingApi(token) {
  const response = await fetch(
    `${API_BASE_URL}/super-admin/staff-verification`,
    authOptions(token)
  );
  return parseResponse(response, 'Failed to load pending staff documents for verification.');
}

// Alias for pending
export const getSuperAdminStaffVerificationApi = getSuperAdminStaffVerificationPendingApi;

/**
 * GET /super-admin/staff-verification/approved
 * Approved documents
 */
export async function getSuperAdminStaffVerificationApprovedApi(token) {
  const response = await fetch(
    `${API_BASE_URL}/super-admin/staff-verification/approved`,
    authOptions(token)
  );
  return parseResponse(response, 'Failed to load approved staff documents.');
}

/**
 * GET /super-admin/staff-verification/rejected
 * Rejected documents
 */
export async function getSuperAdminStaffVerificationRejectedApi(token) {
  const response = await fetch(
    `${API_BASE_URL}/super-admin/staff-verification/rejected`,
    authOptions(token)
  );
  return parseResponse(response, 'Failed to load rejected staff documents.');
}

/**
 * PUT /super-admin/staff-verification/{staff_id}/approve
 * Approve documents
 */
export async function approveSuperAdminStaffVerificationApi(staffId, token, payload = null) {
  const options = {
    method: 'PUT',
  };
  if (payload && Object.keys(payload).length > 0) {
    options.body = JSON.stringify(payload);
  }
  const response = await fetch(
    `${API_BASE_URL}/super-admin/staff-verification/${staffId}/approve`,
    authOptions(token, options)
  );
  return parseResponse(response, 'Failed to approve staff documents.');
}

/**
 * PUT /super-admin/staff-verification/{staff_id}/reject
 * Reject documents; send a JSON body such as {"reason": "Document is unclear"}
 */
export async function rejectSuperAdminStaffVerificationApi(staffId, token, payload = null) {
  const reasonText =
    typeof payload === 'string'
      ? payload
      : payload?.reason || payload?.rejection_reason || payload?.remarks || '';

  const options = {
    method: 'PUT',
  };

  const bodyObj =
    typeof payload === 'string'
      ? { reason: payload }
      : payload || (reasonText ? { reason: reasonText } : { reason: 'Document verification rejected' });

  options.body = JSON.stringify(bodyObj);

  const queryParam = reasonText ? `?reason=${encodeURIComponent(reasonText)}` : '';

  const response = await fetch(
    `${API_BASE_URL}/super-admin/staff-verification/${staffId}/reject${queryParam}`,
    authOptions(token, options)
  );
  return parseResponse(response, 'Failed to reject staff documents.');
}
