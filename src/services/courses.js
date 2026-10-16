const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
import { getPublicBranchesWithCoursesApi } from './branches';

export function getCourseImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  return `${API_BASE_URL.replace(/\/$/, '')}/${imagePath.replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

/**
 * Fetch all active courses
 */
export async function getAllCoursesApi() {
  try {
    const branches = await getPublicBranchesWithCoursesApi();
    const courseMap = new Map();
    if (Array.isArray(branches)) {
      branches.forEach((branch) => {
        if (Array.isArray(branch.courses)) {
          branch.courses.forEach((course) => {
            if (!courseMap.has(course.id)) {
              courseMap.set(course.id, {
                ...course,
                branch_id: branch.id,
                branch_name: branch.name,
              });
            }
          });
        }
      });
    }
    return Array.from(courseMap.values());
  } catch (err) {
    console.warn('Failed to fetch public branches with courses in getAllCoursesApi:', err);
    return [];
  }
}

/**
 * Fetch single course by ID
 */
export async function getCourseByIdApi(courseId) {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData.detail || 'Course not found.');
  }

  return resData;
}

