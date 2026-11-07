import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  GraduationCap,
  X,
} from 'lucide-react';
import {
  requestForgotPasswordOtpApi,
  verifyForgotPasswordOtpApi,
  resetForgottenPasswordApi,
} from '../../services/auth';

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess,
}) {
  const [step, setStep] = useState('request'); // 'request' | 'verify' | 'reset' | 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setEmail(initialEmail || '');
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setResendCooldown(0);
    }
  }, [isOpen, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // 1. Request OTP handler
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your student email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await requestForgotPasswordOtpApi({ email: cleanEmail });
      setSuccessMsg(res.message || 'Verification code sent to your email.');
      setResendCooldown(30);
      setStep('verify');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP handler
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMsg('OTP must be exactly 6 digits.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyForgotPasswordOtpApi({
        email: email.trim(),
        otp: cleanOtp,
      });

      if (!res.reset_token) {
        throw new Error('Verification succeeded but reset token was not received.');
      }

      setResetToken(res.reset_token);
      setSuccessMsg('OTP verified successfully. You may now reset your password.');
      setStep('reset');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password handler
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    if (!resetToken) {
      setErrorMsg('Reset token is missing. Please restart the verification process.');
      setStep('request');
      return;
    }

    try {
      setLoading(true);
      const res = await resetForgottenPasswordApi({
        email: email.trim(),
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMsg(res.message || 'Password reset successfully!');
      setStep('success');
      if (onSuccess) {
        onSuccess(email.trim());
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-md my-auto rounded-3xl bg-white shadow-2xl border border-[#e3ddd0] overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        style={sans}
      >
        {/* Top Header */}
        <div
          className="relative px-6 pt-7 pb-6 border-b border-[#e8e2d5] overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #fbf7ee 0%, #ffffff 100%)' }}
        >
          {/* Subtle gold decorative glow */}
          <div
            className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-30 blur-2xl pointer-events-none"
            style={{ background: '#f4b942' }}
          />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ring-4 ring-amber-100/70"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #9c6b2e 100%)',
                  color: '#ffffff',
                }}
              >
                {step === 'reset' ? (
                  <Lock className="w-6 h-6 text-amber-50" />
                ) : step === 'verify' ? (
                  <ShieldCheck className="w-6 h-6 text-amber-50" />
                ) : step === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-amber-50" />
                ) : (
                  <KeyRound className="w-6 h-6 text-amber-50" />
                )}
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#9c6b2e]" />
                  <span>Student Security</span>
                </span>
                <h3 className="text-xl font-bold text-slate-900 leading-snug" style={serif}>
                  {step === 'verify'
                    ? 'Verify OTP'
                    : step === 'reset'
                    ? 'Set New Password'
                    : step === 'success'
                    ? 'Password Reset'
                    : 'Forgot Password?'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle instructions */}
          <p className="mt-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            {step === 'verify'
              ? `Enter the 6-digit verification code sent to ${email}.`
              : step === 'reset'
              ? 'Choose a strong new password with at least 8 characters.'
              : step === 'success'
              ? 'Your password has been securely updated. You can now log in.'
              : 'Enter your student email address and we will send you a 6-digit OTP code to verify your account.'}
          </p>

          {/* Step indicator pills */}
          {step !== 'success' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#ece7dc]">
              <span
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step === 'request' || step === 'verify' || step === 'reset'
                    ? 'bg-[#9c6b2e]'
                    : 'bg-slate-200'
                }`}
              />
              <span
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step === 'verify' || step === 'reset' ? 'bg-[#9c6b2e]' : 'bg-slate-200'
                }`}
              />
              <span
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step === 'reset' ? 'bg-[#9c6b2e]' : 'bg-slate-200'
                }`}
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 rounded-xl p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span className="flex-1 leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && step !== 'success' && (
            <div className="mb-4 rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="flex-1 leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ── STEP 1: REQUEST OTP ── */}
          {step === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Student Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #9c6b2e 0%, #825722 100%)',
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Sending Verification Code…' : 'Send 6-Digit OTP'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Remember your password? <span className="text-[#9c6b2e] underline font-bold">Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: VERIFY OTP ── */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    6-Digit Verification Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setErrorMsg('');
                    }}
                    className="text-xs text-[#9c6b2e] hover:underline font-semibold"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    placeholder="123456"
                    autoFocus
                    className="w-full px-4 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-center tracking-[0.5em] text-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 text-center">
                  Enter the 6 numbers received in your inbox or spam folder.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #9c6b2e 0%, #825722 100%)',
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Verifying OTP…' : 'Verify & Continue'}</span>
                </button>
              </div>

              {/* Resend OTP button */}
              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-slate-400 font-medium">
                    Resend OTP in <span className="font-bold text-slate-700">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleRequestOtp}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c6b2e] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Didn't receive code? Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── STEP 3: RESET PASSWORD ── */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    New Password *
                  </label>
                  <span
                    className={`text-[11px] font-semibold ${
                      newPassword.length >= 8 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {newPassword.length >= 8 ? '✓ Min 8 chars' : `${newPassword.length}/8 min`}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoFocus
                    className="w-full pl-11 pr-11 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Confirm New Password *
                  </label>
                  {confirmPassword && (
                    <span
                      className={`text-[11px] font-semibold ${
                        newPassword === confirmPassword ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {newPassword === confirmPassword ? '✓ Passwords match' : '⚠️ Passwords do not match'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-11 pr-11 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#9c6b2e] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #9c6b2e 0%, #825722 100%)',
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Updating Password…' : 'Reset Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 4: SUCCESS CONFIRMATION ── */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Password Changed Successfully!</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your student account password has been updated. You can now log in with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #9c6b2e 0%, #825722 100%)',
                }}
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

