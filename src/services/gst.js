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
/**
 * Helper to calculate tax-inclusive GST breakdown.
 * When a course is added with price = 20000, that 20000 is ALREADY tax-inclusive (Final Fee).
 *
 * Total fee including GST = ₹20,000
 * Course fee excluding GST = ₹20,000 / 1.18 = ₹16,949.15
 * GST amount = ₹20,000 - ₹16,949.15 = ₹3,050.85
 * CGST (9%) = ₹1,525.43
 * SGST (9%) = ₹1,525.42
 * Final fee = ₹20,000
 */
export function calculateGstBreakdown(priceOrTotal, cgstPercent = 9, sgstPercent = 9) {
  const total = Math.max(0, Number(priceOrTotal) || 0);
  // Default to standard 9% CGST and 9% SGST (18% total GST) if 0 or unspecified
  const cgst = Number(cgstPercent) > 0 ? Number(cgstPercent) : 9;
  const sgst = Number(sgstPercent) > 0 ? Number(sgstPercent) : 9;
  const totalPercent = Math.round((cgst + sgst) * 100) / 100;

  if (total <= 0) {
    return {
      basePrice: 0,
      cgstPercent: cgst,
      sgstPercent: sgst,
      totalGstPercent: totalPercent,
      cgstAmount: 0,
      sgstAmount: 0,
      totalGstAmount: 0,
      totalAmount: 0,
      finalFee: 0,
    };
  }

  // Inclusive calculation: Total = Base * (1 + rate/100) => Base = Total / (1 + rate/100)
  const base = Math.round((total / (1 + totalPercent / 100)) * 100) / 100;
  const totalGst = Math.round((total - base) * 100) / 100;

  // Split total GST between CGST and SGST proportionally
  const cgstAmount = Math.round((totalGst * (cgst / totalPercent)) * 100) / 100;
  const sgstAmount = Math.round((totalGst - cgstAmount) * 100) / 100;

  return {
    basePrice: base,          // e.g. 16949.15 (Course fee excluding GST)
    cgstPercent: cgst,        // 9%
    sgstPercent: sgst,        // 9%
    totalGstPercent: totalPercent, // 18%
    cgstAmount,               // e.g. 1525.43
    sgstAmount,               // e.g. 1525.42
    totalGstAmount: totalGst, // e.g. 3050.85
    totalAmount: total,       // e.g. 20000 (Final fee)
    finalFee: total,          // e.g. 20000
  };
}

