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

export async function createPaymentOrderApi(courseId, paymentType = 'full', installmentNumber = 1, token) {
  const payload = {
    course_id: Number(courseId),
    payment_type: paymentType,
  };

  if (paymentType === 'installment') {
    payload.installment_number = Number(installmentNumber) || 1;
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