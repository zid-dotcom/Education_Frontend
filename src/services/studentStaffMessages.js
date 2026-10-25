const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = (token) => {
  const authToken =
    (typeof token === 'string' && token.length > 10 ? token : null) ||
    localStorage.getItem('token') ||
    localStorage.getItem('studentToken') ||
    localStorage.getItem('staffToken');

  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
};

const parseResponse = async (res, defaultErrMsg = 'Request failed.') => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg || d).join(', ')
      : data?.detail || data?.message;
    throw new Error(detail || defaultErrMsg);
  }
  return data;
};

// ============================================================================
// STUDENT APIS
// ============================================================================

/**
 * List assigned staff for approved courses.
 * Endpoint: GET /student-staff-messages/student/available-staff
 */
export async function getStudentAvailableStaffApi(token) {
  const res = await fetch(`${API_BASE_URL}/student-staff-messages/student/available-staff`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load available faculty.');
}

/**
 * Send a message with course_id, staff_id, and message.
 * Endpoint: POST /student-staff-messages/student/send
 * Body: { course_id, staff_id, message }
 */
export async function sendStudentMessageApi(arg1, arg2) {
  let authToken;
  let payload;
  if (typeof arg1 === 'string' && arg1.length > 20) {
    authToken = arg1;
    payload = arg2;
  } else if (typeof arg2 === 'string' && arg2.length > 20) {
    payload = arg1;
    authToken = arg2;
  } else {
    payload = arg1;
    authToken = arg2;
  }

  const res = await fetch(`${API_BASE_URL}/student-staff-messages/student/send`, {
    method: 'POST',
    headers: getHeaders(authToken),
    body: JSON.stringify(payload || {}),
  });
  return parseResponse(res, 'Failed to send message.');
}

/**
 * List conversations and unread reply counts for the student.
 * Endpoint: GET /student-staff-messages/student/conversations
 */
export async function getStudentConversationsApi(token) {
  const res = await fetch(`${API_BASE_URL}/student-staff-messages/student/conversations`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load conversations.');
}

/**
 * Get the total unread staff replies for the student.
 * Endpoint: GET /student-staff-messages/student/unread-count
 */
export async function getStudentUnreadCountApi(token) {
  const res = await fetch(`${API_BASE_URL}/student-staff-messages/student/unread-count`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load unread count.');
}

/**
 * Get conversation thread and mark staff replies as read.
 * Endpoint: GET /student-staff-messages/student/conversations/{conversation_id}
 */
export async function getStudentConversationThreadApi(arg1, arg2) {
  let authToken;
  let conversationId;
  if (typeof arg1 === 'number' || (typeof arg1 === 'string' && String(Number(arg1)) === String(arg1))) {
    conversationId = arg1;
    authToken = arg2;
  } else {
    authToken = arg1;
    conversationId = arg2;
  }

  const res = await fetch(
    `${API_BASE_URL}/student-staff-messages/student/conversations/${conversationId}`,
    {
      method: 'GET',
      headers: getHeaders(authToken),
    }
  );
  return parseResponse(res, 'Failed to load conversation thread.');
}

// ============================================================================
// STAFF APIS
// ============================================================================

/**
 * List student conversations and unread counts for staff.
 * Endpoint: GET /student-staff-messages/staff/conversations
 */
export async function getStaffConversationsApi(token) {
  const res = await fetch(`${API_BASE_URL}/student-staff-messages/staff/conversations`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load student conversations.');
}

/**
 * Get the total unread student messages for staff.
 * Endpoint: GET /student-staff-messages/staff/unread-count
 */
export async function getStaffUnreadCountApi(token) {
  const res = await fetch(`${API_BASE_URL}/student-staff-messages/staff/unread-count`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to load unread count.');
}

/**
 * Get conversation thread and mark student messages as read.
 * Endpoint: GET /student-staff-messages/staff/conversations/{conversation_id}
 */
export async function getStaffConversationThreadApi(arg1, arg2) {
  let authToken;
  let conversationId;
  if (typeof arg1 === 'number' || (typeof arg1 === 'string' && String(Number(arg1)) === String(arg1))) {
    conversationId = arg1;
    authToken = arg2;
  } else {
    authToken = arg1;
    conversationId = arg2;
  }

  const res = await fetch(
    `${API_BASE_URL}/student-staff-messages/staff/conversations/${conversationId}`,
    {
      method: 'GET',
      headers: getHeaders(authToken),
    }
  );
  return parseResponse(res, 'Failed to load conversation thread.');
}

/**
 * Reply to the student in a conversation thread.
 * Endpoint: POST /student-staff-messages/staff/conversations/{conversation_id}/reply
 * Body: { message: "string" }
 */
export async function replyStaffConversationApi(arg1, arg2, arg3) {
  let conversationId;
  let payload;
  let authToken;

  if (typeof arg1 === 'number' || (typeof arg1 === 'string' && String(Number(arg1)) === String(arg1))) {
    conversationId = arg1;
    payload = arg2;
    authToken = arg3;
  } else {
    authToken = arg1;
    conversationId = arg2;
    payload = arg3;
  }

  const res = await fetch(
    `${API_BASE_URL}/student-staff-messages/staff/conversations/${conversationId}/reply`,
    {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(payload || {}),
    }
  );
  return parseResponse(res, 'Failed to reply to student.');
}
