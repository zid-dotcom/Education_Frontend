const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data.detail;
    throw new Error(detail || data.message || fallbackMessage);
  }
  return data;
};

const triggerBlobDownload = (blob, suggestedFileName) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
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
 * List this branch's receipts.
 * GET /branch-admin/receipts?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 * @param {string} token
 * @param {object} [params] Optional filter params: { from_date, to_date, fromDate, toDate, search, course_id, page, limit }
 */
export async function getBranchAdminReceiptsApi(token, params = {}) {
  const query = new URLSearchParams();
  const from = params.from_date || params.fromDate;
  const to = params.to_date || params.toDate;
  if (from) query.append("from_date", from);
  if (to) query.append("to_date", to);
  if (params.search) query.append("search", params.search);
  if (params.date) query.append("date", params.date);
  if (params.course_id || params.courseId) query.append("course_id", params.course_id || params.courseId);
  if (params.payment_method || params.paymentMethod) query.append("payment_method", params.payment_method || params.paymentMethod);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  const qs = query.toString() ? `?${query.toString()}` : "";

  const response = await fetch(`${API_BASE_URL}/branch-admin/receipts${qs}`, {
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "69420",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  return parseResponse(response, "Failed to load branch receipts.");
}

/**
 * View one receipt.
 * GET /branch-admin/receipts/{receipt_id}
 * @param {number|string} receiptId
 * @param {string} token
 */
export async function getBranchAdminReceiptApi(receiptId, token) {
  const endpoint = typeof receiptId === "string" && receiptId.startsWith("http")
    ? receiptId
    : typeof receiptId === "string" && receiptId.startsWith("/")
    ? `${API_BASE_URL}${receiptId}`
    : `${API_BASE_URL}/branch-admin/receipts/${receiptId}`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "69420",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  return parseResponse(response, "Failed to load receipt details.");
}

/**
 * Download one receipt.
 * GET /branch-admin/receipts/{receipt_id}/download
 * @param {number|string} receiptId
 * @param {string} token
 * @param {string} [suggestedFileName]
 * @param {string} [customUrl] Optional custom direct download or receipt URL
 */
export async function downloadBranchAdminReceiptApi(
  receiptId,
  token,
  suggestedFileName = `receipt_${receiptId}.pdf`,
  customUrl = null
) {
  let endpoint = customUrl;
  if (!endpoint) {
    if (typeof receiptId === "string" && (receiptId.startsWith("http") || receiptId.startsWith("/"))) {
      endpoint = receiptId;
    } else {
      endpoint = `${API_BASE_URL}/branch-admin/receipts/${receiptId}/download`;
    }
  }

  if (endpoint.startsWith("/")) {
    endpoint = `${API_BASE_URL}${endpoint}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/pdf, application/json, */*",
      "ngrok-skip-browser-warning": "69420",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    let msg = "Failed to download receipt.";
    try {
      const errData = await response.json();
      msg = Array.isArray(errData.detail)
        ? errData.detail.map((item) => item.msg).join(", ")
        : errData.detail || errData.message || msg;
    } catch {
      // response is not json
    }
    throw new Error(msg);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    const downloadUrl = data?.download_url || data?.url || data?.link;
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
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
      const blob = new Blob([byteArray], { type: "application/pdf" });
      triggerBlobDownload(blob, suggestedFileName);
      return { success: true, blob };
    }
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, suggestedFileName);
  return { success: true, blob };
}
