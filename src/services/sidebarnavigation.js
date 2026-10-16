import {
  sanitizeNavLinksForBackend,
  normalizeNavSettings,
} from '../constants/branchNavigation';

export { normalizeNavSettings };

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const parseResponse = async (response, fallbackMessage) => {
  let resData;
  try {
    resData = await response.json();
  } catch {
    resData = null;
  }

  if (!response.ok) {
    const detail = resData?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
      : typeof detail === 'string'
      ? detail
      : fallbackMessage;
    throw new Error(message || fallbackMessage);
  }

  return resData;
};

/**
 * Super Admin: Fetch sidebar navigation settings for a specific branch.
 * GET /super-admin/branches/{branch_id}/sidebar-navigation
 */
export async function getBranchSidebarNavigationApi(branchId, token) {
  if (!branchId) throw new Error('Branch ID is required.');
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/${branchId}/sidebar-navigation`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) {
    return { branch_id: Number(branchId), nav_links: {} };
  }

  return parseResponse(response, 'Failed to fetch branch navigation settings.');
}

/**
 * Super Admin: Save/update sidebar navigation visibility settings for a branch.
 * PUT /super-admin/branches/{branch_id}/sidebar-navigation
 * Payload: { "nav_links": { [key: string]: boolean } }
 */
export async function updateBranchSidebarNavigationApi(branchId, navLinks, token) {
  if (!branchId) throw new Error('Branch ID is required.');
  const sanitizedNavLinks = sanitizeNavLinksForBackend(navLinks);
  const response = await fetch(`${API_BASE_URL}/super-admin/branches/${branchId}/sidebar-navigation`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify({ nav_links: sanitizedNavLinks }),
  });

  return parseResponse(response, 'Failed to update branch navigation settings.');
}

/**
 * Branch Admin: Fetch sidebar navigation settings for the logged-in branch.
 * GET /branch-admin/sidebar-navigation
 */
export async function getMyBranchSidebarNavigationApi(token) {
  const response = await fetch(`${API_BASE_URL}/branch-admin/sidebar-navigation`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) {
    return { nav_links: {} };
  }

  return parseResponse(response, 'Failed to fetch branch navigation settings.');
}

/**
 * Helper to normalize nav settings into a key-value boolean dictionary
 */
export function extractNavLinks(data) {
  return normalizeNavSettings(data);
}
