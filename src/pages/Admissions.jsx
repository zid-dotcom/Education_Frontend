import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileText, Send, CheckCircle2, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import FAQAccordion from '../components/common/FAQAccordion';
import { faqs } from '../data/faqs';
import { createEnquiryApi } from '../services/enquiries';
import { getPublicBranchesWithCoursesApi } from '../services/branches';
import { useAuth } from '../context/AuthContext';

// Reveals its children with a fade-up once scrolled into view
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ad-reveal ${inView ? 'ad-in' : ''} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

const Admissions = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    branchId: '',
    course: '',
    qualification: '12th Pass',
    message: ''
  });

  const [branches, setBranches] = useState([]);
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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const admissionSteps = [
    {
      step: '01',
      title: 'Select Your Course',
      desc: 'Browse our programs across Fashion, Computer Diploma, and Hospitality to pick the course matching your passion.'
    },
    {
      step: '02',
      title: 'Submit Application',
      desc: 'Fill out the online application form below or visit our Calicut campus admissions office.'
    },
    {
      step: '03',
      title: 'Application Review',
      desc: 'Our academic review committee verifies your qualification documents and background.'
    },
    {
      step: '04',
      title: 'Counseling Session',
      desc: 'Attend a 1-on-1 counseling session with our department heads to discuss career goals and batch timing.'
    },
    {
      step: '05',
      title: 'Admission Confirmation',
      desc: 'Receive your official admission letter and student ID card upon fee confirmation.'
    }
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = 'Enter valid 10-digit phone number';
    }
    if (!formData.branchId) {
      newErrors.branchId = 'Please select a branch';
    }
    if (!formData.course) {
      newErrors.course = 'Please select a course';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', {
        state: { message: 'Please log in to your student account to submit your admission application.' }
      });
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');
      setErrors({});

      await createEnquiryApi({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        branch_id: formData.branchId ? Number(formData.branchId) : null,
        course: formData.course,
        qualification: formData.qualification,
        message: formData.message || `Admission application for ${formData.course}`
      });

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit admission form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const admissionFaqs = faqs.filter(f => f.category === 'admission');

  return (
    <div className="bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .ad-serif { font-family: 'Fraunces', serif; }
        .ad-sans { font-family: 'Inter', sans-serif; }

        .ad-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ad-reveal.ad-in { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* PAGE HEADER */}
      <section className="pt-16 pb-8 sm:pt-24 sm:pb-12 bg-white text-center relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-amber-100/50 blur-3xl" />
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 relative">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="ad-sans text-sm font-semibold text-amber-700 tracking-wide">Academic year 2026</span>
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h1 className="ad-serif text-4xl sm:text-6xl leading-[1.08] text-[#1C1917]">
            Your <span className="italic text-amber-700">admission</span> journey, in five steps
          </h1>
          <p className="ad-sans mt-5 text-base text-stone-600 leading-relaxed max-w-xl mx-auto">
            Apply online today with flexible, zero-interest monthly installment options.
          </p>
        </Reveal>
      </section>

      {/* 5-STEP ADMISSION PROCESS */}
      <section className="pt-8 pb-16 sm:pt-12 sm:pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-16">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px bg-amber-500" />
              <span className="ad-sans text-sm font-semibold text-amber-700 tracking-wide">Simple process</span>
            </div>
            <h2 className="ad-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
              How to secure your seat
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">

            {/* Vertical timeline */}
            <div className="lg:col-span-7">
              {admissionSteps.map((item, idx) => (
                <Reveal key={idx} delay={idx * 90} className="relative flex gap-5 pb-10 last:pb-0">
                  {/* connecting line */}
                  {idx < admissionSteps.length - 1 && (
                    <span className="absolute left-5 top-11 bottom-0 w-px bg-stone-200" />
                  )}
                  <span className="ad-serif relative z-10 shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold flex items-center justify-center text-sm shadow-md shadow-amber-900/20">
                    {item.step}
                  </span>
                  <div className="pt-1">
                    <h4 className="ad-serif text-xl text-[#1C1917] mb-1.5">{item.title}</h4>
                    <p className="ad-sans text-sm text-stone-600 leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Supporting image */}
            <Reveal delay={100} className="lg:col-span-5 relative lg:sticky lg:top-24">
              <div className="relative">
                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-300 to-amber-500 -rotate-2" />
                <div className="relative rounded-[1.75rem] overflow-hidden shadow-2xl shadow-amber-900/10 h-[380px] sm:h-[460px]">
                  <img
                    src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&q=80&auto=format&fit=crop"
                    alt="Students beginning their journey at AurumFX"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </div>

                <div className="absolute -bottom-6 -left-4 sm:left-6 bg-white p-4 rounded-2xl shadow-lg border border-stone-100 flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#1C1917] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-amber-400" />
                  </span>
                  <div>
                    <div className="ad-sans text-sm font-bold text-[#1C1917] leading-tight">5 simple steps</div>
                    <div className="ad-sans text-xs text-stone-500 mt-0.5">From application to admit</div>
                  </div>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* REQUIRED DOCUMENTS + APPLICATION FORM */}
      <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">

            {/* Documents checklist */}
            <Reveal className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-amber-500" />
                <span className="ad-sans text-sm font-semibold text-amber-700 tracking-wide">Checklist</span>
              </div>
              <h2 className="ad-serif text-2xl sm:text-4xl leading-[1.15] text-[#1C1917]">
                Required admission documents
              </h2>
              <p className="ad-sans text-stone-600 text-sm sm:text-base leading-relaxed">
                Keep digital copies or physical prints of the following ready for verification
                during counseling:
              </p>

              <div className="space-y-3">
                {[
                  'Passport-size photograph (4 recent copies)',
                  'Valid ID proof (Aadhaar / Voter ID / Passport)',
                  'Educational certificate (10th / 12th / Degree marksheets)',
                  'Address proof & transfer certificate',
                ].map((doc) => (
                  <div
                    key={doc}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-stone-200 text-sm font-medium text-[#1C1917]"
                  >
                    <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </span>
                    <span className="ad-sans">{doc}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* ONLINE APPLICATION FORM */}
            <Reveal delay={150} className="lg:col-span-7">
              <div className="bg-white rounded-[2rem] p-6 sm:p-10 border border-stone-200 shadow-xl space-y-6">

                <div>
                  <h3 className="ad-serif text-2xl text-[#1C1917]">Online admission application</h3>
                  <p className="ad-sans text-xs text-stone-500 mt-1">Submit your details below for instant batch allocation.</p>
                </div>

                {isSubmitted ? (
                  <div className="py-10 text-center flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="ad-serif text-2xl text-[#1C1917]">Application submitted successfully!</h4>
                    <p className="ad-sans text-sm text-stone-600 max-w-sm">
                      Thank you, <span className="font-semibold text-[#1C1917]">{formData.fullName}</span>! Our admissions counselor will contact you shortly at <span className="font-semibold text-[#1C1917]">{formData.phone}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="ad-sans px-6 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-semibold rounded-full transition-colors"
                    >
                      Submit another application
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="ad-sans space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Full name *</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Ananya Nair"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                          errors.fullName ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                        }`}
                      />
                      {errors.fullName && <p className="text-rose-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Phone *</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.phone ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="ananya@example.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Select Branch *</label>
                        <select
                          value={formData.branchId}
                          onChange={(e) => {
                             setFormData({ ...formData, branchId: e.target.value, course: '' });
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white ${
                            errors.branchId ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                          }`}
                        >
                          <option value="">-- Select a Branch --</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        {errors.branchId && <p className="text-rose-500 text-xs mt-1">{errors.branchId}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Select course *</label>
                        <select
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white ${
                            errors.course ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                          }`}
                        >
                          <option value="">-- Select a Course --</option>
                          {branches
                            .find(b => String(b.id) === String(formData.branchId))
                            ?.courses?.map(c => (
                              <option key={c.id} value={c.title}>{c.title}</option>
                            ))}
                        </select>
                        {errors.course && <p className="text-rose-500 text-xs mt-1">{errors.course}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Qualification</label>
                      <select
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      >
                        <option value="10th Pass">10th Pass</option>
                        <option value="12th Pass">12th Pass</option>
                        <option value="Graduate">Graduate</option>
                        <option value="Post Graduate">Post Graduate</option>
                      </select>
                    </div>

                    {submitError && (
                      <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                        {submitError}
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        disabled={loading}
                        icon={loading ? Loader2 : Send}
                      >
                        {loading ? 'Submitting form...' : 'Submit admission form'}
                      </Button>
                    </div>
                  </form>
                )}

              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ADMISSIONS FAQS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mx-auto text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="w-8 h-px bg-amber-500" />
              <span className="ad-sans text-sm font-semibold text-amber-700 tracking-wide">Admission help</span>
              <span className="w-8 h-px bg-amber-500" />
            </div>
            <h2 className="ad-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
              Frequently asked questions
            </h2>
            <p className="ad-sans mt-5 text-base text-stone-600 leading-relaxed">
              Got questions about seat availability, document submission, or installment plans?
            </p>
          </Reveal>
          <Reveal delay={100}>
            <FAQAccordion items={admissionFaqs.length > 0 ? admissionFaqs : faqs.slice(0, 4)} />
          </Reveal>
        </div>
      </section>

    </div>
  );
};

export default Admissions;