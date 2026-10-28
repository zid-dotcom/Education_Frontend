const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const parseResponse = async (response, fallbackMessage) => {
  let data;
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => "");
    throw new Error(text || fallbackMessage || `Request failed with status ${response.status}`);
  }

  if (!response.ok) {
    let detail = data?.detail || data?.message || data?.error;
    if (Array.isArray(detail)) {
      detail = detail
        .map((item) => {
          if (typeof item === "string") return item;
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== "body").join(" -> ")
            : "";
          return loc ? `${loc}: ${item.msg || JSON.stringify(item)}` : (item.msg || JSON.stringify(item));
        })
        .join("; ");
    } else if (typeof detail === "object" && detail !== null) {
      detail = JSON.stringify(detail);
    }
    throw new Error(detail || fallbackMessage || `Request failed with status ${response.status}`);
  }
  return data;
};

const authOptions = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  credentials: "include",
});

export async function getBranchAdmissionsApi(token) {
  const response = await fetch(`${API_BASE_URL}/admissions/`, authOptions(token));
  return parseResponse(response, "Failed to load branch admissions.");
}

export async function createBranchAdmissionApi(admission, token) {
  const response = await fetch(`${API_BASE_URL}/admissions/`, {
    ...authOptions(token),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(admission),
  });
  return parseResponse(response, "Failed to register student.");
}

export async function addBranchAdmissionPaymentApi(enrollmentId, payment, token) {
  const response = await fetch(
    `${API_BASE_URL}/admissions/${enrollmentId}/payments`,
    {
      ...authOptions(token),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payment),
    },
  );
  return parseResponse(response, "Failed to record admission payment.");
}

export async function getDueAdmissionsApi(token) {
  const response = await fetch(`${API_BASE_URL}/admissions/due`, authOptions(token));
  return parseResponse(response, "Failed to load due admissions.");
}
