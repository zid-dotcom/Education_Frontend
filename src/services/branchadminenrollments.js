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

export async function getBranchAdminEnrollmentsApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/my-enrollments`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load branch enrollments.');
}

/**
 * Fetch students with a remaining balance and their installment details.
 * GET /enrollments/branch-admin/installment-students
 */
export async function getBranchAdminInstallmentStudentsApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/installment-students`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load installment students.');
}

/**
 * Fetch fully paid students.
 * GET /enrollments/branch-admin/fully-paid-students
 */
export async function getBranchAdminFullyPaidStudentsApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/fully-paid-students`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load fully paid students.');
}

/**
 * Record an in-person cash, UPI, or split cash + UPI payment.
 * POST /enrollments/branch-admin/{enrollment_id}/installment-payments
 */
export async function recordBranchAdminInstallmentPaymentApi(enrollmentId, paymentData, token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/${enrollmentId}/installment-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(paymentData),
  });
  return parseResponse(response, 'Failed to record installment payment.');
}

/**
 * Fetch verified Razorpay payments awaiting BranchAdmin review.
 * GET /enrollments/branch-admin/installment-payments/pending
 */
export async function getBranchAdminPendingInstallmentPaymentsApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/installment-payments/pending`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load pending installment payments.');
}

/**
 * Fetch today's installment payments.
 * GET /enrollments/branch-admin/installment-payments/today
 */
export async function getBranchAdminTodayInstallmentPaymentsApi(token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/installment-payments/today`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, "Failed to load today's installment payments.");
}

/**
 * Approve a pending Razorpay payment.
 * PUT /enrollments/branch-admin/installment-payments/{payment_id}/approve
 */
export async function approveBranchAdminInstallmentPaymentApi(paymentId, token) {
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/installment-payments/${paymentId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to approve installment payment.');
}

/**
 * Reject a pending Razorpay payment.
 * PUT /enrollments/branch-admin/installment-payments/{payment_id}/reject
 */
export async function rejectBranchAdminInstallmentPaymentApi(paymentId, reason, token) {
  const body = typeof reason === 'object' && reason !== null
    ? reason
    : { reason: reason || 'Rejected by Branch Admin' };

  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/installment-payments/${paymentId}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return parseResponse(response, 'Failed to reject installment payment.');
}

/**
 * Fetch reviewed payment history.
 * GET /enrollments/branch-admin/installment-payments/history?status=received|rejected
 */
export async function getBranchAdminInstallmentPaymentHistoryApi(status = '', token) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${API_BASE_URL}/enrollments/branch-admin/installment-payments/history${query}`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parseResponse(response, 'Failed to load installment payment history.');
}

/**
 * Change a branch student's status:
 * PATCH /branch-admin/students/{student_id}/status
 */
export async function updateBranchAdminStudentStatusApi(studentId, status, token) {
  const formattedStatus = String(status).toLowerCase() === 'active' ? 'Active' : 'Inactive';
  const query = `?status=${encodeURIComponent(formattedStatus)}`;
  const response = await fetch(`${API_BASE_URL}/branch-admin/students/${studentId}/status${query}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      status: formattedStatus,
      is_active: formattedStatus === 'Active',
    }),
  });
  return parseResponse(response, 'Failed to update branch student status.');
}