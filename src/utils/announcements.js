/**
 * Utilities for normalizing, sorting, and formatting Course & Institution Announcements
 * for the Aurum FX Staff Portal.
 */

/**
 * Format a date string or timestamp into a readable date & time.
 * e.g., "21 Oct 2026, 10:30 AM"
 * @param {string|number|Date} dateVal
 * @returns {string}
 */
export const formatAnnouncementDateTime = (dateVal) => {
  if (!dateVal) return 'Recently posted';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const dateFormatted = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return String(dateVal);
  }
};

/**
 * Get human-friendly relative time (e.g. "Just now", "15m ago", "2h ago", "Yesterday", "3d ago")
 * @param {string|number|Date} dateVal
 * @returns {string}
 */
export const getRelativeTimeAgo = (dateVal) => {
  if (!dateVal) return 'Recent';
  try {
    const d = new Date(dateVal);
    const time = d.getTime();
    if (isNaN(time)) return 'Recent';

    const now = Date.now();
    const diffSec = Math.floor((now - time) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Recent';
  }
};

/**
 * Check if announcement is considered new or unread based on existing data:
 * - If backend provides `is_read === false`, `unread === true`, or `is_new === true`
 * - Or if published within the last 48 hours
 * @param {Object} ann
 * @returns {boolean}
 */
export const isNewOrRecent = (ann) => {
  if (!ann) return false;
  if (ann.is_read === false || ann.unread === true || ann.is_new === true) {
    return true;
  }
  const dateVal = ann.created_at || ann.createdAt || ann.date;
  if (!dateVal) return false;
  try {
    const time = new Date(dateVal).getTime();
    if (isNaN(time)) return false;
    const diffHours = (Date.now() - time) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 48;
  } catch {
    return false;
  }
};

/**
 * Safely extracts a numeric timestamp from an announcement.
 * Missing or invalid dates return 0 so that valid dates are never treated as older than missing ones.
 * @param {Object} ann
 * @returns {number}
 */
export const getAnnouncementTimestamp = (ann) => {
  if (!ann) return 0;
  const rawDate =
    ann.created_at ||
    ann.createdAt ||
    ann.published_at ||
    ann.date ||
    ann.scheduled_event_time ||
    ann.event_time;
  if (!rawDate) return 0;

  try {
    const t = new Date(rawDate).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
};

/**
 * Normalize an announcement object from either Course Announcements or Institution Announcements.
 * Preserves all original properties while guaranteeing standard fields.
 * @param {Object} raw - Raw API announcement object
 * @param {'course'|'institution'} type - Source announcement type
 * @param {Object} [meta] - Context metadata (e.g. course title, branch name)
 * @returns {Object}
 */
export const normalizeAnnouncement = (raw, type, meta = {}) => {
  if (!raw) return null;
  const originalId = raw.id ?? raw.announcement_id ?? raw._id;
  const uniqueId = `${type}-${originalId ?? Math.random().toString(36).substring(2, 9)}`;

  const title = (raw.title || '').trim() || (type === 'course' ? 'Course Announcement' : 'Institution Notice');
  const message = raw.message || raw.content || '';

  const createdAt =
    raw.created_at ||
    raw.createdAt ||
    raw.published_at ||
    raw.date ||
    null;

  if (type === 'course') {
    const courseId = raw.course_id || meta.course_id || meta.id;
    const courseTitle =
      raw.course_title ||
      raw.course?.title ||
      meta.course_title ||
      meta.title ||
      (courseId ? `Course #${courseId}` : 'Assigned Course');

    const scheduledEventTime =
      raw.scheduled_event_time ||
      raw.event_time ||
      raw.exam_time ||
      raw.scheduled_time ||
      null;

    const publisher =
      raw.publisher ||
      raw.author ||
      raw.staff_name ||
      raw.creator_name ||
      raw.created_by_name ||
      'Course Faculty';

    return {
      ...raw,
      id: originalId,
      uniqueId,
      type: 'course',
      typeLabel: 'Course Announcement',
      title,
      message,
      created_at: createdAt,
      course_id: courseId,
      course_title: courseTitle,
      scheduled_event_time: scheduledEventTime,
      publisher,
      image: raw.image || null,
      audience: raw.audience || null,
    };
  }

  // Institutional Announcement
  const rawBranch = raw.branch_name || raw.branch?.name || meta.branch_name;
  const branchName =
    rawBranch && !rawBranch.toLowerCase().startsWith('branch #')
      ? rawBranch
      : null;

  const publisher =
    raw.publisher ||
    raw.author ||
    raw.created_by ||
    raw.admin_name ||
    (branchName ? `${branchName} Administration` : 'Central Administration');

  const audience = raw.audience || null;

  return {
    ...raw,
    id: originalId,
    uniqueId,
    type: 'institution',
    typeLabel: 'Institutional Announcement',
    title,
    message,
    created_at: createdAt,
    branch_name: branchName,
    branch_id: raw.branch_id || null,
    audience,
    publisher,
    image: raw.image || null,
    scheduled_event_time: raw.scheduled_event_time || null,
  };
};

/**
 * Sorts announcements newest first.
 * Treats missing dates as 0 so they are placed at the bottom, not top.
 * Secondary sort by numeric ID descending.
 * @param {Array} list
 * @returns {Array}
 */
export const sortAnnouncementsNewestFirst = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = getAnnouncementTimestamp(a);
    const timeB = getTimestampSafe(b);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const idA = Number(a?.id) || 0;
    const idB = Number(b?.id) || 0;
    return idB - idA;
  });
};

const getTimestampSafe = (ann) => {
  if (!ann) return 0;
  const rawDate =
    ann.created_at ||
    ann.createdAt ||
    ann.published_at ||
    ann.date ||
    ann.scheduled_event_time ||
    ann.event_time;
  if (!rawDate) return 0;
  try {
    const t = new Date(rawDate).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
};
