import {
  Activity,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  IndianRupee,
  LayoutDashboard,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Star,
  UserPlus,
  UserRoundSearch,
  Users,
} from 'lucide-react';

/**
 * 19 canonical keys representing the full Branch Admin sidebar navigation:
 * - Overview: Dashboard
 * - Courses: Courses, Course enrollments, Course approvals, Course reviews
 * - Students: Register student, View students, Fees due students, Enquiries
 * - Staff: Staff, All staffs, Staff verification, Staff monitoring, My attendance
 * - Finance: Branch Revenue, Student Receipts, Branch expenses
 * - Communication: Announcements, Messages
 */
export const CANONICAL_BACKEND_KEYS = [
  'dashboard',
  'courses',
  'course_enrolments',
  'course_approvals',
  'course_reviews',
  'register_student',
  'view_students',
  'fees_due_students',
  'enquiries',
  'staff',
  'all_staff',
  'staff_verification',
  'staff_monitoring',
  'my_attendance',
  'student_fees',
  'receipts',
  'expenses',
  'announcements',
  'messages',
];

/**
 * Bidirectional mapping between frontend menu IDs and canonical backend keys
 */
export const FRONTEND_ID_TO_BACKEND_KEY = {
  dashboard: 'dashboard',
  courses: 'courses',
  'course-enrollments': 'course_enrolments',
  purchases: 'course_approvals',
  reviews: 'course_reviews',
  registration: 'register_student',
  enrollments: 'view_students',
  'fees-due': 'fees_due_students',
  enquiries: 'enquiries',
  staff: 'staff',
  'all-staff': 'all_staff',
  'staff-verification': 'staff_verification',
  'staff-monitoring': 'staff_monitoring',
  attendance: 'my_attendance',
  fees: 'student_fees',
  receipts: 'receipts',
  expenses: 'expenses',
  announcements: 'announcements',
  messages: 'messages',
};

export const BACKEND_KEY_TO_FRONTEND_ID = Object.fromEntries(
  Object.entries(FRONTEND_ID_TO_BACKEND_KEY).map(([k, v]) => [v, k])
);

/**
 * Alternate naming aliases to maintain 100% interoperability with any backend API version
 */
export const BACKEND_ALIASES = {
  course_reviews: ['reviews', 'course_review', 'course_reviews', 'review'],
  all_staff: ['all-staff', 'all_staff', 'all_staffs', 'allstaff'],
  staff_monitoring: ['staff-monitoring', 'staff_monitoring', 'staffmonitoring', 'monitoring'],
  expenses: ['expenses', 'branch_expenses', 'branch_expense', 'expense'],
  receipts: ['receipts', 'student_receipts', 'receipt'],
  student_fees: ['fees', 'student_fees', 'profit', 'branch_revenue', 'revenue'],
  course_enrolments: ['course-enrollments', 'course_enrolments', 'course_enrollments'],
  course_approvals: ['purchases', 'course_approvals', 'course_approval', 'approvals'],
  register_student: ['registration', 'register_student'],
  view_students: ['enrollments', 'view_students', 'all_students'],
  fees_due_students: ['fees-due', 'fees_due_students', 'due_students'],
  my_attendance: ['attendance', 'my_attendance'],
  staff_verification: ['staff-verification', 'staff_verification'],
};

export const BRANCH_NAV_CONFIG = [
  {
    group: 'Overview',
    description: 'Branch overview, quick stats, and performance metrics',
    items: [
      {
        id: 'dashboard',
        backendKey: 'dashboard',
        label: 'Dashboard',
        description: 'Branch overview, quick stats, and performance metrics',
        icon: LayoutDashboard,
        path: '/branch-admin/dashboard',
      },
    ],
  },
  {
    group: 'Courses',
    description: 'Course catalog, student enrollments, purchase approvals, and reviews',
    items: [
      {
        id: 'courses',
        backendKey: 'courses',
        label: 'Courses',
        description: 'Course catalog, syllabus, and course details',
        icon: BookOpen,
        path: '/branch-admin/courses',
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
        id: 'reviews',
        backendKey: 'course_reviews',
        label: 'Course reviews',
        description: 'Student course ratings, feedback, and testimonials',
        icon: Star,
        path: '/branch-admin/reviews',
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
        id: 'fees-due',
        backendKey: 'fees_due_students',
        label: 'Fees due students',
        description: 'List of students with pending or overdue installments',
        icon: IndianRupee,
        path: '/branch-admin/fees-due',
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
    group: 'Staff',
    description: 'Staff directory, monitoring, verification, and daily attendance',
    items: [
      {
        id: 'staff',
        backendKey: 'staff',
        label: 'Staff',
        description: 'Staff members directory, roles, and profiles',
        icon: UserPlus,
        path: '/branch-admin/staff',
      },
      {
        id: 'all-staff',
        backendKey: 'all_staff',
        label: 'All staffs',
        description: 'Comprehensive staff directory and roster management',
        icon: Users,
        path: '/branch-admin/all-staff',
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
        id: 'staff-monitoring',
        backendKey: 'staff_monitoring',
        label: 'Staff monitoring',
        description: 'Real-time staff activity, work sessions, and task monitoring',
        icon: Activity,
        path: '/branch-admin/staff-monitoring',
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
    group: 'Finance',
    description: 'Branch revenue, tuition receipts, and operational expenditures',
    items: [
      {
        id: 'fees',
        backendKey: 'student_fees',
        label: 'Branch Revenue',
        description: 'Fee payment records, receipts, and branch profit summaries',
        icon: IndianRupee,
        path: '/branch-admin/profit',
      },
      {
        id: 'receipts',
        backendKey: 'receipts',
        label: 'Student Receipts',
        description: 'Official fee payment receipts and tuition vouchers',
        icon: Receipt,
        path: '/branch-admin/receipts',
      },
      {
        id: 'expenses',
        backendKey: 'expenses',
        label: 'Branch expenses',
        description: 'Branch daily expenditures, operational costs, and utility bills',
        icon: IndianRupee,
        path: '/branch-admin/expenses',
      },
    ],
  },
  {
    group: 'Communication',
    description: 'Branch communications, broadcast notices, and direct messaging',
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
 * Maps both canonical keys, frontend IDs, and aliases so any consumer can look up by either.
 */
export const normalizeNavSettings = (apiResponse) => {
  if (!apiResponse) {
    return getDefaultNavSettings();
  }

  let source = apiResponse;

  // Unwrap root-level array (e.g. [{ key, visible }, ...] OR [{ nav_links: {...} }])
  if (Array.isArray(source)) {
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
      const aliases = BACKEND_ALIASES[canonicalKey] || [];
      for (const alias of aliases) {
        if (rawLinks[alias] !== undefined && rawLinks[alias] !== null) {
          val = rawLinks[alias];
          break;
        }
      }
    }

    if (val === undefined || val === null) {
      val = source[canonicalKey];
      if (val === undefined || val === null) {
        const legacyId = BACKEND_KEY_TO_FRONTEND_ID[canonicalKey];
        if (legacyId) val = source[legacyId];
      }
      if (val === undefined || val === null) {
        const aliases = BACKEND_ALIASES[canonicalKey] || [];
        for (const alias of aliases) {
          if (source[alias] !== undefined && source[alias] !== null) {
            val = source[alias];
            break;
          }
        }
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

  // Populate aliases for maximum compatibility
  Object.entries(BACKEND_ALIASES).forEach(([backKey, aliases]) => {
    aliases.forEach((alias) => {
      if (normalized[alias] === undefined) {
        normalized[alias] = normalized[backKey];
      }
    });
  });

  return normalized;
};

/**
 * Internal helper: converts [{ key: 'dashboard', visible: false }, ...] into a normalized map.
 */
function _normalizeFromKeyVisibleArray(arr) {
  const lookup = {};
  arr.forEach((item) => {
    if (item && typeof item === 'object' && item.key) {
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
      const legacyId = BACKEND_KEY_TO_FRONTEND_ID[canonicalKey];
      if (legacyId) val = lookup[legacyId];
    }
    if (val === undefined || val === null) {
      const aliases = BACKEND_ALIASES[canonicalKey] || [];
      for (const alias of aliases) {
        if (lookup[alias] !== undefined && lookup[alias] !== null) {
          val = lookup[alias];
          break;
        }
      }
    }
    normalized[canonicalKey] = val === false ? false : true;
  });

  Object.entries(FRONTEND_ID_TO_BACKEND_KEY).forEach(([frontId, backKey]) => {
    normalized[frontId] = normalized[backKey];
  });

  Object.entries(BACKEND_ALIASES).forEach(([backKey, aliases]) => {
    aliases.forEach((alias) => {
      if (normalized[alias] === undefined) {
        normalized[alias] = normalized[backKey];
      }
    });
  });

  return normalized;
}

/**
 * Prepares the payload for PUT request.
 * Contains all 19 canonical backend keys with strict boolean true/false values,
 * plus mirrored alias keys so any backend API schema accepts and saves them.
 */
export const sanitizeNavLinksForBackend = (rawSettings = {}) => {
  const sanitized = {};
  CANONICAL_BACKEND_KEYS.forEach((canonicalKey) => {
    let val = rawSettings[canonicalKey];

    if (val === undefined || val === null) {
      const legacyId = BACKEND_KEY_TO_FRONTEND_ID[canonicalKey];
      if (legacyId) val = rawSettings[legacyId];
    }

    if (val === undefined || val === null) {
      const aliases = BACKEND_ALIASES[canonicalKey] || [];
      for (const alias of aliases) {
        if (rawSettings[alias] !== undefined && rawSettings[alias] !== null) {
          val = rawSettings[alias];
          break;
        }
      }
    }

    if (val === false || val === 'false' || val === 0 || val === '0' || val === 'off') {
      sanitized[canonicalKey] = false;
    } else {
      sanitized[canonicalKey] = true;
    }
  });

  // Mirror common backend alias keys in the payload to ensure 100% backend compatibility
  if (sanitized.course_reviews !== undefined) {
    sanitized.reviews = sanitized.course_reviews;
    sanitized.course_review = sanitized.course_reviews;
  }
  if (sanitized.all_staff !== undefined) {
    sanitized['all-staff'] = sanitized.all_staff;
    sanitized.all_staffs = sanitized.all_staff;
  }
  if (sanitized.staff_monitoring !== undefined) {
    sanitized['staff-monitoring'] = sanitized.staff_monitoring;
  }
  if (sanitized.expenses !== undefined) {
    sanitized.branch_expenses = sanitized.expenses;
  }
  if (sanitized.receipts !== undefined) {
    sanitized.student_receipts = sanitized.receipts;
  }
  if (sanitized.student_fees !== undefined) {
    sanitized.branch_revenue = sanitized.student_fees;
    sanitized.profit = sanitized.student_fees;
  }

  return sanitized;
};
