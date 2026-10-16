import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import { instituteInfo } from '../data/instituteInfo';
import { createEnquiryApi } from '../services/enquiries';
import { getPublicBranchesWithCoursesApi } from '../services/branches';
import { getSettingsApi } from '../services/settings';
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
      className={`ct-reveal ${inView ? 'ct-in' : ''} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

const Contact = () => {
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    branchId: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [branches, setBranches] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [contactInfo, setContactInfo] = useState({
    address: instituteInfo.address,
    phone: instituteInfo.phone,
    altPhone: instituteInfo.altPhone,
    email: instituteInfo.email,
    admissionsEmail: instituteInfo.admissionsEmail,
    workingHours: instituteInfo.workingHours,
  });

  useEffect(() => {
    const fetchDynamicSettings = async () => {
      try {
        const data = await getSettingsApi();
        if (data) {
          setContactInfo({
            address: data.address || instituteInfo.address,
            phone: data.phone || instituteInfo.phone,
            altPhone: data.alt_phone || instituteInfo.altPhone,
            email: data.email || instituteInfo.email,
            admissionsEmail: data.admissions_email || instituteInfo.admissionsEmail,
            workingHours: data.working_hours || instituteInfo.workingHours,
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchDynamicSettings();

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
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.branchId) newErrors.branchId = 'Please select a branch';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
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

      await createEnquiryApi({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        course: formData.subject,
        branch_id: formData.branchId ? Number(formData.branchId) : null,
        message: formData.message
      });

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const infoCards = [
    { icon: MapPin, label: 'Campus location', content: contactInfo.address },
    {
      icon: Phone,
      label: 'Phone & WhatsApp',
      content: (
        <>
          <a href={`tel:${contactInfo.phone}`} className="hover:text-amber-700 font-medium">{contactInfo.phone}</a>
          {contactInfo.altPhone && (
            <>
              <br />
              <a href={`tel:${contactInfo.altPhone}`} className="hover:text-amber-700 font-medium">{contactInfo.altPhone}</a>
            </>
          )}
        </>
      ),
    },
    {
      icon: Mail,
      label: 'Email address',
      content: (
        <>
          <a href={`mailto:${contactInfo.email}`} className="hover:text-amber-700 font-medium">{contactInfo.email}</a>
          {contactInfo.admissionsEmail && (
            <>
              <br />
              <a href={`mailto:${contactInfo.admissionsEmail}`} className="hover:text-amber-700 font-medium">{contactInfo.admissionsEmail}</a>
            </>
          )}
        </>
      ),
    },
    { icon: Clock, label: 'Working hours', content: contactInfo.workingHours },
  ];

  return (
    <div className="bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap');

        .ct-serif { font-family: 'Fraunces', serif; }
        .ct-sans { font-family: 'Inter', sans-serif; }

        .ct-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ct-reveal.ct-in { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* PAGE HEADER */}
      <section className="pt-16 pb-8 sm:pt-24 sm:pb-12 bg-white text-center relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-amber-100/50 blur-3xl" />
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 relative">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="w-8 h-px bg-amber-500" />
            <span className="ct-sans text-sm font-semibold text-amber-700 tracking-wide">Connect with us</span>
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h1 className="ct-serif text-4xl sm:text-6xl leading-[1.08] text-[#1C1917]">
            Let's talk about your <span className="italic text-amber-700">next step</span>
          </h1>
          <p className="ct-sans mt-5 text-base text-stone-600 leading-relaxed max-w-xl mx-auto">
            Questions about fees, batch schedules, or campus visits? Reach out to our
            admissions helpdesk.
          </p>
        </Reveal>
      </section>

      {/* CONTACT INFORMATION & FORM */}
      <section className="pt-8 pb-16 sm:pt-12 sm:pb-24 bg-white relative overflow-hidden">
        <div className="pointer-events-none absolute top-1/3 right-0 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10">

            {/* LEFT: CONTACT INFO */}
            <Reveal className="lg:col-span-5 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-px bg-amber-500" />
                  <span className="ct-sans text-sm font-semibold text-amber-700 tracking-wide">Reach us</span>
                </div>
                <h2 className="ct-serif text-2xl sm:text-4xl leading-[1.15] text-[#1C1917]">
                  Get in touch with our counselors
                </h2>
                <p className="ct-sans text-sm text-stone-600 mt-3 leading-relaxed">
                  Our academic counselors are available Monday through Saturday to answer
                  your queries.
                </p>
              </div>

              <div className="space-y-4">
                {infoCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-300 transition-colors duration-300 flex items-start gap-4"
                    >
                      <span className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-900/20">
                        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                      </span>
                      <div>
                        <h4 className="ct-sans text-sm font-semibold text-[#1C1917]">{card.label}</h4>
                        <p className="ct-sans text-xs text-stone-600 leading-relaxed mt-1">
                          {card.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            {/* RIGHT: FORM */}
            <Reveal delay={150} className="lg:col-span-7">
              <div className="bg-white rounded-[2rem] p-6 sm:p-10 border border-stone-200 shadow-xl space-y-6">

                <div>
                  <h3 className="ct-serif text-2xl text-[#1C1917]">Send us a direct message</h3>
                  <p className="ct-sans text-xs text-stone-500 mt-1">Fill out the form below and we'll respond within 24 hours.</p>
                </div>

                {isSubmitted ? (
                  <div className="py-12 text-center flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="ct-serif text-2xl text-[#1C1917]">Message sent successfully!</h4>
                    <p className="ct-sans text-sm text-stone-600 max-w-sm">
                      Thank you for contacting us, <span className="font-semibold text-[#1C1917]">{formData.name}</span>. Our desk representative will get back to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="ct-sans px-6 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white text-xs font-semibold rounded-full transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="ct-sans space-y-4">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Rahul Krishnan"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.name ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="rahul@example.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Phone number</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Select Branch *</label>
                        <select
                          value={formData.branchId}
                          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
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
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Subject</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Your message *</label>
                      <textarea
                        rows="4"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Write your questions here..."
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                          errors.message ? 'border-rose-500 focus:ring-rose-200' : 'border-stone-300 focus:ring-amber-400'
                        }`}
                      ></textarea>
                      {errors.message && <p className="text-rose-500 text-xs mt-1">{errors.message}</p>}
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
                        {loading ? 'Sending message...' : 'Send message'}
                      </Button>
                    </div>

                  </form>
                )}

              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mx-auto text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="w-8 h-px bg-amber-500" />
              <span className="ct-sans text-sm font-semibold text-amber-700 tracking-wide">Visit us</span>
              <span className="w-8 h-px bg-amber-500" />
            </div>
            <h2 className="ct-serif text-3xl sm:text-5xl leading-[1.1] text-[#1C1917]">
              Campus location & map
            </h2>
            <p className="ct-sans mt-5 text-base text-stone-600 leading-relaxed">
              Located conveniently at Mavoor Road Junction, Calicut — accessible via
              public transport and Cyberpark metro routes.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-[2rem] overflow-hidden shadow-xl border border-stone-200 relative h-96 bg-stone-100">
              <iframe
                title="Calicut Institute Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3913.064560123456!2d75.7804!3d11.2588!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba6593856300001%3A0x123456789abcdef!2sCalicut%2C%20Kerala!5e0!3m2!1sen!2sin!4v1600000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
};

export default Contact;