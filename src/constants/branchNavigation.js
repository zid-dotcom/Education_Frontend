import {
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  IndianRupee,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  UserRoundSearch,
  Users,
} from 'lucide-react';

/**
 * Exact 14 canonical keys required and returned by the backend:
 * - GET  /super-admin/branches/{branch_id}/sidebar-navigation
 * - PUT  /super-admin/branches/{branch_id}/sidebar-navigation
 * - GET  /branch-admin/sidebar-navigation
 */
export const CANONICAL_BACKEND_KEYS = [
  'dashboard',
  'courses',
  'staff',
  'staff_verification',
  'my_attendance',
  'register_student',
  'view_students',
  'course_enrolments',
  'course_approvals',
  'fees_due_students',
  'student_fees',
  'enquiries',
  'announcements',
  'messages',
];

/**
 * Bidirectional mapping between frontend menu IDs and canonical backend keys
 */
export const FRONTEND_ID_TO_BACKEND_KEY = {
  dashboard: 'dashboard',
  courses: 'courses',
  staff: 'staff',
  'staff-verification': 'staff_verification',
  attendance: 'my_attendance',
  registration: 'register_student',
  enrollments: 'view_students',
  'course-enrollments': 'course_enrolments',
  purchases: 'course_approvals',
  'fees-due': 'fees_due_students',
  fees: 'student_fees',
  enquiries: 'enquiries',
  announcements: 'announcements',
  messages: 'messages',
};

export const BACKEND_KEY_TO_FRONTEND_ID = Object.fromEntries(
  Object.entries(FRONTEND_ID_TO_BACKEND_KEY).map(([k, v]) => [v, k])
);

export const BRANCH_NAV_CONFIG = [
  {
    group: 'Workspace',
    description: 'Core operational tools for daily branch workflows and staff tracking',
    items: [
      {
        id: 'dashboard',
        backendKey: 'dashboard',
        label: 'Dashboard',
        description: 'Branch overview, quick stats, and performance metrics',
        icon: LayoutDashboard,
        path: '/branch-admin/dashboard',
      },
      {
        id: 'courses',
        backendKey: 'courses',
        label: 'Courses',
        description: 'Course catalog, syllabus, and course details',
        icon: BookOpen,
        path: '/branch-admin/courses',
      },
      {
        id: 'staff',
        backendKey: 'staff',
        label: 'Staff',
        description: 'Staff members directory, roles, and profiles',
        icon: UserPlus,
        path: '/branch-admin/staff',
      },
      {
        id: 'staff-verification',
        backendKey: 'staff_verification',
        label: 'Staff verification',
        description: 'Staff identity, certificates, and approval verification',
        icon: ShieldCheck,
        path: '/branch-admin/staff-verification',
      },
      {
        id: 'attendance',
        backendKey: 'my_attendance',
        label: 'My attendance',
        description: 'Branch administrator daily clock-in / clock-out attendance',
        icon: CalendarCheck,
        path: '/branch-admin/attendance',
      },
    ],
  },
  {
    group: 'Students',
    description: 'Student lifecycle, admissions, course approvals, and fee tracking',
    items: [
      {
        id: 'registration',
        backendKey: 'register_student',
        label: 'Register student',
        description: 'Direct student admission and onboarding form',
        icon: UserPlus,
        path: '/branch-admin/student-registration',
      },
      {
        id: 'enrollments',
        backendKey: 'view_students',
        label: 'View students',
        description: 'Directory of all registered students in the branch',
        icon: Users,
        path: '/branch-admin/enrollments',
      },
      {
        id: 'course-enrollments',
        backendKey: 'course_enrolments',
        label: 'Course enrollments',
        description: 'Individual student course enrollments and batch tracking',
        icon: UserRoundSearch,
        path: '/branch-admin/course-enrollments',
      },
      {
        id: 'purchases',
        backendKey: 'course_approvals',
        label: 'Course approvals',
        description: 'Review and approve online course purchase requests',
        icon: CheckCircle2,
        path: '/branch-admin/purchases',
      },
      {
        id: 'fees-due',
        backendKey: 'fees_due_students',
        label: 'Fees due students',
        description: 'List of students with pending or overdue installments',
        icon: IndianRupee,
        path: '/branch-admin/fees-due',
      },
      {
        id: 'fees',
        backendKey: 'student_fees',
        label: 'Student fees',
        description: 'Fee payment records, receipts, and branch profit summaries',
        icon: IndianRupee,
        path: '/branch-admin/profit',
      },
      {
        id: 'enquiries',
        backendKey: 'enquiries',
        label: 'Enquiries',
        description: 'Prospective student leads and enquiry tracking',
        icon: MessageCircle,
        path: '/branch-admin/enquiries',
      },
    ],
  },
  {
    group: 'Business',
    description: 'Branch communications, notifications, and direct messaging',
    items: [
      {
        id: 'announcements',
        backendKey: 'announcements',
        label: 'Announcements',
        description: 'Publish branch notices for students and staff',
        icon: Bell,
        path: '/branch-admin/announcements',
      },
      {
        id: 'messages',
        backendKey: 'messages',
        label: 'Messages',
        description: 'Real-time communication with students and branch staff',
        icon: MessageCircle,
        path: '/branch-admin/messages',
      },
    ],
  },
];

export const ALL_BRANCH_NAV_ITEMS = BRANCH_NAV_CONFIG.flatMap((g) => g.items);

/**
 * Returns default settings where all items are enabled (true)
 */
export const getDefaultNavSettings = () => {
  const defaults = {};
  CANONICAL_BACKEND_KEYS.forEach((key) => {
    defaults[key] = true;
  });
  // Also populate frontend IDs
  Object.entries(FRONTEND_ID_TO_BACKEND_KEY).forEach(([frontId, backKey]) => {
    defaults[frontId] = defaults[backKey];
  });
  return defaults;
};

/**
 * Normalizes any response format from GET APIs into a clean boolean map.
 * Supports:
 * - { nav_links: { key: boolean, ... } }           flat object inside nav_links
 * - { nav_links: [{ key, visible }, ...] }          array-of-objects inside nav_links
 * - { data: { nav_links: { ... } } }               nested under data
 * - { nav_links: "{...}" }                          JSON string
 * - [{ key, visible }, ...]                         root-level array of objects
 * - Raw flat object { dashboard: false, ... }       plain dictionary
 * Maps both canonical keys and frontend IDs so any consumer can look up by either.
 */
export const normalizeNavSettings = (apiResponse) => {
  if (!apiResponse) {
    return getDefaultNavSettings();
  }

  let source = apiResponse;

  // Unwrap root-level array (e.g. [{ key, visible }, ...] OR [{ nav_links: {...} }])
  if (Array.isArray(source)) {
    // If it looks like an array of { key, visible } objects, handle directly
    if (source.length > 0 && source[0] !== null && typeof source[0] === 'object' && 'key' in source[0] && 'visible' in source[0]) {
      return _normalizeFromKeyVisibleArray(source);
    }
    source = source[0] || {};
  }

  if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) {
    source = source.data;
  }

  let rawLinks = source;
  if (source.nav_links !== undefined && source.nav_links !== null) {
    rawLinks = source.nav_links;
  }

  if (typeof rawLinks === 'string') {
    try {
      rawLinks = JSON.parse(rawLinks);
    } catch {
      rawLinks = {};
    }
  }

  // Handle array-of-objects format: [{ key: 'dashboard', visible: false }, ...]
  if (Array.isArray(rawLinks)) {
    if (rawLinks.length > 0 && rawLinks[0] !== null && typeof rawLinks[0] === 'object' && 'key' in rawLinks[0]) {
      return _normalizeFromKeyVisibleArray(rawLinks);
    }
    // Unknown array format — fall back to empty
    rawLinks = {};
  }

  if (!rawLinks || typeof rawLinks !== 'object') {
    rawLinks = {};
  }

  const normalized = {};

  CANONICAL_BACKEND_KEYS.forEach((canonicalKey) => {
    let val = rawLinks[canonicalKey];

    if (val === undefined || val === null) {
      const legacyId = BACKEND_KEY_TO_FRONTEND_ID[canonicalKey];
      if (legacyId) val = rawLinks[legacyId];
    }

    if (val === undefined || val === null) {
      val = source[canonicalKey];
      if (val === undefined || val === null) {
        const legacyId = BACKEND_KEY_TO_FRONTEND_ID[canonicalKey];
        if (legacyId) val = source[legacyId];
      }
    }

    // Explicit check for disabled states: boolean false, string "false", 0, "0", "off"
    if (val === false || val === 'false' || val === 0 || val === '0' || val === 'off') {
      normalized[canonicalKey] = false;
    } else if (val === true || val === 'true' || val === 1 || val === '1' || val === 'on') {
      normalized[canonicalKey] = true;
    } else {
      // Default enabled if key is completely absent
      normalized[canonicalKey] = true;
    }
  });

  // Populate frontend menu IDs as well so lookups by item.id work identically
  Object.entries(FRONTEND_ID_TO_BACKEND_KEY).forEach(([frontId, backKey]) => {
    normalized[frontId] = normalized[backKey];
  });

  return normalized;
};

/**
 * Internal helper: converts [{ key: 'dashboard', visible: false }, ...] into a normalized map.
 */
function _normalizeFromKeyVisibleArray(arr) {
  // Build a lookup from the array
  const lookup = {};
  arr.forEach((item) => {
    if (item && typeof item === 'object' && item.key) {
      // visible may be boolean, 0/1, string "true"/"false"
      const v = item.visible;
      lookup[item.key] =
        v === false || v === 'false' || v === 0 || v === '0' || v === 'off'
          ? false
          : true;
    }
  });

  const normalized = {};
  CANONICAL_BACKEND_KEYS.forEach((canonicalKey) => {
    let val = lookup[canonicalKey];
    if (val === undefined || val === null) {
      // Try frontend alias
      const legacyId = BACKEND_KEY_TO_FRONTEND_ID[canonicalKey];
      if (legacyId) val = lookup[legacyId];
    }
    // If still unknown, default to true (fully absent key)
    normalized[canonicalKey] = val === false ? false : true;
  });

  Object.entries(FRONTEND_ID_TO_BACKEND_KEY).forEach(([frontId, backKey]) => {
    normalized[frontId] = normalized[backKey];
  });

  return normalized;
}

/**
 * Prepares the payload for PUT request.
 * Contains ONLY the 14 canonical backend keys with strict boolean true/false values.
 */
export const sanitizeNavLinksForBackend = (rawSettings = {}) => {
  const sanitized = {};
  CANONICAL_BACKEND_KEYS.forEach((canonicalKey) => {
    let val = rawSettings[canonicalKey];

    if (val === undefined || val === null) {
      const legacyId = BACKEND_KEY_TO_FRONTEND_ID[canonicalKey];
      if (legacyId) val = rawSettings[legacyId];
    }

    if (val === false || val === 'false' || val === 0 || val === '0' || val === 'off') {
      sanitized[canonicalKey] = false;
    } else {
      sanitized[canonicalKey] = true;
    }
  });
  return sanitized;
};
