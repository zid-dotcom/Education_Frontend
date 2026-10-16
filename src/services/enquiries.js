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
    let errorMessage = 'Failed to submit enquiry.';
    if (resData.detail) {
      if (Array.isArray(resData.detail)) {
        errorMessage = resData.detail.map(d => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`).join(', ');
      } else if (typeof resData.detail === 'string') {
        errorMessage = resData.detail;
      }
    }
    throw new Error(errorMessage);
  }

  return resData;
}

export async function getBranchAdminEnquiriesApi(token) {
  const response = await fetch(`${API_BASE_URL}/enquiries/branch-admin`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  const resData = await response.json();
  
  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to fetch enquiries.');
  }
  
  return resData;
}

/**
 * Mark a branch admin enquiry as read
 */
export async function markBranchAdminEnquiryReadApi(enquiryId, token) {
  const response = await fetch(`${API_BASE_URL}/enquiries/branch-admin/${enquiryId}/read`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = resData?.detail || 'Failed to mark enquiry as read.';
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return resData;
}
