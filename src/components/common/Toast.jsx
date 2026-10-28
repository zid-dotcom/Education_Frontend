import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Standard Toast Notification Component
 * Floats on top of all UI, modals, and backdrops with z-[9999999].
 */
export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'error', message, title, duration = 6500 } =
    typeof toast === 'string' ? { message: toast, type: 'error' } : toast;

  useEffect(() => {
    if (!duration || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  const configs = {
    error: {
      bg: 'bg-[#fff5f5]',
      border: 'border-[#fecaca]',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      titleColor: 'text-rose-950',
      textColor: 'text-rose-800',
      barColor: 'bg-rose-500',
      defaultTitle: 'Submission Error',
    },
    success: {
      bg: 'bg-[#f0fdf4]',
      border: 'border-[#bbf7d0]',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      titleColor: 'text-emerald-950',
      textColor: 'text-emerald-800',
      barColor: 'bg-emerald-500',
      defaultTitle: 'Success',
    },
    warning: {
      bg: 'bg-[#fffbeb]',
      border: 'border-[#fde68a]',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      titleColor: 'text-amber-950',
      textColor: 'text-amber-800',
      barColor: 'bg-amber-500',
      defaultTitle: 'Notice',
    },
    info: {
      bg: 'bg-[#eff6ff]',
      border: 'border-[#bfdbfe]',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      titleColor: 'text-blue-950',
      textColor: 'text-blue-800',
      barColor: 'bg-blue-500',
      defaultTitle: 'Information',
    },
  };

  const cfg = configs[type] || configs.error;
  const displayTitle = title || cfg.defaultTitle;

  return createPortal(
    <div
      className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[9999999] max-w-md w-[calc(100vw-2.5rem)] pointer-events-auto rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 animate-in slide-in-from-top-3 fade-in"
      style={{
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.28), 0 0 1px 1px rgba(0,0,0,0.05)',
      }}
      role="alert"
    >
      <div className={`p-4 ${cfg.bg} ${cfg.border} border flex items-start gap-3.5`}>
        <div className="mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0 pr-1">
          <h4 className={`text-sm font-bold ${cfg.titleColor} leading-snug`}>
            {displayTitle}
          </h4>
          <p className={`mt-0.5 text-xs font-medium ${cfg.textColor} leading-relaxed break-words whitespace-pre-line`}>
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Animated countdown indicator */}
      {duration > 0 && (
        <div className="h-1 w-full bg-black/5 overflow-hidden">
          <div
            className={`h-full ${cfg.barColor}`}
            style={{
              animation: `toastCountdown ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes toastCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default Toast;
