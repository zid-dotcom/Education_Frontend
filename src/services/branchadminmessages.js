const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(response.statusText || fallbackMessage);
    }
    return null;
  }
  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data?.detail;
    throw new Error(detail || data?.message || fallbackMessage);
  }
  return data;
};

const getHeaders = (token) => ({
  Accept: 'application/json',
  'ngrok-skip-browser-warning': '69420',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function getBranchMessagesApi(token) {
  const response = await fetch(`${API_BASE_URL}/messages/my`, {
    headers: getHeaders(token),
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load messages.');
}

export async function getBranchUnreadMessageCountApi(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
      headers: getHeaders(token),
      credentials: 'include',
    });
    if (response.status === 404) {
      return { unread_count: 0 };
    }
    return parseResponse(response, 'Failed to load unread message count.');
  } catch (err) {
    console.warn('Could not load unread message count:', err);
    return { unread_count: 0 };
  }
}
 
export async function sendBranchMessageApi(message, token) {
  const response = await fetch(`${API_BASE_URL}/messages/send`, {
    method: 'POST',
    headers: {
      ...getHeaders(token),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });
  return parseResponse(response, 'Failed to send message.');
}