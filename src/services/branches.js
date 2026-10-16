const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getPublicBranchesWithCoursesApi() {
  const response = await fetch(`${API_BASE_URL}/branches/public-with-courses`, {
    headers: { Accept: 'application/json' },
  });
  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Failed to fetch branches and courses.');
  }

  return resData;
}