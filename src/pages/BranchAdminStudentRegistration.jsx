import React, { useEffect, useState, useRef } from "react";
import { AlertCircle, CalendarDays, Check, Circle, Clock, Download, Edit3, Eye, EyeOff, IndianRupee, Loader2, Lock, Mail, Menu, Phone, Plus, Receipt, Save, Search, Trash2, UserPlus, UserRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import NavLogoutButton from "../components/common/NavLogoutButton";
import { getMyCoursesApi, getMyCourseApi } from "../services/branchadmincourses";
import {
  addBranchAdmissionPaymentApi,
  createBranchAdmissionApi,
  getBranchAdmissionsApi,
} from "../services/branchadminadmissions";
import { downloadBranchAdminReceiptApi } from "../services/branchadminreceipts";
import PaymentSuccessReceiptModal from "../components/common/PaymentSuccessReceiptModal";
import Toast from "../components/common/Toast";
import { updateBranchAdminCourseEnrollmentApi } from "../services/branchadmincourseenrollment";
import { getBranchAdminEnrollmentsApi, updateBranchAdminStudentStatusApi } from "../services/branchadminenrollments";


const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  qualification: "",
  address: "",
  password: "",
  courseId: "",
  paymentPlan: "full",
  paymentAmount: "",
  paymentMethod: "cash",
  paymentStatus: "received",
  selectedInstallment: 1,
};

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";
const INPUT_CLASS = `mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`;
const INPUT_STYLE = {
  border: "1px solid #e3ddd0",
  color: "#1c1a17",
  background: "#ffffff",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "Not provided";
  const parsedDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

function ChoiceGroup({ label, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm" style={{ color: "#5b5346" }}>{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`rounded-lg border px-3.5 py-2 text-sm transition-colors ${FOCUS_RING}`}
              style={{
                borderColor: selected ? "#9c6b2e" : "#e3ddd0",
                background: selected ? "#f7efe0" : "#ffffff",
                color: selected ? "#7a531f" : "#5b5346",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const STATUS_META = {
  approved: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  received: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  paid: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  active: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  completed: { dot: "#5c7a5a", text: "#39533a", bg: "#eef2ea" },
  pending: { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  awaiting_review: { dot: "#b0803a", text: "#7a531f", bg: "#f7efe0" },
  partial: { dot: "#c27803", text: "#8f5403", bg: "#fef3c7" },
  partially_paid: { dot: "#c27803", text: "#8f5403", bg: "#fef3c7" },
  rejected: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  failed: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  cancelled: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
  inactive: { dot: "#a24a3a", text: "#7c3324", bg: "#f8eae5" },
};

const statusMeta = (status) =>
  STATUS_META[String(status || "pending").toLowerCase()] || {
    dot: "#a39a8c",
    text: "#8a8175",
    bg: "#f1ede4",
  };

const StatusPill = ({ status }) => {
  const meta = statusMeta(status);
  const label = String(status || "Pending");
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: meta.bg, color: meta.text }}
    >
      <Circle className="h-1.5 w-1.5" fill={meta.dot} stroke="none" />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
};

const isStudentActive = (enrollment) => {
  if (!enrollment) return false;
  if (
    enrollment.account_status !== undefined &&
    enrollment.account_status !== null &&
    enrollment.account_status !== ""
  ) {
    return String(enrollment.account_status).toLowerCase().trim() === "active";
  }
  if (typeof enrollment.is_active === "boolean") {
    return enrollment.is_active;
  }
  if (enrollment.student_status) {
    return String(enrollment.student_status).toLowerCase().trim() === "active";
  }
  if (enrollment.status) {
    const s = String(enrollment.status).toLowerCase().trim();
    if (s === "active") return true;
    if (s === "inactive") return false;
  }
  return true;
};

const Avatar = ({ name, size = "h-10 w-10" }) => (
  <div
    className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-semibold`}
    style={{ background: "#f1ede4", color: "#7a531f" }}
  >
    {(name || "S").charAt(0).toUpperCase()}
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs" style={{ color: "#a39a8c" }}>
      {label}
    </dt>
    <dd className="mt-1 break-words text-sm font-medium" style={{ color: "#17140f" }}>
      {value || "Not provided"}
    </dd>
  </div>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <h3
    className="flex items-center gap-2 pb-3 text-sm font-semibold"
    style={{ color: "#17140f", borderBottom: "1px solid #e3ddd0" }}
  >
    {Icon && <Icon className="h-4 w-4" style={{ color: "#9c6b2e" }} />}
    {children}
  </h3>
);

const checkIsInstallmentDue = (inst, isPaid) => {
  if (isPaid || inst?.is_paid) return false;

  const rawDate = inst?.due_date;
  if (rawDate) {
    const s = String(rawDate).trim().split("T")[0];
    const parts = s.replace(/\//g, "-").split("-");
    if (parts.length === 3) {
      let isoDate = "";
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        isoDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      if (isoDate) {
        const todayIso = new Date().toISOString().split("T")[0];
        return isoDate <= todayIso;
      }
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return d <= today;
    }
  }

  // Fallback to backend is_due flag if due_date is missing or invalid
  return Boolean(inst?.is_due === true || String(inst?.is_due).toLowerCase() === "true");
};

const StudentInstallmentModal = ({
  enrollment,
  onClose,
  token,
  courses = [],
  onToggleStatus,
  statusUpdatingId,
  onUpdateSuccess,
}) => {
  const [localEnrollment, setLocalEnrollment] = useState(enrollment);
  useEffect(() => {
    setLocalEnrollment(enrollment);
  }, [enrollment]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    parent_name: "",
    parent_phone: "",
    highest_qualification: "",
    address: "",
  });
  const [editableInstallments, setEditableInstallments] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [toast, setToast] = useState(null);

  const activeEnrollment = localEnrollment || enrollment;

  useEffect(() => {
    if (!activeEnrollment) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [activeEnrollment, onClose]);

  const installments = React.useMemo(() => {
    if (!activeEnrollment) return [];
    const list = Array.isArray(activeEnrollment.installments)
      ? activeEnrollment.installments
      : Array.isArray(activeEnrollment.installment_schedule)
      ? activeEnrollment.installment_schedule
      : Array.isArray(activeEnrollment.schedule)
      ? activeEnrollment.schedule
      : [];

    return list.map((inst, idx) => {
      const instNum = Number(inst.installment_number ?? idx + 1);
      const totalInstAmount = Number(inst.amount ?? 0);
      const backendStatus = String(inst.status || "").toLowerCase().trim();
      const isInstBackendPaid = backendStatus === "paid";

      const paidAmount = inst.paid_amount !== undefined && inst.paid_amount !== null
        ? Number(inst.paid_amount)
        : isInstBackendPaid
        ? totalInstAmount
        : 0;

      const remainingAmount = inst.remaining_amount !== undefined && inst.remaining_amount !== null
        ? Number(inst.remaining_amount)
        : isInstBackendPaid
        ? 0
        : Math.max(0, totalInstAmount - paidAmount);

      const isPaid = isInstBackendPaid || (remainingAmount <= 0 && paidAmount >= totalInstAmount && totalInstAmount > 0);
      const isDue = checkIsInstallmentDue(inst, isPaid);

      return {
        ...inst,
        installment_number: instNum,
        amount: totalInstAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        status: isPaid ? "paid" : inst.status || "pending",
        is_paid: isPaid,
        is_due: isDue,
        due_date: inst.due_date,
        paid_date: inst.paid_date || inst.payment_date,
        payment_method: inst.payment_method || (isPaid ? "Verified" : "Pending"),
      };
    });
  }, [activeEnrollment]);

  const handleStartEditing = () => {
    setEditError("");
    setEditSuccess("");

    // Initialize personal details form
    setFormData({
      name: activeEnrollment?.name || "",
      email: activeEnrollment?.email || "",
      phone: activeEnrollment?.phone || "",
      parent_name: activeEnrollment?.parent_name || activeEnrollment?.guardian_name || "",
      parent_phone: activeEnrollment?.parent_phone || activeEnrollment?.guardian_phone || "",
      highest_qualification: activeEnrollment?.highest_qualification || activeEnrollment?.qualification || "",
      address: activeEnrollment?.address || "",
    });

    // Initialize installments
    let initial = installments.map((inst, idx) => {
      const isPaid = Boolean(inst.is_paid);
      return {
        ...inst,
        installment_number: Number(inst.installment_number ?? idx + 1),
        amount: Number(inst.amount ?? 0),
        due_date: inst.due_date ? String(inst.due_date).split("T")[0] : "",
        is_paid: isPaid,
        is_due: checkIsInstallmentDue(inst, isPaid),
        paid_amount: Number(inst.paid_amount ?? (isPaid ? inst.amount : 0)),
        paid_date: inst.paid_date || null,
      };
    });

    if (initial.length === 0) {
      const fee = Number(activeEnrollment?.total_fee || 0);
      initial = [
        {
          installment_number: 1,
          amount: fee,
          due_date: new Date().toISOString().split("T")[0],
          is_paid: false,
          status: "pending",
        },
      ];
    }

    setEditableInstallments(initial);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditError("");
  };

  const handleAddTerm = () => {
    setEditableInstallments((prev) => {
      const nextNum = prev.length + 1;
      const expectedFee = Number(activeEnrollment?.total_fee || 0);
      const currentSum = prev.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const diff = Math.max(0, expectedFee - currentSum);

      let nextDate = "";
      const lastDate = prev[prev.length - 1]?.due_date;
      if (lastDate) {
        const d = new Date(lastDate);
        if (!isNaN(d.getTime())) {
          d.setMonth(d.getMonth() + 1);
          nextDate = d.toISOString().split("T")[0];
        }
      }
      if (!nextDate) {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        nextDate = d.toISOString().split("T")[0];
      }

      return [
        ...prev,
        {
          installment_number: nextNum,
          amount: diff,
          due_date: nextDate,
          is_paid: false,
          status: "pending",
        },
      ];
    });
  };

  const handleRemoveTerm = (index) => {
    setEditableInstallments((prev) => {
      if (prev[index]?.is_paid) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      return next.map((item, idx) => ({
        ...item,
        installment_number: idx + 1,
      }));
    });
  };

  const handleUpdateInstallmentField = (index, field, value) => {
    setEditableInstallments((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = {
          ...item,
          [field]: field === "amount" ? (value === "" ? "" : Number(value)) : value,
        };
        if (field === "due_date") {
          updated.is_due = checkIsInstallmentDue(updated, updated.is_paid);
        }
        return updated;
      })
    );
  };

  const handleSaveAllDetails = async () => {
    if (!token) return;
    setEditError("");
    setEditSuccess("");

    // Validate personal details
    if (!formData.name.trim()) {
      setEditError("Student full name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setEditError("Student email address is required.");
      return;
    }
    if (!formData.phone.trim()) {
      setEditError("Student phone number is required.");
      return;
    }

    // Validate installment schedule
    if (!editableInstallments || editableInstallments.length === 0) {
      setEditError("At least one installment term is required.");
      return;
    }

    for (const inst of editableInstallments) {
      if (!inst.amount || Number(inst.amount) <= 0) {
        setEditError(`Installment #${inst.installment_number || 1} must have an amount greater than 0.`);
        return;
      }
      if (!inst.due_date) {
        setEditError(`Installment #${inst.installment_number || 1} must have a valid due date.`);
        return;
      }
    }

    const expectedFee = Number(activeEnrollment?.total_fee || 0);
    const scheduledTotal = editableInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
    if (Math.abs(scheduledTotal - expectedFee) > 0.01) {
      const errMsg = `Total installments (${formatCurrency(scheduledTotal)}) must equal the total course fee (${formatCurrency(expectedFee)}).`;
      setEditError(errMsg);
      setToast({
        type: "warning",
        title: "Fee Mismatch",
        message: errMsg,
      });
      return;
    }

    const courseId =
      activeEnrollment?.course_id ||
      activeEnrollment?.courseId ||
      activeEnrollment?.course?.id ||
      courses?.find(
        (c) =>
          String(c.id) === String(activeEnrollment?.course_id) ||
          (c.title && activeEnrollment?.course_title && c.title.toLowerCase() === activeEnrollment.course_title.toLowerCase())
      )?.id;
    const enrollmentId = activeEnrollment?.enrollment_id || activeEnrollment?.id;

    if (!courseId || !enrollmentId) {
      setEditError("Could not determine Course ID or Enrollment ID for this student.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      parent_name: formData.parent_name.trim(),
      parent_phone: formData.parent_phone.trim(),
      highest_qualification: formData.highest_qualification.trim(),
      address: formData.address.trim(),
      installments: editableInstallments.map((inst, idx) => ({
        installment_number: Number(inst.installment_number || idx + 1),
        amount: Number(inst.amount) || 0,
        due_date: inst.due_date ? String(inst.due_date).split("T")[0] : new Date().toISOString().split("T")[0],
      })),
    };

    try {
      setIsSaving(true);
      const res = await updateBranchAdminCourseEnrollmentApi(courseId, enrollmentId, payload, token);
      setEditSuccess("Student details & installment schedule updated successfully!");
      setToast({
        type: "success",
        title: "Changes Saved",
        message: `Student details & installment schedule for ${payload.name} updated successfully!`,
      });
      setIsEditing(false);

      const updatedInsts = editableInstallments.map((inst, idx) => ({
        ...inst,
        installment_number: idx + 1,
      }));

      setLocalEnrollment((prev) => ({
        ...(prev || activeEnrollment),
        ...payload,
        installments: updatedInsts,
        installment_schedule: updatedInsts,
      }));

      if (onUpdateSuccess) {
        onUpdateSuccess(enrollmentId, updatedInsts, res, payload);
      }
      setTimeout(() => setEditSuccess(""), 4000);
    } catch (err) {
      const errMsg = err?.message || "Failed to update enrollment details.";
      setEditError(errMsg);
      setToast({
        type: "error",
        title: "Save Failed",
        message: errMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeEnrollment) return null;

  const balanceNum = Number(activeEnrollment.balance_amount ?? activeEnrollment.remaining_amount ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(23,20,15,.55)" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl"
        style={{
          background: "#ffffff",
          border: "1px solid #e3ddd0",
          boxShadow: "0 30px 80px -30px rgba(23,20,15,.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-5 sm:px-8"
          style={{ background: "#ffffff", borderBottom: "1px solid #e3ddd0" }}
        >
          <div className="flex items-start gap-4 min-w-0">
            <span
              aria-hidden="true"
              className="mt-1 h-12 w-1 shrink-0 rounded-full"
              style={{ background: "#9c6b2e" }}
            />
            <div className="min-w-0">
              <p className="text-xs" style={{ color: "#a39a8c" }}>
                Enrollment Details #{activeEnrollment.enrollment_id || activeEnrollment.id}
              </p>
              <h2
                className="mt-1 break-words text-2xl leading-tight"
                style={{ ...serif, fontWeight: 500, color: "#17140f" }}
              >
                {activeEnrollment.name || "Unnamed student"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                {activeEnrollment.course_title || "Course unavailable"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[#f1ede4] ${FOCUS_RING}`}
            style={{ color: "#a39a8c" }}
            aria-label="Close student details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {/* Global Notification messages */}
          {editSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{editSuccess}</span>
            </div>
          )}
          {editError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{editError}</span>
            </div>
          )}

          {/* 1. Student Information */}
          <section>
            <SectionTitle icon={UserRound}>Student Information</SectionTitle>
            
            {isEditing ? (
              /* Editable Personal Details */
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-[#5b5346] block mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5b5346] block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5b5346] block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                    placeholder="+91 90000 00000"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5b5346] block mb-1">
                    Highest Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.highest_qualification}
                    onChange={(e) => setFormData({ ...formData, highest_qualification: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                    placeholder="e.g. B.Tech, Degree, Higher Secondary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5b5346] block mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                    placeholder="Parent / Guardian Name"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5b5346] block mb-1">
                    Parent / Guardian Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                    placeholder="Parent / Guardian Phone"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#5b5346] block mb-1">
                    Residential Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none border focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                    placeholder="Residential Address"
                  />
                </div>
              </div>
            ) : (
              /* Read-only Personal Details */
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <DetailItem label="Full Name" value={activeEnrollment.name} />
                <DetailItem label="Email" value={activeEnrollment.email} />
                <DetailItem label="Phone" value={activeEnrollment.phone} />
                <DetailItem
                  label="Highest Qualification"
                  value={activeEnrollment.highest_qualification || activeEnrollment.qualification}
                />
                <DetailItem
                  label="Parent / Guardian Name"
                  value={activeEnrollment.parent_name || activeEnrollment.guardian_name}
                />
                <DetailItem
                  label="Parent / Guardian Phone"
                  value={activeEnrollment.parent_phone || activeEnrollment.guardian_phone}
                />
                <DetailItem label="Address" value={activeEnrollment.address} />
              </dl>
            )}

            {/* Account Status Control */}
            {(() => {
              const isAct = isStudentActive(activeEnrollment);
              const studentId =
                activeEnrollment.student_id ??
                activeEnrollment.user_id ??
                activeEnrollment.id ??
                activeEnrollment.enrollment_id;
              const isUpdating = statusUpdatingId === studentId;
              return (
                <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-[#e3ddd0] flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#17140f]">Account Access</p>
                    <p className="text-xs text-[#8a8175]">
                      Student portal login and features access
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        isAct
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAct ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {isAct ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        onToggleStatus && onToggleStatus(activeEnrollment, isAct ? "Inactive" : "Active")
                      }
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                        isAct
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isAct ? "Deactivate Account" : "Activate Account"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* 2. Course Information */}
          <section>
            <SectionTitle icon={CalendarDays}>Course Information</SectionTitle>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Course Title" value={activeEnrollment.course_title} />
              <DetailItem label="Course Duration" value={activeEnrollment.course_duration} />
              <DetailItem
                label="Course Status"
                value={<StatusPill status={activeEnrollment.course_status || "pending"} />}
              />
              <DetailItem label="Enrollment ID" value={`#${activeEnrollment.enrollment_id || activeEnrollment.id}`} />
              <DetailItem label="Enrollment Date" value={formatDate(activeEnrollment.created_at || activeEnrollment.admission_date)} />
            </dl>
          </section>

          {/* 3. Payment Summary (No update button here as requested) */}
          <section>
            <SectionTitle icon={IndianRupee}>Payment Summary</SectionTitle>
            <div
              className="mt-4 grid gap-4 rounded-xl p-4 sm:grid-cols-3"
              style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
            >
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Total Fee
                </p>
                <p
                  className="mt-1 text-xl tabular-nums font-bold"
                  style={{ ...serif, color: "#17140f" }}
                >
                  {formatCurrency(activeEnrollment.total_fee)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Total Paid
                </p>
                <p
                  className="mt-1 text-xl tabular-nums font-bold"
                  style={{ ...serif, color: "#5c7a5a" }}
                >
                  {formatCurrency(activeEnrollment.total_paid)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: "#a39a8c" }}>
                  Installment Balance
                </p>
                <p
                  className="mt-1 text-xl tabular-nums font-bold"
                  style={{
                    ...serif,
                    color: balanceNum > 0 ? "#a24a3a" : "#5c7a5a",
                  }}
                >
                  {formatCurrency(balanceNum)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Payment Status:</span>
              <StatusPill status={activeEnrollment.status} />
            </div>
          </section>

          {/* 4. Installment Details & Update Schedule (No header button here as requested) */}
          <section>
            <div className="pb-3 border-b border-[#e3ddd0]">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#17140f]">
                <Clock className="h-4 w-4 text-[#9c6b2e]" />
                Installments Breakdown
              </h3>
            </div>

            {isEditing ? (
              /* ─── EDITABLE INSTALLMENTS FORM ─── */
              <div className="mt-4 space-y-4">
                <div
                  className="flex items-center gap-2 rounded-xl p-3.5 text-xs"
                  style={{ background: "#fbf8f2", border: "1px solid #ecd8c0", color: "#7a531f" }}
                >
                  <Lock className="h-4 w-4 text-[#9c6b2e] shrink-0" />
                  <span>
                    <strong>Paid installments are locked</strong> and cannot be modified. You can customize unpaid installment amounts and due dates.
                  </span>
                </div>

                <div className="space-y-3">
                  {editableInstallments.map((inst, index) => {
                    const isPaid = Boolean(inst.is_paid);
                    const isDue = checkIsInstallmentDue(inst, isPaid);

                    return (
                      <div
                        key={inst.installment_id || index}
                        className={`rounded-xl p-4 transition-all ${
                          isPaid
                            ? "bg-[#f5f8f5] border border-[#cbe0cb]"
                            : isDue
                            ? "bg-[#fef8f0] border border-[#f0d9b5]"
                            : "bg-white border border-[#e3ddd0] shadow-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#9c6b2e]">
                              Installment Term #{inst.installment_number || index + 1}
                            </span>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                <Lock className="h-3 w-3 text-emerald-700" />
                                Paid (Locked)
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {isDue && (
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    Due
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                                  Unpaid Term
                                </span>
                              </div>
                            )}
                          </div>

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTerm(index)}
                              title="Remove this installment term"
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {isPaid ? (
                          <dl className="grid gap-3 sm:grid-cols-3 text-xs">
                            <DetailItem label="Total Amount" value={formatCurrency(inst.amount)} />
                            <DetailItem
                              label="Paid Amount"
                              value={
                                <span className="font-semibold text-emerald-700">
                                  {formatCurrency(inst.paid_amount || inst.amount)}
                                </span>
                              }
                            />
                            <DetailItem
                              label="Paid / Due Date"
                              value={formatDate(inst.paid_date || inst.payment_date || inst.due_date)}
                            />
                          </dl>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-[#5b5346] block mb-1">
                                Installment Amount (₹) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8a8175]">₹</span>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={inst.amount}
                                  onChange={(e) => handleUpdateInstallmentField(index, "amount", e.target.value)}
                                  className="w-full rounded-lg px-3 py-2 text-sm outline-none pl-7"
                                  style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                                  placeholder="Amount"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-[#5b5346] block mb-1">
                                Due Date *
                              </label>
                              <input
                                type="date"
                                required
                                value={inst.due_date ? String(inst.due_date).split("T")[0] : ""}
                                onChange={(e) => handleUpdateInstallmentField(index, "due_date", e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                                style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#1c1a17" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Term Option below last installment */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition hover:bg-[#efe5d3] cursor-pointer"
                    style={{ background: "#f7efe0", color: "#7a531f", border: "1px solid #e8dbbe" }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Term
                  </button>
                </div>

                {/* Validation summary bar */}
                {(() => {
                  const expectedFee = Number(activeEnrollment?.total_fee || 0);
                  const scheduledTotal = editableInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
                  const diff = expectedFee - scheduledTotal;
                  const isMatch = Math.abs(diff) < 0.01;

                  return (
                    <div
                      className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3.5 text-xs font-medium"
                      style={{
                        background: isMatch ? "#eef2ea" : "#fbf2e9",
                        border: `1px solid ${isMatch ? "#d3e0cd" : "#ecd8c0"}`,
                        color: isMatch ? "#39533a" : "#845217",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <span>Scheduled Total: <strong className="text-sm">{formatCurrency(scheduledTotal)}</strong></span>
                        <span>Course Fee: <strong className="text-sm">{formatCurrency(expectedFee)}</strong></span>
                      </div>
                      <div>
                        {isMatch ? (
                          <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                            <Check className="h-4 w-4 text-emerald-600" />
                            Installments perfectly match total course fee
                          </span>
                        ) : (
                          <span className="font-semibold text-rose-700">
                            Difference: {diff > 0 ? `+${formatCurrency(diff)} remaining` : `-${formatCurrency(Math.abs(diff))} over course fee`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* ─── READ ONLY INSTALLMENTS VIEW ─── */
              installments.length === 0 ? (
                <p className="mt-4 text-sm text-stone-500">
                  No installment schedule records found for this enrollment.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {installments.map((inst, idx) => {
                    const isPaid = inst.is_paid;
                    const isDue = checkIsInstallmentDue(inst, isPaid);

                    return (
                      <div
                        key={inst.installment_id || idx}
                        className={`rounded-xl p-4 transition-all ${
                          isDue && !isPaid
                            ? "bg-[#fef8f0] border border-[#f0d9b5]"
                            : "bg-white border border-[#e3ddd0]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <p
                            className="text-xs font-semibold tracking-wide uppercase"
                            style={{ color: "#9c6b2e" }}
                          >
                            Installment #{inst.installment_number ?? idx + 1}
                          </p>
                          <div className="flex items-center gap-2">
                            {isDue && !isPaid && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Due
                              </span>
                            )}
                            <StatusPill status={inst.status || "pending"} />
                          </div>
                        </div>

                        <dl className="grid gap-3 sm:grid-cols-3">
                          <DetailItem label="Total Amount" value={formatCurrency(inst.amount)} />
                          <DetailItem
                            label="Paid Amount"
                            value={
                              <span className={isPaid ? "text-emerald-700 font-semibold" : ""}>
                                {formatCurrency(inst.paid_amount || 0)}
                              </span>
                            }
                          />
                          <DetailItem
                            label="Remaining"
                            value={formatCurrency(inst.remaining_amount || 0)}
                          />
                          <DetailItem label="Due Date" value={formatDate(inst.due_date)} />
                          <DetailItem
                            label="Paid Date"
                            value={inst.paid_date ? formatDate(inst.paid_date) : "Not yet paid"}
                          />
                          <DetailItem
                            label="Payment Method"
                            value={inst.payment_method || (isPaid ? "Verified" : "Pending")}
                          />
                        </dl>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </section>
        </div>

        {/* Toast Notification */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Footer: Action button is placed on the down side near Close Details button */}
        <div
          className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 px-6 py-4 sm:px-8 border-t bg-white"
          style={{ borderColor: "#e3ddd0" }}
        >
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#855924] cursor-pointer"
                style={{ background: "#9c6b2e" }}
              >
                <Edit3 className="h-4 w-4" />
                Update Installment Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#30291f] cursor-pointer ${FOCUS_RING}`}
                style={{ background: "#17140f" }}
              >
                Close Details
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCancelEditing}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 border border-stone-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isSaving ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.phone.trim() ||
                  Math.abs(Number(activeEnrollment?.total_fee || 0) - editableInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0)) >= 0.01
                }
                onClick={handleSaveAllDetails}
                className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                style={{ background: "#9c6b2e" }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


function BranchAdminStudentRegistration() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("registration");
  const [form, setForm] = useState(INITIAL_FORM);
  const [courses, setCourses] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const errorRef = useRef(null);

  const scrollToError = () => {
    setTimeout(() => {
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  };

  const [selectedAdmissionForPayment, setSelectedAdmissionForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ cash_amount: 0, upi_amount: 0, upi_transaction_id: "", installment_number: 1, payment_date: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [editableInstallments, setEditableInstallments] = useState([]);
  const [registrationPayment, setRegistrationPayment] = useState({
    term_number: 1,
    cash_amount: "",
    upi_amount: "",
    upi_transaction_id: "",
    status: "received"
  });
  const [registrationReceipt, setRegistrationReceipt] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Enrollments & Installments Management (Tab 3) ---
  const [enrollmentsList, setEnrollmentsList] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState("");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [selectedEnrollmentForModal, setSelectedEnrollmentForModal] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchBranchEnrollments = async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setEnrollmentsLoading(true);
      setEnrollmentsError("");
      const res = await getBranchAdminEnrollmentsApi(token);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res && typeof res === "object") {
        for (const k of ["students", "enrollments", "items", "data"]) {
          if (Array.isArray(res[k])) {
            list = res[k];
            break;
          }
        }
      }
      setEnrollmentsList(list);
    } catch (err) {
      setEnrollmentsError(err?.message || "Failed to load enrollments.");
    } finally {
      if (!silent) setEnrollmentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "update") {
      fetchBranchEnrollments();
    }
  }, [activeTab, token]);

  const filteredEnrollments = React.useMemo(() => {
    const q = enrollmentSearch.trim().toLowerCase();
    if (!q) return enrollmentsList;
    return enrollmentsList.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const course = (item.course_title || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();
      const idStr = String(item.enrollment_id || item.id || "");
      return name.includes(q) || email.includes(q) || course.includes(q) || phone.includes(q) || idStr.includes(q);
    });
  }, [enrollmentsList, enrollmentSearch]);

  const handleToggleStudentStatus = async (enrollment, nextStatus) => {
    if (!token) return;
    const studentId =
      enrollment.student_id ??
      enrollment.user_id ??
      enrollment.id ??
      enrollment.enrollment_id;
    if (!studentId) return;

    try {
      setStatusUpdatingId(studentId);
      await updateBranchAdminStudentStatusApi(studentId, nextStatus, token);
      const isNowActive = String(nextStatus).toLowerCase() === "active";
      setEnrollmentsList((prev) =>
        prev.map((item) => {
          const id = item.student_id ?? item.user_id ?? item.id ?? item.enrollment_id;
          if (String(id) === String(studentId)) {
            return {
              ...item,
              account_status: nextStatus,
              is_active: isNowActive,
              student_status: nextStatus,
            };
          }
          return item;
        })
      );
      if (selectedEnrollmentForModal) {
        const modalId =
          selectedEnrollmentForModal.student_id ??
          selectedEnrollmentForModal.user_id ??
          selectedEnrollmentForModal.id ??
          selectedEnrollmentForModal.enrollment_id;
        if (String(modalId) === String(studentId)) {
          setSelectedEnrollmentForModal((prev) => ({
            ...prev,
            account_status: nextStatus,
            is_active: isNowActive,
            student_status: nextStatus,
          }));
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleUpdateInstallmentSuccess = async (enrollmentId, updatedInsts) => {
    await fetchBranchEnrollments(true);
    setSelectedEnrollmentForModal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        installments: updatedInsts,
        installment_schedule: updatedInsts,
      };
    });
  };

  // --- Update Registration (PUT API) State ---
  const [selectedAdmissionForUpdate, setSelectedAdmissionForUpdate] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    parent_name: "",
    parent_phone: "",
    highest_qualification: "",
    address: "",
  });
  const [updateInstallments, setUpdateInstallments] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const populateUpdateForm = (admission) => {
    if (!admission) return;
    setUpdateFormData({
      name: admission.name || "",
      email: admission.email || "",
      phone: admission.phone || "",
      parent_name: admission.parent_name || "",
      parent_phone: admission.parent_phone || "",
      highest_qualification: admission.highest_qualification || admission.qualification || "",
      address: admission.address || "",
    });

    let rawInsts = [];
    if (Array.isArray(admission.installments) && admission.installments.length > 0) {
      rawInsts = admission.installments;
    } else if (Array.isArray(admission.installment_terms) && admission.installment_terms.length > 0) {
      rawInsts = admission.installment_terms;
    }

    if (rawInsts.length > 0) {
      const sorted = [...rawInsts].sort(
        (a, b) => Number(a.installment_number ?? a.term_number ?? 0) - Number(b.installment_number ?? b.term_number ?? 0)
      );
      setUpdateInstallments(
        sorted.map((inst, idx) => ({
          installment_number: Number(inst.installment_number ?? inst.term_number ?? idx + 1),
          amount: Number(inst.amount) || 0,
          due_date: inst.due_date ? String(inst.due_date).split("T")[0] : new Date().toISOString().split("T")[0],
          paid_amount: Number(inst.paid_amount) || 0,
          status: inst.status || "pending",
        }))
      );
    } else {
      setUpdateInstallments([
        {
          installment_number: 1,
          amount: Number(admission.total_fee || admission.balance_amount || 0),
          due_date: admission.admission_date ? String(admission.admission_date).split("T")[0] : new Date().toISOString().split("T")[0],
          paid_amount: Number(admission.total_paid) || 0,
          status: "pending",
        },
      ]);
    }
    setUpdateError("");
    setUpdateSuccess("");
  };

  const handleSelectForUpdate = (admission) => {
    setActiveTab("update");
    const found = enrollmentsList.find(
      (e) => String(e.enrollment_id || e.id) === String(admission.enrollment_id || admission.id)
    );
    setSelectedEnrollmentForModal(found || admission);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateInstallmentChange = (index, field, value) => {
    setUpdateInstallments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddInstallment = () => {
    setUpdateInstallments((prev) => {
      const nextNum = prev.length + 1;
      const currentTotal = prev.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const expectedFee = Number(selectedAdmissionForUpdate?.total_fee || 0);
      const remainder = Math.max(0, expectedFee - currentTotal);
      const lastDate = prev.length > 0 && prev[prev.length - 1].due_date ? new Date(prev[prev.length - 1].due_date) : new Date();
      lastDate.setMonth(lastDate.getMonth() + 1);

      return [
        ...prev,
        {
          installment_number: nextNum,
          amount: remainder,
          due_date: lastDate.toISOString().split("T")[0],
          paid_amount: 0,
          status: "pending",
        },
      ];
    });
  };

  const handleRemoveInstallment = (index) => {
    setUpdateInstallments((prev) => {
      return prev
        .filter((_, i) => i !== index)
        .map((inst, i) => ({
          ...inst,
          installment_number: i + 1,
        }));
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmissionForUpdate) return;
    setUpdateLoading(true);
    setUpdateError("");
    setUpdateSuccess("");

    const admission = selectedAdmissionForUpdate;
    const courseId =
      admission.course_id ||
      admission.course?.id ||
      courses.find(
        (c) =>
          String(c.id) === String(admission.course_id) ||
          (c.title && admission.course_title && c.title.toLowerCase() === admission.course_title.toLowerCase())
      )?.id;
    const enrollmentId = admission.enrollment_id || admission.id;

    if (!courseId || !enrollmentId) {
      setUpdateError("Could not determine Course ID or Enrollment ID for this student.");
      setUpdateLoading(false);
      return;
    }

    if (!updateInstallments || updateInstallments.length === 0) {
      setUpdateError("At least one installment term is required.");
      setUpdateLoading(false);
      return;
    }

    for (const inst of updateInstallments) {
      if (Number(inst.amount) <= 0) {
        setUpdateError(`Installment #${inst.installment_number || 1} must have an amount greater than 0.`);
        setUpdateLoading(false);
        return;
      }
      if (!inst.due_date) {
        setUpdateError(`Installment #${inst.installment_number || 1} requires a valid due date.`);
        setUpdateLoading(false);
        return;
      }
    }

    const expectedFee = Number(admission.total_fee || 0);
    const totalInstallmentAmt = updateInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
    if (expectedFee > 0 && Math.abs(totalInstallmentAmt - expectedFee) > 0.01) {
      setUpdateError(
        `The sum of all installments (₹${totalInstallmentAmt.toLocaleString("en-IN")}) must exactly equal the total course fee (₹${expectedFee.toLocaleString("en-IN")}).`
      );
      setUpdateLoading(false);
      return;
    }

    const payload = {
      name: updateFormData.name.trim(),
      email: updateFormData.email.trim(),
      phone: updateFormData.phone.trim(),
      parent_name: updateFormData.parent_name.trim(),
      parent_phone: updateFormData.parent_phone.trim(),
      highest_qualification: updateFormData.highest_qualification.trim(),
      address: updateFormData.address.trim(),
      installments: updateInstallments.map((inst, idx) => ({
        installment_number: Number(inst.installment_number || idx + 1),
        amount: Number(inst.amount) || 0,
        due_date: inst.due_date ? String(inst.due_date).split("T")[0] : new Date().toISOString().split("T")[0],
      })),
    };

    try {
      await updateBranchAdminCourseEnrollmentApi(courseId, enrollmentId, payload, token);
      setUpdateSuccess(`Registration for ${payload.name} updated successfully!`);

      const refreshedAdmissions = await getBranchAdmissionsApi(token);
      if (Array.isArray(refreshedAdmissions)) {
        setAdmissions(refreshedAdmissions);
        const updated = refreshedAdmissions.find((a) => (a.enrollment_id || a.id) === enrollmentId);
        if (updated) {
          setSelectedAdmissionForUpdate(updated);
          populateUpdateForm(updated);
        }
      }
    } catch (err) {
      setUpdateError(err.message || "Failed to update registration.");
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !form.courseId) return;
    let isMounted = true;
    const fetchCourseDetails = async () => {
      try {
        const details = await getMyCourseApi(form.courseId, token);
        if (isMounted) {
          setSelectedCourseDetails(details);
          const fee = Number(details.price) || 0;
          let terms = details?.installment_terms;
          if (typeof terms === "string") {
            try {
              terms = JSON.parse(terms);
            } catch {
              terms = [];
            }
          }
          if (Array.isArray(terms) && terms.length > 0) {
            setEditableInstallments(
              terms.map((t, idx) => ({
                term_number: Number(t.term_number || t.installment_number || idx + 1),
                amount: Number(t.amount) || 0,
                due_date: t.due_date ? String(t.due_date).slice(0, 10) : "",
              }))
            );
          } else if (details?.installment_count > 0) {
            const count = Number(details.installment_count);
            const amt = Math.round(fee / count);
            const today = new Date();
            const generatedTerms = Array.from({ length: count }, (_, i) => {
              const dueDate = new Date(today);
              dueDate.setMonth(today.getMonth() + i);
              return {
                term_number: i + 1,
                amount: amt,
                due_date: dueDate.toISOString().slice(0, 10),
              };
            });
            const totalSoFar = amt * (count - 1);
            generatedTerms[count - 1].amount = fee - totalSoFar;
            setEditableInstallments(generatedTerms);
          } else {
            setEditableInstallments([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course details:", err);
      }
    };
    fetchCourseDetails();
    return () => {
      isMounted = false;
    };
  }, [form.courseId, token]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadPageData = async () => {
      setLoading(true);
      setError("");
      try {
        const [courseResult, admissionResult] = await Promise.allSettled([
          getMyCoursesApi(token),
          getBranchAdmissionsApi(token),
        ]);
        if (!isMounted) return;
        const availableCourses = courseResult.status === "fulfilled" && Array.isArray(courseResult.value)
          ? courseResult.value
          : [];
        setCourses(availableCourses);
        setAdmissions(
          admissionResult.status === "fulfilled" && Array.isArray(admissionResult.value)
            ? admissionResult.value
            : [],
        );
        setForm((current) => {
          if (current.courseId || availableCourses.length === 0) return current;
          const firstCourse = availableCourses[0];
          return {
            ...current,
            courseId: String(firstCourse.id),
            paymentAmount: String(firstCourse.price || ""),
          };
        });
        const loadErrors = [courseResult, admissionResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason?.message)
          .filter(Boolean);
        if (loadErrors.length) setError(loadErrors.join(" "));
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load courses and admissions.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPageData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const selectedCourse = courses.find(
    (course) => String(course.id) === String(form.courseId),
  );
  const installmentCount = Number(selectedCourse?.installment_count) || 0;
  const installmentSchedule = selectedCourse?.installment_schedule || "";
  const hasInstallments = installmentCount > 0 && Boolean(installmentSchedule);
  const courseFee = Number(selectedCourse?.price) || 0;
  const currentPayment = Number(form.paymentAmount) || 0;

  const updateField = (event) => {
    const { name, value } = event.target;
    setSuccess("");
    setError("");
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "courseId"
        ? (() => {
            const nextCourse = courses.find((course) => String(course.id) === value);
            const nextCourseHasInstallments =
              Number(nextCourse?.installment_count) > 0 &&
              Boolean(nextCourse?.installment_schedule);
            const nextPaymentPlan = nextCourseHasInstallments
              ? current.paymentPlan
              : "full";
            return {
              paymentPlan: nextPaymentPlan,
              paymentAmount: String(
                nextPaymentPlan === "installment"
                  ? Math.round(
                      Number(nextCourse?.price || 0) /
                        Number(nextCourse?.installment_count || 1),
                    )
                  : Number(nextCourse?.price || 0),
              ),
            };
          })()
        : {}),
    }));
    if (name === "courseId") {
      setRegistrationPayment({
        term_number: 1,
        cash_amount: "",
        upi_amount: "",
        upi_transaction_id: "",
        status: "received",
      });
    }
  };

  const changePaymentPlan = (paymentPlan) => {
    setError("");
    setSuccess("");
    setForm((current) => ({
      ...current,
      paymentPlan,
    }));
    setRegistrationPayment({
      term_number: 1,
      cash_amount: "",
      upi_amount: "",
      upi_transaction_id: "",
      status: "received",
    });
    if (paymentPlan === "installment" && editableInstallments.length === 0 && installmentCount > 0) {
      const amt = Math.round(courseFee / installmentCount);
      const today = new Date();
      const generated = Array.from({ length: installmentCount }, (_, i) => {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + i);
        return {
          term_number: i + 1,
          amount: i === installmentCount - 1 ? courseFee - amt * (installmentCount - 1) : amt,
          due_date: dueDate.toISOString().slice(0, 10),
        };
      });
      setEditableInstallments(generated);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedCourse) {
      setError("Select a course before registering the student.");
      scrollToError();
      return;
    }

    if (!form.password || form.password.length < 8) {
      setError("Student account password must be at least 8 characters long.");
      scrollToError();
      return;
    }

    const isInstallment = form.paymentPlan === "installment";
    const isPaymentReceived = registrationPayment.status === "received";

    if (isInstallment) {
      if (editableInstallments.length === 0) {
        setError("No installments configured for this course. Please switch to Full payment or configure installments.");
        scrollToError();
        return;
      }
      const totalInst = editableInstallments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      if (totalInst !== courseFee) {
        setError(`The sum of all installments (${formatCurrency(totalInst)}) must equal the course fee (${formatCurrency(courseFee)}).`);
        scrollToError();
        return;
      }
      const hasInvalidTerm = editableInstallments.some(t => !t.due_date || Number(t.amount) <= 0);
      if (hasInvalidTerm) {
        setError("All installment terms must have a valid due date and an amount greater than zero.");
        scrollToError();
        return;
      }
    }

    const cashAmt = Number(registrationPayment.cash_amount) || 0;
    const upiAmt = Number(registrationPayment.upi_amount) || 0;
    const totalPay = cashAmt + upiAmt;

    if (isPaymentReceived) {
      if (totalPay <= 0) {
        setError("Enter a payment amount greater than zero when status is received.");
        scrollToError();
        return;
      }
      if (isInstallment) {
        const selectedTerm = editableInstallments.find(t => t.term_number === registrationPayment.term_number);
        if (selectedTerm && totalPay !== Number(selectedTerm.amount)) {
          setError(`Cash + UPI (${formatCurrency(totalPay)}) must equal Term ${selectedTerm.term_number}'s full amount (${formatCurrency(selectedTerm.amount)}).`);
          scrollToError();
          return;
        }
      } else {
        if (totalPay !== courseFee) {
          setError(`Cash + UPI (${formatCurrency(totalPay)}) must equal the course fee (${formatCurrency(courseFee)}).`);
          scrollToError();
          return;
        }
      }

      if (upiAmt > 0 && !registrationPayment.upi_transaction_id?.trim()) {
        setError("UPI Transaction ID is required when paying with UPI.");
        scrollToError();
        return;
      }
    }

    setSaving(true);
    let createdAdmission;
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        parent_name: form.guardianName.trim(),
        parent_phone: form.guardianPhone.trim(),
        highest_qualification: form.qualification.trim(),
        address: form.address.trim(),
        password: form.password,
        course_id: Number(selectedCourse.id),
        installments: isInstallment && editableInstallments.length > 0
          ? editableInstallments.map((t, idx) => ({
              installment_number: Number(t.term_number || idx + 1),
              amount: Number(t.amount) || 0,
              due_date: t.due_date ? String(t.due_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            }))
          : null,
        first_installment_amount: null,
        payment_status: isPaymentReceived ? "received" : "not_received",
        cash_amount: isPaymentReceived ? cashAmt : 0,
        upi_amount: isPaymentReceived ? upiAmt : 0,
        upi_transaction_id: isPaymentReceived && upiAmt > 0
          ? registrationPayment.upi_transaction_id.trim()
          : null,
        installment_number: isInstallment && isPaymentReceived
          ? (Number(registrationPayment.term_number) || 1)
          : null,
        payment_date: isPaymentReceived
          ? new Date().toISOString().slice(0, 10)
          : null,
      };

      createdAdmission = await createBranchAdmissionApi(payload, token);

      const hasReceipt =
        createdAdmission?.receipt ||
        createdAdmission?.receipt_url ||
        createdAdmission?.receipt_id ||
        createdAdmission?.receipt_number ||
        (registrationPayment.status === "received" && totalPay > 0);

      let receiptObj = null;
      if (hasReceipt) {
        receiptObj = createdAdmission?.receipt || {
          ...createdAdmission,
          receipt_url: createdAdmission?.receipt_url,
          download_url: createdAdmission?.download_url,
          receipt_id: createdAdmission?.receipt_id || (createdAdmission?.receipt_url ? String(createdAdmission.receipt_url).split('/').pop() : null),
          receipt_number: createdAdmission?.receipt_number || createdAdmission?.receipt_id || `REC-${Date.now().toString().slice(-4)}`,
          student_name: createdAdmission?.name || form.name.trim(),
          student_phone: createdAdmission?.phone || form.phone.trim(),
          student_email: createdAdmission?.email || form.email.trim(),
          course_title: selectedCourse?.title || "Course",
          course_fee: courseFee,
          amount_paid: (isPaymentReceived ? totalPay : 0) || createdAdmission?.amount || createdAdmission?.paid_amount,
          amount: (isPaymentReceived ? totalPay : 0) || createdAdmission?.amount || createdAdmission?.paid_amount,
          payment_method: cashAmt > 0 && upiAmt > 0 ? "split" : cashAmt > 0 ? "cash" : "upi",
          payment_type: isInstallment ? "installment" : "full",
          installment_number: isInstallment && isPaymentReceived ? registrationPayment.term_number : null,
          cash_amount: cashAmt,
          upi_amount: upiAmt,
          upi_transaction_id: isPaymentReceived && upiAmt > 0 ? (registrationPayment.upi_transaction_id?.trim() || null) : null,
          payment_date: new Date().toISOString(),
        };
        setRegistrationReceipt(receiptObj);
      }

      try {
        const updatedAdmissions = await getBranchAdmissionsApi(token);
        setAdmissions(Array.isArray(updatedAdmissions) ? updatedAdmissions : []);
      } catch {
        setAdmissions((current) => [createdAdmission, ...current]);
      }
      setSuccess(`${createdAdmission.name} registered successfully.${receiptObj ? " Payment receipt generated!" : ""}`);
      setActiveTab("registrations");
      setForm({
        ...INITIAL_FORM,
        courseId: String(selectedCourse.id),
        paymentAmount: String(courseFee),
      });
      setRegistrationPayment({
        term_number: 1,
        cash_amount: "",
        upi_amount: "",
        upi_transaction_id: "",
        status: "received",
      });
    } catch (err) {
      if (createdAdmission) {
        setError(`Student was registered, but payment could not be recorded: ${err.message}`);
        setActiveTab("registrations");
        try {
          const updatedAdmissions = await getBranchAdmissionsApi(token);
          setAdmissions(Array.isArray(updatedAdmissions) ? updatedAdmissions : []);
        } catch {
          setAdmissions((current) => [createdAdmission, ...current]);
        }
      } else {
        setError(err.message || "Failed to register student.");
      }
      scrollToError();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen md:flex" style={{ ...sans, background: "#faf8f4", color: "#17140f" }}>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="registration"
      />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-[68px] sm:h-[92px] items-center justify-between gap-2 border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-3.5 sm:px-6 lg:px-10 backdrop-blur-md sm:px-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
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
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                Student Registration
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {user?.branch_name || "Branch Administrator"}
              </p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
              style={{ background: "#17140f", color: "#f4b942" }}
              aria-hidden="true"
            >
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
            <NavLogoutButton redirectTo="/branch-admin-login" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8 sm:px-10">
          {error && (
            <div
              ref={errorRef}
              role="alert"
              className="flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 font-bold mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 text-[#7c3324] hover:opacity-75"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {success && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
            >
              <Check className="h-4 w-4" /> {success}
            </div>
          )}

          <div
            className="flex gap-1 border-b"
            role="tablist"
            aria-label="Student registration views"
            style={{ borderColor: "#e3ddd0" }}
          >
            {[
              { id: "registration", label: "Registration" },
              { id: "registrations", label: `Registrations (${admissions.length})` },
              { id: "update", label: "Update Installment Details" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${tab.id}-tab`}
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-panel`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "update" && !selectedAdmissionForUpdate && admissions.length > 0) {
                      setSelectedAdmissionForUpdate(admissions[0]);
                      populateUpdateForm(admissions[0]);
                    }
                  }}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors ${FOCUS_RING}`}
                  style={{ color: isActive ? "#7a531f" : "#8a8175" }}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full"
                      style={{ background: "#9c6b2e" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "registration" && (
            <div id="registration-panel" role="tabpanel" aria-labelledby="registration-tab">
          <form
            onSubmit={submit}
            className="overflow-hidden rounded-xl"
            style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
          >
            <section className="p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl" style={{ ...serif, fontWeight: 500 }}>Student details</h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>Student identity and course registration</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Student full name
                  <input name="name" required value={form.name} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="Student name" />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Phone number
                  <input name="phone" type="tel" required value={form.phone} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="+91 90000 00000" />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Email address
                  <input name="email" type="email" required value={form.email} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="student@example.com" />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Parent / guardian name
                  <input name="guardianName" required value={form.guardianName} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Parent / guardian phone
                  <input name="guardianPhone" required type="tel" value={form.guardianPhone} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Highest qualification
                  <input name="qualification" required value={form.qualification} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm sm:col-span-2" style={{ color: "#5b5346" }}>
                  Address
                  <textarea name="address" required rows="2" value={form.address} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  <div className="flex items-center justify-between">
                    <span>Student account password</span>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          form.password && form.password.length < 8
                            ? "#c25438"
                            : form.password && form.password.length >= 8
                            ? "#39533a"
                            : "#8a8175",
                      }}
                    >
                      {form.password
                        ? `${form.password.length}/8 min characters`
                        : "Min. 8 characters required"}
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      minLength="8"
                      required
                      placeholder="Minimum 8 characters (e.g. 12345678)"
                      value={form.password}
                      onChange={updateField}
                      className={INPUT_CLASS}
                      style={{ ...INPUT_STYLE, paddingRight: "40px", marginTop: 0 }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "#8a8175" }}>
                    Student will use this password to sign in to their portal. Must be at least 8 characters.
                  </p>
                </label>
                <label className="block text-sm sm:col-span-2" style={{ color: "#5b5346" }}>
                  Course purchased
                  <select
                    name="courseId"
                    required
                    disabled={loading || courses.length === 0}
                    value={form.courseId}
                    onChange={updateField}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="" disabled>
                      {loading ? "Loading courses…" : "Select a course"}
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} · {formatCurrency(course.price)}
                      </option>
                    ))}
                  </select>
                  {selectedCourse && (
                    <span className="mt-2 block text-xs" style={{ color: "#8a8175" }}>
                      {selectedCourse.start_date || "Start date unavailable"} to {selectedCourse.end_date || "End date unavailable"}
                      {hasInstallments && ` · ${installmentCount} ${installmentSchedule} installments`}
                    </span>
                  )}
                </label>
              </div>
            </section>

            <section className="grid gap-7 border-t p-5 sm:grid-cols-2 sm:p-7" style={{ borderColor: "#e3ddd0", background: "#fdfcf9" }}>
              <div className="space-y-5">
                <ChoiceGroup
                  label="Payment plan"
                  value={form.paymentPlan}
                  onChange={changePaymentPlan}
                  options={[
                    { value: "full", label: "Full amount" },
                    ...(hasInstallments
                      ? [{ value: "installment", label: "Installments" }]
                      : []),
                  ]}
                />

                {form.paymentPlan === "installment" && (
                  <div className="space-y-4">
                    <div className="rounded-lg px-4 py-3" style={{ background: "#f7efe0", border: "1px solid #ead9bc" }}>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs" style={{ color: "#8a6d43" }}>Course installment plan</p>
                          <p className="mt-1 text-sm font-medium" style={{ color: "#5b4529" }}>
                            {installmentCount} installments · {installmentSchedule}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-[3.5rem_1fr_1fr] gap-3 text-xs font-medium pb-2" style={{ color: "#8a6d43", borderBottom: "1px solid #ead9bc" }}>
                          <div>Term</div>
                          <div>Due date</div>
                          <div>Amount</div>
                        </div>
                        {editableInstallments.map((term, idx) => (
                          <div key={term.term_number} className="grid grid-cols-[3.5rem_1fr_1fr] gap-3 items-center">
                            <div className="text-sm font-medium" style={{ color: "#5b4529" }}>{term.term_number}</div>
                            <input
                              type="date"
                              required
                              value={term.due_date ? String(term.due_date).slice(0, 10) : ""}
                              onChange={(e) => {
                                setError("");
                                const newInst = [...editableInstallments];
                                newInst[idx].due_date = e.target.value;
                                setEditableInstallments(newInst);
                              }}
                              className={INPUT_CLASS}
                              style={{ ...INPUT_STYLE, padding: '6px 8px' }}
                            />
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                              <input
                                type="number"
                                min="0"
                                required
                                value={term.amount === 0 ? "" : term.amount}
                                onChange={(e) => {
                                  const newInst = [...editableInstallments];
                                  newInst[idx].amount = Number(e.target.value) || 0;
                                  setEditableInstallments(newInst);
                                }}
                                className={INPUT_CLASS}
                                style={{ ...INPUT_STYLE, padding: '6px 8px 6px 24px' }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs pt-3 mt-2" style={{ borderTop: "1px dashed #ead9bc" }}>
                          <span style={{ color: editableInstallments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) === courseFee ? "#39533a" : "#7c3324" }}>
                            Total (Must equal {formatCurrency(courseFee)})
                          </span>
                          <span className="font-semibold text-sm" style={{ color: "#5b4529" }}>
                            {formatCurrency(editableInstallments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-5 border-t" style={{ borderColor: "#e3ddd0" }}>
                  <h3 className="text-sm font-medium" style={{ color: "#5b5346" }}>Payment at registration</h3>
                  <ChoiceGroup
                    label="Status"
                    value={registrationPayment.status}
                    onChange={(value) => {
                      setSuccess(""); setError("");
                      setRegistrationPayment(prev => ({ ...prev, status: value }));
                    }}
                    options={[
                      { value: "received", label: "Received" },
                      { value: "not-received", label: "Not received" },
                    ]}
                  />
                  {registrationPayment.status === "received" && (
                    <div className="space-y-4 mt-4">
                      {form.paymentPlan === "installment" && (
                        <label className="block text-sm" style={{ color: "#5b5346" }}>
                          Paying for Term
                          <select
                            value={registrationPayment.term_number}
                            onChange={(e) => {
                              setError("");
                              setRegistrationPayment(prev => ({ ...prev, term_number: Number(e.target.value) }));
                            }}
                            className={INPUT_CLASS}
                            style={INPUT_STYLE}
                          >
                            {editableInstallments.map(term => (
                              <option key={term.term_number} value={term.term_number}>
                                Term {term.term_number} — {formatCurrency(term.amount)} (Due: {formatDate(term.due_date)})
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <label className="block text-sm" style={{ color: "#5b5346" }}>
                          Cash Amount
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                            <input
                              type="number"
                              min="0"
                              value={registrationPayment.cash_amount}
                              onChange={(e) => {
                                setError("");
                                setRegistrationPayment(prev => ({ ...prev, cash_amount: e.target.value }));
                              }}
                              className={INPUT_CLASS}
                              style={{ ...INPUT_STYLE, paddingLeft: '28px', marginTop: 0 }}
                              placeholder="0"
                            />
                          </div>
                        </label>
                        <label className="block text-sm" style={{ color: "#5b5346" }}>
                          UPI Amount
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                            <input
                              type="number"
                              min="0"
                              value={registrationPayment.upi_amount}
                              onChange={(e) => {
                                setError("");
                                setRegistrationPayment(prev => ({ ...prev, upi_amount: e.target.value }));
                              }}
                              className={INPUT_CLASS}
                              style={{ ...INPUT_STYLE, paddingLeft: '28px', marginTop: 0 }}
                              placeholder="0"
                            />
                          </div>
                        </label>
                      </div>

                      {Number(registrationPayment.upi_amount) > 0 && (
                        <label className="block text-sm" style={{ color: "#5b5346" }}>
                          <span className="flex items-center justify-between">
                            <span>UPI Transaction ID</span>
                            <span className="text-xs text-amber-700 font-medium">Required for UPI payment</span>
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="Enter 12-digit UPI reference / transaction ID (e.g. 123456789012)"
                            value={registrationPayment.upi_transaction_id || ""}
                            onChange={(e) => {
                              setError("");
                              setRegistrationPayment(prev => ({ ...prev, upi_transaction_id: e.target.value }));
                            }}
                            className={INPUT_CLASS}
                            style={INPUT_STYLE}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <aside className="rounded-lg p-5" style={{ background: "#f7efe0", border: "1px solid #ead9bc" }}>
                <h3 className="text-base" style={{ ...serif, fontWeight: 500 }}>Payment summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt style={{ color: "#7a6b55" }}>Course fee</dt>
                    <dd className="text-right font-medium">{formatCurrency(courseFee)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt style={{ color: "#7a6b55" }}>Plan</dt>
                    <dd className="text-right font-medium">
                      {form.paymentPlan === "full"
                        ? "Full payment"
                        : `${installmentCount} installments · ${installmentSchedule}`}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt style={{ color: "#7a6b55" }}>Payment status</dt>
                    <dd className="text-right font-medium" style={{ color: registrationPayment.status === "received" ? "#39533a" : "#8a571f" }}>
                      {registrationPayment.status === "received" ? "Received" : "Not received"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-t pt-3" style={{ borderColor: "#ead9bc" }}>
                    <dt style={{ color: "#7a6b55" }}>Amount received</dt>
                    <dd className="flex items-center gap-1 text-right text-lg font-semibold" style={{ color: "#7a531f" }}>
                      <IndianRupee className="h-4 w-4" />
                      {formatCurrency(registrationPayment.status === "received" ? (Number(registrationPayment.cash_amount) || 0) + (Number(registrationPayment.upi_amount) || 0) : 0).replace("₹", "")}
                    </dd>
                  </div>
                </dl>
                {error && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-lg p-3 text-xs font-semibold"
                    style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
                  >
                    <span className="shrink-0 font-bold mt-0.5">⚠️</span>
                    <span className="flex-1 leading-relaxed">{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={saving || loading || !selectedCourse || courses.length === 0}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#30291f] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
                  style={{ background: "#17140f" }}
                >
                  <UserPlus className="h-4 w-4" style={{ color: "#f4b942" }} />
                  {saving ? "Registering…" : "Register student"}
                </button>
              </aside>
            </section>
          </form>
            </div>
          )}

          {activeTab === "registrations" && (
          <section id="registrations-panel" role="tabpanel" aria-labelledby="registrations-tab">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl" style={{ ...serif, fontWeight: 500 }}>Recent registrations</h2>
                <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                  {admissions.length} admissions from this branch
                </p>
              </div>
            </div>
            {loading ? (
              <div className="rounded-xl px-5 py-12 text-center text-sm" style={{ background: "#ffffff", border: "1px solid #e3ddd0", color: "#8a8175" }}>
                Loading courses and admissions…
              </div>
            ) : admissions.length === 0 ? (
              <div className="rounded-xl px-5 py-12 text-center text-sm" style={{ background: "#ffffff", border: "1px solid #e3ddd0", color: "#8a8175" }}>
                No admissions have been registered for this branch yet.
              </div>
            ) : (
              <div className="space-y-3">
                {admissions.map((admission) => {
                  const payments = Array.isArray(admission.payments) ? admission.payments : [];
                  const latestPayment = payments[payments.length - 1];
                  const totalPaid = Number(admission.total_paid) || 0;
                  const rawStatus = String(admission.status || "").toLowerCase();
                  const paymentStatus = totalPaid > 0
                    ? "Received"
                    : ["not_received", "pending", "unpaid"].includes(rawStatus)
                      ? "Not received"
                      : admission.status || "Unknown";
                  const paymentMethod = latestPayment
                    ? Number(latestPayment.cash_amount) > 0 && Number(latestPayment.upi_amount) > 0
                      ? "Cash + UPI"
                      : Number(latestPayment.cash_amount) > 0
                        ? "Cash"
                        : Number(latestPayment.upi_amount) > 0
                          ? "UPI"
                          : "Payment recorded"
                    : "No payment recorded";

                  return (
                    <article key={admission.enrollment_id} className="rounded-xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}>
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <h3 className="text-lg font-medium">{admission.name}</h3>
                          <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>{admission.course_title}</p>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "#5b5346" }}>
                            {admission.phone && (
                              <a className="flex items-center gap-1.5 hover:underline" href={`tel:${admission.phone.replaceAll(" ", "")}`}>
                                <Phone className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} /> {admission.phone}
                              </a>
                            )}
                            {admission.email && (
                              <a className="flex items-center gap-1.5 hover:underline" href={`mailto:${admission.email}`}>
                                <Mail className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} /> {admission.email}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              background: paymentStatus === "Received" ? "#eef2ea" : "#f7efe0",
                              color: paymentStatus === "Received" ? "#39533a" : "#7a531f",
                            }}
                          >
                            {paymentStatus}
                          </span>

                        </div>
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3 lg:grid-cols-6" style={{ borderColor: "#efe9dd" }}>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Course fee</dt>
                          <dd className="mt-1 text-sm font-medium">{formatCurrency(admission.total_fee)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Paid</dt>
                          <dd className="mt-1 text-sm font-medium">{formatCurrency(totalPaid)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Balance</dt>
                          <dd className="mt-1 text-sm font-medium">{formatCurrency(admission.balance_amount)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Payment plan</dt>
                          <dd className="mt-1 text-sm font-medium">
                            {Number(admission.installment_count) > 1
                              ? `${admission.installment_count} installments${admission.installment_schedule ? ` · ${admission.installment_schedule}` : ""}`
                              : "Full payment"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Latest payment</dt>
                          <dd className="mt-1 text-sm font-medium">
                            {latestPayment ? `${paymentMethod} · ${formatCurrency(latestPayment.amount)}` : paymentMethod}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Admission date</dt>
                          <dd className="mt-1 text-sm font-medium">{formatDate(admission.admission_date)}</dd>
                        </div>
                      </dl>

                      <div className="mt-5 grid gap-5 border-t pt-4 lg:grid-cols-[minmax(180px,1fr)_2fr]" style={{ borderColor: "#efe9dd" }}>
                        <section>
                          <h4 className="text-xs font-medium" style={{ color: "#a39a8c" }}>Parent / guardian</h4>
                          <p className="mt-1 text-sm font-medium">{admission.parent_name || "Not provided"}</p>
                          {admission.parent_phone ? (
                            <a
                              className="mt-1 inline-flex items-center gap-1.5 text-sm hover:underline"
                              style={{ color: "#5b5346" }}
                              href={`tel:${admission.parent_phone.replaceAll(" ", "")}`}
                            >
                              <Phone className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                              {admission.parent_phone}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>Phone not provided</p>
                          )}
                        </section>

                        <section className="min-w-0">
                          <h4 className="text-xs font-medium" style={{ color: "#a39a8c" }}>
                            Payment details ({payments.length})
                          </h4>
                          {payments.length === 0 ? (
                            <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>No payment entries returned.</p>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {payments.map((payment, index) => (
                                <div
                                  key={payment.id || `${admission.enrollment_id}-${index}`}
                                  className="grid gap-2 rounded-lg px-3 py-2 sm:grid-cols-2 lg:grid-cols-4"
                                  style={{ background: "#faf8f4", border: "1px solid #efe9dd" }}
                                >
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Installment</p>
                                    <p className="mt-0.5 text-sm font-medium">
                                      {payment.installment_number || "Full payment"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Date</p>
                                    <p className="mt-0.5 text-sm font-medium">{formatDate(payment.payment_date)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Cash / UPI</p>
                                    <p className="mt-0.5 text-sm font-medium">
                                      {formatCurrency(payment.cash_amount)} / {formatCurrency(payment.upi_amount)}
                                    </p>
                                    {payment.upi_transaction_id && (
                                      <p className="text-[11px] font-mono mt-0.5" style={{ color: "#8a6d43" }}>
                                        Ref: {payment.upi_transaction_id}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Total · status</p>
                                    <p className="mt-0.5 text-sm font-medium">
                                      {formatCurrency(payment.amount)} · {payment.status || "Unknown"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          )}

          {activeTab === "update" && (
            <section
              role="tabpanel"
              id="update-panel"
              aria-labelledby="update-tab"
              className="space-y-6"
            >
              {/* Header with Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-medium" style={{ ...serif, color: "#17140f" }}>
                    Update Installment Details
                  </h2>
                  <p className="mt-1 text-sm text-[#8a8175]">
                    Select any enrolled student to view full details and update their installment breakdown.
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8175]" />
                  <input
                    type="text"
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                    placeholder="Search students, course..."
                    className="w-full rounded-xl bg-white border pl-10 pr-4 py-2.5 text-xs text-[#17140f] placeholder-[#a39a8c] focus:outline-none focus:border-[#9c6b2e]"
                    style={{ borderColor: "#e3ddd0" }}
                  />
                </div>
              </div>

              {enrollmentsLoading ? (
                <div
                  className="overflow-hidden rounded-2xl bg-white border border-[#e3ddd0] p-6 space-y-4"
                  aria-busy="true"
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-[#efe9dd] last:border-b-0 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-[#f1ede4] shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-44 rounded bg-[#f1ede4]" />
                        <div className="h-3 w-64 rounded bg-[#f1ede4]" />
                      </div>
                      <div className="h-8 w-20 rounded bg-[#f1ede4]" />
                    </div>
                  ))}
                </div>
              ) : enrollmentsError ? (
                <div className="rounded-2xl p-6 text-center bg-white border border-[#e3ddd0]">
                  <p className="text-sm text-rose-700 font-medium">{enrollmentsError}</p>
                  <button
                    type="button"
                    onClick={() => fetchBranchEnrollments()}
                    className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#9c6b2e]"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredEnrollments.length === 0 ? (
                <div className="rounded-2xl px-6 py-16 text-center border border-dashed border-[#dfc9a9] bg-white">
                  <Search className="mx-auto h-8 w-8 text-[#d9b77b]" />
                  <h3 className="mt-3 text-lg font-bold text-[#17140f]" style={serif}>
                    No Students Found
                  </h3>
                  <p className="mt-1 text-sm text-[#8a8175] max-w-sm mx-auto">
                    {enrollmentSearch
                      ? `No student records match "${enrollmentSearch}". Try searching with a different name or course.`
                      : "No enrollments found for this branch."}
                  </p>
                  {enrollmentSearch && (
                    <button
                      type="button"
                      onClick={() => setEnrollmentSearch("")}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#9c6b2e]"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden overflow-hidden rounded-2xl bg-white border border-[#e3ddd0] md:block shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[920px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#e3ddd0] bg-[#faf8f4]">
                            {["Student", "Course", "Contact", "Account Access", "Fee Balance", "Details"].map(
                              (h, i) => (
                                <th
                                  key={i}
                                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#8a8175] ${
                                    h === "Details" ? "text-right" : ""
                                  }`}
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#efe9dd]">
                          {filteredEnrollments.map((enrollment) => {
                            const studentId =
                              enrollment.student_id ??
                              enrollment.user_id ??
                              enrollment.id ??
                              enrollment.enrollment_id;
                            const isActive = isStudentActive(enrollment);
                            const isUpdating = statusUpdatingId === studentId;
                            const balance = Number(
                              enrollment.balance_amount ?? enrollment.remaining_amount ?? 0
                            );

                            return (
                              <tr key={enrollment.enrollment_id || enrollment.id} className="align-top hover:bg-[#faf8f4] transition">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={enrollment.name} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-[#17140f]">
                                        {enrollment.name || "Unnamed student"}
                                      </p>
                                      <p className="text-xs text-[#8a8175]">
                                        #{enrollment.enrollment_id || enrollment.id}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <p className="font-semibold text-[#17140f] text-xs">
                                    {enrollment.course_title || "Course unavailable"}
                                  </p>
                                  <p className="text-[11px] text-[#8a8175] mt-0.5">
                                    {enrollment.course_duration || "Standard"}
                                  </p>
                                </td>

                                <td className="px-6 py-4 text-xs text-[#5b5346]">
                                  <p className="truncate max-w-[180px]">{enrollment.email || "—"}</p>
                                  <p className="text-[#8a8175] mt-0.5">{enrollment.phone || "—"}</p>
                                </td>

                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() =>
                                        handleToggleStudentStatus(
                                          enrollment,
                                          isActive ? "Inactive" : "Active"
                                        )
                                      }
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isActive ? "bg-emerald-600" : "bg-stone-300"
                                      } ${isUpdating ? "opacity-60 cursor-not-allowed" : ""}`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                          isActive ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      >
                                        {isUpdating && (
                                          <Loader2 className="h-3 w-3 animate-spin text-stone-500" />
                                        )}
                                      </span>
                                    </button>
                                    <span
                                      className={`text-xs font-semibold capitalize ${
                                        isActive ? "text-emerald-700" : "text-[#8a8175]"
                                      }`}
                                    >
                                      {isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  {balance > 0 ? (
                                    <div>
                                      <span className="font-bold text-rose-600 text-sm">
                                        {formatCurrency(balance)}
                                      </span>
                                      <span className="text-[11px] text-[#8a8175] block">
                                        of {formatCurrency(enrollment.total_fee)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      ✓ Paid
                                    </span>
                                  )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedEnrollmentForModal(enrollment)}
                                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5b5346] hover:bg-stone-100 transition cursor-pointer"
                                    >
                                      <Eye className="h-3 w-3" /> View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="space-y-4 md:hidden">
                    {filteredEnrollments.map((enrollment) => {
                      const studentId =
                        enrollment.student_id ??
                        enrollment.user_id ??
                        enrollment.id ??
                        enrollment.enrollment_id;
                      const isActive = isStudentActive(enrollment);
                      const isUpdating = statusUpdatingId === studentId;
                      const balance = Number(
                        enrollment.balance_amount ?? enrollment.remaining_amount ?? 0
                      );

                      return (
                        <div
                          key={enrollment.enrollment_id || enrollment.id}
                          className="rounded-2xl bg-white border border-[#e3ddd0] p-4 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={enrollment.name} />
                              <div>
                                <p className="font-bold text-[#17140f] text-sm">
                                  {enrollment.name || "Unnamed student"}
                                </p>
                                <p className="text-xs text-[#8a8175]">
                                  #{enrollment.enrollment_id || enrollment.id}
                                </p>
                              </div>
                            </div>
                            {balance > 0 ? (
                              <span className="text-xs font-bold text-rose-600">
                                {formatCurrency(balance)}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Paid
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[#5b5346] border-t border-[#efe9dd] pt-2 space-y-1">
                            <p className="font-medium text-[#17140f]">{enrollment.course_title}</p>
                            <p className="text-[#8a8175]">{enrollment.email} • {enrollment.phone}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#efe9dd] pt-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleToggleStudentStatus(
                                    enrollment,
                                    isActive ? "Inactive" : "Active"
                                  )
                                }
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                  isActive ? "bg-emerald-600" : "bg-stone-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                    isActive ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                              <span className="text-xs text-[#8a8175] capitalize">
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedEnrollmentForModal(enrollment)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5b5346] bg-stone-100 hover:bg-stone-200 transition"
                            >
                              <Eye className="h-3 w-3" /> View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>

      {selectedEnrollmentForModal && (
        <StudentInstallmentModal
          enrollment={selectedEnrollmentForModal}
          onClose={() => setSelectedEnrollmentForModal(null)}
          token={token}
          courses={courses}
          onToggleStatus={handleToggleStudentStatus}
          statusUpdatingId={statusUpdatingId}
          onUpdateSuccess={handleUpdateInstallmentSuccess}
        />
      )}

      {selectedAdmissionForPayment && (() => {
        const admission = selectedAdmissionForPayment;
        // Use the installments array from BranchAdmissionResponse which has all pre-computed fields
        const installments = Array.isArray(admission.installments) ? admission.installments : [];
        const payments = admission.payments || [];
        
        const totalFee = Number(admission.total_fee) || 0;
        const totalPaid = Number(admission.total_paid) || 0;
        const balance = Number(admission.balance_amount) || 0;
        const isFullyPaid = balance <= 0;
        
        const totalInstallments = Number(admission.installment_count) || 1;
        
        // Build termDetails directly from the API's installments array
        const termDetails = installments.map(inst => {
          const paidAmount = Number(inst.paid_amount) || 0;
          const isTermPaid = String(inst.status).toLowerCase() === "paid" || paidAmount >= Number(inst.amount);
          const pCash = Number(inst.cash_amount) || 0;
          const pUpi = Number(inst.upi_amount) || 0;
          let paymentMethod = "No payment recorded";
          if (pCash > 0 && pUpi > 0) paymentMethod = `Cash: ${formatCurrency(pCash)} + UPI: ${formatCurrency(pUpi)}`;
          else if (pCash > 0) paymentMethod = `Cash: ${formatCurrency(pCash)}`;
          else if (pUpi > 0) paymentMethod = inst.upi_transaction_id ? `UPI: ${formatCurrency(pUpi)} (Ref: ${inst.upi_transaction_id})` : `UPI: ${formatCurrency(pUpi)}`;
          else if (paidAmount > 0) paymentMethod = "Recorded";
          return {
            term_number: inst.installment_number,
            amount: Number(inst.amount),
            paidAmount,
            remaining: Number(inst.remaining_amount),
            dueDate: inst.due_date,
            paidDate: inst.paid_date || null,
            paymentMethod,
            isPaid: isTermPaid,
            isDue: inst.is_due,
          };
        });

        // If installments array is empty (full payment plan), synthesize one row
        if (termDetails.length === 0 && totalInstallments <= 1) {
          termDetails.push({
            term_number: 1,
            amount: totalFee,
            paidAmount: totalPaid,
            remaining: balance,
            dueDate: null,
            paidDate: payments[0]?.payment_date || null,
            paymentMethod: (() => {
              const p = payments[0];
              if (!p) return "No payment recorded";
              const pCash = Number(p.cash_amount) || 0;
              const pUpi = Number(p.upi_amount) || 0;
              if (pCash > 0 && pUpi > 0) return `Cash: ${formatCurrency(pCash)} + UPI: ${formatCurrency(pUpi)}`;
              if (pCash > 0) return `Cash: ${formatCurrency(pCash)}`;
              if (pUpi > 0) return p.upi_transaction_id ? `UPI: ${formatCurrency(pUpi)} (Ref: ${p.upi_transaction_id})` : `UPI: ${formatCurrency(pUpi)}`;
              return "Recorded";
            })(),
            isPaid: balance <= 0,
            isDue: false,
          });
        }

        const paidCount = Number(admission.terms_paid) || termDetails.filter(t => t.isPaid).length;
        const dueCount = Number(admission.due_installment_count) || termDetails.filter(t => t.isDue).length;
        const remainingCount = totalInstallments - paidCount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ba-fade overflow-y-auto">
            <div className="w-full max-w-5xl rounded-2xl shadow-xl ba-rise bg-white my-8 flex flex-col md:flex-row overflow-hidden" style={{ border: "1px solid #e3ddd0", maxHeight: "90vh" }}>
              {/* Left Panel: Details (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ background: "#fdfcf9" }}>
                <h2 className="text-xl mb-6" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>Payment Details</h2>
                
                {/* Payment Summary */}
                <section className="mb-8">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#5b5346" }}>
                    <IndianRupee className="h-4 w-4" /> Payment Summary
                  </h3>
                  <div className="rounded-xl p-5 flex flex-wrap gap-6 justify-between" style={{ background: "#f7efe0", border: "1px solid #ead9bc" }}>
                    <div>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Total Fee</p>
                      <p className="text-xl font-medium mt-1" style={{ color: "#17140f" }}>{formatCurrency(totalFee)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Total Paid</p>
                      <p className="text-xl font-medium mt-1" style={{ color: "#39533a" }}>{formatCurrency(totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Balance</p>
                      <p className="text-xl font-medium mt-1" style={{ color: "#7c3324" }}>{formatCurrency(balance)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-sm">
                    <span style={{ color: "#a39a8c" }}>Payment Status</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: isFullyPaid ? "#eef2ea" : "#f7efe0", color: isFullyPaid ? "#39533a" : "#7a531f" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: isFullyPaid ? "#39533a" : "#7a531f" }}></span>
                      {isFullyPaid ? "Completed" : "Pending"}
                    </span>
                  </div>
                </section>

                {/* Installment Summary */}
                <section className="mb-8">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#5b5346" }}>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">i</span> Installment Summary
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Total Installments</p>
                      <p className="text-lg font-medium mt-1" style={{ color: "#17140f" }}>{totalInstallments}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Paid</p>
                      <p className="text-lg font-medium mt-1" style={{ color: "#39533a" }}>{paidCount}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Remaining</p>
                      <p className="text-lg font-medium mt-1" style={{ color: "#7a531f" }}>{remainingCount}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Due</p>
                      <p className="text-lg font-medium mt-1" style={{ color: dueCount > 0 ? "#7c3324" : "#17140f" }}>{dueCount}</p>
                    </div>
                  </div>
                </section>

                {/* Installment Details */}
                <section>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#5b5346" }}>
                    <IndianRupee className="h-4 w-4" /> Installment Details
                  </h3>
                  <div className="space-y-4">
                    {termDetails.map(term => (
                      <div key={term.term_number} className="rounded-xl p-5" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#8a6d43" }}>INSTALLMENT {term.term_number}</h4>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: term.isPaid ? "#eef2ea" : "#f7efe0", color: term.isPaid ? "#39533a" : "#7a531f" }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: term.isPaid ? "#39533a" : "#7a531f" }}></span>
                            {term.isPaid ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Amount</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatCurrency(term.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Paid Amount</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatCurrency(term.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Remaining</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatCurrency(term.remaining)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Due Date</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatDate(term.dueDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Paid Date</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{term.paidDate ? formatDate(term.paidDate) : "Not yet paid"}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Payment Method</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{term.paymentMethod}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Panel: Add Payment Form */}
              <div className="w-full md:w-[360px] flex flex-col" style={{ borderLeft: "1px solid #e3ddd0", background: "#ffffff" }}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const cashVal = Number(paymentForm.cash_amount) || 0;
                    const upiVal = Number(paymentForm.upi_amount) || 0;
                    if (cashVal <= 0 && upiVal <= 0) {
                       setPaymentError("Please enter a valid amount greater than zero.");
                       return;
                    }
                    if (upiVal > 0 && !paymentForm.upi_transaction_id?.trim()) {
                       setPaymentError("UPI Transaction ID is required when paying with UPI.");
                       return;
                    }
                    setPaymentLoading(true);
                    setPaymentError("");
                    try {
                      const paymentRes = await addBranchAdmissionPaymentApi(
                        selectedAdmissionForPayment.enrollment_id,
                        {
                          installment_number: Number(paymentForm.installment_number),
                          cash_amount: cashVal,
                          upi_amount: upiVal,
                          upi_transaction_id: upiVal > 0 ? paymentForm.upi_transaction_id.trim() : null,
                          payment_date: paymentForm.payment_date,
                        },
                        token
                      );
                      const receiptObj =
                        paymentRes?.receipt ||
                        (paymentRes?.receipt_id || paymentRes?.receipt_url
                          ? {
                              id: paymentRes.receipt_id,
                              receipt_id: paymentRes.receipt_id,
                              receipt_url: paymentRes.receipt_url,
                              download_url: paymentRes.download_url,
                              student_name: selectedAdmissionForPayment?.student_name || selectedAdmissionForPayment?.name,
                              course_title: selectedAdmissionForPayment?.course_title || selectedAdmissionForPayment?.course_name,
                              amount_paid: cashVal + upiVal,
                              installment_number: Number(paymentForm.installment_number),
                              payment_date: paymentForm.payment_date,
                              upi_transaction_id: upiVal > 0 ? paymentForm.upi_transaction_id.trim() : null,
                              ...paymentRes,
                            }
                          : null);
                      if (receiptObj) {
                        setRegistrationReceipt(receiptObj);
                      }
                      const updatedAdmissions = await getBranchAdmissionsApi(token);
                      setAdmissions(Array.isArray(updatedAdmissions) ? updatedAdmissions : []);
                      setSuccess(`Payment added successfully.${receiptObj ? " Receipt generated!" : ""}`);
                      setSelectedAdmissionForPayment(null);
                    } catch (err) {
                      setPaymentError(err.message || "Failed to add payment.");
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                  className="flex-1 flex flex-col"
                >
                  <div className="px-6 py-6" style={{ borderBottom: "1px solid #efe9dd" }}>
                    <h3 className="text-lg" style={{ ...serif, fontWeight: 500 }}>Add Payment</h3>
                    <p className="text-sm mt-1" style={{ color: "#8a8175" }}>Record a new payment</p>
                  </div>
                  
                  <div className="p-6 flex-1 space-y-4 overflow-y-auto">
                    {paymentError && (
                      <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}>
                        {paymentError}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block text-sm" style={{ color: "#5b5346" }}>
                        Cash Amount
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            value={paymentForm.cash_amount}
                            onChange={(e) => {
                              setPaymentError("");
                              setPaymentForm(prev => ({ ...prev, cash_amount: e.target.value }));
                            }}
                            className={INPUT_CLASS}
                            style={{ ...INPUT_STYLE, paddingLeft: '28px', marginTop: 0 }}
                            placeholder="0"
                          />
                        </div>
                      </label>
                      <label className="block text-sm" style={{ color: "#5b5346" }}>
                        UPI Amount
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            value={paymentForm.upi_amount}
                            onChange={(e) => {
                              setPaymentError("");
                              setPaymentForm(prev => ({ ...prev, upi_amount: e.target.value }));
                            }}
                            className={INPUT_CLASS}
                            style={{ ...INPUT_STYLE, paddingLeft: '28px', marginTop: 0 }}
                            placeholder="0"
                          />
                        </div>
                      </label>
                    </div>
                    {Number(paymentForm.upi_amount) > 0 && (
                      <label className="block text-sm" style={{ color: "#5b5346" }}>
                        <span className="flex items-center justify-between">
                          <span>UPI Transaction ID</span>
                          <span className="text-xs text-amber-700 font-medium">Required for UPI payment</span>
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Enter UPI reference / transaction ID"
                          value={paymentForm.upi_transaction_id || ""}
                          onChange={(e) => {
                            setPaymentError("");
                            setPaymentForm(prev => ({ ...prev, upi_transaction_id: e.target.value }));
                          }}
                          className={INPUT_CLASS}
                          style={INPUT_STYLE}
                        />
                      </label>
                    )}
                    <label className="block text-sm" style={{ color: "#5b5346" }}>
                      Payment Date
                      <input
                        required
                        type="date"
                        value={paymentForm.payment_date}
                        onChange={(e) => {
                          setPaymentError("");
                          setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }));
                        }}
                        className={INPUT_CLASS}
                        style={{ ...INPUT_STYLE, marginTop: '4px' }}
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 px-6 py-5" style={{ background: "#faf8f4", borderTop: "1px solid #efe9dd" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedAdmissionForPayment(null)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#e3ddd0] transition-colors ${FOCUS_RING}`}
                      style={{ color: "#5b5346" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-[#30291f] disabled:opacity-60 transition-colors ${FOCUS_RING}`}
                      style={{ background: "#17140f" }}
                    >
                      {paymentLoading ? "Saving..." : "Save Payment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Generated Receipt Modal with Congratulations & Download */}
      <PaymentSuccessReceiptModal
        isOpen={Boolean(registrationReceipt)}
        onClose={() => setRegistrationReceipt(null)}
        receipt={registrationReceipt}
        receiptUrl={registrationReceipt?.receipt_url}
        downloadUrl={registrationReceipt?.download_url}
        token={token}
        isBranchAdmin={true}
        title="Congratulations! Student course enrollment confirmed"
        subtitle="Student admission and initial payment were successfully recorded into branch ledger. Official receipt generated below."
        onViewReceipt={(rcpt, url) => {
          if (url) window.open(url, "_blank");
          else navigate("/branch-admin/receipts");
        }}
      />
    </div>
  );
}

export default BranchAdminStudentRegistration;