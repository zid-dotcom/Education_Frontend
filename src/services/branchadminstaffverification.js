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
 * GET /branch-admin/staff-verification
 * Get Pending Branch Staff Verification
 */
export async function getBranchStaffVerificationPendingApi(token) {
  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff-verification`,
    authOptions(token)
  );
  return parseResponse(response, 'Failed to load pending staff for verification.');
}

// Backwards-compatible alias for GET /branch-admin/staff-verification
export const getBranchStaffVerificationApi = getBranchStaffVerificationPendingApi;

/**
 * GET /branch-admin/staff-verification/approved
 * Get Approved Branch Staff Documents
 */
export async function getBranchStaffVerificationApprovedApi(token) {
  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff-verification/approved`,
    authOptions(token)
  );
  return parseResponse(response, 'Failed to load approved staff documents.');
}

/**
 * GET /branch-admin/staff-verification/rejected
 * Get Rejected Branch Staff Documents
 */
export async function getBranchStaffVerificationRejectedApi(token) {
  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff-verification/rejected`,
    authOptions(token)
  );
  return parseResponse(response, 'Failed to load rejected staff documents.');
}

/**
 * PUT /branch-admin/staff-verification/{staff_id}/approve
 * Approve Staff Documents
 */
export async function approveStaffVerificationApi(staffId, token, payload = null) {
  const options = {
    method: 'PUT',
  };
  if (payload && Object.keys(payload).length > 0) {
    options.body = JSON.stringify(payload);
  }
  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff-verification/${staffId}/approve`,
    authOptions(token, options)
  );
  return parseResponse(response, 'Failed to approve staff documents.');
}

/**
 * PUT /branch-admin/staff-verification/{staff_id}/reject
 * Reject Staff Documents
 */
export async function rejectStaffVerificationApi(staffId, token, payload = null) {
  const reasonText =
    typeof payload === 'string'
      ? payload
      : payload?.reason || payload?.rejection_reason || payload?.remarks || '';

  const options = {
    method: 'PUT',
  };
  const bodyObj =
    typeof payload === 'string'
      ? { reason: payload, rejection_reason: payload, remarks: payload }
      : payload || (reasonText ? { reason: reasonText, rejection_reason: reasonText, remarks: reasonText } : {});

  if (bodyObj && Object.keys(bodyObj).length > 0) {
    options.body = JSON.stringify(bodyObj);
  }

  const queryParam = reasonText ? `?reason=${encodeURIComponent(reasonText)}` : '';

  const response = await fetch(
    `${API_BASE_URL}/branch-admin/staff-verification/${staffId}/reject${queryParam}`,
    authOptions(token, options)
  );
  return parseResponse(response, 'Failed to reject staff documents.');
}
