const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Register a new user
 * @param {Object} data { name, email, password }
 */
export async function registerApi(data) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Registration failed. Please try again.');
  }

  return resData;
}

/**
 * Login regular user
 * @param {Object} data { email, password }
 */
export async function loginApi(data) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Login failed. Invalid credentials.');
  }

  return resData; // { access_token, token_type }
}

/**
 * Login admin user
 * @param {Object} data { email, password }
 */
export async function adminLoginApi(data) {
  const response = await fetch(`${API_BASE_URL}/auth/super-admin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(resData?.detail)
      ? resData.detail.map((item) => item.msg || item).join(', ')
      : resData?.detail;
    throw new Error(detail || 'Admin login failed. Invalid credentials or access denied.');
  }

  return resData; // { access_token, token_type }
}

/**
 * Get current user profile details
 * @param {string} token
 */
export async function getMeApi(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to fetch user session.');
  }

  return resData;
}

/**
 * Invalidate session and logout on backend
 * Calls POST /auth/logout
 * @param {string} [token]
 */
export async function logoutApi(token) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
    });

    const resData = await response.json().catch(() => ({}));
    return resData;
  } catch (error) {
    console.error('Logout API call failed:', error);
    return null;
  }
}

