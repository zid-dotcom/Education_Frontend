import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    highestQualification: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        parent_name: formData.parentName,
        parent_phone: formData.parentPhone,
        highest_qualification: formData.highestQualification,
        address: formData.address,
      });
      navigate('/student-dashboard', { replace: true });
    } catch (error) {
      setErrorMsg(error.message?.includes('Failed to fetch')
        ? 'Unable to connect to the server. Please try again shortly.'
        : error.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-[#fbfaf7] px-4 py-10 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="animate-fade-in-up mb-8 text-center">
          <Link to="/" className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-amber-400 shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-1" aria-label="Back to Aurumfx home">
            <GraduationCap className="h-7 w-7" />
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700">Aurumfx Academy</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Start your learning journey</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-slate-500">Create your student account and take the first step toward a career you are proud of.</p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          {errorMsg && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700" role="alert">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm font-black text-amber-800">01</span>
                <div><h2 className="text-sm font-black text-slate-950">Your details</h2><p className="text-xs font-medium text-slate-500">Tell us how to reach you.</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Full name</span><div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={formData.name} onChange={updateField('name')} placeholder="John Doe" className={fieldClass} /></div></label>
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Email address</span><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" value={formData.email} onChange={updateField('email')} placeholder="student@example.com" className={fieldClass} /></div></label>
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Phone number</span><div className="relative"><Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="tel" value={formData.phone} onChange={updateField('phone')} placeholder="+91 98765 43210" className={fieldClass} /></div></label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sm font-black text-sky-800">02</span><div><h2 className="text-sm font-black text-slate-950">Student profile</h2><p className="text-xs font-medium text-slate-500">A little context helps us support you.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Guardian name</span><div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={formData.parentName} onChange={updateField('parentName')} placeholder="Guardian name" className={fieldClass} /></div></label>
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Guardian phone</span><div className="relative"><Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="tel" value={formData.parentPhone} onChange={updateField('parentPhone')} placeholder="Guardian phone number" className={fieldClass} /></div></label>
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Highest qualification</span><div className="relative"><GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required value={formData.highestQualification} onChange={updateField('highestQualification')} placeholder="e.g. 12th Pass, Degree" className={fieldClass} /></div></label>
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Address</span><div className="relative"><MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><textarea required rows="1" value={formData.address} onChange={updateField('address')} placeholder="Enter your full address" className={`${fieldClass} resize-y`} /></div></label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-black text-emerald-800">03</span><div><h2 className="text-sm font-black text-slate-950">Secure your account</h2><p className="text-xs font-medium text-slate-500">Use at least 6 characters for your password.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Password</span><div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength="6" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={updateField('password')} placeholder="Create a password" className={`${fieldClass} pr-11`} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
                <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-600">Confirm password</span><div className="relative"><ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength="6" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={updateField('confirmPassword')} placeholder="Repeat your password" className={`${fieldClass} pr-11`} /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin text-amber-400" /> Creating account...</> : <>Create student account <ArrowRight className="h-4 w-4 text-amber-400" /></>}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Your information is kept secure.</div>
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-slate-500">Already have an account? <Link to="/login" className="font-black text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4">Sign in</Link></p>
      </div>
    </div>
  );
};

export default Register;