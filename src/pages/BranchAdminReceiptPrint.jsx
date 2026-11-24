import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Printer,
  ArrowLeft,
  X,
  Loader2,
  AlertCircle,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getBranchAdminReceiptApi } from "../services/branchadminreceipts";
import OfficialReceiptVoucherCard from "../components/common/OfficialReceiptVoucherCard";

const PRINT_PAGE_CSS = `
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .no-print {
    display: none !important;
  }
  #print-area-wrapper {
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #print-voucher-card {
    box-shadow: none !important;
    border: none !important;
    margin: 0 auto !important;
    padding: 0 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
`;

export default function BranchAdminReceiptPrint() {
  const { receiptId: paramReceiptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const queryReceiptId = queryParams.get("id") || queryParams.get("receipt_id");
  const effectiveReceiptId = paramReceiptId || queryReceiptId;

  const [receipt, setReceipt] = useState(() => {
    if (location.state?.receipt) {
      return location.state.receipt;
    }
    if (effectiveReceiptId) {
      try {
        const cached = sessionStorage.getItem(`print_receipt_${effectiveReceiptId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    try {
      const last = sessionStorage.getItem("last_print_receipt");
      if (last) {
        const parsed = JSON.parse(last);
        if (
          !effectiveReceiptId ||
          String(parsed.receipt_id || parsed.id || parsed.receipt_number) === String(effectiveReceiptId)
        ) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState(!receipt);
  const [error, setError] = useState("");
  const printTriggeredRef = useRef(false);

  // Fetch receipt details via authenticated API if not already available
  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      if (!effectiveReceiptId) {
        if (!receipt) {
          setError("No receipt ID specified. Please select a receipt to print.");
          setLoading(false);
        }
        return;
      }

      // If we already have the receipt from session, try to refresh in background or keep it
      if (receipt) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getBranchAdminReceiptApi(effectiveReceiptId, token);
        if (!isMounted) return;
        if (data) {
          setReceipt(data);
          try {
            sessionStorage.setItem(`print_receipt_${effectiveReceiptId}`, JSON.stringify(data));
          } catch {}
        } else {
          throw new Error("No receipt data returned.");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to load receipt details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReceipt();

    return () => {
      isMounted = false;
    };
  }, [effectiveReceiptId, token]);

  // Auto trigger browser print once receipt is loaded
  useEffect(() => {
    if (receipt && !loading && !printTriggeredRef.current) {
      printTriggeredRef.current = true;
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn("Auto-print failed, user can click Print button:", e);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [receipt, loading]);

  const handleManualPrint = () => {
    window.print();
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] text-slate-800 flex flex-col">
      <style>{PRINT_PAGE_CSS}</style>

      {/* Top Toolbar (Hidden when printing) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e3ddd0] px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e3ddd0] bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
              title="Go back / Close"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#9c6b2e]" />
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Print Official Fee Receipt
              </h1>
              {receipt && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready to Print
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={loading || Boolean(error)}
              onClick={handleManualPrint}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#9c6b2e] hover:bg-[#805420] active:scale-[0.98] transition shadow-md cursor-pointer disabled:opacity-50"
              title="Print Receipt (Ctrl+P)"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition cursor-pointer"
              title="Close window"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Print Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div id="print-area-wrapper" className="w-full max-w-3xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-[#e3ddd0] shadow-sm p-8 text-center">
              <Loader2 className="h-8 w-8 text-[#9c6b2e] animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-800">Preparing Receipt Document...</p>
              <p className="text-xs text-slate-500 mt-1">
                Loading official ledger details and formatting for print
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-md mx-auto shadow-sm">
              <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
              <h2 className="text-base font-bold text-slate-800">Unable to Load Receipt</h2>
              <p className="text-xs text-rose-600 mt-1.5">{error}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
              >
                Close Window
              </button>
            </div>
          ) : receipt ? (
            <div
              id="print-voucher-card"
              className="bg-white rounded-3xl shadow-xl border border-[#e3ddd0] overflow-hidden"
            >
              <OfficialReceiptVoucherCard receipt={receipt} user={user} />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

