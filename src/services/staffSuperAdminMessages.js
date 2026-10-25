const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const parseResponse = async (response, fallbackMsg) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((i) => i.msg || i).join(', ')
      : data?.detail || fallbackMsg;
    throw new Error(detail);
  }
  return data;
};

// ==========================================
// 1. Staff APIs (Staff <-> Super Admin)
// ==========================================

/**
 * Staff sends a message to Super Admin
 * Endpoint: POST /staff-super-admin-messages/staff/send
 * Body: { "message": "..." }
 */
export const staffSendSuperAdminMessageApi = async (message, token) => {
  const res = await fetch(`${API_BASE_URL}/staff-super-admin-messages/staff/send`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ message }),
  });
  return parseResponse(res, 'Failed to send message to Super Admin.');
};

/**
 * Staff reads their conversation with Super Admin
 * Endpoint: GET /staff-super-admin-messages/staff/my
 */
export const getStaffSuperAdminConversationApi = async (token) => {
  const res = await fetch(`${API_BASE_URL}/staff-super-admin-messages/staff/my`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load conversation with Super Admin.');
};

/**
 * Count of unread super-admin replies for that staff member
 * Endpoint: GET /staff-super-admin-messages/staff/unread-count
 */
export const getStaffSuperAdminUnreadCountApi = async (token) => {
  const res = await fetch(`${API_BASE_URL}/staff-super-admin-messages/staff/unread-count`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load unread count.');
};

// ==========================================
// 2. Super Admin APIs (Super Admin <-> Staff)
// ==========================================

/**
 * Super Admin inbox with unread totals and staff/branch details
 * Endpoint: GET /staff-super-admin-messages/super-admin/inbox
 */
export const getSuperAdminStaffInboxApi = async (token) => {
  const res = await fetch(`${API_BASE_URL}/staff-super-admin-messages/super-admin/inbox`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load staff messages inbox.');
};

/**
 * Global unread staff-message count
 * Endpoint: GET /staff-super-admin-messages/super-admin/unread-count
 */
export const getSuperAdminStaffUnreadCountApi = async (token) => {
  const res = await fetch(`${API_BASE_URL}/staff-super-admin-messages/super-admin/unread-count`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load unread staff messages count.');
};

/**
 * Super Admin reads a thread; staff messages are marked read
 * Endpoint: GET /staff-super-admin-messages/super-admin/{conversation_id}
 */
export const getSuperAdminStaffConversationApi = async (conversationId, token) => {
  const res = await fetch(
    `${API_BASE_URL}/staff-super-admin-messages/super-admin/${conversationId}`,
    {
      method: 'GET',
      headers: getHeaders(token),
    }
  );
  return parseResponse(res, 'Failed to load conversation thread.');
};

/**
 * Super Admin replies to a staff conversation
 * Endpoint: POST /staff-super-admin-messages/super-admin/{conversation_id}/reply
 * Body: { "message": "..." }
 */
export const replySuperAdminStaffMessageApi = async (conversationId, message, token) => {
  const res = await fetch(
    `${API_BASE_URL}/staff-super-admin-messages/super-admin/${conversationId}/reply`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ message }),
    }
  );
  return parseResponse(res, 'Failed to send reply to staff.');
};
