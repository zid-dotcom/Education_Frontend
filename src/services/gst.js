const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  let data;
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => '');
    throw new Error(text || fallbackMessage || `Request failed with status ${response.status}`);
  }

  if (!response.ok) {
    let detail = data?.detail || data?.message || data?.error;
    if (Array.isArray(detail)) {
      detail = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((p) => p !== 'body').join(' -> ')
            : '';
          return loc ? `${loc}: ${item.msg || JSON.stringify(item)}` : (item.msg || JSON.stringify(item));
        })
        .join('; ');
    } else if (typeof detail === 'object' && detail !== null) {
      detail = JSON.stringify(detail);
    }
    throw new Error(detail || fallbackMessage || `Request failed with status ${response.status}`);
  }
  return data;
};

const getHeaders = (token) => ({
  Authorization: token ? `Bearer ${token}` : '',
  'ngrok-skip-browser-warning': '69420',
});

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: token ? `Bearer ${token}` : '',
  'ngrok-skip-browser-warning': '69420',
});

/**
 * Fetch GST settings (Super Admin)
 * Returns { cgst_percent, sgst_percent, total_gst_percent }
 */
export async function getSuperAdminGstSettingsApi(token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/gst-settings/`, {
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to fetch GST settings.');
}

/**
 * Fetch GST settings (Branch Admin)
 * Returns { cgst_percent, sgst_percent, total_gst_percent }
 * GET /branch-admin/gst-settings/
 */
export async function getBranchAdminGstSettingsApi(token) {
  const res = await fetch(`${API_BASE_URL}/branch-admin/gst-settings/`, {
    headers: getHeaders(token),
  });
  return parseResponse(res, 'Failed to fetch branch GST settings.');
}

/**
 * Update GST settings (Super Admin)
 * Payload: { cgst_percent: number, sgst_percent: number }
 */
export async function updateSuperAdminGstSettingsApi(data, token) {
  const res = await fetch(`${API_BASE_URL}/super-admin/gst-settings/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      cgst_percent: Number(data.cgst_percent),
      sgst_percent: Number(data.sgst_percent),
    }),
  });
  return parseResponse(res, 'Failed to update GST settings.');
}

/**
 * Helper to calculate GST breakdown on a pre-GST base price.
 */
export function calculateGstBreakdown(basePrice, cgstPercent = 0, sgstPercent = 0) {
  const base = Math.max(0, Number(basePrice) || 0);
  const cgst = Math.max(0, Number(cgstPercent) || 0);
  const sgst = Math.max(0, Number(sgstPercent) || 0);
  const totalPercent = Math.round((cgst + sgst) * 100) / 100;
  
  const cgstAmount = Math.round(base * (cgst / 100) * 100) / 100;
  const sgstAmount = Math.round(base * (sgst / 100) * 100) / 100;
  const totalGstAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
  const totalAmount = Math.round((base + totalGstAmount) * 100) / 100;

  return {
    basePrice: base,
    cgstPercent: cgst,
    sgstPercent: sgst,
    totalGstPercent: totalPercent,
    cgstAmount,
    sgstAmount,
    totalGstAmount,
    totalAmount,
  };
}

