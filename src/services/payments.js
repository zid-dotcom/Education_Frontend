const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export const loadRazorpayScript = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(true), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = RAZORPAY_SCRIPT_URL;
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
  document.body.appendChild(script);
});

async function parsePaymentResponse(response, fallbackMessage) {
  const resData = await response.json();

  if (!response.ok) {
    const detail = Array.isArray(resData.detail)
      ? resData.detail.map((item) => item.msg).join(', ')
      : resData.detail;
    throw new Error(detail || resData.message || fallbackMessage);
  }

  return resData;
}

export { getEnrollmentInstallmentsApi } from './enrollments';

/**
 * Create a payment order.
 * Supports:
 * - New course enrollment order: createPaymentOrderApi(courseId, paymentType, installmentNumber, token)
 * - Existing student installment order: createPaymentOrderApi({ enrollment_id, payment_type: 'installment' }, token)
 */
export async function createPaymentOrderApi(courseIdOrParams, paymentType = 'full', installmentNumber = 1, tokenArg) {
  let payload = {};
  let token = tokenArg;

  if (typeof courseIdOrParams === 'object' && courseIdOrParams !== null) {
    // Called as: createPaymentOrderApi({ enrollment_id, course_id, payment_type, installment_number }, token)
    token = paymentType;
    const { enrollment_id, course_id, payment_type = 'installment', installment_number } = courseIdOrParams;
    payload = {
      ...(enrollment_id !== undefined ? { enrollment_id: Number(enrollment_id) } : {}),
      ...(course_id !== undefined ? { course_id: Number(course_id) } : {}),
      payment_type: payment_type,
      ...(installment_number !== undefined ? { installment_number: Number(installment_number) } : {}),
    };
  } else {
    // Called as: createPaymentOrderApi(courseId, paymentType, installmentNumber, token)
    payload = {
      course_id: Number(courseIdOrParams),
      payment_type: paymentType,
    };

    if (paymentType === 'installment') {
      payload.installment_number = Number(installmentNumber) || 1;
    }
  }

  const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  return parsePaymentResponse(response, 'Failed to create payment order.');
}

/**
 * Convenience helper to create a Razorpay order for an existing student's next unpaid installment.
 * POST /payments/create-order
 * @param {number|string} enrollmentId
 * @param {string} token
 */
export async function createInstallmentOrderApi(enrollmentId, token) {
  return createPaymentOrderApi(
    {
      enrollment_id: Number(enrollmentId),
      payment_type: 'installment',
    },
    token
  );
}

export async function verifyPaymentApi(paymentData, token) {
  const response = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(paymentData),
  });

  return parsePaymentResponse(response, 'Payment verification failed.');
}