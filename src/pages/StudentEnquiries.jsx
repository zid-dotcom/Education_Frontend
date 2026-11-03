import React, { useEffect, useState } from 'react';
import { MessageCircle, GraduationCap, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPublicBranchesWithCoursesApi } from '../services/branches';
import { createEnquiryApi } from '../services/enquiries';
import { EnquiriesBannerIllustration } from '../components/common/StudentBannerIllustrations';

const StudentEnquiries = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('admission');
  const [branches, setBranches] = useState([]);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    branchId: '',
    course: '',
    qualification: '12th Pass',
    admissionMessage: '',
    generalMessage: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await getPublicBranchesWithCoursesApi();
        setBranches(data || []);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, branchId: data[0].id }));
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.branchId) {
      newErrors.branchId = 'Please select a branch';
    }
    if (activeTab === 'admission' && !formData.course) {
      newErrors.course = 'Please select a course';
    }
    const currentMsg = activeTab === 'admission' ? formData.admissionMessage : formData.generalMessage;
    if (!currentMsg.trim()) {
      newErrors.message = 'Message is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');
      setErrors({});

      const messageText = activeTab === 'admission' ? formData.admissionMessage : formData.generalMessage;

      await createEnquiryApi({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        branch_id: formData.branchId ? Number(formData.branchId) : null,
        course: activeTab === 'admission' ? formData.course : 'General Inquiry',
        qualification: activeTab === 'admission' ? formData.qualification : null,
        message: messageText,
      });

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData(prev => ({
      ...prev,
      course: '',
      admissionMessage: '',
      generalMessage: '',
    }));
  };

  return (
    <div
      className="w-full pb-8 font-['Plus_Jakarta_Sans',sans-serif] opacity-0 animate-[announcementOpen_0.45s_ease-out_forwards]"
    >
      <style>{`
        @keyframes announcementOpen {
          0% { opacity: 0; transform: translateY(18px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div className="w-full space-y-6">
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
          <div className="relative z-10 flex flex-col md:flex-row md:items-stretch justify-between min-h-[190px] sm:min-h-[210px] md:min-h-[230px]">
            {/* Left Text Content */}
            <div className="p-6 sm:p-8 md:p-10 max-w-xl lg:max-w-2xl space-y-2.5 z-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
                <MessageCircle className="h-3.5 w-3.5 text-[#9C6B2E]" />
                <span>Student Support & Queries</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17140F] leading-tight">
                Student Enquiries
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
                Send admission requests, academic questions, or fee queries directly to your branch administrator and track answers.
              </p>
            </div>

            {/* Right SVG Illustration - Fitted flush to top, bottom and right */}
            <div className="w-full md:w-auto flex justify-end items-end md:self-stretch shrink-0 select-none overflow-hidden pr-0">
              <div className="w-full sm:w-[460px] md:w-[480px] lg:w-[540px] xl:w-[600px] h-[190px] sm:h-[220px] md:h-full flex items-end justify-end">
                <EnquiriesBannerIllustration className="w-full h-full block" />
              </div>
            </div>
          </div>
        </section>

        <div className="bg-white rounded-3xl border border-[#E3DDD0] shadow-2xs overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#E3DDD0] bg-[#FAF8F4]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admission');
                setIsSubmitted(false);
                setErrors({});
                setSubmitError('');
              }}
              className={`flex-1 py-4 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'admission'
                  ? 'text-[#9C6B2E] bg-white border-b-2 border-[#9C6B2E]'
                  : 'text-[#8A8175] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Admission Enquiry
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('general');
                setIsSubmitted(false);
                setErrors({});
                setSubmitError('');
              }}
              className={`flex-1 py-4 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'general'
                  ? 'text-[#9C6B2E] bg-white border-b-2 border-[#9C6B2E]'
                  : 'text-[#8A8175] hover:bg-[#F1EDE4] hover:text-[#17140F]'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              General Enquiry
            </button>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {isSubmitted ? (
              <div className="py-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-[#F1EDE4] text-[#9C6B2E] rounded-full flex items-center justify-center border border-[#E3DDD0] mb-4 shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-[#17140F] mb-2">Message sent successfully!</h3>
                <p className="text-[#5B5346] text-xs sm:text-sm mb-6 max-w-md">
                  Thank you for reaching out. The branch administrator has received your {activeTab === 'admission' ? 'admission application' : 'general enquiry'} and will get back to you shortly.
                </p>
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-[#F1EDE4] hover:bg-[#E8E2D5] text-[#9C6B2E] text-xs font-bold rounded-xl border border-[#E3DDD0] transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Your name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 bg-[#FAF8F4] text-[#17140F] transition ${
                        errors.name
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-[#9C6B2E]'
                      }`}
                    />
                    {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Your email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 bg-[#FAF8F4] text-[#17140F] transition ${
                        errors.email
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-[#9C6B2E]'
                      }`}
                    />
                    {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 bg-[#FAF8F4] text-[#17140F] transition ${
                        errors.phone
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-[#9C6B2E]'
                      }`}
                    />
                    {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Branch *</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value, course: '' })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 bg-[#FAF8F4] text-[#17140F] transition ${
                        errors.branchId
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-[#9C6B2E]'
                      }`}
                    >
                      <option value="">-- Select a Branch --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {errors.branchId && <p className="text-rose-500 text-xs mt-1">{errors.branchId}</p>}
                  </div>
                </div>

                {activeTab === 'admission' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Select course *</label>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 bg-[#FAF8F4] text-[#17140F] transition ${
                          errors.course
                            ? 'border-rose-500 focus:ring-rose-200'
                            : 'border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-[#9C6B2E]'
                        }`}
                      >
                        <option value="">-- Select a Course --</option>
                        {branches
                          .find((b) => String(b.id) === String(formData.branchId))
                          ?.courses?.map((c) => (
                            <option key={c.id} value={c.title}>
                              {c.title}
                            </option>
                          ))}
                      </select>
                      {errors.course && <p className="text-rose-500 text-xs mt-1">{errors.course}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Highest Qualification *</label>
                      <select
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] text-xs focus:outline-none focus:ring-1 focus:ring-[#9C6B2E] bg-[#FAF8F4] text-[#17140F] transition"
                      >
                        <option value="10th Pass">10th Pass</option>
                        <option value="12th Pass">12th Pass</option>
                        <option value="Undergraduate">Undergraduate</option>
                        <option value="Postgraduate">Postgraduate</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {activeTab === 'admission' ? 'Your admission inquiry message *' : 'Your general inquiry message *'}
                  </label>
                  <textarea
                    rows="4"
                    value={activeTab === 'admission' ? formData.admissionMessage : formData.generalMessage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [activeTab === 'admission' ? 'admissionMessage' : 'generalMessage']: e.target.value,
                      })
                    }
                    placeholder={
                      activeTab === 'admission'
                        ? 'Tell us about your background and interest in this course...'
                        : 'Write your questions here...'
                    }
                    className={`w-full px-4 py-3 rounded-xl border text-xs focus:outline-none focus:ring-1 bg-[#FAF8F4] text-[#17140F] transition resize-none ${
                      errors.message
                        ? 'border-rose-500 focus:ring-rose-200'
                        : 'border-[#E3DDD0] focus:bg-white focus:border-[#9C6B2E] focus:ring-[#9C6B2E]'
                    }`}
                  ></textarea>
                  {errors.message && <p className="text-rose-500 text-xs mt-1">{errors.message}</p>}
                </div>

                {submitError && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs font-medium rounded-xl border border-rose-200">
                    {submitError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#9C6B2E] hover:bg-[#855923] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? 'Sending message...' : 'Send message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnquiries;
