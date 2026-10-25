import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import {
  getSuperAdminStaffVerificationPendingApi,
  getSuperAdminStaffVerificationApprovedApi,
  getSuperAdminStaffVerificationRejectedApi,
  approveSuperAdminStaffVerificationApi,
  rejectSuperAdminStaffVerificationApi,
} from '../services/superadminstaffverification';
import {
  getSuperAdminStaffBranchesApi,
  getSuperAdminBranchStaffApi,
} from '../services/superadmin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getDocumentFileUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (typeof pathOrUrl !== 'string') return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = pathOrUrl.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
};

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById('sa-verification-fonts')) return;
    const link = document.createElement('link');
    link.id = 'sa-verification-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const PAGE_CSS = `
@keyframes sa-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sa-fade { from { opacity: 0; } to { opacity: 1; } }
.sa-rise  { opacity: 0; animation: sa-rise .45s cubic-bezier(.2,.7,.2,1) forwards; }
.sa-fade  { animation: sa-fade .35s ease both; }
.sa-card  { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.sa-card:hover { border-color: #d9cdb5; box-shadow: 0 12px 30px -16px rgba(23,20,15,.2); }
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatDate = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return value;
  }
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return value;
  }
};

const formatRole = (role) => {
  if (!role) return 'Super Admin';
  const str = String(role).replace(/_/g, ' ').trim();
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getStoredAdminName = (fallbackRole = 'Super Admin') => {
  try {
    const superItem = localStorage.getItem('superAdminUser');
    if (superItem) {
      const p = JSON.parse(superItem);
      if (p?.name || p?.full_name) return p.name || p.full_name;
    }
    const branchItem = localStorage.getItem('branchAdminUser');
    if (branchItem) {
      const p = JSON.parse(branchItem);
      if (p?.name || p?.full_name) return p.name || p.full_name;
    }
  } catch {}
  return fallbackRole;
};

const getStaffId = (staff) => {
  if (!staff) return null;
  if (staff.staff_id !== undefined && staff.staff_id !== null && staff.staff_id !== '') return staff.staff_id;
  if (staff.id !== undefined && staff.id !== null && staff.id !== '') return staff.id;
  if (staff.staff?.staff_id !== undefined && staff.staff?.staff_id !== null && staff.staff?.staff_id !== '') return staff.staff.staff_id;
  if (staff.staff?.id !== undefined && staff.staff?.id !== null && staff.staff?.id !== '') return staff.staff.id;
  if (staff.user_id !== undefined && staff.user_id !== null && staff.user_id !== '') return staff.user_id;
  if (staff.staffId !== undefined && staff.staffId !== null && staff.staffId !== '') return staff.staffId;
  if (staff.faculty_id !== undefined && staff.faculty_id !== null && staff.faculty_id !== '') return staff.faculty_id;
  if (staff.documents?.staff_id !== undefined && staff.documents?.staff_id !== null && staff.documents?.staff_id !== '') return staff.documents.staff_id;
  if (staff.documents?.id !== undefined && staff.documents?.id !== null && staff.documents?.id !== '') return staff.documents.id;
  if (staff.staff_code) {
    const match = String(staff.staff_code).match(/STF-(?:(\d+)-)?(\d+)/i) || String(staff.staff_code).match(/STF-(\d+)/i);
    if (match && match[match.length - 1]) return Number(match[match.length - 1]);
  }
  return null;
};

const extractReviewerInfo = (item, staffObj = {}, docObj = {}, targetStatus = '') => {
  if (!item) {
    return {
      reviewer_name: '',
      reviewer_role: '',
      reviewer_email: '',
      reviewer_id: '',
      reviewed_at: null,
      approved_at: null,
      rejected_at: null,
    };
  }

  // 1. Timestamps from API
  const approvedAt =
    item.verification_approved_at ||
    staffObj.verification_approved_at ||
    docObj.verification_approved_at ||
    item.approved_at ||
    item.approval_date ||
    item.approved_on ||
    staffObj.approved_at ||
    docObj.approved_at ||
    null;

  const rejectedAt =
    item.verification_rejected_at ||
    staffObj.verification_rejected_at ||
    docObj.verification_rejected_at ||
    item.rejected_at ||
    item.rejection_date ||
    item.rejected_on ||
    staffObj.rejected_at ||
    docObj.rejected_at ||
    null;

  const reviewedAt =
    approvedAt ||
    rejectedAt ||
    item.reviewed_at ||
    item.decision_at ||
    item.verified_at ||
    item.action_at ||
    item.verification_submitted_at ||
    staffObj.reviewed_at ||
    staffObj.verified_at ||
    docObj.reviewed_at ||
    item.updated_at ||
    item.created_at ||
    null;

  // Determine status to prioritize the proper reviewer object
  const statusStr = String(
    targetStatus ||
    item.verification_status ||
    item.status ||
    staffObj.verification_status ||
    staffObj.status ||
    ''
  ).toLowerCase().trim();

  const isApproved = statusStr.includes('approve') || statusStr === 'verified';
  const isRejected = statusStr.includes('reject');

  // Backend reviewer objects
  const approvedByObj =
    item.verification_approved_by ||
    staffObj.verification_approved_by ||
    docObj.verification_approved_by ||
    item.approved_by ||
    staffObj.approved_by ||
    docObj.approved_by;

  const rejectedByObj =
    item.verification_rejected_by ||
    staffObj.verification_rejected_by ||
    docObj.verification_rejected_by ||
    item.rejected_by ||
    staffObj.rejected_by ||
    docObj.rejected_by;

  const primaryReviewer = isApproved
    ? approvedByObj
    : isRejected
    ? rejectedByObj
    : (approvedByObj || rejectedByObj);

  const sources = [
    primaryReviewer,
    isApproved ? null : approvedByObj,
    isRejected ? null : rejectedByObj,
    item.reviewed_by,
    item.reviewer,
    item.decision_by,
    item.decision_maker,
    item.decided_by,
    item.verified_by,
    item.action_by,
    item.reviewed_user,
    item.super_admin,
    item.branch_admin,
    item.admin,
    item.decision,
    staffObj.reviewed_by,
    staffObj.reviewer,
    staffObj.decision_by,
    staffObj.decision_maker,
    staffObj.verified_by,
    docObj.reviewed_by,
    docObj.reviewer,
  ].filter(Boolean);

  let reviewerName =
    (isApproved ? (item.approved_by_name || staffObj.approved_by_name) : '') ||
    (isRejected ? (item.rejected_by_name || staffObj.rejected_by_name) : '') ||
    item.reviewer_name ||
    item.reviewed_by_name ||
    item.decision_maker_name ||
    item.decision_by_name ||
    item.verified_by_name ||
    item.super_admin_name ||
    item.branch_admin_name ||
    item.admin_name ||
    staffObj.reviewer_name ||
    staffObj.reviewed_by_name ||
    '';

  let reviewerRole =
    (isApproved ? (item.approved_by_role || staffObj.approved_by_role) : '') ||
    (isRejected ? (item.rejected_by_role || staffObj.rejected_by_role) : '') ||
    item.reviewer_role ||
    item.reviewed_by_role ||
    item.decision_maker_role ||
    item.approver_role ||
    item.verifier_role ||
    staffObj.reviewer_role ||
    staffObj.reviewed_by_role ||
    '';

  let reviewerEmail =
    item.reviewer_email ||
    item.reviewed_by_email ||
    staffObj.reviewer_email ||
    staffObj.reviewed_by_email ||
    '';

  let reviewerId =
    (isApproved ? (item.approved_by_id || staffObj.approved_by_id) : '') ||
    (isRejected ? (item.rejected_by_id || staffObj.rejected_by_id) : '') ||
    item.reviewer_id ||
    item.reviewed_by_id ||
    staffObj.reviewer_id ||
    '';

  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'string') {
      const trimmed = src.trim();
      if (trimmed && isNaN(Number(trimmed)) && !reviewerName) {
        reviewerName = trimmed;
      }
    } else if (typeof src === 'object') {
      if (!reviewerName) {
        reviewerName =
          src.name ||
          src.full_name ||
          (src.first_name ? `${src.first_name} ${src.last_name || ''}`.trim() : '') ||
          src.username ||
          src.admin_name ||
          src.user?.name ||
          src.user?.full_name ||
          '';
      }
      if (!reviewerRole) {
        reviewerRole = src.role || src.designation || src.user_type || '';
      }
      if (!reviewerEmail) {
        reviewerEmail = src.email || src.user?.email || '';
      }
      if (!reviewerId) {
        reviewerId = src.id || src.user_id || '';
      }
    }
  }

  // Fallback defaults for approved/rejected records if backend has null reviewer
  if (!reviewerName && (isApproved || isRejected)) {
    reviewerName = 'Admin';
  }
  if (!reviewerRole && (isApproved || isRejected)) {
    reviewerRole = 'super_admin';
  }

  return {
    reviewer_name: reviewerName,
    reviewer_role: reviewerRole,
    reviewer_email: reviewerEmail,
    reviewer_id: reviewerId,
    reviewed_at: reviewedAt,
    approved_at: approvedAt || reviewedAt,
    rejected_at: rejectedAt || reviewedAt,
  };
};

const normalizeStaffRecord = (item, defaultStatus = 'pending', branches = [], branchStaffMap = {}) => {
  if (!item) return null;

  const staffObj = item.staff || item.user || {};
  const docObj = item.documents || item.kyc || item.document || {};

  const id =
    getStaffId(item) ||
    getStaffId(staffObj) ||
    item.staff_id ||
    item.id ||
    staffObj.staff_id ||
    staffObj.id;

  const rawStatus = String(
    item.verification_status ||
    item.status ||
    staffObj.verification_status ||
    staffObj.status ||
    (item.is_verified ? 'approved' : '') ||
    defaultStatus
  ).toLowerCase().trim();

  let status = defaultStatus;
  if (rawStatus.includes('approve') || rawStatus === 'verified' || item.is_verified === true) {
    status = 'approved';
  } else if (rawStatus.includes('reject')) {
    status = 'rejected';
  } else {
    status = 'pending';
  }

  const name =
    item.name ||
    staffObj.name ||
    item.full_name ||
    staffObj.full_name ||
    item.staff_name ||
    'Unnamed Faculty';

  const email = item.email || staffObj.email || '';
  const phone = item.phone || staffObj.phone || item.mobile || staffObj.mobile || '';
  const staffCode = item.staff_code || staffObj.staff_code || item.code || (id ? `STF-${String(id).padStart(3, '0')}` : '');
  const role = item.role || item.designation || staffObj.role || staffObj.designation || 'Faculty';

  // --- BRANCH RESOLUTION ---
  let branchId =
    item.branch_id ??
    item.branchId ??
    staffObj.branch_id ??
    staffObj.branchId ??
    docObj.branch_id ??
    docObj.branchId;

  if (!branchId && item.branch !== undefined && item.branch !== null) {
    if (typeof item.branch === 'number') branchId = item.branch;
    else if (typeof item.branch === 'object' && (item.branch.branch_id || item.branch.id)) branchId = item.branch.branch_id || item.branch.id;
    else if (typeof item.branch === 'string' && !isNaN(Number(item.branch)) && item.branch.trim() !== '') branchId = Number(item.branch);
  }

  if (!branchId && staffObj.branch !== undefined && staffObj.branch !== null) {
    if (typeof staffObj.branch === 'number') branchId = staffObj.branch;
    else if (typeof staffObj.branch === 'object' && (staffObj.branch.branch_id || staffObj.branch.id)) branchId = staffObj.branch.branch_id || staffObj.branch.id;
    else if (typeof staffObj.branch === 'string' && !isNaN(Number(staffObj.branch)) && staffObj.branch.trim() !== '') branchId = Number(staffObj.branch);
  }

  // Check staffCode pattern: STF-{branch_id}-{unique_hash}
  if (!branchId && staffCode) {
    const codeMatch = String(staffCode).match(/^STF-(\d+)-/i);
    if (codeMatch && codeMatch[1]) {
      branchId = Number(codeMatch[1]);
    }
  }

  // Check from branchStaffMap
  const fromMap =
    (id && branchStaffMap[`id_${id}`]) ||
    (staffCode && branchStaffMap[`code_${String(staffCode).toLowerCase()}`]) ||
    (email && branchStaffMap[`email_${String(email).toLowerCase()}`]);

  if (!branchId && fromMap?.branch_id) {
    branchId = fromMap.branch_id;
  }

  // Branch Name resolution
  let branchName =
    item.branch_name ||
    item.branch_title ||
    staffObj.branch_name ||
    staffObj.branch_title ||
    docObj.branch_name ||
    (typeof item.branch === 'object' ? (item.branch.branch_name || item.branch.name) : '') ||
    (typeof staffObj.branch === 'object' ? (staffObj.branch.branch_name || staffObj.branch.name) : '') ||
    '';

  if (!branchName && fromMap?.branch_name) {
    branchName = fromMap.branch_name;
  }

  // Look up branchName from branches list if we have branchId
  if (!branchName && branchId && Array.isArray(branches) && branches.length > 0) {
    const foundBranch = branches.find((b) => String(b.id ?? b.branch_id) === String(branchId));
    if (foundBranch) {
      branchName = foundBranch.name || foundBranch.branch_name || '';
    }
  }

  // If we have branchName but no branchId, look up in branches
  if (!branchId && branchName && Array.isArray(branches) && branches.length > 0) {
    const foundBranch = branches.find(
      (b) => (b.name || b.branch_name || '').toLowerCase().trim() === branchName.toLowerCase().trim()
    );
    if (foundBranch) {
      branchId = foundBranch.id ?? foundBranch.branch_id;
    }
  }

  // Salary
  const salary =
    item.salary ??
    staffObj.salary ??
    item.staff_salary ??
    docObj.salary ??
    fromMap?.salary ??
    '';

  // Course Details
  const courseList = Array.isArray(item.courses)
    ? item.courses
    : Array.isArray(staffObj.courses)
    ? staffObj.courses
    : [];
  const firstCourse = courseList[0] || {};

  const courseName =
    firstCourse.course_title ||
    firstCourse.name ||
    firstCourse.title ||
    item.course_name ||
    item.course?.name ||
    item.course?.title ||
    staffObj.course_name ||
    staffObj.course?.name ||
    staffObj.course?.title ||
    item.course_title ||
    fromMap?.course_name ||
    '';

  const courseId =
    firstCourse.course_id ||
    firstCourse.id ||
    item.course_id ||
    item.course?.id ||
    staffObj.course_id ||
    staffObj.course?.id ||
    fromMap?.course_id ||
    '';

  // Address
  const address =
    item.address ||
    staffObj.address ||
    item.location ||
    staffObj.location ||
    fromMap?.address ||
    '';

  const aadhaarNumber =
    item.aadhaar_number ||
    docObj.aadhaar_number ||
    staffObj.aadhaar_number ||
    '';

  const panNumber =
    item.pan_number ||
    docObj.pan_number ||
    staffObj.pan_number ||
    '';

  const bankAccount =
    item.bank_account_number ||
    docObj.bank_account_number ||
    item.account_number ||
    staffObj.bank_account_number ||
    '';

  const bankIfsc =
    item.bank_ifsc ||
    docObj.bank_ifsc ||
    item.ifsc ||
    item.ifsc_code ||
    staffObj.bank_ifsc ||
    '';

  const bankName =
    item.bank_name ||
    docObj.bank_name ||
    staffObj.bank_name ||
    '';

  const rejectionReason =
    item.verification_rejection_reason ||
    staffObj.verification_rejection_reason ||
    docObj.verification_rejection_reason ||
    item.rejection_reason ||
    item.reason ||
    item.remarks ||
    docObj.rejection_reason ||
    staffObj.rejection_reason ||
    '';

  const documents = {
    aadhaar_front_url:
      item.aadhaar_front_url ||
      item.aadhaar_front ||
      docObj.aadhaar_front_url ||
      docObj.aadhaar_front ||
      staffObj.aadhaar_front_url ||
      staffObj.aadhaar_front,
    aadhaar_back_url:
      item.aadhaar_back_url ||
      item.aadhaar_back ||
      docObj.aadhaar_back_url ||
      docObj.aadhaar_back ||
      staffObj.aadhaar_back_url ||
      staffObj.aadhaar_back,
    pan_card_url:
      item.pan_card_url ||
      item.pan_card ||
      docObj.pan_card_url ||
      docObj.pan_card ||
      staffObj.pan_card_url ||
      staffObj.pan_card,
    bank_passbook_url:
      item.bank_passbook_url ||
      item.bank_passbook ||
      docObj.bank_passbook_url ||
      docObj.bank_passbook ||
      staffObj.bank_passbook_url ||
      staffObj.bank_passbook,
    other_document_url:
      item.other_document_url ||
      item.other_document ||
      docObj.other_document_url ||
      docObj.other_document ||
      staffObj.other_document_url ||
      staffObj.other_document,
    other_document_name:
      item.other_document_name ||
      docObj.other_document_name ||
      staffObj.other_document_name ||
      'Qualification Document',
  };

  const reviewerInfo = extractReviewerInfo(item, staffObj, docObj, status);

  return {
    ...item,
    id,
    staff_id: id,
    name,
    email,
    phone,
    address,
    staff_code: staffCode,
    role,
    salary,
    course_name: courseName,
    course_id: courseId,
    branch_name: branchName,
    branch_id: branchId ? String(branchId) : '',
    verification_status: status,
    status,
    is_verified: status === 'approved',
    aadhaar_number: aadhaarNumber,
    pan_number: panNumber,
    bank_account_number: bankAccount,
    bank_ifsc: bankIfsc,
    bank_name: bankName,
    rejection_reason: rejectionReason,
    ...reviewerInfo,
    documents,
    created_at: item.created_at || staffObj.created_at,
    verified_at: reviewerInfo.reviewed_at || item.verified_at || staffObj.verified_at,
    reviewed_at: reviewerInfo.reviewed_at || item.verified_at || staffObj.verified_at,
    approved_at: reviewerInfo.approved_at,
    rejected_at: reviewerInfo.rejected_at,
  };
};

const SuperAdminStaffVerification = () => {
  useDisplayFonts();
  const { user, token: authContextToken, logout } = useAuth();
  const token = authContextToken || localStorage.getItem('token') || localStorage.getItem('superAdminToken') || '';
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchStaffMap, setBranchStaffMap] = useState({});
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED

  // Modals & In-flight
  const [selectedStaffModal, setSelectedStaffModal] = useState(null);
  const [rejectingStaff, setRejectingStaff] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Load branches and branch staff mapping
  useEffect(() => {
    if (!token) return;
    getSuperAdminStaffBranchesApi(token)
      .then(async (data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);

        // Fetch staff from branches in background to accurately resolve branch IDs, names, salary, and courses
        if (list.length > 0) {
          const map = {};
          await Promise.allSettled(
            list.map(async (b) => {
              const bId = b.id ?? b.branch_id;
              const bName = b.name || b.branch_name || '';
              try {
                const bStaffRes = await getSuperAdminBranchStaffApi(bId, token);
                const sList = Array.isArray(bStaffRes)
                  ? bStaffRes
                  : (Array.isArray(bStaffRes?.staff) ? bStaffRes.staff : []);
                sList.forEach((s) => {
                  const sId = s.id ?? s.staff_id;
                  const sCode = s.staff_code || s.code;
                  const sEmail = s.email;
                  const sCourse = s.course_name || s.course?.title || s.course?.name || (s.course_id ? `Course #${s.course_id}` : '');
                  const info = {
                    branch_id: String(bId),
                    branch_name: bName,
                    salary: s.salary,
                    course_name: sCourse,
                    course_id: s.course_id,
                    address: s.address,
                    phone: s.phone,
                    email: s.email,
                    role: s.role || s.designation,
                  };
                  if (sId) map[`id_${sId}`] = info;
                  if (sCode) map[`code_${String(sCode).toLowerCase()}`] = info;
                  if (sEmail) map[`email_${String(sEmail).toLowerCase()}`] = info;
                });
              } catch (e) {
                // Ignore silent errors for branch staff lookup
              }
            })
          );
          setBranchStaffMap(map);
        }
      })
      .catch((err) => console.warn('Could not load branches for filter:', err));
  }, [token]);

  const loadVerificationList = async (isManualRefresh = false) => {
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('superAdminToken') || '';
    if (!authToken) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [pendingRes, approvedRes, rejectedRes] = await Promise.allSettled([
        getSuperAdminStaffVerificationPendingApi(authToken),
        getSuperAdminStaffVerificationApprovedApi(authToken),
        getSuperAdminStaffVerificationRejectedApi(authToken),
      ]);

      const extractArray = (settledResult) => {
        if (settledResult.status !== 'fulfilled' || !settledResult.value) return [];
        const val = settledResult.value;
        if (Array.isArray(val)) return val;
        if (Array.isArray(val?.staff)) return val.staff;
        if (Array.isArray(val?.data)) return val.data;
        if (Array.isArray(val?.documents)) return val.documents;
        if (Array.isArray(val?.items)) return val.items;
        if (Array.isArray(val?.results)) return val.results;
        return [];
      };

      const pendingRaw = extractArray(pendingRes);
      const approvedRaw = extractArray(approvedRes);
      const rejectedRaw = extractArray(rejectedRes);

      const normalizedPending = pendingRaw.map((it) => normalizeStaffRecord(it, 'pending', branches, branchStaffMap)).filter(Boolean);
      const normalizedApproved = approvedRaw.map((it) => normalizeStaffRecord(it, 'approved', branches, branchStaffMap)).filter(Boolean);
      const normalizedRejected = rejectedRaw.map((it) => normalizeStaffRecord(it, 'rejected', branches, branchStaffMap)).filter(Boolean);

      setPendingList(normalizedPending);
      setApprovedList(normalizedApproved);
      setRejectedList(normalizedRejected);
    } catch (err) {
      console.error('Error loading super admin staff verification:', err);
      setError(err.message || 'Failed to load staff verification records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVerificationList();
  }, [token]);

  // Enrich lists when branches or branchStaffMap are populated
  useEffect(() => {
    if (branches.length === 0 && Object.keys(branchStaffMap).length === 0) return;

    const enrichItem = (staff) => {
      let bId = staff.branch_id;
      let bName = staff.branch_name;
      let salary = staff.salary;
      let courseName = staff.course_name;
      let courseId = staff.course_id;
      let address = staff.address;

      const sId = staff.id || staff.staff_id;
      const sCode = staff.staff_code;
      const sEmail = staff.email;

      // Map lookup
      const fromMap =
        (sId && branchStaffMap[`id_${sId}`]) ||
        (sCode && branchStaffMap[`code_${String(sCode).toLowerCase()}`]) ||
        (sEmail && branchStaffMap[`email_${String(sEmail).toLowerCase()}`]);

      if (fromMap) {
        if (!bId) bId = fromMap.branch_id;
        if (!bName) bName = fromMap.branch_name;
        if ((salary === undefined || salary === null || salary === '') && fromMap.salary !== undefined) {
          salary = fromMap.salary;
        }
        if (!courseName && fromMap.course_name) courseName = fromMap.course_name;
        if (!courseId && fromMap.course_id) courseId = fromMap.course_id;
        if (!address && fromMap.address) address = fromMap.address;
      }

      // Code prefix STF-{branchId}-
      if (!bId && sCode) {
        const match = String(sCode).match(/^STF-(\d+)-/i);
        if (match && match[1]) bId = match[1];
      }

      // Name lookup from branches list
      if (!bName && bId && branches.length > 0) {
        const found = branches.find((b) => String(b.id ?? b.branch_id) === String(bId));
        if (found) bName = found.name || found.branch_name || '';
      }

      return {
        ...staff,
        branch_id: bId ? String(bId) : '',
        branch_name: bName || '',
        salary: salary ?? '',
        course_name: courseName || '',
        course_id: courseId ?? '',
        address: address || '',
      };
    };

    setPendingList((prev) => prev.map(enrichItem));
    setApprovedList((prev) => prev.map(enrichItem));
    setRejectedList((prev) => prev.map(enrichItem));
    setSelectedStaffModal((prev) => (prev ? enrichItem(prev) : null));
  }, [branches, branchStaffMap]);

  const handleApprove = async (staff) => {
    const staffId = staff?.id || staff?.staff_id;
    if (!staffId) {
      setError('Cannot approve: Staff ID not found.');
      return;
    }
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('superAdminToken') || '';
    setActionLoadingId(staffId);
    setError('');
    setActionSuccess('');

    try {
      await approveSuperAdminStaffVerificationApi(staffId, authToken);
      setActionSuccess(`Successfully approved documents for ${staff.name || 'faculty member'}.`);

      const currentReviewerName = user?.name || user?.full_name || 'Super Admin';
      const currentReviewerRole = user?.role || 'Super Admin';
      const nowIso = new Date().toISOString();

      const updatedApprovedItem = {
        ...staff,
        verification_status: 'approved',
        status: 'approved',
        is_verified: true,
        verified_at: nowIso,
        reviewed_at: nowIso,
        reviewer_name: currentReviewerName,
        reviewer_role: currentReviewerRole,
        reviewer_email: user?.email || '',
      };

      // Update state locally
      setPendingList((prev) => prev.filter((s) => s.id !== staffId));
      setRejectedList((prev) => prev.filter((s) => s.id !== staffId));
      setApprovedList((prev) => [
        updatedApprovedItem,
        ...prev.filter((s) => s.id !== staffId),
      ]);

      if (selectedStaffModal?.id === staffId) {
        setSelectedStaffModal(updatedApprovedItem);
      }
    } catch (err) {
      console.error('Approve error:', err);
      setError(err.message || 'Failed to approve staff documents.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (staff) => {
    setRejectingStaff(staff);
    setRejectReason('Document is unclear');
    setError('');
  };

  const closeRejectModal = () => {
    setRejectingStaff(null);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingStaff) return;
    const staffId = rejectingStaff?.id || rejectingStaff?.staff_id;
    if (!staffId) {
      setError('Cannot reject: Staff ID not found.');
      return;
    }
    const reasonText = rejectReason.trim() || 'Document is unclear';
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('superAdminToken') || '';
    setActionLoadingId(staffId);
    setError('');
    setActionSuccess('');

    try {
      await rejectSuperAdminStaffVerificationApi(staffId, authToken, { reason: reasonText });
      setActionSuccess(`Staff verification for ${rejectingStaff.name || 'faculty member'} has been rejected.`);

      const currentReviewerName = user?.name || user?.full_name || 'Super Admin';
      const currentReviewerRole = user?.role || 'Super Admin';
      const nowIso = new Date().toISOString();

      const updatedRejectedItem = {
        ...rejectingStaff,
        verification_status: 'rejected',
        status: 'rejected',
        is_verified: false,
        rejection_reason: reasonText,
        reviewed_at: nowIso,
        reviewer_name: currentReviewerName,
        reviewer_role: currentReviewerRole,
        reviewer_email: user?.email || '',
      };

      // Update state locally
      setPendingList((prev) => prev.filter((s) => s.id !== staffId));
      setApprovedList((prev) => prev.filter((s) => s.id !== staffId));
      setRejectedList((prev) => [
        updatedRejectedItem,
        ...prev.filter((s) => s.id !== staffId),
      ]);

      if (selectedStaffModal?.id === staffId) {
        setSelectedStaffModal(updatedRejectedItem);
      }
      closeRejectModal();
    } catch (err) {
      console.error('Reject error:', err);
      setError(err.message || 'Failed to reject staff documents.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Branch names mapping for filter dropdown
  const branchOptions = useMemo(() => {
    const list = [...branches];
    const allRecords = [...pendingList, ...approvedList, ...rejectedList];
    allRecords.forEach((r) => {
      if (r.branch_id && !list.some((b) => String(b.id ?? b.branch_id) === String(r.branch_id))) {
        list.push({ id: r.branch_id, name: r.branch_name || `Branch #${r.branch_id}` });
      }
    });
    return list;
  }, [branches, pendingList, approvedList, rejectedList]);

  // Branch filter helper matching by ID, Name, Code pattern, or Map
  const matchesSelectedBranch = (staff, selBranchId) => {
    if (selBranchId === 'all') return true;
    const selBranchIdStr = String(selBranchId).trim();
    const selectedBranch = branchOptions.find((b) => String(b.id ?? b.branch_id) === selBranchIdStr);
    const selName = selectedBranch ? (selectedBranch.name || selectedBranch.branch_name || '').toLowerCase().trim() : '';

    const staffBranchId = String(staff.branch_id || '').trim();
    const staffBranchName = String(staff.branch_name || '').toLowerCase().trim();

    // 1. Direct ID match
    if (staffBranchId && staffBranchId === selBranchIdStr) return true;

    // 2. Direct Name match
    if (selName && staffBranchName && (staffBranchName === selName || staffBranchName.includes(selName) || selName.includes(staffBranchName))) {
      return true;
    }

    // 3. Staff code prefix pattern: STF-{branch_id}-...
    if (staff.staff_code && new RegExp(`^STF-${selBranchIdStr}-`, 'i').test(staff.staff_code)) {
      return true;
    }

    // 4. Branch staff lookup map
    const fromMap =
      (staff.id && branchStaffMap[`id_${staff.id}`]) ||
      (staff.staff_code && branchStaffMap[`code_${String(staff.staff_code).toLowerCase()}`]) ||
      (staff.email && branchStaffMap[`email_${String(staff.email).toLowerCase()}`]);
    if (fromMap && String(fromMap.branch_id) === selBranchIdStr) {
      return true;
    }

    return false;
  };

  // Branch-filtered lists for real-time counts
  const branchPendingList = useMemo(() => pendingList.filter((s) => matchesSelectedBranch(s, selectedBranchId)), [pendingList, selectedBranchId, branchOptions, branchStaffMap]);
  const branchApprovedList = useMemo(() => approvedList.filter((s) => matchesSelectedBranch(s, selectedBranchId)), [approvedList, selectedBranchId, branchOptions, branchStaffMap]);
  const branchRejectedList = useMemo(() => rejectedList.filter((s) => matchesSelectedBranch(s, selectedBranchId)), [rejectedList, selectedBranchId, branchOptions, branchStaffMap]);

  const totalPending = branchPendingList.length;
  const totalApproved = branchApprovedList.length;
  const totalRejected = branchRejectedList.length;
  const totalAll = totalPending + totalApproved + totalRejected;

  // Active list filtered by statusTab, branch, and search query
  const activeList = useMemo(() => {
    let base = [];
    if (statusTab === 'PENDING') base = branchPendingList;
    else if (statusTab === 'APPROVED') base = branchApprovedList;
    else if (statusTab === 'REJECTED') base = branchRejectedList;

    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();

    return base.filter((staff) => {
      const matchName = staff.name?.toLowerCase().includes(q);
      const matchCode = staff.staff_code?.toLowerCase().includes(q);
      const matchEmail = staff.email?.toLowerCase().includes(q);
      const matchPhone = staff.phone?.toLowerCase().includes(q);
      const matchBranch = staff.branch_name?.toLowerCase().includes(q);
      const matchCourse = staff.course_name?.toLowerCase().includes(q);
      const matchAadhaar = staff.aadhaar_number?.toLowerCase().includes(q);
      const matchPan = staff.pan_number?.toLowerCase().includes(q);
      const matchAccount = staff.bank_account_number?.toLowerCase().includes(q);
      const matchIfsc = staff.bank_ifsc?.toLowerCase().includes(q);
      return matchName || matchCode || matchEmail || matchPhone || matchBranch || matchCourse || matchAadhaar || matchPan || matchAccount || matchIfsc;
    });
  }, [statusTab, branchPendingList, branchApprovedList, branchRejectedList, searchQuery]);

  return (
    <div
      className="min-h-screen md:flex"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#faf8f4',
        color: '#17140f',
      }}
    >
      <style>{PAGE_CSS}</style>

      {/* Super Admin Sidebar */}
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="staff-verification"
      />

      <main className="min-w-0 flex-1">
        {/* HEADER */}
        <header
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{ background: '#f5edd8', color: '#9c6b2e' }}
              >
                Super Admin Portal
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">Verification Central</span>
            </div>
            <h1
              className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight"
              style={serif}
            >
              Staff Document Verification
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadVerificationList(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              style={{ borderColor: '#d9cdb5', color: '#17140f' }}
              title="Refresh staff verification list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#9c6b2e' }} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        {/* CONTENT WRAPPER */}
        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 space-y-6">

          {/* ALERT MESSAGES */}
          {error && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-900 sa-fade">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
              <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg text-rose-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {actionSuccess && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 sa-fade">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setStatusTab('PENDING')}
              className={`p-5 rounded-2xl border bg-white cursor-pointer transition-all ${
                statusTab === 'PENDING' ? 'ring-2 ring-[#9c6b2e] shadow-md' : 'hover:border-[#9c6b2e]/40'
              }`}
              style={{ borderColor: '#e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-amber-600" style={serif}>
                {totalPending}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-medium">Awaiting super admin action</p>
            </div>

            <div
              onClick={() => setStatusTab('APPROVED')}
              className={`p-5 rounded-2xl border bg-white cursor-pointer transition-all ${
                statusTab === 'APPROVED' ? 'ring-2 ring-emerald-600 shadow-md' : 'hover:border-emerald-300'
              }`}
              style={{ borderColor: '#e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-emerald-600" style={serif}>
                {totalApproved}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-medium">Verified faculty staff</p>
            </div>

            <div
              onClick={() => setStatusTab('REJECTED')}
              className={`p-5 rounded-2xl border bg-white cursor-pointer transition-all ${
                statusTab === 'REJECTED' ? 'ring-2 ring-rose-600 shadow-md' : 'hover:border-rose-300'
              }`}
              style={{ borderColor: '#e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-rose-600" style={serif}>
                {totalRejected}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-medium">Re-upload required</p>
            </div>

            <div
              className="p-5 rounded-2xl border bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Submissions</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-800" style={serif}>
                {totalAll}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {selectedBranchId === 'all' ? 'Across all branches' : 'In selected branch'}
              </p>
            </div>
          </div>

          {/* CONTROLS BAR: TABS, SEARCH & BRANCH FILTER */}
          <div
            className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl border bg-white shadow-xs"
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* TABS */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] shrink-0">
              <button
                onClick={() => setStatusTab('PENDING')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusTab === 'PENDING'
                    ? 'bg-white text-amber-800 shadow-xs border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pending</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusTab === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                  {totalPending}
                </span>
              </button>

              <button
                onClick={() => setStatusTab('APPROVED')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusTab === 'APPROVED'
                    ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Approved</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusTab === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {totalApproved}
                </span>
              </button>

              <button
                onClick={() => setStatusTab('REJECTED')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusTab === 'REJECTED'
                    ? 'bg-white text-rose-800 shadow-xs border border-rose-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Rejected</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusTab === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                  {totalRejected}
                </span>
              </button>
            </div>

            {/* SEARCH AND BRANCH SELECTOR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl lg:ml-auto">
              {/* Branch filter */}
              {branchOptions.length > 0 && (
                <div className="relative min-w-[200px]">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 cursor-pointer"
                    style={{ borderColor: '#d9cdb5' }}
                  >
                    <option value="all">All Branches</option>
                    {branchOptions.map((b) => (
                      <option key={b.id ?? b.branch_id} value={String(b.id ?? b.branch_id)}>
                        {b.name || b.branch_name || `Branch #${b.id}`}
                      </option>
                    ))}
                  </select>
                  <Building2 className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
              )}

              {/* Search field */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff, course, email, account, PAN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border bg-white pl-9 pr-3.5 py-2.5 text-xs font-medium placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30"
                  style={{ borderColor: '#d9cdb5' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MAIN RECORD LIST */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border" style={{ borderColor: '#e3ddd0' }}>
              <Loader2 className="w-8 h-8 animate-spin text-[#9c6b2e]" />
              <p className="mt-3 text-sm font-semibold text-slate-600">Loading staff verification records...</p>
            </div>
          ) : activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl border text-center" style={{ borderColor: '#e3ddd0' }}>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <FileCheck2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800" style={serif}>
                No {statusTab.toLowerCase()} verification records found
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                {searchQuery || selectedBranchId !== 'all'
                  ? 'Try clearing the search query or branch filter to see more submissions.'
                  : `There are currently no staff records in the ${statusTab.toLowerCase()} status.`}
              </p>
              {(searchQuery || selectedBranchId !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBranchId('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-[#9c6b2e] bg-[#f5edd8] hover:bg-[#ede1c5] transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeList.map((staff, idx) => {
                const staffId = staff.id || staff.staff_id;
                const isActionLoading = actionLoadingId === staffId;
                const docKeys = Object.entries(staff.documents || {}).filter(
                  ([key, val]) => key.endsWith('_url') && Boolean(val)
                );

                return (
                  <div
                    key={staffId || idx}
                    className="sa-rise sa-card rounded-2xl border bg-white p-5 sm:p-6 transition-all"
                    style={{
                      borderColor: '#e3ddd0',
                      animationDelay: `${idx * 0.04}s`,
                    }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* LEFT: STAFF INFO & DETAILS */}
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs"
                          style={{
                            background:
                              staff.verification_status === 'approved'
                                ? '#ecfdf5'
                                : staff.verification_status === 'rejected'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              staff.verification_status === 'approved'
                                ? '#059669'
                                : staff.verification_status === 'rejected'
                                ? '#dc2626'
                                : '#d97706',
                            border: '1px solid currentColor',
                          }}
                        >
                          {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 truncate">
                              {staff.name}
                            </h4>

                            {staff.staff_code && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold tracking-wider">
                                {staff.staff_code}
                              </span>
                            )}

                            {/* Status badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                staff.verification_status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : staff.verification_status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {staff.verification_status || 'Pending'}
                            </span>

                            {/* Branch name badge */}
                            {staff.branch_name && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f5edd8] text-[#9c6b2e]">
                                <Building2 className="w-3 h-3" />
                                <span>{staff.branch_name}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                            {staff.email && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{staff.email}</span>
                              </span>
                            )}
                            {staff.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{staff.phone}</span>
                              </span>
                            )}
                            {staff.role && (
                              <span className="flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                <span>{staff.role}</span>
                              </span>
                            )}
                            {staff.course_name && (
                              <span className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60">
                                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                <span>{staff.course_name}</span>
                              </span>
                            )}
                            {staff.salary !== undefined && staff.salary !== null && staff.salary !== '' && (
                              <span className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                                <span>₹{Number(staff.salary).toLocaleString('en-IN')}/mo</span>
                              </span>
                            )}
                          </div>

                          {/* SUBMITTED DOCUMENTS PILLS */}
                          <div className="flex flex-wrap items-center gap-2 pt-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Docs ({docKeys.length}):
                            </span>
                            {staff.documents?.aadhaar_front_url && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                Aadhaar Front
                              </span>
                            )}
                            {staff.documents?.aadhaar_back_url && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                Aadhaar Back
                              </span>
                            )}
                            {staff.documents?.pan_card_url && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                PAN Card
                              </span>
                            )}
                            {staff.documents?.bank_passbook_url && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                Bank Passbook
                              </span>
                            )}
                            {staff.documents?.other_document_url && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 truncate max-w-[180px]">
                                {staff.documents.other_document_name || 'Certificate'}
                              </span>
                            )}
                            {docKeys.length === 0 && (
                              <span className="text-xs italic text-slate-400">No document files uploaded</span>
                            )}
                          </div>

                          {/* REVIEWER ATTRIBUTION FOR APPROVED */}
                          {staff.verification_status === 'approved' && (
                            <div className="mt-2.5 max-w-sm sm:max-w-md w-full rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-xs overflow-hidden shadow-2xs">
                              {/* Row 1: Decision Header with Reviewer Name */}
                              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100/70 border-b border-emerald-200/80">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span className="font-semibold text-emerald-950">Approved by:</span>
                                <span className="font-bold text-emerald-900 truncate">
                                  {staff.reviewer_name || 'Admin'}
                                </span>
                              </div>

                              {/* Row 2 & 3: Clean, tidy stacked rows */}
                              <div className="px-3 py-2 bg-white/80 space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-500 font-medium">Role:</span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px] tracking-wide whitespace-nowrap">
                                    {formatRole(staff.reviewer_role || (staff.reviewer_name?.toLowerCase() === 'admin' ? 'super_admin' : 'Admin'))}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-100/60">
                                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium whitespace-nowrap">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Approved at:</span>
                                  </span>
                                  <span className="font-semibold text-slate-800 text-[11px] whitespace-nowrap text-right">
                                    {formatDateTime(staff.approved_at || staff.reviewed_at || staff.verified_at || staff.updated_at || staff.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* REVIEWER ATTRIBUTION & REASON FOR REJECTED */}
                          {staff.verification_status === 'rejected' && (
                            <div className="mt-2.5 max-w-sm sm:max-w-md w-full rounded-xl bg-rose-50/90 border border-rose-200/90 text-xs overflow-hidden shadow-2xs">
                              {/* Row 1: Decision Header with Reviewer Name */}
                              <div className="flex items-center gap-2 px-3 py-2 bg-rose-100/70 border-b border-rose-200/80">
                                <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                                <span className="font-semibold text-rose-950">Rejected by:</span>
                                <span className="font-bold text-rose-900 truncate">
                                  {staff.reviewer_name || 'Admin'}
                                </span>
                              </div>

                              {/* Row 2 & 3: Clean, tidy stacked rows */}
                              <div className="px-3 py-2 bg-white/80 space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-500 font-medium">Role:</span>
                                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-[10px] tracking-wide whitespace-nowrap">
                                    {formatRole(staff.reviewer_role || (staff.reviewer_name?.toLowerCase() === 'admin' ? 'super_admin' : 'Admin'))}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-100/60">
                                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium whitespace-nowrap">
                                    <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Rejected at:</span>
                                  </span>
                                  <span className="font-semibold text-slate-800 text-[11px] whitespace-nowrap text-right">
                                    {formatDateTime(staff.rejected_at || staff.reviewed_at || staff.verified_at || staff.updated_at || staff.created_at)}
                                  </span>
                                </div>
                              </div>

                              {/* Row 4: Rejection Reason (if any) */}
                              {staff.rejection_reason && (
                                <div className="px-3 py-2 border-t border-rose-200/70 bg-rose-50/70 text-xs flex items-start gap-1.5">
                                  <span className="font-bold text-rose-950 shrink-0">Reason:</span>
                                  <span className="text-rose-900 font-medium break-words">{staff.rejection_reason}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT: ACTION BUTTONS */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {/* VIEW / INSPECT MODAL */}
                        <button
                          onClick={() => setSelectedStaffModal(staff)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-800 transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#9c6b2e]" />
                          <span>View Documents</span>
                        </button>

                        {/* APPROVE BUTTON: ONLY FOR PENDING DOCUMENTS */}
                        {staff.verification_status === 'pending' && (
                          <button
                            onClick={() => handleApprove(staff)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Approve</span>
                          </button>
                        )}

                        {/* REJECT BUTTON: ONLY FOR PENDING DOCUMENTS */}
                        {staff.verification_status === 'pending' && (
                          <button
                            onClick={() => openRejectModal(staff)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── FULL DOCUMENT INSPECTION MODAL ────────────────────────────────────── */}
        {selectedStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto sa-fade">
            <div
              className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border overflow-hidden my-auto"
              style={{ borderColor: '#e3ddd0' }}
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-white" style={{ borderColor: '#e3ddd0' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 text-[#9c6b2e]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900" style={serif}>
                      Faculty Verification — {selectedStaffModal.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedStaffModal.staff_code} • {selectedStaffModal.branch_name || 'Main Branch'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStaffModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-6 overflow-y-auto space-y-5">

                {/* 1. PERSONAL & EMPLOYMENT DETAILS */}
                <div className="rounded-2xl border p-4 sm:p-5 bg-[#faf8f4]/60 space-y-3.5" style={{ borderColor: '#e3ddd0' }}>
                  <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: '#e3ddd0' }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c6b2e] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Staff Personal & Employment Details</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        selectedStaffModal.verification_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedStaffModal.verification_status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {selectedStaffModal.verification_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                    {/* Faculty Name */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Faculty Name</span>
                      <span className="font-bold text-slate-900 text-sm truncate block">{selectedStaffModal.name}</span>
                    </div>

                    {/* Staff Code */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Staff Code / ID</span>
                      <span className="font-bold font-mono text-slate-900 truncate block">{selectedStaffModal.staff_code || '—'}</span>
                    </div>

                    {/* Branch */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Branch</span>
                      <span className="font-bold text-[#9c6b2e] truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedStaffModal.branch_name || 'Main Branch'}</span>
                      </span>
                    </div>

                    {/* Designation / Role */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Designation</span>
                      <span className="font-bold text-slate-800 truncate block">{selectedStaffModal.role || 'Faculty'}</span>
                    </div>

                    {/* Assigned Course */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Assigned Course</span>
                      <span className="font-bold text-amber-900 truncate flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">{selectedStaffModal.course_name || (selectedStaffModal.course_id ? `Course #${selectedStaffModal.course_id}` : 'General Faculty')}</span>
                      </span>
                    </div>

                    {/* Monthly Salary */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Salary</span>
                      <span className="font-black text-emerald-700 text-sm flex items-center gap-1 mt-0.5">
                        <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {selectedStaffModal.salary !== undefined && selectedStaffModal.salary !== null && selectedStaffModal.salary !== ''
                            ? `${Number(selectedStaffModal.salary).toLocaleString('en-IN')}`
                            : 'Not specified'}
                        </span>
                        {selectedStaffModal.salary ? <span className="text-[10px] font-normal text-slate-500">/mo</span> : null}
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Phone Number</span>
                      <span className="font-semibold text-slate-800 truncate flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{selectedStaffModal.phone || 'Not provided'}</span>
                      </span>
                    </div>

                    {/* Email Address */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Email Address</span>
                      <span className="font-semibold text-slate-800 truncate flex items-center gap-1 mt-0.5" title={selectedStaffModal.email}>
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{selectedStaffModal.email || 'Not provided'}</span>
                      </span>
                    </div>

                    {/* Address if present */}
                    {selectedStaffModal.address && (
                      <div className="col-span-2 sm:col-span-3 lg:col-span-4 p-3 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Address</span>
                        <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{selectedStaffModal.address}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. OFFICIAL BANKING & GOVERNMENT KYC DETAILS (SPACIOUS 2-COLUMN CARDS, NO NUMBER WRAPPING) */}
                <div className="rounded-2xl border p-4 sm:p-6 bg-white space-y-4" style={{ borderColor: '#e3ddd0' }}>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#e3ddd0' }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#9c6b2e]" />
                      <span>Official Banking & KYC Verification Details</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Account Number (SEPARATE CARD) */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-amber-200/90 bg-amber-50/50 min-w-0">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          Bank Account Number
                        </span>
                        {selectedStaffModal.bank_account_number && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedStaffModal.bank_account_number, 'account')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 transition cursor-pointer shrink-0"
                            title="Copy Account Number"
                          >
                            {copiedField === 'account' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="font-mono font-bold text-base sm:text-lg text-slate-900 tracking-wider whitespace-nowrap overflow-x-auto select-all">
                        {selectedStaffModal.bank_account_number || 'Not provided'}
                      </p>
                    </div>

                    {/* Bank IFSC Code (SEPARATE CARD) */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-blue-200/90 bg-blue-50/50 min-w-0">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                          Bank IFSC Code
                        </span>
                        {selectedStaffModal.bank_ifsc && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedStaffModal.bank_ifsc, 'ifsc')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 transition cursor-pointer shrink-0"
                            title="Copy IFSC Code"
                          >
                            {copiedField === 'ifsc' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="font-mono font-bold text-base sm:text-lg text-slate-900 uppercase tracking-wider whitespace-nowrap overflow-x-auto select-all">
                        {selectedStaffModal.bank_ifsc || 'Not provided'}
                      </p>
                    </div>

                    {/* Aadhaar Number */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/80 min-w-0">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Aadhaar Number
                        </span>
                        {selectedStaffModal.aadhaar_number && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedStaffModal.aadhaar_number, 'aadhaar')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 transition cursor-pointer shrink-0"
                            title="Copy Aadhaar Number"
                          >
                            {copiedField === 'aadhaar' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="font-mono font-bold text-base sm:text-lg text-slate-900 tracking-wider whitespace-nowrap overflow-x-auto select-all">
                        {selectedStaffModal.aadhaar_number
                          ? String(selectedStaffModal.aadhaar_number).replace(/(\d{4})/g, '$1 ').trim()
                          : 'Not provided'}
                      </p>
                    </div>

                    {/* PAN Card Number */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/80 min-w-0">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          PAN Card Number
                        </span>
                        {selectedStaffModal.pan_number && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedStaffModal.pan_number, 'pan')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 transition cursor-pointer shrink-0"
                            title="Copy PAN Number"
                          >
                            {copiedField === 'pan' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="font-mono font-bold text-base sm:text-lg text-slate-900 uppercase tracking-wider whitespace-nowrap overflow-x-auto select-all">
                        {selectedStaffModal.pan_number || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* REVIEW & DECISION AUDIT BOX (FOR APPROVED & REJECTED) */}
                {(selectedStaffModal.verification_status === 'approved' || selectedStaffModal.verification_status === 'rejected') && (
                  <div
                    className={`p-4 rounded-2xl border ${
                      selectedStaffModal.verification_status === 'approved'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/70 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div
                      className="flex items-center justify-between border-b pb-2 mb-3"
                      style={{ borderColor: selectedStaffModal.verification_status === 'approved' ? '#a7f3d0' : '#fecdd3' }}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        {selectedStaffModal.verification_status === 'approved' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-900">Verification Decision: Approved</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span className="text-rose-900">Verification Decision: Rejected</span>
                          </>
                        )}
                      </span>
                      {(selectedStaffModal.reviewed_at || selectedStaffModal.verified_at) && (
                        <span className="text-[11px] font-medium flex items-center gap-1 opacity-80">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDateTime(selectedStaffModal.reviewed_at || selectedStaffModal.verified_at)}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {/* Reviewer / Decision Maker Name */}
                      <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Decision Made By
                        </span>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {selectedStaffModal.reviewer_name || 'Admin'}
                          </span>
                        </span>
                      </div>

                      {/* Reviewer Role */}
                      <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Reviewer Role
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#9c6b2e] shrink-0" />
                          <span>
                            {formatRole(
                              selectedStaffModal.reviewer_role ||
                                (selectedStaffModal.reviewer_name?.toLowerCase() === 'admin'
                                  ? 'super_admin'
                                  : 'Admin')
                            )}
                          </span>
                        </span>
                      </div>

                      {/* Reviewer Email (if available) */}
                      {selectedStaffModal.reviewer_email && (
                        <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Reviewer Email
                          </span>
                          <span
                            className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs truncate"
                            title={selectedStaffModal.reviewer_email}
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedStaffModal.reviewer_email}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rejection Notice if rejected */}
                    {selectedStaffModal.verification_status === 'rejected' && selectedStaffModal.rejection_reason && (
                      <div className="mt-3 p-3 rounded-xl bg-white/90 border border-rose-200 text-xs">
                        <span className="font-bold text-rose-900 block mb-1">Reason for Rejection:</span>
                        <p className="text-rose-800 font-medium">{selectedStaffModal.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DOCUMENT PREVIEWS GRID */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Submitted Document Files
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Aadhaar Front */}
                    <div className="rounded-2xl border p-4 bg-white flex flex-col justify-between" style={{ borderColor: '#e3ddd0' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Aadhaar Card (Front)</span>
                        {selectedStaffModal.documents?.aadhaar_front_url && (
                          <a
                            href={getDocumentFileUrl(selectedStaffModal.documents.aadhaar_front_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c6b2e] hover:underline"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {selectedStaffModal.documents?.aadhaar_front_url ? (
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <img
                            src={getDocumentFileUrl(selectedStaffModal.documents.aadhaar_front_url)}
                            alt="Aadhaar Front"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-xs font-semibold">View document in full window</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-4/3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                          <FileText className="w-6 h-6 mb-1 text-slate-300" />
                          <span>Not uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Aadhaar Back */}
                    <div className="rounded-2xl border p-4 bg-white flex flex-col justify-between" style={{ borderColor: '#e3ddd0' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Aadhaar Card (Back)</span>
                        {selectedStaffModal.documents?.aadhaar_back_url && (
                          <a
                            href={getDocumentFileUrl(selectedStaffModal.documents.aadhaar_back_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c6b2e] hover:underline"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {selectedStaffModal.documents?.aadhaar_back_url ? (
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <img
                            src={getDocumentFileUrl(selectedStaffModal.documents.aadhaar_back_url)}
                            alt="Aadhaar Back"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-xs font-semibold">View document in full window</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-4/3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                          <FileText className="w-6 h-6 mb-1 text-slate-300" />
                          <span>Not uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* PAN Card */}
                    <div className="rounded-2xl border p-4 bg-white flex flex-col justify-between" style={{ borderColor: '#e3ddd0' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">PAN Card</span>
                        {selectedStaffModal.documents?.pan_card_url && (
                          <a
                            href={getDocumentFileUrl(selectedStaffModal.documents.pan_card_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c6b2e] hover:underline"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {selectedStaffModal.documents?.pan_card_url ? (
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <img
                            src={getDocumentFileUrl(selectedStaffModal.documents.pan_card_url)}
                            alt="PAN Card"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-xs font-semibold">View document in full window</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-4/3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                          <FileText className="w-6 h-6 mb-1 text-slate-300" />
                          <span>Not uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Bank Passbook / Cheque */}
                    <div className="rounded-2xl border p-4 bg-white flex flex-col justify-between" style={{ borderColor: '#e3ddd0' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Bank Passbook / Cancelled Cheque</span>
                        {selectedStaffModal.documents?.bank_passbook_url && (
                          <a
                            href={getDocumentFileUrl(selectedStaffModal.documents.bank_passbook_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c6b2e] hover:underline"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {selectedStaffModal.documents?.bank_passbook_url ? (
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <img
                            src={getDocumentFileUrl(selectedStaffModal.documents.bank_passbook_url)}
                            alt="Bank Passbook"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-xs font-semibold">View document in full window</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-4/3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                          <FileText className="w-6 h-6 mb-1 text-slate-300" />
                          <span>Not uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Other Document if available */}
                    {selectedStaffModal.documents?.other_document_url && (
                      <div className="col-span-1 md:col-span-2 rounded-2xl border p-4 bg-white flex flex-col justify-between" style={{ borderColor: '#e3ddd0' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">
                            {selectedStaffModal.documents.other_document_name || 'Qualification / Other Certificate'}
                          </span>
                          <a
                            href={getDocumentFileUrl(selectedStaffModal.documents.other_document_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c6b2e] hover:underline"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <img
                            src={getDocumentFileUrl(selectedStaffModal.documents.other_document_url)}
                            alt="Other Document"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-xs font-semibold">View document in full window</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50" style={{ borderColor: '#e3ddd0' }}>
                <button
                  onClick={() => setSelectedStaffModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {/* REJECT BUTTON: ONLY FOR PENDING DOCUMENTS */}
                  {selectedStaffModal.verification_status === 'pending' && (
                    <button
                      onClick={() => openRejectModal(selectedStaffModal)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                    >
                      Reject Documents
                    </button>
                  )}

                  {/* APPROVE BUTTON: ONLY FOR PENDING DOCUMENTS */}
                  {selectedStaffModal.verification_status === 'pending' && (
                    <button
                      onClick={() => handleApprove(selectedStaffModal)}
                      disabled={actionLoadingId === selectedStaffModal.id}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {actionLoadingId === selectedStaffModal.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve Documents</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── REJECTION REASON MODAL ────────────────────────────────────────────── */}
        {rejectingStaff && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs sa-fade">
            <div
              className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border p-6 space-y-4"
              style={{ borderColor: '#e3ddd0' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900" style={serif}>
                      Reject Staff Verification
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {rejectingStaff.name} ({rejectingStaff.staff_code})
                    </p>
                  </div>
                </div>

                <button onClick={closeRejectModal} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* STAFF QUICK PREVIEW IN REJECT MODAL */}
              <div className="p-3.5 rounded-2xl bg-[#faf8f4] border border-[#e3ddd0] text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{rejectingStaff.name}</span>
                  <span className="font-mono text-slate-600 text-[11px]">{rejectingStaff.staff_code}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                  {rejectingStaff.branch_name && <span>Branch: {rejectingStaff.branch_name}</span>}
                  {rejectingStaff.course_name && <span>• Course: {rejectingStaff.course_name}</span>}
                  {rejectingStaff.salary !== undefined && rejectingStaff.salary !== null && rejectingStaff.salary !== '' && (
                    <span>• Salary: ₹{Number(rejectingStaff.salary).toLocaleString('en-IN')}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono pt-1.5 border-t border-slate-200/60 flex flex-wrap gap-x-4">
                  <span>A/C: {rejectingStaff.bank_account_number || '—'}</span>
                  <span>IFSC: {rejectingStaff.bank_ifsc || '—'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify why the documents are rejected..."
                  className="w-full rounded-xl border p-3 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  style={{ borderColor: '#d9cdb5' }}
                />

                {/* Quick suggestions */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    'Document is unclear',
                    'ID proof expired',
                    'Name mismatch on Bank account',
                    'Aadhaar number blurred',
                    'Incomplete documents',
                  ].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setRejectReason(quick)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: '#e3ddd0' }}>
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim() || actionLoadingId === rejectingStaff.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoadingId === rejectingStaff.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SuperAdminStaffVerification;
