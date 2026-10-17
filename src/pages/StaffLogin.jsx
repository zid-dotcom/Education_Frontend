import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import staffHero from '../assets/Collaborative Teamwork Around Laptop.png';
import { 
  Mail, 
  Lock, 
  User, 
  Phone,
  MapPin,
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

const StaffLogin = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [highestQualification, setHighestQualification] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register, staffLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated as staff
  React.useEffect(() => {
    if (user?.role === 'staff') {
      navigate('/staff/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const from = location.state?.from?.pathname || '/staff/dashboard';

  const resetForm = () => {
    setName('');
    setStaffId('');
    setPhone('');
    setParentName('');
    setParentPhone('');
    setHighestQualification('');
    setAddress('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const toggleMode = (mode) => {
    setIsLoginMode(mode);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!staffId || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!isLoginMode) {
      if (!name) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!phone) {
        setErrorMsg('Please enter your phone number.');
        return;
      }
      if (!parentName || !parentPhone || !highestQualification || !address) {
        setErrorMsg('Please complete all student profile fields.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        await staffLogin(staffId.trim(), password);
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          navigate('/staff/dashboard', { replace: true });
        }, 800);
      } else {
        const userData = await register({
          name,
          email: staffId,
          password,
          phone,
          parent_name: parentName,
          parent_phone: parentPhone,
          highest_qualification: highestQualification,
          address,
        });
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate('/student-dashboard', { replace: true });
        }, 1000);
      }
    } catch (err) {
      if (err.message?.includes('Failed to fetch')) {
        setErrorMsg('Unable to connect to backend server. Please ensure backend is running.');
      } else {
        setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-h-[calc(100vh-92px)] flex flex-col lg:flex-row bg-white relative overflow-hidden">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-white items-center justify-center">
        <img src={staffHero} alt="Staff Login at AurumFX Academy" className="w-full h-full object-contain object-center lg:pl-8 scale-105" />
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
      
      <div className="max-w-md w-full lg:max-w-lg">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1917] flex items-center justify-center text-[#F5B718] shadow-lg group-hover:scale-105 transition-transform">
              <User className="w-7 h-7" />
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {!isLoginMode ? 'Join as Staff' : 'Staff Login'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            {!isLoginMode ? 'Create a staff account to access the dashboard' : 'Sign in to your staff account to continue'}
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80">
          
          {/* Navigation Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <Link
              to="/login"
              className="flex-1 py-2.5 px-3 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-900 text-center transition-colors"
            >
              Student Login
            </Link>
            <button
              type="button"
              className="flex-1 py-2.5 px-3 rounded-lg text-sm font-bold bg-white text-slate-900 shadow-sm"
            >
              Staff Login
            </button>
          </div>
          
          {/* Redirect Notice Banner (e.g. when session expires or unauthenticated access) */}
          {location.state?.message && !successMsg && !errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center gap-3 text-amber-950 text-sm font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-extrabold text-slate-900">
                  {location.state?.title ||
                    (location.state?.message?.toLowerCase().includes('expired')
                      ? 'Staff Session Expired'
                      : 'Staff Login Required')}
                </div>
                <div className="text-xs text-amber-900 font-medium mt-0.5">{location.state.message}</div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col gap-2 text-rose-800 text-sm font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Full Name field (Register mode only) */}
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F5B718] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Phone Number field (Register mode only) */}
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F5B718] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Parent / guardian details (Register mode only) */}
            {!isLoginMode && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Guardian Name</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><User className="h-5 w-5" /></div>
                    <input type="text" required value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Guardian name" className="w-full rounded-xl border border-amber-200 bg-[#FAF6ED]/70 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F5B718]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Guardian Phone</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Phone className="h-5 w-5" /></div>
                    <input type="tel" required value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="Guardian phone number" className="w-full rounded-xl border border-amber-200 bg-[#FAF6ED]/70 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F5B718]" />
                  </div>
                </div>
              </div>
            )}

            {/* Qualification and address (Register mode only) */}
            {!isLoginMode && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Highest Qualification</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><GraduationCap className="h-5 w-5" /></div>
                    <input type="text" required value={highestQualification} onChange={(e) => setHighestQualification(e.target.value)} placeholder="e.g. 12th Pass, Degree" className="w-full rounded-xl border border-amber-200 bg-[#FAF6ED]/70 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F5B718]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">Address</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-0 top-3.5 flex items-center pl-3.5 text-slate-400"><MapPin className="h-5 w-5" /></div>
                    <textarea required rows="3" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full address" className="w-full resize-y rounded-xl border border-amber-200 bg-[#FAF6ED]/70 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F5B718]" />
                  </div>
                </div>
              </>
            )}

            {/* Staff ID field */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Staff ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. STF001"
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F5B718] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F5B718] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field (Register mode only) */}
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-[#FAF6ED]/70 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F5B718] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#1C1917] hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F5B718]" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isLoginMode ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4 text-[#F5B718]" />
                  </>
                )}
              </button>
            </div>
          </form>


        </div>



      </div>
      </div>
    </div>
  );
};

export default StaffLogin;
