import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  GraduationCap,
  Receipt,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import { getEnrollmentInstallmentsApi } from '../../services/enrollments';
import { createPaymentOrderApi, loadRazorpayScript, verifyPaymentApi } from '../../services/payments';
import PaymentSuccessReceiptModal from './PaymentSuccessReceiptModal';
import {
  enrichInstallmentsWithPayments,
  getInstallmentPaymentDetails,
  isInstallmentPaidOrSubmitted,
  checkIsInstallmentDue,
} from '../../pages/StudentDashboard';

const formatDate = (date) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(date);
  }
};

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

const StudentPaymentEnrollmentModal = ({
  isOpen,
  enrollment,
  onClose,
  token,
  user,
  onRefresh,
}) => {
  const [selectedEnrollment, setSelectedEnrollment] = useState(enrollment);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [payingInstallmentNumber, setPayingInstallmentNumber] = useState(null);
  const [isPayingFullBalance, setIsPayingFullBalance] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');
  const [installmentError, setInstallmentError] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);

  useEffect(() => {
    setSelectedEnrollment(enrollment);
  }, [enrollment]);

  const enrollmentId = selectedEnrollment?.enrollment_id || selectedEnrollment?.id;

  const fetchInstallments = async () => {
    if (!enrollmentId || !token) return;
    setIsLoadingInstallments(true);
    try {
      const details = await getEnrollmentInstallmentsApi(enrollmentId, token);
      if (details) {
        setSelectedEnrollment((prev) => ({
          ...(prev || {}),
          ...details,
          id: prev?.id || details?.id,
          enrollment_id: prev?.enrollment_id || details?.enrollment_id,
        }));
      }
    } catch {
      // silent
    } finally {
      setIsLoadingInstallments(false);
    }
  };

  useEffect(() => {
    if (isOpen && enrollmentId && token) {
      fetchInstallments();
    }
  }, [isOpen, enrollmentId, token]);

  if (!isOpen || !selectedEnrollment) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePayInstallment = async (installment) => {
    const targetNumber = installment.installment_number || 1;
    if (!enrollmentId || !token) return;

    try {
      setPaymentProcessing(true);
      setPayingInstallmentNumber(targetNumber);
      setIsPayingFullBalance(false);
      setInstallmentError('');
      setPaymentSuccessMessage('');

      const order = await createPaymentOrderApi(
        {
          enrollment_id: Number(enrollmentId),
          installment_number: Number(targetNumber),
          payment_type: 'installment',
        },
        token
      );

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
      }

      const razorpay = new window.Razorpay({
        key: order.key_id || order.razorpay_key_id,
        amount: order.amount_paise || order.amount,
        currency: order.currency || 'INR',
        name: 'Aurum FX Education',
        description: `Installment #${targetNumber} - ${selectedEnrollment.course_title || 'Course'}`,
        order_id: order.order_id || order.razorpay_order_id,
        prefill: {
          name: order.student?.name || user?.name || '',
          email: order.student?.email || user?.email || '',
          contact: order.student?.phone || user?.phone || '',
        },
        theme: {
          color: '#9C6B2E',
        },
        handler: async (paymentResponse) => {
          try {
            setPaymentProcessing(true);
            const verifyRes = await verifyPaymentApi(
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                enrollment_id: Number(enrollmentId),
                installment_number: Number(targetNumber),
                payment_type: 'installment',
              },
              token
            );

            setPaymentSuccessMessage(
              `Installment #${targetNumber} payment was recorded successfully!`
            );

            const receiptData = {
              receipt_number: verifyRes?.receipt_number || paymentResponse.razorpay_payment_id,
              receipt_id: verifyRes?.receipt_id,
              receipt_url: verifyRes?.receipt_url,
              download_url: verifyRes?.download_url,
              student_name: order.student?.name || user?.name || 'Student',
              student_email: order.student?.email || user?.email || '',
              student_phone: order.student?.phone || user?.phone || '',
              course_title: order.course?.title || selectedEnrollment?.course_title || 'Enrolled Course',
              course_fee: selectedEnrollment?.total_fee,
              amount_paid: Number(installment?.amount || 0),
              payment_method: 'online',
              payment_type: 'installment',
              installment_number: Number(targetNumber),
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              payment_date: new Date().toISOString(),
            };

            setSuccessReceipt(receiptData);
            setShowReceiptModal(true);

            fetchInstallments();
            if (onRefresh) onRefresh();
          } catch (err) {
            setInstallmentError(err.message || 'Payment verification failed. If money was debited, contact campus support.');
          } finally {
            setPaymentProcessing(false);
            setPayingInstallmentNumber(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setPayingInstallmentNumber(null);
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        setInstallmentError(response.error?.description || 'Payment was declined or cancelled. Please try again.');
        setPaymentProcessing(false);
        setPayingInstallmentNumber(null);
      });

      razorpay.open();
    } catch (err) {
      setInstallmentError(err.message || 'Unable to initiate payment with Razorpay. Please try again.');
      setPaymentProcessing(false);
      setPayingInstallmentNumber(null);
    }
  };

  const handlePayFullRemainingBalance = async () => {
    if (!enrollmentId || !token) return;

    try {
      setPaymentProcessing(true);
      setIsPayingFullBalance(true);
      setInstallmentError('');
      setPaymentSuccessMessage('');

      const order = await createPaymentOrderApi(
        {
          enrollment_id: Number(enrollmentId),
          payment_type: 'full',
        },
        token
      );

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay payment gateway failed to load.');
      }

      const razorpay = new window.Razorpay({
        key: order.key_id || order.razorpay_key_id,
        amount: order.amount_paise || order.amount,
        currency: order.currency || 'INR',
        name: 'Aurum FX Education',
        description: `Full Balance Settlement - ${selectedEnrollment.course_title || 'Course'}`,
        order_id: order.order_id || order.razorpay_order_id,
        prefill: {
          name: order.student?.name || user?.name || '',
          email: order.student?.email || user?.email || '',
          contact: order.student?.phone || user?.phone || '',
        },
        theme: {
          color: '#9C6B2E',
        },
        handler: async (paymentResponse) => {
          try {
            setPaymentProcessing(true);
            await verifyPaymentApi(
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                enrollment_id: Number(enrollmentId),
                payment_type: 'full',
              },
              token
            );

            setPaymentSuccessMessage('Full balance cleared successfully!');
            fetchInstallments();
            if (onRefresh) onRefresh();
          } catch (err) {
            setInstallmentError(err.message || 'Payment verification failed.');
          } finally {
            setPaymentProcessing(false);
            setIsPayingFullBalance(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setIsPayingFullBalance(false);
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        setInstallmentError(response.error?.description || 'Payment was declined or cancelled.');
        setPaymentProcessing(false);
        setIsPayingFullBalance(false);
      });

      razorpay.open();
    } catch (err) {
      setInstallmentError(err.message || 'Unable to initiate payment with Razorpay.');
      setPaymentProcessing(false);
      setIsPayingFullBalance(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#E3DDD0] bg-white shadow-2xl overflow-hidden animate-[modalPop_0.22s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative shrink-0 border-b border-[#E3DDD0] bg-[#FAF8F4] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1EDE4] border border-[#E3DDD0] px-3 py-1 text-[11px] font-bold text-[#9C6B2E] uppercase tracking-wider">
                  <Receipt className="h-3.5 w-3.5 text-[#9C6B2E]" /> Enrollment & Payment Details
                </span>
                {selectedEnrollment.payment_plan && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 capitalize">
                    Plan: {selectedEnrollment.payment_plan}
                  </span>
                )}
              </div>
              <h3
                className="text-2xl font-bold tracking-tight text-slate-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {selectedEnrollment.course_title || selectedEnrollment.course_details?.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {selectedEnrollment.course_duration && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F1EDE4] px-2.5 py-1 text-xs font-semibold text-[#9C6B2E] border border-[#E3DDD0]">
                    <Clock className="h-3.5 w-3.5" /> {selectedEnrollment.course_duration}
                  </span>
                )}
                {selectedEnrollment.course_details?.category && (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {selectedEnrollment.course_details.category}
                  </span>
                )}
                {selectedEnrollment.course_details?.level && (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize">
                    {selectedEnrollment.course_details.level.trim()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={fetchInstallments}
                disabled={isLoadingInstallments}
                className="rounded-2xl p-2.5 text-slate-400 hover:bg-[#F1EDE4] hover:text-[#9C6B2E] transition disabled:opacity-50 cursor-pointer"
                title="Sync latest installment schedule"
                aria-label="Refresh payment details"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingInstallments ? 'animate-spin text-[#9C6B2E]' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl p-2.5 text-slate-400 hover:bg-[#F1EDE4] hover:text-[#17140F] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
          {/* Dynamic Status / Feedback Banners */}
          {paymentSuccessMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-2xs animate-in fade-in">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-emerald-950">Payment Verified Successfully</p>
                <p className="text-emerald-800 mt-0.5">{paymentSuccessMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSuccessMessage('')}
                className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {installmentError && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-2xs animate-in fade-in">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-rose-950">Payment Error</p>
                <p className="text-rose-800 mt-0.5">{installmentError}</p>
              </div>
              <button
                type="button"
                onClick={() => setInstallmentError('')}
                className="text-rose-700 hover:text-rose-950 p-1 cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {isLoadingInstallments && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3.5 py-2 text-xs text-amber-900 animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#9C6B2E]" />
              <span>Synchronizing real-time installment schedule & payment history...</span>
            </div>
          )}

          {/* SECTION 1: Financial Overview */}
          {(() => {
            const rawInst = Array.isArray(selectedEnrollment.installments)
              ? selectedEnrollment.installments
              : Array.isArray(selectedEnrollment.schedule)
              ? selectedEnrollment.schedule
              : [];

            const enrichedInst = enrichInstallmentsWithPayments(rawInst, selectedEnrollment);

            const totalPaidSum = enrichedInst
              .filter(isInstallmentPaidOrSubmitted)
              .reduce((sum, inst) => sum + Number(inst.paid_amount || inst.amount || 0), 0);

            const effectiveTotalPaid = Math.max(
              Number(selectedEnrollment.total_paid || 0),
              totalPaidSum
            );

            const totalFeeNum = Number(selectedEnrollment.total_fee || 0);
            const effectiveBalance = Math.max(0, totalFeeNum - effectiveTotalPaid);

            const effectivePaidCount = Math.max(
              Number(selectedEnrollment.paid_installment_count || 0),
              enrichedInst.filter(isInstallmentPaidOrSubmitted).length
            );
            const effectiveTotalCount = Number(
              selectedEnrollment.installment_count || enrichedInst.length || 1
            );

            return (
              <div className="rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#9C6B2E]">
                    Financial Overview
                  </h4>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    {effectiveBalance <= 0 ? '100% Cleared' : 'In Progress'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs">
                    <p className="text-xs font-medium text-slate-500">Total Course Fee</p>
                    <p className="mt-1.5 text-2xl font-black text-slate-900">
                      {formatCurrency(totalFeeNum)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">Fixed course fee</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4.5 shadow-2xs">
                    <p className="text-xs font-semibold text-emerald-800">Total Paid</p>
                    <p className="mt-1.5 text-2xl font-black text-emerald-700">
                      {formatCurrency(effectiveTotalPaid)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                      {Math.round((effectiveTotalPaid / (totalFeeNum || 1)) * 100)}% settled
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl border p-4.5 shadow-2xs ${
                      effectiveBalance > 0
                        ? 'border-[#E3DDD0] bg-white'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        effectiveBalance > 0 ? 'text-[#9C6B2E]' : 'text-slate-500'
                      }`}
                    >
                      Balance Due
                    </p>
                    <p
                      className={`mt-1.5 text-2xl font-black ${
                        effectiveBalance > 0 ? 'text-[#9C6B2E]' : 'text-slate-800'
                      }`}
                    >
                      {formatCurrency(effectiveBalance)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {effectiveBalance > 0 ? 'Due on upcoming installments' : 'Zero balance remaining'}
                    </p>
                  </div>
                </div>

                {effectiveTotalCount > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#E3DDD0]">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Installment Progress
                      </span>
                      <span className="text-emerald-700 font-bold">
                        {effectivePaidCount} of {effectiveTotalCount} Paid (
                        {Math.round((effectiveTotalPaid / (totalFeeNum || 1)) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((effectiveTotalPaid / (totalFeeNum || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* SECTION 2: 2-Column Info Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Card A: Transaction Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="h-4 w-4 text-[#9C6B2E]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Transaction Details
                </h4>
              </div>

              <dl className="mt-3.5 divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 font-medium">Payment Plan:</dt>
                  <dd className="font-bold text-slate-900 capitalize">
                    {selectedEnrollment.payment_plan || 'Full Payment'}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 font-medium">Payment Status:</dt>
                  <dd>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {selectedEnrollment.status || 'Paid'}
                    </span>
                  </dd>
                </div>

                {selectedEnrollment.razorpay_payment_id && (
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-slate-500 font-medium">Payment ID:</dt>
                    <dd className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
                        {selectedEnrollment.razorpay_payment_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedEnrollment.razorpay_payment_id, 'payment_id')}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        title="Copy Payment ID"
                      >
                        {copiedKey === 'payment_id' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </dd>
                  </div>
                )}

                {selectedEnrollment.razorpay_order_id && (
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-slate-500 font-medium">Order ID:</dt>
                    <dd className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
                        {selectedEnrollment.razorpay_order_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedEnrollment.razorpay_order_id, 'order_id')}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        title="Copy Order ID"
                      >
                        {copiedKey === 'order_id' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Card B: Campus & Schedule */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap className="h-4 w-4 text-[#9C6B2E]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Campus & Schedule
                </h4>
              </div>

              <dl className="mt-3.5 divide-y divide-slate-100 text-xs">
                <div className="flex items-start justify-between py-2.5 gap-2">
                  <dt className="text-slate-500 font-medium shrink-0">Branch:</dt>
                  <dd className="font-bold text-slate-900 text-right">
                    {selectedEnrollment.branch_details?.name || 'Main Campus'}
                    {selectedEnrollment.branch_details?.location && (
                      <span className="block text-[11px] font-medium text-slate-500">
                        ({selectedEnrollment.branch_details.location})
                      </span>
                    )}
                  </dd>
                </div>

                {(selectedEnrollment.course_details?.start_date || selectedEnrollment.course_details?.end_date) && (
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-slate-500 font-medium">Batch Schedule:</dt>
                    <dd className="font-bold text-slate-900 text-right">
                      {formatDate(selectedEnrollment.course_details?.start_date)} — {formatDate(selectedEnrollment.course_details?.end_date)}
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 font-medium">Branch Admin Approval:</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        (selectedEnrollment.branch_approval_status || '').toLowerCase() === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {selectedEnrollment.branch_approval_status || 'Pending'}
                    </span>
                  </dd>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500 font-medium">Super Admin Approval:</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        (selectedEnrollment.super_admin_approval_status || '').toLowerCase() === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {selectedEnrollment.super_admin_approval_status || 'Pending'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* SECTION 3: Installment Breakdown */}
          {(() => {
            const rawInstallments = Array.isArray(selectedEnrollment.installments)
              ? selectedEnrollment.installments
              : Array.isArray(selectedEnrollment.schedule)
              ? selectedEnrollment.schedule
              : [];

            const enrichedInstallments = enrichInstallmentsWithPayments(rawInstallments, selectedEnrollment);
            const installmentsList = [...enrichedInstallments].sort(
              (a, b) => (Number(a.installment_number) || 0) - (Number(b.installment_number) || 0)
            );

            const hasInstallments = installmentsList.length > 0;

            if (!hasInstallments) {
              return (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-center text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">One-Time Lump Sum Payment</p>
                  <p className="mt-1">This enrollment was paid in full. No recurring installments are scheduled.</p>
                  <div className="mt-3">
                    <Link
                      to="/student-dashboard/receipts"
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3DDD0] bg-white px-3.5 py-1.5 text-xs font-bold text-[#9C6B2E] shadow-2xs hover:bg-[#FAF8F4]"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>View Payment Receipt</span>
                    </Link>
                  </div>
                </div>
              );
            }

            // Find any installment that has been paid by student and is awaiting Branch Admin review
            const pendingReviewInstallment = installmentsList.find(
              (inst) => getInstallmentPaymentDetails(inst).isPendingReview
            );

            // The next unpaid installment is the first one where isPaid is false
            const firstUnpaidInstallment = installmentsList.find(
              (inst) => !getInstallmentPaymentDetails(inst).isPaid
            );

            const nextUnpaidInstallment = firstUnpaidInstallment;

            const paidCount = installmentsList.filter((inst) => getInstallmentPaymentDetails(inst).isPaid).length;
            const totalClearedAmount = installmentsList
              .filter((inst) => getInstallmentPaymentDetails(inst).isPaid)
              .reduce((sum, inst) => sum + Number(inst.paid_amount || inst.amount || 0), 0);
            const displayCleared = Math.max(Number(selectedEnrollment.total_paid || 0), totalClearedAmount);

            return (
              <div className="space-y-4">
                {/* Top Banner 1: Verification In Progress (when an installment is paid and awaiting review) */}
                {pendingReviewInstallment && (
                  <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-[#FAF8F4] via-[#FDF6E9] to-[#FAF8F4] p-4.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-600 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                            Verification In Progress
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Installment #{pendingReviewInstallment.installment_number || 3}
                          </span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900">
                          Amount Paid: {formatCurrency(pendingReviewInstallment.amount)}
                          {pendingReviewInstallment.payment_date && (
                            <span className="text-xs font-normal text-slate-600 ml-2">
                              (Paid on {formatDate(pendingReviewInstallment.payment_date)})
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-amber-900 font-medium">
                          Your payment is completed. Branch admin will verify soon.
                          {pendingReviewInstallment.payment_reference && (
                            <span className="font-mono text-slate-600 ml-1.5 font-medium">
                              (Ref: {pendingReviewInstallment.payment_reference})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-900 shrink-0">
                      <Clock className="h-4 w-4 text-amber-700 animate-pulse" />
                      Branch Admin Approval: Pending
                    </div>
                  </div>
                )}

                {/* Top Banner 2: Action Required for next unpaid installment */}
                {!pendingReviewInstallment && nextUnpaidInstallment && Number(selectedEnrollment.balance_amount || nextUnpaidInstallment.amount || 1) > 0 && (
                  <div className="rounded-2xl border border-[#9C6B2E]/40 bg-gradient-to-r from-[#FAF8F4] via-[#F6EFE3] to-[#FAF8F4] p-4.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#9C6B2E] text-white shadow-xs">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#9C6B2E] text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                            Action Required
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Installment #{nextUnpaidInstallment.installment_number || 1}
                          </span>
                          {checkIsInstallmentDue(nextUnpaidInstallment, false) && (
                            <span className="inline-flex items-center rounded-md bg-rose-600 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                              Due
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-extrabold text-slate-900">
                          Amount Due: {formatCurrency(nextUnpaidInstallment.amount)}
                          {nextUnpaidInstallment.due_date && (
                            <span className="text-xs font-normal text-slate-600 ml-2">
                              (Due: {formatDate(nextUnpaidInstallment.due_date)})
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Pay securely online via Razorpay (UPI, Credit/Debit Cards, NetBanking).
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        disabled={paymentProcessing}
                        onClick={() => handlePayInstallment(nextUnpaidInstallment)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9C6B2E] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#855923] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {paymentProcessing && payingInstallmentNumber === (nextUnpaidInstallment.installment_number || 1) ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            <span>Pay {formatCurrency(nextUnpaidInstallment.amount)}</span>
                          </>
                        )}
                      </button>

                      {Number(selectedEnrollment.balance_amount || 0) > Number(nextUnpaidInstallment.amount || 0) && (
                        <button
                          type="button"
                          disabled={paymentProcessing}
                          onClick={handlePayFullRemainingBalance}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#9C6B2E] bg-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-[#9C6B2E] shadow-sm hover:bg-[#FAF8F4] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title="Pay entire remaining course balance and clear all remaining installments"
                        >
                          {paymentProcessing && isPayingFullBalance ? (
                            <>
                              <div className="h-4 w-4 border-2 border-[#9C6B2E]/30 border-t-[#9C6B2E] rounded-full animate-spin" />
                              <span>Settling Balance...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-[#9C6B2E]" />
                              <span>Pay Full Balance ({formatCurrency(selectedEnrollment.balance_amount)})</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Installment Grid Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#9C6B2E]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Installment Breakdown ({paidCount}/{installmentsList.length} Paid)
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">
                      {formatCurrency(displayCleared)} Cleared
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {installmentsList.map((inst, index) => {
                      const statusInfo = getInstallmentPaymentDetails(inst);
                      const isPaid = statusInfo.isPaid;
                      const isPendingReview = statusInfo.isPendingReview;
                      const isRejected = statusInfo.isRejected;
                      const isNextUnpaid =
                        !isPaid &&
                        !isPendingReview &&
                        !pendingReviewInstallment &&
                        nextUnpaidInstallment &&
                        (
                          (nextUnpaidInstallment.installment_id && inst.installment_id && nextUnpaidInstallment.installment_id === inst.installment_id) ||
                          (nextUnpaidInstallment.installment_number && inst.installment_number && Number(nextUnpaidInstallment.installment_number) === Number(inst.installment_number)) ||
                          inst === firstUnpaidInstallment
                        );

                      const instNum = Number(inst.installment_number ?? index + 1);

                      const cashAmount =
                        inst.cash_amount !== undefined && inst.cash_amount !== null
                          ? Number(inst.cash_amount)
                          : statusInfo.cashAmount !== undefined && statusInfo.cashAmount !== null
                          ? Number(statusInfo.cashAmount)
                          : null;

                      const upiAmount =
                        inst.upi_amount !== undefined && inst.upi_amount !== null
                          ? Number(inst.upi_amount)
                          : statusInfo.upiAmount !== undefined && statusInfo.upiAmount !== null
                          ? Number(statusInfo.upiAmount)
                          : null;

                      const razorpayId = (() => {
                        if (inst.razorpay_payment_id) return inst.razorpay_payment_id;
                        if (inst.payment_reference && String(inst.payment_reference).startsWith('pay_')) {
                          return inst.payment_reference;
                        }
                        if (statusInfo.paymentReference && String(statusInfo.paymentReference).startsWith('pay_')) {
                          return statusInfo.paymentReference;
                        }
                        if (statusInfo.razorpayPaymentId) {
                          return statusInfo.razorpayPaymentId;
                        }
                        if (inst.transaction_id && String(inst.transaction_id).startsWith('pay_')) {
                          return inst.transaction_id;
                        }
                        if (selectedEnrollment?.razorpay_payment_id && (installmentsList.length === 1 || instNum === 1)) {
                          return selectedEnrollment.razorpay_payment_id;
                        }
                        if (selectedEnrollment?.payment_reference && String(selectedEnrollment.payment_reference).startsWith('pay_') && (installmentsList.length === 1 || instNum === 1)) {
                          return selectedEnrollment.payment_reference;
                        }
                        return '';
                      })();

                      const rawMethod = String(
                        inst.payment_method ||
                        inst.method ||
                        statusInfo.paymentMethod ||
                        (razorpayId ? 'razorpay' : '') ||
                        ''
                      ).toLowerCase().trim();

                      const rawMethodLabel = inst.payment_method_label || statusInfo.paymentMethodLabel;

                      const isSplit =
                        rawMethod === 'cash_upi' ||
                        rawMethod === 'split' ||
                        rawMethod.includes('cash+upi') ||
                        rawMethod.includes('cash + upi') ||
                        (cashAmount !== null && upiAmount !== null && cashAmount > 0 && upiAmount > 0);

                      const isCash =
                        !isSplit &&
                        (rawMethod === 'cash' || (cashAmount !== null && cashAmount > 0 && (!upiAmount || upiAmount === 0)));

                      const isUpi =
                        !isSplit &&
                        !isCash &&
                        (rawMethod === 'upi' || (upiAmount !== null && upiAmount > 0 && (!cashAmount || cashAmount === 0)));

                      const isRazorpay =
                        !isSplit &&
                        !isCash &&
                        !isUpi &&
                        (rawMethod === 'razorpay' ||
                          rawMethod === 'online' ||
                          rawMethod.includes('razorpay') ||
                          Boolean(razorpayId));

                      let methodDisplay = '';
                      if (rawMethodLabel) {
                        methodDisplay = rawMethodLabel;
                      } else if (isSplit) {
                        methodDisplay = 'Cash + UPI';
                      } else if (isUpi) {
                        methodDisplay = 'UPI';
                      } else if (isCash) {
                        methodDisplay = 'Cash';
                      } else if (isRazorpay) {
                        methodDisplay = 'Razorpay';
                      } else if (rawMethod) {
                        if (rawMethod === 'cash_upi') methodDisplay = 'Cash + UPI';
                        else methodDisplay = rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1);
                      } else if (isPaid) {
                        methodDisplay = 'Razorpay';
                      }

                      const paymentRef =
                        inst.upi_transaction_id ||
                        statusInfo.upiTransactionId ||
                        inst.payment_reference ||
                        statusInfo.paymentReference ||
                        inst.transaction_id ||
                        '';

                      const isDue = !isPaid && !isPendingReview && !isRejected && checkIsInstallmentDue(inst, isPaid);

                      return (
                        <div
                          key={inst.installment_id || index}
                          className={`flex flex-col justify-between rounded-xl border p-3.5 text-xs transition ${
                            isRejected
                              ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400 ring-1 ring-rose-200/60 shadow-2xs'
                              : isPendingReview
                              ? 'border-amber-300 bg-amber-50/25 hover:border-amber-400 shadow-2xs'
                              : isPaid
                              ? 'border-emerald-100 bg-emerald-50/25 hover:border-emerald-300'
                              : isNextUnpaid
                              ? isDue
                                ? 'border-[#f0d9b5] ring-2 ring-[#9C6B2E]/25 bg-[#fef8f0] shadow-2xs'
                                : 'border-[#9C6B2E] ring-2 ring-[#9C6B2E]/20 bg-gradient-to-br from-[#FFFDF9] via-white to-[#FDF8EF] shadow-2xs'
                              : isDue
                              ? 'border-[#f0d9b5] bg-[#fef8f0] hover:border-[#e2c49b]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-900">
                                  Installment #{inst.installment_number || index + 1}
                                </span>
                                {isDue && (
                                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    Due
                                  </span>
                                )}
                                {isRejected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    <XCircle className="h-3 w-3 text-rose-600" />
                                    Payment Rejected
                                  </span>
                                ) : isPaid ? (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                                    Paid
                                  </span>
                                ) : isNextUnpaid ? (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300/80">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                    Next Installment
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700">
                                    <Clock className="h-3 w-3 text-slate-500" />
                                    {inst.status || 'Pending'}
                                  </span>
                                )}

                                {isPendingReview && (
                                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <Clock className="h-2.5 w-2.5 text-amber-700" />
                                    Branch Admin Approval: Pending
                                  </span>
                                )}
                              </div>

                              <div className="space-y-0.5 text-[11px] text-slate-500">
                                <p className={isDue ? 'text-rose-600 font-semibold' : ''}>
                                  Due: {formatDate(inst.due_date)} {isDue && <span className="text-[10px] font-bold text-rose-700 ml-1">(Overdue)</span>}
                                </p>
                                {(statusInfo.paymentDate || inst.paid_date || inst.payment_date) && (
                                  <p className={isRejected ? 'text-rose-600 font-medium' : 'text-emerald-700 font-semibold'}>
                                    • {isRejected ? 'Attempted on: ' : 'Paid on: '}
                                    {formatDate(statusInfo.paymentDate || inst.paid_date || inst.payment_date)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-slate-900">
                                {formatCurrency(inst.amount)}
                              </p>
                              {isPaid && (
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-semibold text-emerald-700">
                                    Paid: {formatCurrency(statusInfo.paidAmount || inst.amount)}
                                  </p>
                                  <Link
                                    to="/student-dashboard/receipts"
                                    onClick={onClose}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9C6B2E] hover:underline"
                                  >
                                    <Receipt className="h-2.5 w-2.5" />
                                    <span>Receipt</span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Method & Amount Breakdown (Cash / UPI / Razorpay) */}
                          {(isPaid || isPendingReview) && (methodDisplay || isSplit || isCash || isUpi || isRazorpay) && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">Payment Method:</span>
                                <span className="font-bold text-[#9C6B2E] bg-[#FAF8F4] border border-[#E3DDD0] px-2 py-0.5 rounded-md">
                                  {methodDisplay || 'Paid'}
                                </span>
                              </div>

                              {isSplit && (
                                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-[11px] space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-amber-900 font-medium">Cash Amount:</span>
                                    <span className="font-bold text-amber-950">{formatCurrency(cashAmount ?? 0)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-amber-900 font-medium">UPI Amount:</span>
                                    <span className="font-bold text-amber-950">{formatCurrency(upiAmount ?? 0)}</span>
                                  </div>
                                  {paymentRef && (
                                    <div className="flex justify-between items-center pt-1 border-t border-amber-200/60 font-mono text-[10px]">
                                      <span className="text-amber-800">Ref / Txn ID:</span>
                                      <span className="text-amber-950 font-bold select-all truncate max-w-[160px]" title={paymentRef}>
                                        {paymentRef}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {isCash && (
                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                                  {cashAmount !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-600 font-medium">Cash Amount:</span>
                                      <span className="font-bold text-slate-900">{formatCurrency(cashAmount)}</span>
                                    </div>
                                  )}
                                  {paymentRef && (
                                    <div className="flex justify-between items-center font-mono text-[10px] text-slate-500">
                                      <span>Receipt Ref:</span>
                                      <span className="text-slate-800 font-bold select-all truncate max-w-[160px]" title={paymentRef}>
                                        {paymentRef}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {isUpi && (
                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                                  {upiAmount !== null && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-600 font-medium">UPI Amount:</span>
                                      <span className="font-bold text-slate-900">{formatCurrency(upiAmount)}</span>
                                    </div>
                                  )}
                                  {paymentRef && (
                                    <div className="flex justify-between items-center font-mono text-[10px] text-slate-500">
                                      <span>UPI Ref:</span>
                                      <span className="text-slate-800 font-bold select-all truncate max-w-[160px]" title={paymentRef}>
                                        {paymentRef}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {isRazorpay && razorpayId && (
                                <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                  <span className="text-slate-500 font-medium">Razorpay ID:</span>
                                  <span className="font-mono font-bold text-slate-800 select-all truncate max-w-[160px]" title={razorpayId}>
                                    {razorpayId}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {isRejected && (
                            <div className="mt-2.5 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-rose-950">
                                <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                <span>Payment Rejected by Branch Admin</span>
                              </div>
                              <p className="text-rose-800 pl-5">
                                <span className="font-semibold text-rose-950">Reason: </span>
                                {statusInfo.rejectionReason || 'Payment could not be verified in branch bank records'}
                              </p>
                            </div>
                          )}

                          {isPendingReview && (
                            <div className="mt-2.5 rounded-lg bg-amber-50/90 border border-amber-200/90 p-2.5 text-[11px] text-amber-900 space-y-0.5">
                              <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                                <Clock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                                <span>Your payment is completed. Branch admin will verify soon.</span>
                              </div>
                              {statusInfo.paymentReference && (
                                <p className="text-[10px] text-amber-800/80 font-mono pl-5">
                                  Ref: {statusInfo.paymentReference}
                                </p>
                              )}
                            </div>
                          )}

                          {isNextUnpaid && (
                            <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-amber-900 font-semibold flex items-center gap-1">
                                <CreditCard className="h-3 w-3 text-[#9C6B2E]" />
                                Ready to pay
                              </span>
                              <button
                                type="button"
                                disabled={paymentProcessing}
                                onClick={() => handlePayInstallment(inst)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9C6B2E] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#855923] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                              >
                                {paymentProcessing && payingInstallmentNumber === (inst.installment_number || index + 1) ? (
                                  <>
                                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-3 w-3" />
                                    <span>Pay {formatCurrency(inst.amount)}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {!isPaid && !isNextUnpaid && (
                            <div className="mt-2 text-right">
                              <span className={`text-[10px] font-medium ${isDue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                                {pendingReviewInstallment
                                  ? `Upcoming (Verification of #${pendingReviewInstallment.installment_number || 3} in progress)`
                                  : isDue
                                  ? `Overdue (Pay #${firstUnpaidInstallment?.installment_number || 1} first)`
                                  : `Upcoming (Pay #${firstUnpaidInstallment?.installment_number || 1} first)`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-[#E3DDD0] bg-[#FAF8F4] px-6 py-4 sm:px-8 gap-3">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Need assistance with your enrollment or invoice? Contact campus admin.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 justify-end">
            {(() => {
              const rawInst = Array.isArray(selectedEnrollment.installments)
                ? selectedEnrollment.installments
                : Array.isArray(selectedEnrollment.schedule)
                ? selectedEnrollment.schedule
                : [];

              const enrichedInst = enrichInstallmentsWithPayments(rawInst, selectedEnrollment);

              const pendingReview = enrichedInst.find(
                (inst) => getInstallmentPaymentDetails(inst).isPendingReview
              );
              const nextUnpaid = enrichedInst.find(
                (inst) => !getInstallmentPaymentDetails(inst).isPaid
              );

              if (pendingReview) {
                return (
                  <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-4 py-2 text-xs font-bold text-amber-900 shadow-2xs">
                    <Clock className="h-4 w-4 text-amber-700 animate-pulse" />
                    <span>Installment #{pendingReview.installment_number || 3} Verification Pending</span>
                  </div>
                );
              }

              if (nextUnpaid && Number(selectedEnrollment.balance_amount || nextUnpaid.amount || 1) > 0) {
                const hasMultipleRemaining = Number(selectedEnrollment.balance_amount || 0) > Number(nextUnpaid.amount || 0);

                return (
                  <>
                    <button
                      type="button"
                      disabled={paymentProcessing}
                      onClick={() => handlePayInstallment(nextUnpaid)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#9C6B2E] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#855923] disabled:opacity-50 cursor-pointer"
                    >
                      {paymentProcessing && !isPayingFullBalance ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Next Installment ({formatCurrency(nextUnpaid.amount)})</span>
                        </>
                      )}
                    </button>

                    {hasMultipleRemaining && (
                      <button
                        type="button"
                        disabled={paymentProcessing}
                        onClick={handlePayFullRemainingBalance}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#9C6B2E] bg-white px-4 py-2.5 text-xs font-bold text-[#9C6B2E] shadow-xs transition hover:bg-[#FAF8F4] disabled:opacity-50 cursor-pointer"
                      >
                        {paymentProcessing && isPayingFullBalance ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-[#9C6B2E]/30 border-t-[#9C6B2E] rounded-full animate-spin" />
                            <span>Settling...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                            <span>Pay Full Balance ({formatCurrency(selectedEnrollment.balance_amount)})</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              }
              return null;
            })()}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 shadow-2xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showReceiptModal && successReceipt && (
        <PaymentSuccessReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receiptData={successReceipt}
        />
      )}
    </div>,
    document.body
  );
};

export default StudentPaymentEnrollmentModal;
