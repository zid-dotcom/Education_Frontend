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


/**
 * Request OTP for student forgot password
 * POST /auth/forgot-password/request-otp
 * @param {Object} data { email: string }
 */
export async function requestForgotPasswordOtpApi(data) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let detail = resData?.detail || resData?.message || resData?.error;
    if (Array.isArray(detail)) {
      detail = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
    }
    throw new Error(detail || 'Failed to request OTP. Please try again.');
  }

  return resData; // { message: '...' }
}

/**
 * Verify OTP for student forgot password
 * POST /auth/forgot-password/verify-otp
 * @param {Object} data { email: string, otp: string }
 */
export async function verifyForgotPasswordOtpApi(data) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
      otp: String(data.otp).trim(),
    }),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let detail = resData?.detail || resData?.message || resData?.error;
    if (Array.isArray(detail)) {
      detail = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
    }
    throw new Error(detail || 'Invalid or expired OTP code.');
  }

  return resData; // { reset_token: string, message?: string }
}

/**
 * Reset student forgotten password
 * POST /auth/forgot-password/reset
 * @param {Object} data { email: string, reset_token: string, new_password: string, confirm_password: string }
 */
export async function resetForgottenPasswordApi(data) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
      reset_token: data.reset_token,
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    }),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    let detail = resData?.detail || resData?.message || resData?.error;
    if (Array.isArray(detail)) {
      detail = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
    }
    throw new Error(detail || 'Failed to reset password. Please verify requirements and try again.');
  }

  return resData; // { message: string }
}
