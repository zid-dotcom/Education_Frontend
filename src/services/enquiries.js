const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Submit a student admission enquiry / contact form (Public)
 */  
export async function createEnquiryApi(enquiryData) {
  const response = await fetch(`${API_BASE_URL}/enquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(enquiryData),
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to submit enquiry.');
  }

  return resData;
}

/**
 * Fetch all student admission enquiries (Admin only)
 */
export async function getAllEnquiriesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enquiries`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to fetch enquiries.');
  }

  return resData;
}

/**
 * Update status of an enquiry (Admin only)
 */
export async function updateEnquiryStatusApi(enquiryId, status, token) {
  const response = await fetch(`${API_BASE_URL}/enquiries/${enquiryId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to update enquiry status.');
  }

  return resData;
}

/**
 * Delete an enquiry (Admin only)
 */
export async function deleteEnquiryApi(enquiryId, token) {
  const response = await fetch(`${API_BASE_URL}/enquiries/${enquiryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to delete enquiry.');
  }

  return resData;
}
