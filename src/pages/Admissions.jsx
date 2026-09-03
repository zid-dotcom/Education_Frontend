import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CheckCircle, FileText, Send, UserCheck, HelpCircle, PhoneCall, CheckCircle2, Loader2 } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';
import FAQAccordion from '../components/common/FAQAccordion';
import { faqs } from '../data/faqs';
import { createEnquiryApi } from '../services/enquiries';
import { useAuth } from '../context/AuthContext';

const Admissions = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    course: 'Diploma in Fashion Designing',
    qualification: '12th Pass',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      
      {/* PAGE HEADER BANNER */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-100/60 to-white border-b border-amber-200/60 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-950 border border-amber-300 mb-4">
            <GraduationCap className="w-4 h-4 text-amber-700" />
            <span>Academic Year 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Institute Admission Process
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Simple 5-step admission process to launch your career. Apply online today with flexible zero-interest monthly installment options.
          </p>
        </div>
      </section>

      {/* 5-STEP ADMISSION PROCESS TIMELINE */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Simple Process"
            title="How to Secure Your Seat"
            subtitle="Follow these 5 easy steps to get enrolled in your preferred diploma program."
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {admissionSteps.map((item, idx) => (
              <div key={idx} className="bg-amber-50/50 rounded-3xl p-6 border border-amber-200 shadow-sm relative space-y-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                  {item.step}
                </span>
                <h4 className="font-extrabold text-lg text-slate-950 pt-2">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REQUIRED DOCUMENTS CHECKLIST */}
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Checklist</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-tight">
                Required Admission Documents
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Please keep digital copies or physical prints of the following documents ready for verification during counseling:
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-amber-200 text-slate-900 text-sm font-bold shadow-xs">
                  <FileText className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Passport-size Photograph (4 Recent Copies)</span>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-amber-200 text-slate-900 text-sm font-bold shadow-xs">
                  <FileText className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Valid ID Proof (Aadhaar / Voter ID / Passport)</span>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-amber-200 text-slate-900 text-sm font-bold shadow-xs">
                  <FileText className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Educational Certificate (10th / 12th / Degree Marksheets)</span>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-amber-200 text-slate-900 text-sm font-bold shadow-xs">
                  <FileText className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Address Proof & Transfer Certificate</span>
                </div>
              </div>
            </div>

            {/* ONLINE APPLICATION FORM */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-amber-300 shadow-2xl space-y-6">
                
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-950">Online Admission Application</h3>
                  <p className="text-xs text-slate-500 mt-1">Submit your details below for instant batch allocation.</p>
                </div>

                {isSubmitted ? (
                  <div className="py-10 text-center flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-950">Application Submitted Successfully!</h4>
                    <p className="text-sm text-slate-600 max-w-sm">
                      Thank you, <span className="font-bold text-slate-900">{formData.fullName}</span>! Our admissions counselor will contact you shortly at <span className="font-bold text-slate-900">{formData.phone}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full"
                    >
                      Submit Another Application
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Ananya Nair"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                          errors.fullName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400'
                        }`}
                      />
                      {errors.fullName && <p className="text-rose-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.phone ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="ananya@example.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Select Course</label>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      >
                        <option value="Diploma in Fashion Designing">Diploma in Fashion Designing</option>
                        <option value="Full Stack Web Development Diploma">Full Stack Web Development Diploma</option>
                        <option value="Diploma in Hotel Management">Diploma in Hotel Management</option>
                        <option value="Diploma in Graphic Design & UI/UX">Diploma in Graphic Design & UI/UX</option>
                        <option value="Diploma in Computer Applications (DCA)">Diploma in Computer Applications (DCA)</option>
                        <option value="Food & Beverage Management">Food & Beverage Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Qualification</label>
                      <select
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
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
                        {loading ? 'Submitting Form...' : 'Submit Admission Form'}
                      </Button>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ADMISSIONS FAQS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Admission Help"
            title="Admission Frequently Asked Questions"
            subtitle="Got questions about seat availability, document submission, or installment plans?"
          />
          <FAQAccordion items={admissionFaqs.length > 0 ? admissionFaqs : faqs.slice(0, 4)} />
        </div>
      </section>

    </div>
  );
};

export default Admissions;
