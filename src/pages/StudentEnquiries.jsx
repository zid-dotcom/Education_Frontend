import React, { useEffect, useState } from 'react';
import { MessageCircle, GraduationCap, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPublicBranchesWithCoursesApi } from '../services/branches';
import { createEnquiryApi } from '../services/enquiries';

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
        <section className="rounded-2xl border border-purple-100 bg-white p-6 sm:p-8 shadow-[0_8px_25px_rgba(0,0,0,0.03)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#7C3AED]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Student Portal</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Enquiries</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal">
                Send admission requests or general queries directly to your branch administrator.
              </p>
            </div>
          </div>
        </section>

        <div className="bg-white rounded-3xl border border-purple-100 shadow-[0_8px_25px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-purple-100 bg-[#FAF8FE]">
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
                  ? 'text-[#7C3AED] bg-white border-b-2 border-[#7C3AED]'
                  : 'text-slate-400 hover:bg-purple-50 hover:text-purple-700'
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
                  ? 'text-[#7C3AED] bg-white border-b-2 border-[#7C3AED]'
                  : 'text-slate-400 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              General Enquiry
            </button>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {isSubmitted ? (
              <div className="py-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-purple-50 text-[#7C3AED] rounded-full flex items-center justify-center border border-purple-200 mb-4 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Message sent successfully!</h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-md">
                  Thank you for reaching out. The branch administrator has received your {activeTab === 'admission' ? 'admission application' : 'general enquiry'} and will get back to you shortly.
                </p>
                <button
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition"
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
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 bg-[#F5F2FC] transition ${
                        errors.name
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-purple-100 focus:bg-white focus:border-purple-300 focus:ring-purple-200'
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
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 bg-[#F5F2FC] transition ${
                        errors.email
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-purple-100 focus:bg-white focus:border-purple-300 focus:ring-purple-200'
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
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 bg-[#F5F2FC] transition ${
                        errors.phone
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-purple-100 focus:bg-white focus:border-purple-300 focus:ring-purple-200'
                      }`}
                    />
                    {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Branch *</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value, course: '' })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 bg-[#F5F2FC] transition ${
                        errors.branchId
                          ? 'border-rose-500 focus:ring-rose-200'
                          : 'border-purple-100 focus:bg-white focus:border-purple-300 focus:ring-purple-200'
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
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 bg-[#F5F2FC] transition ${
                          errors.course
                            ? 'border-rose-500 focus:ring-rose-200'
                            : 'border-purple-100 focus:bg-white focus:border-purple-300 focus:ring-purple-200'
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
                        className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:bg-white focus:border-purple-300 focus:ring-purple-200 text-xs focus:outline-none focus:ring-2 bg-[#F5F2FC] transition"
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
                    className={`w-full px-4 py-3 rounded-xl border text-xs focus:outline-none focus:ring-2 bg-[#F5F2FC] transition resize-none ${
                      errors.message
                        ? 'border-rose-500 focus:ring-rose-200'
                        : 'border-purple-100 focus:bg-white focus:border-purple-300 focus:ring-purple-200'
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
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
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
