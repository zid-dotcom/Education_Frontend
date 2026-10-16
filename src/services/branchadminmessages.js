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

export async function getBranchMessagesApi(token) {
  const response = await fetch(`${API_BASE_URL}/messages/my`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load messages.');
}

export async function getBranchUnreadMessageCountApi(token) {
  const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load unread message count.');
}
 
export async function sendBranchMessageApi(message, token) {
  const response = await fetch(`${API_BASE_URL}/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });
  return parseResponse(response, 'Failed to send message.');
}