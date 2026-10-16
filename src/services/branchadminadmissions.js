const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data.detail;
    throw new Error(detail || fallbackMessage);
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