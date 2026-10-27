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

/**
 * Convenience helper to create a Razorpay order to pay the student's entire remaining course balance.
 * POST /payments/create-order with payment_type: "full"
 * @param {number|string} enrollmentId
 * @param {string} token
 */
export async function createFullBalanceOrderApi(enrollmentId, token) {
  return createPaymentOrderApi(
    {
      enrollment_id: Number(enrollmentId),
      payment_type: 'full',
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

const triggerBlobDownload = (blob, suggestedFileName) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = suggestedFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 10000);
};

/**
 * List the student's receipts, including branch-recorded payments.
 * GET /payments/receipts
 * @param {string} token
 */
export async function getStudentReceiptsApi(token) {
  const response = await fetch(`${API_BASE_URL}/payments/receipts`, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parsePaymentResponse(response, 'Failed to load receipts.');
}

/**
 * View one student receipt.
 * GET /payments/receipts/{receipt_id}
 * @param {number|string} receiptId
 * @param {string} token
 */
export async function getStudentReceiptApi(receiptIdOrUrl, token) {
  let endpoint = receiptIdOrUrl;
  if (typeof receiptIdOrUrl === 'string' && (receiptIdOrUrl.startsWith('http') || receiptIdOrUrl.startsWith('/'))) {
    endpoint = receiptIdOrUrl.startsWith('/') ? `${API_BASE_URL}${receiptIdOrUrl}` : receiptIdOrUrl;
  } else {
    endpoint = `${API_BASE_URL}/payments/receipts/${receiptIdOrUrl}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  return parsePaymentResponse(response, 'Failed to load receipt details.');
}

/**
 * Download one student receipt.
 * GET /payments/receipts/{receipt_id}/download
 * @param {number|string} receiptIdOrUrl
 * @param {string} token
 * @param {string} [suggestedFileName]
 */
export async function downloadStudentReceiptApi(
  receiptIdOrUrl,
  token,
  suggestedFileName = `receipt_${receiptIdOrUrl}.pdf`
) {
  let endpoint = receiptIdOrUrl;
  if (typeof receiptIdOrUrl === 'string' && (receiptIdOrUrl.startsWith('http') || receiptIdOrUrl.startsWith('/'))) {
    endpoint = receiptIdOrUrl.startsWith('/') ? `${API_BASE_URL}${receiptIdOrUrl}` : receiptIdOrUrl;
  } else {
    endpoint = `${API_BASE_URL}/payments/receipts/${receiptIdOrUrl}/download`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/pdf, application/json, */*',
      'ngrok-skip-browser-warning': '69420',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let msg = 'Failed to download receipt.';
    try {
      const errData = await response.json();
      msg = Array.isArray(errData.detail)
        ? errData.detail.map((item) => item.msg).join(', ')
        : errData.detail || errData.message || msg;
    } catch {
      // response is not json
    }
    throw new Error(msg);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    const downloadUrl = data?.download_url || data?.url || data?.link;
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return { success: true, url: downloadUrl };
    }
    if (data?.pdf_base64 || data?.base64) {
      const base64Data = data.pdf_base64 || data.base64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      triggerBlobDownload(blob, suggestedFileName);
      return { success: true, blob };
    }
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, suggestedFileName);
  return { success: true, blob };
}
