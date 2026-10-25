import React, { useEffect, useMemo, useState } from "react";
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
  Menu,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  getBranchStaffVerificationPendingApi,
  getBranchStaffVerificationApprovedApi,
  getBranchStaffVerificationRejectedApi,
  approveStaffVerificationApi,
  rejectStaffVerificationApi,
} from "../services/branchadminstaffverification";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getDocumentFileUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (typeof pathOrUrl !== "string") return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = pathOrUrl.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
};

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("ba-attendance-fonts")) return;
    const link = document.createElement("link");
    link.id = "ba-attendance-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

const PAGE_CSS = `
@keyframes ba-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ba-fade { from { opacity: 0; } to { opacity: 1; } }
.ba-rise  { opacity: 0; animation: ba-rise .45s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .35s ease both; }
.ba-card  { transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease; }
.ba-card:hover { border-color: #d9cdb5; box-shadow: 0 12px 30px -16px rgba(23,20,15,.2); }
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return value;
  }
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value;
  }
};

const formatRole = (role) => {
  if (!role) return "Branch Admin";
  const str = String(role).replace(/_/g, " ").trim();
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStaffId = (staff) => {
  if (!staff) return null;
  if (staff.staff_id !== undefined && staff.staff_id !== null && staff.staff_id !== "") {
    return staff.staff_id;
  }
  if (staff.id !== undefined && staff.id !== null && staff.id !== "") {
    return staff.id;
  }
  if (staff.staff?.staff_id !== undefined && staff.staff?.staff_id !== null && staff.staff?.staff_id !== "") {
    return staff.staff.staff_id;
  }
  if (staff.staff?.id !== undefined && staff.staff?.id !== null && staff.staff?.id !== "") {
    return staff.staff.id;
  }
  if (staff.user_id !== undefined && staff.user_id !== null && staff.user_id !== "") {
    return staff.user_id;
  }
  if (staff.staffId !== undefined && staff.staffId !== null && staff.staffId !== "") {
    return staff.staffId;
  }
  if (staff.faculty_id !== undefined && staff.faculty_id !== null && staff.faculty_id !== "") {
    return staff.faculty_id;
  }
  if (staff.documents?.staff_id !== undefined && staff.documents?.staff_id !== null && staff.documents?.staff_id !== "") {
    return staff.documents.staff_id;
  }
  if (staff.documents?.id !== undefined && staff.documents?.id !== null && staff.documents?.id !== "") {
    return staff.documents.id;
  }
  if (staff.staff_code) {
    const match = String(staff.staff_code).match(/STF-(\d+)/i);
    if (match && match[1]) {
      return Number(match[1]);
    }
  }
  return null;
};

const getStaffVerificationStatus = (staff) => {
  if (!staff) return "pending";
  const statusStr = String(
    staff.verification_status || staff.status || (staff.is_verified ? "approved" : "pending")
  ).toLowerCase().trim();

  if (statusStr.includes("approve") || statusStr === "verified" || staff.is_verified === true) {
    return "approved";
  }
  if (statusStr.includes("reject")) {
    return "rejected";
  }
  return "pending";
};

const getStoredAdminName = (fallbackRole = "Branch Admin") => {
  try {
    const branchItem = localStorage.getItem("branchAdminUser");
    if (branchItem) {
      const p = JSON.parse(branchItem);
      if (p?.name || p?.full_name) return p.name || p.full_name;
    }
    const superItem = localStorage.getItem("superAdminUser");
    if (superItem) {
      const p = JSON.parse(superItem);
      if (p?.name || p?.full_name) return p.name || p.full_name;
    }
  } catch {}
  return fallbackRole;
};

const extractReviewerInfo = (item, staffObj = {}, docObj = {}, currentUser = null, targetStatus = "") => {
  if (!item) {
    return {
      reviewer_name: "",
      reviewer_role: "",
      reviewer_email: "",
      reviewer_id: "",
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
    ""
  ).toLowerCase().trim();

  const isApproved = statusStr.includes("approve") || statusStr === "verified";
  const isRejected = statusStr.includes("reject");

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
    (isApproved ? (item.approved_by_name || staffObj.approved_by_name) : "") ||
    (isRejected ? (item.rejected_by_name || staffObj.rejected_by_name) : "") ||
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
    "";

  let reviewerRole =
    (isApproved ? (item.approved_by_role || staffObj.approved_by_role) : "") ||
    (isRejected ? (item.rejected_by_role || staffObj.rejected_by_role) : "") ||
    item.reviewer_role ||
    item.reviewed_by_role ||
    item.decision_maker_role ||
    item.approver_role ||
    item.verifier_role ||
    staffObj.reviewer_role ||
    staffObj.reviewed_by_role ||
    "";

  let reviewerEmail =
    item.reviewer_email ||
    item.reviewed_by_email ||
    staffObj.reviewer_email ||
    staffObj.reviewed_by_email ||
    "";

  let reviewerId =
    (isApproved ? (item.approved_by_id || staffObj.approved_by_id) : "") ||
    (isRejected ? (item.rejected_by_id || staffObj.rejected_by_id) : "") ||
    item.reviewer_id ||
    item.reviewed_by_id ||
    staffObj.reviewer_id ||
    "";

  for (const src of sources) {
    if (!src) continue;
    if (typeof src === "string") {
      const trimmed = src.trim();
      if (trimmed && isNaN(Number(trimmed)) && !reviewerName) {
        reviewerName = trimmed;
      }
    } else if (typeof src === "object") {
      if (!reviewerName) {
        reviewerName =
          src.name ||
          src.full_name ||
          (src.first_name ? `${src.first_name} ${src.last_name || ""}`.trim() : "") ||
          src.username ||
          src.admin_name ||
          src.user?.name ||
          src.user?.full_name ||
          "";
      }
      if (!reviewerRole) {
        reviewerRole = src.role || src.designation || src.user_type || "";
      }
      if (!reviewerEmail) {
        reviewerEmail = src.email || src.user?.email || "";
      }
      if (!reviewerId) {
        reviewerId = src.id || src.user_id || "";
      }
    }
  }

  // Fallback defaults for approved/rejected records if backend has null reviewer
  if (!reviewerName && (isApproved || isRejected)) {
    reviewerName = "Admin";
  }
  if (!reviewerRole && (isApproved || isRejected)) {
    reviewerRole = "super_admin";
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

const normalizeStaffRecord = (item, defaultStatus = "pending", currentUser = null) => {
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
    (item.is_verified ? "approved" : "") ||
    defaultStatus
  ).toLowerCase().trim();

  let status = defaultStatus;
  if (rawStatus.includes("approve") || rawStatus === "verified" || item.is_verified === true) {
    status = "approved";
  } else if (rawStatus.includes("reject")) {
    status = "rejected";
  } else {
    status = "pending";
  }

  const name =
    item.name ||
    staffObj.name ||
    item.full_name ||
    staffObj.full_name ||
    item.staff_name ||
    "Unnamed Faculty";

  const email = item.email || staffObj.email || "";
  const phone = item.phone || staffObj.phone || item.mobile || staffObj.mobile || "";
  const staffCode = item.staff_code || staffObj.staff_code || item.code || (id ? `STF-${String(id).padStart(3, "0")}` : "");
  const role = item.role || item.designation || staffObj.role || staffObj.designation || "Faculty";

  // Salary
  const salary =
    item.salary ??
    staffObj.salary ??
    item.staff_salary ??
    docObj.salary ??
    "";

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
    "";

  const courseId =
    firstCourse.course_id ||
    firstCourse.id ||
    item.course_id ||
    item.course?.id ||
    staffObj.course_id ||
    staffObj.course?.id ||
    "";

  // Address
  const address =
    item.address ||
    staffObj.address ||
    item.location ||
    staffObj.location ||
    "";

  const aadhaarNumber =
    item.aadhaar_number ||
    docObj.aadhaar_number ||
    staffObj.aadhaar_number ||
    "";

  const panNumber =
    item.pan_number ||
    docObj.pan_number ||
    staffObj.pan_number ||
    "";

  const bankAccount =
    item.bank_account_number ||
    docObj.bank_account_number ||
    item.account_number ||
    staffObj.bank_account_number ||
    "";

  const bankIfsc =
    item.bank_ifsc ||
    docObj.bank_ifsc ||
    item.ifsc ||
    item.ifsc_code ||
    staffObj.bank_ifsc ||
    "";

  const rejectionReason =
    item.verification_rejection_reason ||
    staffObj.verification_rejection_reason ||
    docObj.verification_rejection_reason ||
    item.rejection_reason ||
    item.reason ||
    item.remarks ||
    docObj.rejection_reason ||
    staffObj.rejection_reason ||
    "";

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
      "Qualification Document",
  };

  const reviewerInfo = extractReviewerInfo(item, staffObj, docObj, currentUser, status);

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
    verification_status: status,
    status,
    is_verified: status === "approved",
    aadhaar_number: aadhaarNumber,
    pan_number: panNumber,
    bank_account_number: bankAccount,
    bank_ifsc: bankIfsc,
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

const BranchAdminStaffVerification = () => {
  useDisplayFonts();
  const { user, token: authContextToken, logout } = useAuth();
  const token = authContextToken || localStorage.getItem("token") || localStorage.getItem("branchAdminToken") || "";
  const navigate = useNavigate();
  const defaultReviewerName = user?.name || user?.full_name || getStoredAdminName("Branch Admin");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("PENDING"); // PENDING, APPROVED, REJECTED

  // Modals & In-flight Actions
  const [selectedStaffModal, setSelectedStaffModal] = useState(null);
  const [rejectingStaff, setRejectingStaff] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const loadVerificationList = async (isManualRefresh = false) => {
    const authToken = token || localStorage.getItem("token") || localStorage.getItem("branchAdminToken") || "";
    if (!authToken) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [pendingRes, approvedRes, rejectedRes] = await Promise.allSettled([
        getBranchStaffVerificationPendingApi(authToken),
        getBranchStaffVerificationApprovedApi(authToken),
        getBranchStaffVerificationRejectedApi(authToken),
      ]);

      const extractArray = (settledResult) => {
        if (settledResult.status !== "fulfilled" || !settledResult.value) return [];
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

      const pendingNorm = pendingRaw
        .map((item) => normalizeStaffRecord(item, "pending", user))
        .filter(Boolean);
      const approvedNorm = approvedRaw
        .map((item) => normalizeStaffRecord(item, "approved", user))
        .filter(Boolean);
      const rejectedNorm = rejectedRaw
        .map((item) => normalizeStaffRecord(item, "rejected", user))
        .filter(Boolean);

      if (
        pendingRes.status === "rejected" &&
        approvedRes.status === "rejected" &&
        rejectedRes.status === "rejected"
      ) {
        setError(
          pendingRes.reason?.message ||
          approvedRes.reason?.message ||
          rejectedRes.reason?.message ||
          "Failed to load staff verification records."
        );
      }

      setPendingList(pendingNorm);
      setApprovedList(approvedNorm);
      setRejectedList(rejectedNorm);
    } catch (err) {
      setError(err?.message || "Failed to load staff list for verification.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVerificationList();
  }, [token]);

  // Combined staff list for "ALL" tab
  const allStaffList = useMemo(() => {
    return [...pendingList, ...approvedList, ...rejectedList];
  }, [pendingList, approvedList, rejectedList]);

  // Backward-compatible reference for empty state checks
  const staffList = allStaffList;

  // Statistics
  const stats = useMemo(() => {
    return {
      total: pendingList.length + approvedList.length + rejectedList.length,
      pending: pendingList.length,
      approved: approvedList.length,
      rejected: rejectedList.length,
    };
  }, [pendingList, approvedList, rejectedList]);

  // Filtered List
  const filteredStaff = useMemo(() => {
    let listToFilter = allStaffList;
    if (statusTab === "PENDING") listToFilter = pendingList;
    else if (statusTab === "APPROVED") listToFilter = approvedList;
    else if (statusTab === "REJECTED") listToFilter = rejectedList;

    if (!searchQuery.trim()) return listToFilter;

    const q = searchQuery.toLowerCase();
    return listToFilter.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(q);
      const emailMatch = item.email?.toLowerCase().includes(q);
      const phoneMatch = item.phone?.toLowerCase().includes(q);
      const codeMatch = String(item.staff_code || item.id || "").toLowerCase().includes(q);
      const roleMatch = (item.role || item.designation || "").toLowerCase().includes(q);
      const aadhaarMatch = String(item.aadhaar_number || "").includes(q);
      const panMatch = String(item.pan_number || "").toLowerCase().includes(q);

      return (
        nameMatch ||
        emailMatch ||
        phoneMatch ||
        codeMatch ||
        roleMatch ||
        aadhaarMatch ||
        panMatch
      );
    });
  }, [allStaffList, pendingList, approvedList, rejectedList, statusTab, searchQuery]);

  // Handle Approve
  const handleApprove = async (staffMember) => {
    const authToken = token || localStorage.getItem("token") || localStorage.getItem("branchAdminToken") || "";
    const staffId = getStaffId(staffMember) || staffMember?.id || staffMember?.staff_id;

    if (!authToken) {
      setError("Authentication session not found. Please log in again.");
      return;
    }
    if (!staffId) {
      setError("Unable to identify staff record ID for approval.");
      return;
    }

    try {
      setActionLoadingId(staffId);
      setError("");
      setActionSuccess("");

      const res = await approveStaffVerificationApi(staffId, authToken);
      const successMsg = res?.message || `Successfully approved documents for ${staffMember.name || "staff"}.`;
      setActionSuccess(successMsg);

      const currentReviewerName = user?.name || user?.full_name || "Branch Admin";
      const currentReviewerRole = user?.role || "Branch Admin";
      const nowIso = new Date().toISOString();

      const updatedItem = {
        ...staffMember,
        verification_status: "approved",
        is_verified: true,
        status: "approved",
        verified_at: nowIso,
        reviewed_at: nowIso,
        reviewer_name: currentReviewerName,
        reviewer_role: currentReviewerRole,
        reviewer_email: user?.email || "",
      };

      setPendingList((prev) => prev.filter((s) => (getStaffId(s) || s.id) !== staffId));
      setRejectedList((prev) => prev.filter((s) => (getStaffId(s) || s.id) !== staffId));
      setApprovedList((prev) => {
        const exists = prev.some((s) => (getStaffId(s) || s.id) === staffId);
        return exists
          ? prev.map((s) => ((getStaffId(s) || s.id) === staffId ? updatedItem : s))
          : [updatedItem, ...prev];
      });

      if (selectedStaffModal && (getStaffId(selectedStaffModal) || selectedStaffModal.id) === staffId) {
        setSelectedStaffModal(updatedItem);
      }
    } catch (err) {
      setError(err?.message || "Failed to approve staff documents.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async (e) => {
    e?.preventDefault?.();
    const authToken = token || localStorage.getItem("token") || localStorage.getItem("branchAdminToken") || "";
    const staffId = getStaffId(rejectingStaff) || rejectingStaff?.id || rejectingStaff?.staff_id;

    if (!authToken) {
      setError("Authentication session not found. Please log in again.");
      return;
    }
    if (!staffId) {
      setError("Unable to identify staff record ID for rejection.");
      return;
    }

    try {
      setActionLoadingId(staffId);
      setError("");
      setActionSuccess("");

      const reason = rejectReason.trim();
      const res = await rejectStaffVerificationApi(
        staffId,
        authToken,
        reason ? { reason, rejection_reason: reason, remarks: reason } : { reason: "Rejected by branch administration" }
      );
      const successMsg = res?.message || `Documents rejected for ${rejectingStaff.name || "staff"}.`;
      setActionSuccess(successMsg);

      const currentReviewerName = user?.name || user?.full_name || "Branch Admin";
      const currentReviewerRole = user?.role || "Branch Admin";
      const nowIso = new Date().toISOString();

      const updatedItem = {
        ...rejectingStaff,
        verification_status: "rejected",
        is_verified: false,
        status: "rejected",
        rejection_reason: reason || "Rejected by branch administration.",
        reviewed_at: nowIso,
        reviewer_name: currentReviewerName,
        reviewer_role: currentReviewerRole,
        reviewer_email: user?.email || "",
      };

      setPendingList((prev) => prev.filter((s) => (getStaffId(s) || s.id) !== staffId));
      setApprovedList((prev) => prev.filter((s) => (getStaffId(s) || s.id) !== staffId));
      setRejectedList((prev) => {
        const exists = prev.some((s) => (getStaffId(s) || s.id) === staffId);
        return exists
          ? prev.map((s) => ((getStaffId(s) || s.id) === staffId ? updatedItem : s))
          : [updatedItem, ...prev];
      });

      if (selectedStaffModal && (getStaffId(selectedStaffModal) || selectedStaffModal.id) === staffId) {
        setSelectedStaffModal(updatedItem);
      }

      setRejectingStaff(null);
      setRejectReason("");
    } catch (err) {
      setError(err?.message || "Failed to reject staff documents.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper to extract document URLs
  const getDocumentList = (staff) => {
    if (!staff) return [];
    const docs = staff.documents || staff.kyc || staff;
    const items = [
      { key: "aadhaar_front", label: "Aadhaar Card (Front)", url: getDocumentFileUrl(docs.aadhaar_front_url || docs.aadhaar_front) },
      { key: "aadhaar_back", label: "Aadhaar Card (Back)", url: getDocumentFileUrl(docs.aadhaar_back_url || docs.aadhaar_back) },
      { key: "pan_card", label: "PAN Card", url: getDocumentFileUrl(docs.pan_card_url || docs.pan_card) },
      { key: "bank_passbook", label: "Bank Passbook / Cheque", url: getDocumentFileUrl(docs.bank_passbook_url || docs.bank_passbook) },
      {
        key: "other_document",
        label: docs.other_document_name || "Qualification / Other Document",
        url: getDocumentFileUrl(docs.other_document_url || docs.other_document),
      },
    ];

    return items.filter((d) => Boolean(d.url));
  };

  return (
    <div
      className="min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="staff-verification"
      />

      <main className="min-w-0 flex-1 h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Staff KYC Verification
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadVerificationList(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition hover:bg-[#f8f5ee] disabled:opacity-50"
              style={{ borderColor: "#e3ddd0", color: "#5b5346", background: "#ffffff" }}
              title="Refresh staff records"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {user?.branch_name || "Branch Administrator"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140f] text-sm font-extrabold text-[#f4b942] shadow-sm ring-2 ring-[#e3ddd0]">
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 space-y-6">
          {/* Alerts */}
          {error && (
            <div
              role="alert"
              className="ba-pop rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {actionSuccess && (
            <div
              role="status"
              className="ba-pop rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
              style={{ background: "#eef6ee", color: "#256029", border: "1px solid #c8e6c9" }}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccess("")}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Pending Review */}
            <div
              onClick={() => setStatusTab("PENDING")}
              className="ba-card ba-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer"
              style={{
                borderColor: statusTab === "PENDING" ? "#b91c1c" : "#e3ddd0",
                animationDelay: "30ms",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Pending Review</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fee2e2] text-rose-700">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-[#17140f]" style={serif}>
                {stats.pending}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Awaiting your verification</p>
            </div>

            {/* Approved */}
            <div
              onClick={() => setStatusTab("APPROVED")}
              className="ba-card ba-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer"
              style={{
                borderColor: statusTab === "APPROVED" ? "#2e7d32" : "#e3ddd0",
                animationDelay: "60ms",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Verified & Approved</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3ea] text-[#2e7d32]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-[#17140f]" style={serif}>
                {stats.approved}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">KYC documents approved</p>
            </div>

            {/* Rejected */}
            <div
              onClick={() => setStatusTab("REJECTED")}
              className="ba-card ba-rise rounded-2xl p-5 border bg-white shadow-xs cursor-pointer"
              style={{
                borderColor: statusTab === "REJECTED" ? "#a24a3a" : "#e3ddd0",
                animationDelay: "90ms",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68]">Rejected</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f8eae5] text-[#a24a3a]">
                  <XCircle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-[#17140f]" style={serif}>
                {stats.rejected}
              </p>
              <p className="mt-1 text-xs text-[#8a7b68]">Action required by staff</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            className="rounded-2xl border bg-white p-4 sm:p-5 space-y-4 shadow-xs"
            style={{ borderColor: "#e3ddd0" }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatusTab("PENDING")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    statusTab === "PENDING"
                      ? "bg-[#17140f] text-white shadow-xs"
                      : "bg-[#faf8f4] text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]"
                  }`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab("APPROVED")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    statusTab === "APPROVED"
                      ? "bg-[#17140f] text-white shadow-xs"
                      : "bg-[#faf8f4] text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]"
                  }`}
                >
                  Approved ({stats.approved})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab("REJECTED")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    statusTab === "REJECTED"
                      ? "bg-[#17140f] text-white shadow-xs"
                      : "bg-[#faf8f4] text-[#5b5346] border border-[#e3ddd0] hover:bg-[#f1ede4]"
                  }`}
                >
                  Rejected ({stats.rejected})
                </button>
              </div>

              {/* Search input */}
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff, ID, Aadhaar, PAN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-7 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List Section */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#9c6b2e]" />
              <p className="mt-3 text-sm font-semibold text-[#8a7b68]">Loading staff verification list...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed p-16 text-center"
              style={{ borderColor: "#e3ddd0", background: "#fdfcf9" }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#17140f]" style={serif}>
                {staffList.length === 0
                  ? "No staff records found for verification"
                  : "No staff matching the current filters"}
              </h3>
              <p className="mt-1 text-xs text-[#8a7b68] max-w-md mx-auto">
                {staffList.length === 0
                  ? "When your branch staff members submit their KYC and verification documents from their dashboard, they will appear here for your approval."
                  : "Try clearing your search term or switching the status filter tab above."}
              </p>
              {staffList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusTab("PENDING");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#17140f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredStaff.map((staff, idx) => {
                const status = getStaffVerificationStatus(staff);
                const docs = getDocumentList(staff);
                const docsCount = docs.length;
                const aadhaarNumber = staff.aadhaar_number || staff.documents?.aadhaar_number;
                const panNumber = staff.pan_number || staff.documents?.pan_number;
                const bankAccount = staff.bank_account_number || staff.documents?.bank_account_number;
                const bankIfsc = staff.bank_ifsc || staff.documents?.bank_ifsc;
                const staffId = getStaffId(staff) || staff.id;
                const isActionLoading = actionLoadingId === staffId;

                return (
                  <article
                    key={staffId ?? idx}
                    className="ba-card ba-rise flex flex-col justify-between rounded-2xl border bg-white p-5 sm:p-6 shadow-xs min-w-0"
                    style={{
                      borderColor: "#e3ddd0",
                      animationDelay: `${Math.min(idx, 8) * 35}ms`,
                    }}
                  >
                    <div>
                      {/* Top Bar: Name, Code & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-base text-[#17140f]">
                            {staff.name || "Unnamed Faculty"}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#8a7b68]">
                            {staff.staff_code && (
                              <span className="font-mono font-medium text-[#9c6b2e]">
                                #{staff.staff_code}
                              </span>
                            )}
                            {(staff.role || staff.designation) && (
                              <span>• {staff.role || staff.designation}</span>
                            )}
                            {staff.course_name && (
                              <span className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60">
                                <BookOpen className="w-3 h-3 text-amber-600" />
                                <span>{staff.course_name}</span>
                              </span>
                            )}
                            {staff.salary !== undefined && staff.salary !== null && staff.salary !== "" && (
                              <span className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                <IndianRupee className="w-3 h-3 text-emerald-600" />
                                <span>₹{Number(staff.salary).toLocaleString("en-IN")}/mo</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {status === "approved" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </>
                          ) : status === "rejected" ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending Review</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5 text-xs text-[#5b5346] mb-4">
                        {staff.email && (
                          <p className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                            <a href={`mailto:${staff.email}`} className="hover:underline truncate">
                              {staff.email}
                            </a>
                          </p>
                        )}
                        {staff.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                            <a href={`tel:${staff.phone}`} className="hover:underline">
                              {staff.phone}
                            </a>
                          </p>
                        )}
                      </div>

                      {/* REVIEWER ATTRIBUTION FOR APPROVED */}
                      {status === "approved" && (
                        <div className="mb-3 rounded-xl bg-emerald-50/90 border border-emerald-200/90 text-xs overflow-hidden shadow-2xs">
                          {/* Row 1: Decision Header with Reviewer Name */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100/70 border-b border-emerald-200/80">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="font-semibold text-emerald-950">Approved by:</span>
                            <span className="font-bold text-emerald-900 truncate">
                              {staff.reviewer_name || "Admin"}
                            </span>
                          </div>

                          {/* Row 2 & 3: Clean, tidy stacked rows */}
                          <div className="px-3 py-2 bg-white/80 space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 font-medium">Role:</span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px] tracking-wide whitespace-nowrap">
                                {formatRole(staff.reviewer_role || (staff.reviewer_name?.toLowerCase() === "admin" ? "super_admin" : "Admin"))}
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
                      {status === "rejected" && (
                        <div className="mb-3 rounded-xl bg-rose-50/90 border border-rose-200/90 text-xs overflow-hidden shadow-2xs">
                          {/* Row 1: Decision Header with Reviewer Name */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-rose-100/70 border-b border-rose-200/80">
                            <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                            <span className="font-semibold text-rose-950">Rejected by:</span>
                            <span className="font-bold text-rose-900 truncate">
                              {staff.reviewer_name || "Admin"}
                            </span>
                          </div>

                          {/* Row 2 & 3: Clean, tidy stacked rows */}
                          <div className="px-3 py-2 bg-white/80 space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 font-medium">Role:</span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-[10px] tracking-wide whitespace-nowrap">
                                {formatRole(staff.reviewer_role || (staff.reviewer_name?.toLowerCase() === "admin" ? "super_admin" : "Admin"))}
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

                    {/* Bottom Action Bar */}
                    <div
                      className="mt-4 pt-3.5 border-t flex flex-wrap items-center justify-between gap-2"
                      style={{ borderColor: "#f1ede4" }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedStaffModal(staff)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#17140f] bg-[#faf8f4] border border-[#e3ddd0] hover:bg-[#f1ede4] transition shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#9c6b2e]" /> View Details
                      </button>

                      <div className="flex items-center gap-1.5">
                        {status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleApprove(staff)}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50 shadow-2xs"
                            style={{ background: "#2e7d32" }}
                            title="Approve staff documents"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Approve</span>
                          </button>
                        )}

                        {status === "pending" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingStaff(staff);
                              setRejectReason("");
                            }}
                            disabled={isActionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                            title="Reject staff documents"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Detail / Full Verification Modal */}
      {selectedStaffModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setSelectedStaffModal(null)}
        >
          <div
            className="relative w-full max-w-5xl xl:max-w-6xl overflow-hidden rounded-3xl border border-[#e3ddd0] bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#f0ebe0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#faf8f4] border border-[#e3ddd0] px-2.5 py-0.5 text-[10px] font-semibold text-[#5b5346]">
                    Staff ID #{selectedStaffModal.staff_code || selectedStaffModal.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      getStaffVerificationStatus(selectedStaffModal) === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : getStaffVerificationStatus(selectedStaffModal) === "rejected"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {getStaffVerificationStatus(selectedStaffModal) === "approved" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </>
                    ) : getStaffVerificationStatus(selectedStaffModal) === "rejected" ? (
                      <>
                        <XCircle className="w-3 h-3" /> Rejected
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Pending Review
                      </>
                    )}
                  </span>
                </div>
                <h3
                  className="mt-1 text-2xl font-bold text-[#17140f]"
                  style={serif}
                >
                  {selectedStaffModal.name || "Faculty Member"}
                </h3>
                <p className="text-xs text-[#8a7b68] mt-0.5">
                  {selectedStaffModal.role || selectedStaffModal.designation || "Faculty"} •{" "}
                  {selectedStaffModal.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffModal(null)}
                className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-5 overflow-y-auto pr-1 text-xs flex-1">
              {/* 1. REVIEW & DECISION AUDIT BOX (FOR APPROVED & REJECTED) */}
              {(getStaffVerificationStatus(selectedStaffModal) === "approved" ||
                getStaffVerificationStatus(selectedStaffModal) === "rejected") && (
                <div
                  className={`p-4 rounded-2xl border ${
                    getStaffVerificationStatus(selectedStaffModal) === "approved"
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                      : "bg-rose-50/70 border-rose-200 text-rose-950"
                  }`}
                >
                  <div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2.5 mb-3"
                    style={{
                      borderColor:
                        getStaffVerificationStatus(selectedStaffModal) === "approved"
                          ? "#a7f3d0"
                          : "#fecdd3",
                    }}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      {getStaffVerificationStatus(selectedStaffModal) === "approved" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-900">Verification Decision: Approved</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-rose-900">Verification Decision: Rejected</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] font-medium flex items-center gap-1 opacity-90 sm:ml-auto">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="font-semibold">
                        {getStaffVerificationStatus(selectedStaffModal) === "approved" ? "Approved at:" : "Rejected at:"}
                      </span>
                      <span className="font-bold">
                        {formatDateTime(
                          selectedStaffModal.approved_at ||
                          selectedStaffModal.rejected_at ||
                          selectedStaffModal.reviewed_at ||
                          selectedStaffModal.verified_at ||
                          selectedStaffModal.updated_at ||
                          selectedStaffModal.created_at
                        )}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {/* Decision Maker Name */}
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Decision Made By
                      </span>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm truncate">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {selectedStaffModal.reviewer_name || "Admin"}
                        </span>
                      </span>
                    </div>

                    {/* Reviewer Role */}
                    <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Reviewer Role
                      </span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#9c6b2e] shrink-0" />
                        <span className="truncate">
                          {formatRole(
                            selectedStaffModal.reviewer_role ||
                              (selectedStaffModal.reviewer_name?.toLowerCase() === "admin"
                                ? "super_admin"
                                : "Admin")
                          )}
                        </span>
                      </span>
                    </div>

                    {/* Reviewer Email (if available) */}
                    {selectedStaffModal.reviewer_email && (
                      <div className="p-3 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs min-w-0">
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
                  {selectedStaffModal.rejection_reason &&
                    getStaffVerificationStatus(selectedStaffModal) === "rejected" && (
                      <div className="mt-3 p-3 rounded-xl bg-white/90 border border-rose-200 text-xs">
                        <span className="font-bold text-rose-900 block mb-1">Reason for Rejection:</span>
                        <p className="text-rose-800 font-medium break-words">{selectedStaffModal.rejection_reason}</p>
                      </div>
                    )}
                </div>
              )}

              {/* 2. COMPLETE PERSONAL & ACADEMIC DETAILS */}
              <div className="rounded-2xl border p-4 sm:p-6 bg-white space-y-4" style={{ borderColor: "#e3ddd0" }}>
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "#e3ddd0" }}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#9c6b2e]" />
                    <span>Personal & Course Information</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {/* Full Name */}
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Full Name
                    </span>
                    <span className="font-bold text-slate-900 block text-sm">
                      {selectedStaffModal.name || "Faculty Member"}
                    </span>
                  </div>

                  {/* Staff Code */}
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Staff ID
                    </span>
                    <span className="font-mono font-bold text-slate-800 block text-xs">
                      {selectedStaffModal.staff_code || (selectedStaffModal.id ? `STF-${selectedStaffModal.id}` : "—")}
                    </span>
                  </div>

                  {/* Role / Designation */}
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Designation
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-[#9c6b2e] shrink-0" />
                      <span>{selectedStaffModal.role || selectedStaffModal.designation || "Faculty"}</span>
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Course
                    </span>
                    <span className="font-bold text-amber-800 flex items-center gap-1.5 text-xs">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{selectedStaffModal.course_name || "General Faculty"}</span>
                    </span>
                  </div>

                  {/* Monthly Salary */}
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Monthly Salary
                    </span>
                    <span className="font-black text-emerald-700 text-sm flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {selectedStaffModal.salary !== undefined &&
                        selectedStaffModal.salary !== null &&
                        selectedStaffModal.salary !== ""
                          ? `${Number(selectedStaffModal.salary).toLocaleString("en-IN")}`
                          : "Not specified"}
                      </span>
                      {selectedStaffModal.salary ? (
                        <span className="text-[10px] font-normal text-slate-500">/mo</span>
                      ) : null}
                    </span>
                  </div>

                  {/* Phone Number */}
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Phone Number
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedStaffModal.phone || "Not provided"}</span>
                    </span>
                  </div>

                  {/* Email Address */}
                  <div className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Email Address
                    </span>
                    <span
                      className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs break-all"
                      title={selectedStaffModal.email}
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedStaffModal.email || "Not provided"}</span>
                    </span>
                  </div>

                  {/* Address */}
                  {selectedStaffModal.address && (
                    <div className="col-span-full p-3.5 rounded-xl bg-[#faf8f4] border border-[#e3ddd0] min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Address
                      </span>
                      <span className="font-medium text-slate-700 flex items-center gap-1.5 text-xs break-words">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{selectedStaffModal.address}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. OFFICIAL BANKING & GOVERNMENT KYC DETAILS (SPACIOUS 2-COLUMN CARDS, NO NUMBER WRAPPING) */}
              <div className="rounded-2xl border p-4 sm:p-6 bg-white space-y-4" style={{ borderColor: "#e3ddd0" }}>
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "#e3ddd0" }}>
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
                          onClick={() => handleCopy(selectedStaffModal.bank_account_number, "account")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 transition cursor-pointer shrink-0"
                          title="Copy Account Number"
                        >
                          {copiedField === "account" ? (
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
                      {selectedStaffModal.bank_account_number || "Not provided"}
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
                          onClick={() => handleCopy(selectedStaffModal.bank_ifsc, "ifsc")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 transition cursor-pointer shrink-0"
                          title="Copy IFSC Code"
                        >
                          {copiedField === "ifsc" ? (
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
                      {selectedStaffModal.bank_ifsc || "Not provided"}
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
                          onClick={() => handleCopy(selectedStaffModal.aadhaar_number, "aadhaar")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 transition cursor-pointer shrink-0"
                          title="Copy Aadhaar Number"
                        >
                          {copiedField === "aadhaar" ? (
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
                        : "Not provided"}
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
                          onClick={() => handleCopy(selectedStaffModal.pan_number, "pan")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 transition cursor-pointer shrink-0"
                          title="Copy PAN Number"
                        >
                          {copiedField === "pan" ? (
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
                      {selectedStaffModal.pan_number || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. UPLOADED VERIFICATION DOCUMENTS */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a7b68] mb-2.5">
                  Uploaded Verification Documents ({getDocumentList(selectedStaffModal).length})
                </p>
                {getDocumentList(selectedStaffModal).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e3ddd0] p-6 text-center text-xs text-[#8a7b68]">
                    No digital document files were attached to this staff record.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getDocumentList(selectedStaffModal).map((doc) => (
                      <div
                        key={doc.key}
                        className="rounded-xl border border-[#e3ddd0] bg-[#ffffff] p-3.5 flex items-center justify-between gap-3 hover:border-[#c9bea9] transition"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8edcf] text-[#9c6b2e] shrink-0">
                            <FileCheck2 className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate text-xs">{doc.label}</p>
                            <p className="text-[10px] text-slate-400">Government record</p>
                          </div>
                        </div>

                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#17140f] bg-[#faf8f4] border border-[#e3ddd0] hover:bg-[#ede5d8] transition shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3 text-[#9c6b2e]" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ebe0] pt-4">
              <button
                type="button"
                onClick={() => setSelectedStaffModal(null)}
                className="rounded-xl border border-[#e3ddd0] px-4 py-2 text-xs font-semibold text-[#5b5346] hover:bg-[#f1ede4] transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {getStaffVerificationStatus(selectedStaffModal) === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedStaffModal)}
                    disabled={actionLoadingId === (getStaffId(selectedStaffModal) || selectedStaffModal.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shadow-xs"
                    style={{ background: "#2e7d32" }}
                  >
                    {actionLoadingId === (getStaffId(selectedStaffModal) || selectedStaffModal.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Approve Staff Documents</span>
                  </button>
                )}

                {getStaffVerificationStatus(selectedStaffModal) === "pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingStaff(selectedStaffModal);
                      setRejectReason("");
                    }}
                    disabled={actionLoadingId === (getStaffId(selectedStaffModal) || selectedStaffModal.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Documents</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Prompt Modal */}
      {rejectingStaff && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setRejectingStaff(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900" style={serif}>
                  Reject Staff Documents
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Are you sure you want to reject verification documents for{" "}
                  <strong>{rejectingStaff.name || "this staff member"}</strong>?
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for rejection (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Aadhaar image is blurry, or PAN card name does not match banking details..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingStaff(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === (getStaffId(rejectingStaff) || rejectingStaff.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-xs"
                >
                  {actionLoadingId === (getStaffId(rejectingStaff) || rejectingStaff.id) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchAdminStaffVerification;
