import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  RefreshCw,
  ShoppingCart,
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Users,
  Image as ImageIcon,
  IndianRupee,
  Wallet,
  Calendar,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  BookOpen,
  Circle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import {
  getSuperAdminPurchaseBranchesApi,
  getSuperAdminPendingPurchasesApi,
  getSuperAdminApprovedPurchasesApi,
  getSuperAdminPurchaseHistoryApi,
  approvePurchaseAsSuperAdminApi,
  rejectPurchaseAsSuperAdminApi,
  getSuperAdminRejectedPurchasesApi,
  getSuperAdminBranchRejectedPurchasesApi,
} from '../services/superadmin';
import { getEnrollmentInstallmentsApi } from '../services/enrollments';

const PAGE_CSS = `
@keyframes sa-rise { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.sa-rise { animation: sa-rise .35s ease both; }
`;

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const STATUS_META = {
  approved: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  received: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  paid: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  active: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  completed: { dot: '#5c7a5a', text: '#39533a', bg: '#eef2ea' },
  pending: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  awaiting_review: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  pending_review: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  partial: { dot: '#b0803a', text: '#7a531f', bg: '#f7efe0' },
  rejected: { dot: '#a24a3a', text: '#7c3324', bg: '#f8eae5' },
  failed: { dot: '#a24a3a', text: '#7c3324', bg: '#f8eae5' },
  inactive: { dot: '#a24a3a', text: '#7c3324', bg: '#f8eae5' },
  not_required: { dot: '#64748b', text: '#475569', bg: '#f1f5f9' },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[String(status || 'pending').toLowerCase()] || {
    dot: '#a39a8c',
    text: '#8a8175',
    bg: '#f1ede4',
  };
  const raw = String(status || 'Pending').replace(/_/g, ' ');
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: meta.bg, color: meta.text }}
    >
      <Circle className="h-1.5 w-1.5" fill={meta.dot} stroke="none" />
      {label}
    </span>
  );
};

const formatDate = (date) => {
  if (!date) return 'Date unavailable';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

const formatDateTime = (date) => {
  if (!date) return 'Date unavailable';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs" style={{ color: '#a39a8c' }}>
      {label}
    </dt>
    <dd className="mt-1 break-words text-sm font-medium" style={{ color: '#17140f' }}>
      {value || 'Not provided'}
    </dd>
  </div>
);

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'approved', label: 'Approved', icon: CheckCircle2 },
  { id: 'rejected', label: 'Rejected', icon: X },
  { id: 'branch_rejected', label: 'Branch Rejected', icon: XCircle },
  { id: 'history', label: 'History', icon: ShoppingCart },
];

const SuperAdminPurchases = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [approvedPurchases, setApprovedPurchases] = useState([]);
  const [rejectedPurchases, setRejectedPurchases] = useState([]);
  const [branchRejectedPurchases, setBranchRejectedPurchases] = useState([]);
  const [historyPurchases, setHistoryPurchases] = useState([]);
  const fetchIdRef = useRef(0);

  const purchases = useMemo(() => {
    if (activeTab === 'pending') return pendingPurchases;
    if (activeTab === 'approved') return approvedPurchases;
    if (activeTab === 'rejected') return rejectedPurchases;
    if (activeTab === 'branch_rejected') return branchRejectedPurchases;
    return historyPurchases;
  }, [activeTab, pendingPurchases, approvedPurchases, rejectedPurchases, branchRejectedPurchases, historyPurchases]);

  const tabCounts = useMemo(() => ({
    pending: pendingPurchases.length,
    approved: approvedPurchases.length,
    rejected: rejectedPurchases.length,
    branch_rejected: branchRejectedPurchases.length,
    history: historyPurchases.length,
  }), [pendingPurchases, approvedPurchases, rejectedPurchases, branchRejectedPurchases, historyPurchases]);

  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch branches for purchase filtering
  useEffect(() => {
    if (!token) return;
    getSuperAdminPurchaseBranchesApi(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.branches ?? [];
        setBranches(list);
      })
      .catch(() => {
        // Fallback or silent if branches fail
      });
  }, [token]);

  const normalizeArray = (res) => {
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object') {
      const keys = ['purchases', 'enrollments', 'pending', 'approved', 'rejected', 'items', 'data'];
      for (const k of keys) {
        if (Array.isArray(res[k])) return res[k];
      }
    }
    return [];
  };

  const loadPurchases = async (arg1, arg2) => {
    if (!token) return;
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const branchId = typeof arg1 === 'string' && ['pending', 'approved', 'rejected', 'branch_rejected', 'history'].includes(arg1)
        ? (arg2 !== undefined ? arg2 : selectedBranchId)
        : (arg1 !== undefined ? arg1 : selectedBranchId);

      const bId = branchId ? Number(branchId) : undefined;
      const [pendingRes, approvedRes, rejectedRes, branchRejectedRes, historyRes] = await Promise.allSettled([
        getSuperAdminPendingPurchasesApi(token, bId),
        getSuperAdminApprovedPurchasesApi(token, bId),
        getSuperAdminRejectedPurchasesApi(token, bId),
        getSuperAdminBranchRejectedPurchasesApi(token, bId),
        getSuperAdminPurchaseHistoryApi(token, bId),
      ]);

      if (fetchId !== fetchIdRef.current) return;

      const pendingData = normalizeArray(pendingRes.status === 'fulfilled' ? pendingRes.value : []);
      const approvedData = normalizeArray(approvedRes.status === 'fulfilled' ? approvedRes.value : []);
      const rawRejectedData = normalizeArray(rejectedRes.status === 'fulfilled' ? rejectedRes.value : []);
      const rawBranchRejectedData = normalizeArray(branchRejectedRes.status === 'fulfilled' ? branchRejectedRes.value : []);
      const historyData = normalizeArray(historyRes.status === 'fulfilled' ? historyRes.value : []);

      // Filter super admin rejected: exclude branch admin rejections so they never leak into the super admin rejected tab
      const superAdminRejectedData = rawRejectedData.filter((p) => {
        const stage = String(p.rejection_stage || '').toLowerCase();
        if (stage === 'branch_admin' || stage === 'branch') return false;
        return true;
      });

      // Filter branch rejected: ensure only branch admin rejections are shown
      const branchRejectedData = rawBranchRejectedData.filter((p) => {
        const stage = String(p.rejection_stage || '').toLowerCase();
        if (stage === 'super_admin' || stage === 'superadmin') return false;
        return true;
      });

      setPendingPurchases(pendingData);
      setApprovedPurchases(approvedData);
      setRejectedPurchases(superAdminRejectedData);
      setBranchRejectedPurchases(branchRejectedData);
      setHistoryPurchases(historyData);
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setError(err.message || 'Failed to load purchases.');
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPurchases(selectedBranchId);
  }, [selectedBranchId, token]);

  useEffect(() => {
    if (!selectedPurchase) return;
    const enrId = selectedPurchase.enrollment_id ?? selectedPurchase.id;
    if (!enrId || !token) return;
    if (!selectedPurchase.installments || selectedPurchase.installments.length === 0) {
      getEnrollmentInstallmentsApi(enrId, token)
        .then((data) => {
          if (!data) return;
          const fetchedInstallments = Array.isArray(data)
            ? data
            : data.installments || data.schedule || [];
          setSelectedPurchase((prev) =>
            prev && String(prev.enrollment_id ?? prev.id) === String(enrId)
              ? {
                  ...prev,
                  ...(typeof data === 'object' && !Array.isArray(data) ? data : {}),
                  installments: fetchedInstallments.length > 0 ? fetchedInstallments : prev.installments,
                  payments: data.payments || prev.payments || [],
                  installment_payments: data.installment_payments || prev.installment_payments || [],
                  payment_history: data.payment_history || prev.payment_history || [],
                  razorpay_order_id: data.razorpay_order_id || prev.razorpay_order_id || '',
                  razorpay_payment_id: data.razorpay_payment_id || prev.razorpay_payment_id || '',
                }
              : prev
          );
        })
        .catch((err) => {
          console.warn('Could not load detailed installments for purchase:', err);
        });
    }
  }, [selectedPurchase?.enrollment_id, selectedPurchase?.id, token]);

  const allPurchasePayments = useMemo(() => {
    if (!selectedPurchase) return [];
    const list = [
      ...(Array.isArray(selectedPurchase.installment_payments) ? selectedPurchase.installment_payments : []),
      ...(Array.isArray(selectedPurchase.payments) ? selectedPurchase.payments : []),
      ...(Array.isArray(selectedPurchase.payment_history) ? selectedPurchase.payment_history : []),
      ...(Array.isArray(selectedPurchase.recent_payments) ? selectedPurchase.recent_payments : []),
      ...(Array.isArray(selectedPurchase.history) ? selectedPurchase.history : []),
      ...(Array.isArray(selectedPurchase.transactions) ? selectedPurchase.transactions : []),
      ...(Array.isArray(selectedPurchase.records) ? selectedPurchase.records : []),
      ...(Array.isArray(selectedPurchase.all_payments) ? selectedPurchase.all_payments : []),
    ];
    const seen = new Set();
    return list.filter((p) => {
      const idKey = p.payment_id ?? p.id ?? (p.receipt_number ? `rcpt-${p.receipt_number}` : null);
      if (!idKey) return true;
      if (seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
  }, [selectedPurchase]);

  const enrichedInstallments = useMemo(() => {
    if (!selectedPurchase) return [];

    const rawBase = Array.isArray(selectedPurchase.installments)
      ? selectedPurchase.installments
      : Array.isArray(selectedPurchase.due_installments)
      ? selectedPurchase.due_installments
      : Array.isArray(selectedPurchase.installment_schedule)
      ? selectedPurchase.installment_schedule
      : Array.isArray(selectedPurchase.schedule)
      ? selectedPurchase.schedule
      : [];

    const allPayments = allPurchasePayments;

    return rawBase.map((inst, idx) => {
      const instNum = Number(inst.installment_number ?? (idx + 1));
      const instId = inst.installment_id ?? inst.id;
      const totalInstAmount = Number(inst.amount ?? 0);
      const backendStatus = String(inst.status || "").toLowerCase().trim();
      const isInstBackendPaid = backendStatus === "paid";
      const isInstBackendPartial = backendStatus === "partial";

      const matchingPayments = allPayments.filter((p) => {
        if (!p) return false;
        if (Array.isArray(p.installment_numbers) && p.installment_numbers.map(Number).includes(instNum)) {
          return true;
        }
        if (p.installment_number !== undefined && p.installment_number !== null) {
          return Number(p.installment_number) === instNum;
        }
        if (instId && p.installment_id !== undefined && p.installment_id !== null) {
          return String(p.installment_id) === String(instId);
        }
        if (
          instNum === 1 &&
          (
            (selectedPurchase.razorpay_payment_id && (p.payment_reference === selectedPurchase.razorpay_payment_id || p.razorpay_payment_id === selectedPurchase.razorpay_payment_id)) ||
            (String(p.payment_method).toLowerCase() === 'razorpay' && (p.installment_number === undefined || p.installment_number === null))
          )
        ) {
          return true;
        }
        return false;
      });

      matchingPayments.sort((a, b) => {
        const timeA = new Date(a.reviewed_at || a.payment_date || a.created_at || 0).getTime();
        const timeB = new Date(b.reviewed_at || b.payment_date || b.created_at || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return Number(b.payment_id || b.id || 0) - Number(a.payment_id || a.id || 0);
      });

      const match = matchingPayments[0];

      const rawMethod = String(
        match?.payment_method ||
        inst.payment_method ||
        (isInstBackendPaid && instNum === 1 && (selectedPurchase.razorpay_payment_id || selectedPurchase.razorpay_order_id) ? 'razorpay' : '') ||
        ''
      ).toLowerCase().trim();

      const rawCashAmount = match?.cash_amount !== undefined && match?.cash_amount !== null
        ? Number(match.cash_amount)
        : inst.cash_amount !== undefined && inst.cash_amount !== null
        ? Number(inst.cash_amount)
        : null;

      const rawUpiAmount = match?.upi_amount !== undefined && match?.upi_amount !== null
        ? Number(match.upi_amount)
        : inst.upi_amount !== undefined && inst.upi_amount !== null
        ? Number(inst.upi_amount)
        : null;

      const isSplit =
        rawMethod === 'cash_upi' ||
        rawMethod === 'split' ||
        (rawCashAmount !== null && rawUpiAmount !== null && rawCashAmount > 0 && rawUpiAmount > 0);

      const isUpi = !isSplit && (rawMethod === 'upi' || (rawUpiAmount !== null && rawUpiAmount > 0 && (!rawCashAmount || rawCashAmount === 0)));
      const isCash = !isSplit && !isUpi && (rawMethod === 'cash' || (rawCashAmount !== null && rawCashAmount > 0 && (!rawUpiAmount || rawUpiAmount === 0)));
      const isRazorpay =
        rawMethod === 'razorpay' ||
        rawMethod === 'online' ||
        Boolean(
          match?.razorpay_payment_id ||
          inst.razorpay_payment_id ||
          (instNum === 1 && (selectedPurchase.razorpay_payment_id || selectedPurchase.razorpay_order_id)) ||
          (match?.payment_reference && String(match.payment_reference).startsWith('pay_'))
        );

      let paymentMethodDisplay = 'Pending';
      if (isSplit) {
        paymentMethodDisplay = 'Cash + UPI';
      } else if (isUpi) {
        paymentMethodDisplay = 'UPI';
      } else if (isCash) {
        paymentMethodDisplay = 'Cash';
      } else if (isRazorpay) {
        paymentMethodDisplay = 'Razorpay';
      } else if (rawMethod) {
        if (rawMethod === 'cash_upi') paymentMethodDisplay = 'Cash + UPI';
        else paymentMethodDisplay = rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1);
      } else if (isInstBackendPaid || (match && (match.status === 'received' || match.status === 'paid'))) {
        paymentMethodDisplay = 'Verified';
      }

      const upiTxnId =
        match?.upi_transaction_id ||
        inst.upi_transaction_id ||
        match?.transaction_id ||
        inst.transaction_id ||
        '';

      const paymentRef =
        match?.payment_reference ||
        inst.payment_reference ||
        match?.reference ||
        inst.reference ||
        '';

      const rzpPaymentId =
        match?.razorpay_payment_id ||
        inst.razorpay_payment_id ||
        (isRazorpay ? (paymentRef || (instNum === 1 ? selectedPurchase.razorpay_payment_id : '')) : '');

      const rzpOrderId =
        match?.razorpay_order_id ||
        inst.razorpay_order_id ||
        (isRazorpay && instNum === 1 ? selectedPurchase.razorpay_order_id : '');

      if (!match) {
        const isInstRejected =
          backendStatus === "rejected" ||
          String(inst.approval_status || "").toLowerCase() === "rejected";
        const isInstPaid =
          backendStatus === "paid" ||
          String(inst.approval_status || "").toLowerCase() === "approved";

        const computedPaid = isInstRejected
          ? 0
          : inst.paid_amount !== undefined && inst.paid_amount !== null
          ? Number(inst.paid_amount)
          : isInstPaid
          ? totalInstAmount
          : 0;

        const computedRemaining = isInstRejected
          ? totalInstAmount
          : isInstPaid
          ? 0
          : inst.remaining_amount !== undefined && inst.remaining_amount !== null
          ? Number(inst.remaining_amount)
          : Math.max(0, totalInstAmount - computedPaid);

        const isActuallyPaid = isInstPaid || (computedRemaining <= 0 && computedPaid >= totalInstAmount && totalInstAmount > 0);
        const isActuallyPartial = !isActuallyPaid && (isInstBackendPartial || (computedPaid > 0 && computedRemaining > 0));

        return {
          ...inst,
          installment_number: instNum,
          amount: totalInstAmount,
          paid_amount: computedPaid,
          remaining_amount: computedRemaining,
          status: isInstRejected
            ? "rejected"
            : isActuallyPaid
            ? "paid"
            : isActuallyPartial
            ? "partial"
            : inst.status || "pending",
          is_rejected: isInstRejected,
          is_paid: isActuallyPaid,
          is_partial: isActuallyPartial,
          rejection_reason: inst.rejection_reason || inst.reason || "",
          payment_method: rawMethod || inst.payment_method,
          payment_method_display: paymentMethodDisplay,
          cash_amount: rawCashAmount ?? (isCash ? computedPaid : null),
          upi_amount: rawUpiAmount ?? (isUpi ? computedPaid : null),
          upi_transaction_id: upiTxnId,
          payment_reference: paymentRef,
          razorpay_payment_id: rzpPaymentId,
          razorpay_order_id: rzpOrderId,
          is_split: isSplit,
          is_upi: isUpi,
          is_cash: isCash,
          is_razorpay: isRazorpay,
        };
      }

      const matchStatus = String(match.status || "").toLowerCase().trim();
      const matchApprovalStatus = String(match.approval_status || "").toLowerCase().trim();
      const matchMethodStatus = String(match.payment_status || "").toLowerCase().trim();

      const isRejected = matchStatus === "rejected" || matchApprovalStatus === "rejected";

      const isPendingReview =
        !isRejected &&
        (matchStatus === "pending_review" ||
          matchApprovalStatus === "pending" ||
          (match.credited_to_balance === false && matchMethodStatus === "paid"));

      const rejectionReason =
        match.rejection_reason ||
        match.reason ||
        inst.rejection_reason ||
        (isRejected ? "Payment could not be verified in branch bank records" : "");

      const isGroupedFullBalance = Array.isArray(match.installment_numbers) && match.installment_numbers.length > 1;

      const computedPaidAmount = isRejected
        ? 0
        : inst.paid_amount !== undefined && inst.paid_amount !== null
        ? Number(inst.paid_amount)
        : isGroupedFullBalance
        ? totalInstAmount
        : Number(match.paid_amount ?? match.amount ?? 0);

      const computedRemainingAmount = isRejected
        ? totalInstAmount
        : isInstBackendPaid || (isGroupedFullBalance && !isRejected && !isPendingReview)
        ? 0
        : inst.remaining_amount !== undefined && inst.remaining_amount !== null
        ? Number(inst.remaining_amount)
        : Math.max(0, totalInstAmount - computedPaidAmount);

      const isPaid =
        !isRejected &&
        !isPendingReview &&
        (isInstBackendPaid ||
          (computedRemainingAmount <= 0 && computedPaidAmount >= totalInstAmount && totalInstAmount > 0));

      const isPartial =
        !isRejected &&
        !isPendingReview &&
        !isPaid &&
        (isInstBackendPartial || (computedPaidAmount > 0 && computedRemainingAmount > 0));

      const finalStatus = isRejected
        ? "rejected"
        : isPendingReview
        ? "awaiting_review"
        : isPaid
        ? "paid"
        : isPartial
        ? "partial"
        : inst.status || "pending";

      return {
        ...inst,
        installment_number: instNum,
        amount: totalInstAmount,
        paid_amount: computedPaidAmount,
        remaining_amount: computedRemainingAmount,
        status: finalStatus,
        approval_status: isRejected
          ? "rejected"
          : isPendingReview
          ? "pending"
          : isPaid
          ? "approved"
          : isPartial
          ? "partial"
          : inst.approval_status || "pending",
        is_rejected: isRejected,
        is_pending_review: isPendingReview,
        is_paid: isPaid,
        is_partial: isPartial,
        rejection_reason: rejectionReason,
        reviewed_at: match.reviewed_at || inst.reviewed_at,
        payment_date: match.payment_date || match.paid_date || inst.payment_date || inst.paid_date,
        paid_date: isPaid
          ? (inst.paid_date || match.paid_date || match.payment_date)
          : inst.paid_date,
        payment_method: match.payment_method || inst.payment_method || rawMethod,
        payment_method_display: paymentMethodDisplay,
        cash_amount: rawCashAmount ?? (isCash ? computedPaidAmount : null),
        upi_amount: rawUpiAmount ?? (isUpi ? computedPaidAmount : null),
        upi_transaction_id: upiTxnId,
        payment_reference: paymentRef,
        razorpay_payment_id: rzpPaymentId,
        razorpay_order_id: rzpOrderId,
        is_split: isSplit,
        is_upi: isUpi,
        is_cash: isCash,
        is_razorpay: isRazorpay,
      };
    });
  }, [selectedPurchase, allPurchasePayments]);

  const handleApprove = async (purchase) => {
    const id = purchase.enrollment_id ?? purchase.id;
    setApprovingId(id);
    setError('');
    setSuccess('');
    try {
      await approvePurchaseAsSuperAdminApi(id, token);
      setSuccess(`Purchase #${id} approved successfully.`);
      window.dispatchEvent(new CustomEvent('purchases-updated'));
      loadPurchases(activeTab, selectedBranchId);
    } catch (err) {
      setError(err.message || 'Failed to approve purchase.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setApprovingId(rejectingPurchaseId);
    setError('');
    setSuccess('');
    try {
      await rejectPurchaseAsSuperAdminApi(rejectingPurchaseId, rejectReason, token);
      setSuccess(`Purchase #${rejectingPurchaseId} rejected successfully.`);
      setRejectingPurchaseId(null);
      setRejectReason('');
      setSelectedPurchase(null);
      window.dispatchEvent(new CustomEvent('purchases-updated'));
      loadPurchases(activeTab, selectedBranchId);
    } catch (err) {
      setError(err.message || 'Failed to reject purchase.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div
      className="min-h-screen md:flex max-w-full overflow-x-hidden"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#faf8f4',
        color: '#17140f',
      }}
    >
      <style>{PAGE_CSS}</style>
      <SuperAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="purchases"
      />

      <main className="min-w-0 flex-1 max-w-full overflow-x-hidden">
        <header
          className="hidden md:flex items-center justify-between border-b px-6 py-5 sm:px-10"
          style={{ borderColor: '#e3ddd0', background: '#ffffff' }}
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#9c6b2e' }}
            >
              Super Admin
            </p>
            <h1
              className="mt-1 text-2xl font-bold"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Purchases & Approvals
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadPurchases(activeTab, selectedBranchId)}
              className="rounded-lg p-2 hover:bg-[#f1ede4]"
              title="Refresh purchases"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                style={{ color: '#9c6b2e' }}
              />
            </button>
            <NavLogoutButton redirectTo="/super-admin/login" />
          </div>
        </header>
   
        <div className="w-full px-4 py-6 sm:px-8 sm:py-8 lg:px-10 space-y-6">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
              }}
            >
              {success}
            </div>
          )}

          {/* Filter Bar: Branch selection + Tabs */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white border shadow-2xs max-w-full min-w-0"
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full min-w-0">
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                const count = tabCounts[id] ?? 0;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
                    style={{
                      background: isActive ? '#9c6b2e' : '#faf8f4',
                      color: isActive ? '#ffffff' : '#7a5220',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    <span
                      className="ml-1 px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full transition"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#e3ddd0',
                        color: isActive ? '#ffffff' : '#7a5220',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Branch Filter dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#f1ede4]">
              <Building2 className="h-4 w-4 text-stone-500 shrink-0" />
              <div className="relative flex-1 sm:flex-initial min-w-0 w-full sm:w-56 max-w-full">
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full appearance-none rounded-xl border pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] bg-stone-50 truncate"
                  style={{ borderColor: '#e3ddd0', color: '#17140f' }}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option
                      key={b.id ?? b.branch_id}
                      value={String(b.id ?? b.branch_id)}
                    >
                      {b.name || b.branch_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                  style={{ color: '#a39a8c' }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: '#9c6b2e' }}
              />
            </div>
          ) : purchases.length === 0 ? (
            <div
              className="rounded-2xl px-5 py-16 text-center text-sm bg-white border"
              style={{ borderColor: '#e3ddd0', color: '#64748b' }}
            >
              <ShoppingCart className="h-10 w-10 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No {activeTab} purchases found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedBranchId
                  ? 'Try selecting "All Branches" to view records across all locations.'
                  : `There are currently no items under the ${activeTab} purchases tab.`}
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden bg-white border shadow-2xs"
              style={{ borderColor: '#e3ddd0' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        background: '#faf8f4',
                        borderBottom: '1px solid #e3ddd0',
                      }}
                    >
                      {[
                        '#',
                        'Student',
                        'Course',
                        'Payment',
                        'Balance',
                        'Amount',
                        'Branch',
                        'Date',
                        'Action',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ color: '#9c6b2e' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.filter(p => !selectedBranchId || String(p.branch_id) === String(selectedBranchId)).map((p, i) => {
                      const id = p.enrollment_id ?? p.id;
                      return (
                        <tr
                          key={id ?? i}
                          className="transition hover:bg-stone-50/70"
                          style={{ borderBottom: '1px solid #f1ede4' }}
                        >
                          <td className="px-4 py-3 text-xs font-bold font-mono" style={{ color: '#9c6b2e' }}>
                            {i + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{p.student_name || p.name || '—'}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID #{p.user_id}</p>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                            {p.course_title || p.course_name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-600 font-bold text-xs">
                              {p.payment_status ? (String(p.payment_status).toLowerCase() === 'paid' ? 'Paid' : String(p.payment_status).toUpperCase()) : 'Paid'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-sm">
                            {Number(p.balance_amount) > 0 ? (
                               <span className="text-rose-600">{fmt(p.balance_amount)}</span>
                            ) : (
                               <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#9c6b2e]">
                            {fmt(p.total_fee ?? p.amount ?? p.course_fee)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                            {p.branch_name || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                               onClick={() => setSelectedPurchase(p)}
                               className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 transition whitespace-nowrap border border-stone-200 shadow-2xs"
                            >
                               View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* View Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="sa-rise relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#faf8f4] rounded-2xl shadow-2xl overflow-hidden border border-[#e3ddd0]">
             {/* Header */}
             <div className="shrink-0 flex flex-wrap gap-4 items-center justify-between p-5 sm:px-6 border-b border-[#e3ddd0] bg-white">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedPurchase.name || selectedPurchase.student_name} 
                    <span className="text-slate-400 font-normal ml-2">#{selectedPurchase.enrollment_id ?? selectedPurchase.id}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-stone-500" /> {selectedPurchase.course_title || selectedPurchase.course_name}</span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-stone-500" /> {selectedPurchase.branch_name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end mr-4">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Branch:</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${selectedPurchase.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPurchase.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : (selectedPurchase.branch_approval_status === 'rejected' || activeTab === 'branch_rejected' || selectedPurchase.branch_rejection_reason) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{activeTab === 'branch_rejected' || selectedPurchase.branch_rejection_reason ? 'rejected' : (selectedPurchase.branch_approval_status || '—')}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-700">Super Admin:</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${selectedPurchase.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedPurchase.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : selectedPurchase.super_admin_approval_status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{selectedPurchase.super_admin_approval_status || '—'}</span>
                     </div>
                   </div>
                   <button onClick={() => setSelectedPurchase(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition bg-slate-50 border border-slate-200">
                     <X className="h-5 w-5" />
                   </button>
                </div>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Left Column */}
                   <div className="space-y-6">
                     
                     {/* Student Information */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <User className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Student Information</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Name</p>
                             <p className="text-sm font-bold text-slate-800 mt-1">{selectedPurchase.name || selectedPurchase.student_name}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User ID</p>
                             <p className="text-sm font-mono text-slate-800 mt-1">#{selectedPurchase.user_id}</p>
                           </div>
                           <div className="col-span-2 sm:col-span-1">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.email || '—'}</p>
                           </div>
                           <div className="col-span-2 sm:col-span-1">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.phone || '—'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Highest Qualification</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.highest_qualification || '—'}</p>
                           </div>
                           <div className="col-span-2">
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-stone-500 shrink-0 mt-0.5"/> {selectedPurchase.address || '—'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Parent / Guardian */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <Users className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Parent / Guardian</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Name</p>
                             <p className="text-sm font-bold text-slate-800 mt-1">{selectedPurchase.parent_name || '—'}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parent Phone</p>
                             <p className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.parent_phone || '—'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Course & Branch */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Course & Branch</h3>
                        </div>
                        <div className="p-5 flex gap-5">
                          {selectedPurchase.course_image && (
                            <img src={selectedPurchase.course_image} alt="Course" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" />
                          )}
                          <div className="grid grid-cols-2 gap-5 flex-1">
                             <div className="col-span-2">
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course Name</p>
                               <p className="text-sm font-bold text-[#9c6b2e] mt-1">{selectedPurchase.course_title || selectedPurchase.course_name}</p>
                             </div>
                             <div className="col-span-2">
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Branch Name</p>
                               <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.branch_name}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Course Duration</p>
                               <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-stone-500"/> {selectedPurchase.course_duration || '—'}</p>
                             </div>
                             <div>
                               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Course Fee</p>
                               <p className="text-sm font-bold text-[#9c6b2e] mt-1 flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-[#9c6b2e]"/> {fmt(selectedPurchase.total_fee || selectedPurchase.course_fee).replace('₹','')}</p>
                             </div>
                          </div>
                        </div>
                     </div>

                   </div>

                   {/* Right Column */}
                   <div className="space-y-6">

                     {/* Payment Summary */}
                     <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden bg-gradient-to-br from-white to-stone-50/50">
                        <div className="px-5 py-3.5 border-b border-stone-100 bg-white/60 flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment Summary</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Fee</p>
                             <p className="text-xl font-bold text-slate-800 mt-1">{fmt(selectedPurchase.total_fee || selectedPurchase.course_fee)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Paid</p>
                             <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(selectedPurchase.total_paid || selectedPurchase.amount)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Balance</p>
                             <p className={`text-xl font-bold mt-1 ${Number(selectedPurchase.balance_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(selectedPurchase.balance_amount)}</p>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Payment Status</p>
                             <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase border shadow-2xs ${selectedPurchase.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200'}`}>
                                {selectedPurchase.payment_status || '—'}
                             </span>
                           </div>
                           <div className="col-span-2 pt-4 border-t border-stone-100">
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Installments Paid</p>
                             <p className="text-sm font-bold text-slate-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-stone-100">
                                {Number(selectedPurchase.installment_count) > 0 
                                  ? `${selectedPurchase.paid_installment_count ?? 0} of ${selectedPurchase.installment_count} Paid`
                                  : 'No Installments'
                                }
                             </p>
                           </div>
                        </div>
                     </div>

                     {/* Approval & Enrollment Status */}
                     <div className="bg-white rounded-2xl border border-[#e3ddd0] shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-[#e3ddd0] bg-slate-50 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-stone-500" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Approval & Enrollment Status</h3>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-5">
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Branch Approval</p>
                             <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedPurchase.branch_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : selectedPurchase.branch_approval_status === 'pending' ? 'bg-amber-100 text-amber-700' : (selectedPurchase.branch_approval_status === 'rejected' || activeTab === 'branch_rejected' || selectedPurchase.branch_rejection_reason) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                {activeTab === 'branch_rejected' || selectedPurchase.branch_rejection_reason ? 'rejected' : (selectedPurchase.branch_approval_status || '—')}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Super Admin Approval</p>
                             <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase border ${selectedPurchase.super_admin_approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedPurchase.super_admin_approval_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' : selectedPurchase.super_admin_approval_status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {selectedPurchase.super_admin_approval_status || '—'}
                             </span>
                           </div>
                           <div>
                             <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Payment Status</p>
                             <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase border ${selectedPurchase.payment_status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {selectedPurchase.payment_status || '—'}
                             </span>
                           </div>
                           {(selectedPurchase.branch_rejection_reason || (activeTab === 'branch_rejected' && (selectedPurchase.rejection_reason || selectedPurchase.reason))) && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Branch Admin Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                 {selectedPurchase.branch_rejection_reason || selectedPurchase.rejection_reason || selectedPurchase.reason}
                               </p>
                             </div>
                           )}
                           {selectedPurchase.super_admin_rejection_reason && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Super Admin Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">{selectedPurchase.super_admin_rejection_reason}</p>
                             </div>
                           )}
                           {!selectedPurchase.branch_rejection_reason && !selectedPurchase.super_admin_rejection_reason && activeTab !== 'branch_rejected' && (selectedPurchase.rejection_reason || selectedPurchase.reason) && (
                             <div className="col-span-2 mt-2">
                               <p className="text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1.5">Rejection Reason</p>
                               <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">{selectedPurchase.rejection_reason || selectedPurchase.reason}</p>
                             </div>
                           )}
                        </div>
                     </div>

                    </div>
                 </div>

                 {/* Installments Breakdown (Matching Branch Admin View) */}
                 <section className="mt-6">
                   <div className="flex items-center justify-between pb-3 border-b border-[#e3ddd0]">
                     <h3 className="flex items-center gap-2 text-sm font-semibold text-[#17140f]">
                       <Clock className="h-4 w-4 text-[#9c6b2e]" />
                       Installments Breakdown
                     </h3>
                   </div>

                   {enrichedInstallments.length === 0 ? (
                     <p className="mt-4 text-sm text-stone-500">
                       No installment schedule records found for this enrollment.
                     </p>
                   ) : (
                     <div className="mt-4 space-y-3">
                       {enrichedInstallments.map((inst, idx) => {
                         const instStatus = String(inst.status || "pending").toLowerCase();
                         const isDue = instStatus !== "paid" && (
                           inst.due_date
                             ? new Date(inst.due_date) <= new Date(new Date().setHours(23, 59, 59, 999))
                             : inst.is_due === true
                         );
                         const isRejected = Boolean(inst.is_rejected || instStatus === "rejected");
                         const isPendingReview = Boolean(inst.is_pending_review || instStatus === "awaiting_review");

                         return (
                           <div
                             key={inst.installment_id || idx}
                             className={`rounded-xl p-4 transition-all ${
                               isRejected
                                 ? "bg-rose-50/40 border border-rose-300 ring-1 ring-rose-200/60 shadow-2xs"
                                 : isDue
                                 ? "bg-[#fef8f0] border border-[#f0d9b5]"
                                 : "bg-white border border-[#e3ddd0]"
                             }`}
                           >
                             <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                               <div className="flex items-center gap-2">
                                 <p
                                   className="text-xs font-semibold tracking-wide uppercase"
                                   style={{ color: isRejected ? "#b91c1c" : "#9c6b2e" }}
                                 >
                                   Installment {inst.installment_number ?? idx + 1}
                                 </p>
                                 {isRejected && (
                                   <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                     Payment Rejected
                                   </span>
                                 )}
                               </div>
                               <div className="flex items-center gap-2">
                                 {isDue && !isRejected && (
                                   <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                     Due
                                   </span>
                                 )}
                                 <StatusPill status={isRejected ? "rejected" : isPendingReview ? "pending" : instStatus} />
                               </div>
                             </div>

                             {/* Rejection Alert Box */}
                             {isRejected && (
                               <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-900 shadow-2xs">
                                 <div className="flex items-start gap-2.5">
                                   <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                   <div className="space-y-1 min-w-0">
                                     <p className="font-bold text-rose-950 text-xs">
                                       Online Payment Rejected by Branch Admin
                                     </p>
                                     <p className="text-rose-800">
                                       <span className="font-semibold text-rose-950">Reason: </span>
                                       {inst.rejection_reason || "Payment could not be verified in branch bank records"}
                                     </p>
                                     {inst.reviewed_at && (
                                       <p className="text-[11px] text-rose-600">
                                         Reviewed on: {formatDateTime(inst.reviewed_at)}
                                       </p>
                                     )}
                                   </div>
                                 </div>
                               </div>
                             )}

                             <dl className="grid gap-3 sm:grid-cols-3">
                               <DetailItem label="Total Amount" value={formatCurrency(inst.amount)} />
                               <DetailItem
                                 label="Paid Amount"
                                 value={formatCurrency(
                                   inst.paid_amount !== undefined && inst.paid_amount !== null
                                     ? inst.paid_amount
                                     : inst.is_paid || String(inst.status || "").toLowerCase() === "paid"
                                     ? inst.amount
                                     : 0
                                 )}
                               />
                               <DetailItem
                                 label="Remaining"
                                 value={formatCurrency(
                                   inst.remaining_amount !== undefined && inst.remaining_amount !== null
                                     ? inst.remaining_amount
                                     : inst.is_paid || String(inst.status || "").toLowerCase() === "paid"
                                     ? 0
                                     : Math.max(0, Number(inst.amount || 0) - Number(inst.paid_amount || 0))
                                 )}
                               />
                               <DetailItem label="Due Date" value={formatDate(inst.due_date)} />
                               <DetailItem
                                 label={isRejected ? "Attempted Date" : "Paid Date"}
                                 value={
                                   inst.payment_date || inst.paid_date
                                     ? `${formatDate(inst.payment_date || inst.paid_date)}${isRejected ? " (Rejected)" : ""}`
                                     : "Not yet paid"
                                 }
                               />
                               <DetailItem
                                 label="Payment Method"
                                 value={
                                   isRejected
                                     ? (inst.payment_method ? `${String(inst.payment_method).toUpperCase()} Online (Rejected)` : "Razorpay Online (Rejected)")
                                     : inst.payment_method_display || (inst.status === "paid" ? "Online / Verified" : "Pending")
                                 }
                               />

                               {/* Split (Cash + UPI): Show Cash Amount & UPI Amount as separate fields */}
                               {inst.is_split && (
                                 <>
                                   <DetailItem
                                     label="Cash Amount"
                                     value={formatCurrency(inst.cash_amount ?? 0)}
                                   />
                                   <DetailItem
                                     label="UPI Amount"
                                     value={formatCurrency(inst.upi_amount ?? 0)}
                                   />
                                 </>
                               )}

                               {/* UPI Transaction ID for Split or UPI */}
                               {(inst.is_split || inst.is_upi || Boolean(inst.upi_transaction_id)) && inst.upi_transaction_id ? (
                                 <DetailItem
                                   label="UPI Transaction ID"
                                   value={inst.upi_transaction_id}
                                 />
                               ) : null}

                               {/* Cash Amount for cash-only */}
                               {inst.is_cash && !inst.is_split && inst.cash_amount !== null && inst.cash_amount > 0 && (
                                 <DetailItem
                                   label="Cash Amount"
                                   value={formatCurrency(inst.cash_amount)}
                                 />
                               )}

                               {/* UPI Amount for upi-only */}
                               {inst.is_upi && !inst.is_split && inst.upi_amount !== null && inst.upi_amount > 0 && (
                                 <DetailItem
                                   label="UPI Amount"
                                   value={formatCurrency(inst.upi_amount)}
                                 />
                               )}

                               {/* Razorpay Gateway Details directly inside Razorpay installment */}
                               {inst.is_razorpay && inst.razorpay_payment_id && (
                                 <DetailItem
                                   label="Razorpay Payment ID"
                                   value={inst.razorpay_payment_id}
                                 />
                               )}
                               {inst.is_razorpay && inst.razorpay_order_id && (
                                 <DetailItem
                                   label="Razorpay Order ID"
                                   value={inst.razorpay_order_id}
                                 />
                               )}
                             </dl>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </section>
             </div>

             {/* Footer Actions */}
             <div className="shrink-0 p-5 sm:px-6 border-t border-[#e3ddd0] bg-white flex flex-col gap-3 rounded-b-2xl">
                {rejectingPurchaseId === (selectedPurchase.enrollment_id ?? selectedPurchase.id) ? (
                  <div className="flex flex-col gap-3 w-full animate-in slide-in-from-bottom-2">
                    <label className="text-sm font-bold text-slate-700">Rejection Reason</label>
                    <textarea 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please specify why this is being rejected..."
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      rows={3}
                    />
                    <div className="flex justify-end gap-3 items-center mt-2">
                      <button
                         onClick={() => {
                           setRejectingPurchaseId(null);
                           setRejectReason('');
                         }}
                         className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent"
                      >
                         Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={approvingId !== null}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-md disabled:opacity-60"
                      >
                         {approvingId === (selectedPurchase.enrollment_id ?? selectedPurchase.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                            <X className="h-4 w-4" />
                         )}
                         Confirm Rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3 items-center w-full">
                    <button
                       onClick={() => setSelectedPurchase(null)}
                       className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition border border-transparent"
                    >
                       Close
                    </button>
                    {selectedPurchase.super_admin_approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => setRejectingPurchaseId(selectedPurchase.enrollment_id ?? selectedPurchase.id)}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition shadow-sm"
                        >
                           Reject
                        </button>
                        <button
                          onClick={() => {
                             handleApprove(selectedPurchase);
                             setSelectedPurchase(null);
                          }}
                          disabled={approvingId !== null}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#9c6b2e] hover:bg-[#7a5220] transition shadow-md disabled:opacity-60"
                        >
                           {approvingId === (selectedPurchase.enrollment_id ?? selectedPurchase.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                              <CheckCircle2 className="h-4 w-4" />
                           )}
                           Approve
                        </button>
                      </>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminPurchases;
