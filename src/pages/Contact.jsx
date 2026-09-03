import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';
import { instituteInfo } from '../data/instituteInfo';
import { createEnquiryApi } from '../services/enquiries';
import { getSettingsApi } from '../services/settings';
import { useAuth } from '../context/AuthContext';

const Contact = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

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
        message: formData.message
      });

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      
      {/* PAGE HEADER BANNER */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-100/60 to-white border-b border-amber-200/60 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-950 border border-amber-300 mb-4">
            <MessageSquare className="w-4 h-4 text-amber-700" />
            <span>Connect With Us</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Contact Aurumfx Institute
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about our course fees, batch schedules, or campus visits? Reach out to our admissions helpdesk.
          </p>
        </div>
      </section>

      {/* CONTACT INFORMATION & FORM */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT CONTACT INFO CARDS */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Reach Us</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
                  Get In Touch With Our Counselors
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2">
                  Our academic counselors are available Monday through Saturday to answer your queries.
                </p>
              </div>

              {/* Info Cards */}
              <div className="space-y-4">
                
                <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-200 flex items-start gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950">Campus Location</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {contactInfo.address}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-200 flex items-start gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950">Phone & WhatsApp</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      <a href={`tel:${contactInfo.phone}`} className="hover:text-amber-800 font-semibold">{contactInfo.phone}</a><br />
                      {contactInfo.altPhone && (
                        <a href={`tel:${contactInfo.altPhone}`} className="hover:text-amber-800 font-semibold">{contactInfo.altPhone}</a>
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-200 flex items-start gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950">Email Address</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      <a href={`mailto:${contactInfo.email}`} className="hover:text-amber-800 font-semibold">{contactInfo.email}</a><br />
                      {contactInfo.admissionsEmail && (
                        <a href={`mailto:${contactInfo.admissionsEmail}`} className="hover:text-amber-800 font-semibold">{contactInfo.admissionsEmail}</a>
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-200 flex items-start gap-4 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950">Working Hours</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {contactInfo.workingHours}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT INTERACTIVE CONTACT FORM */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-amber-200 shadow-xl space-y-6">
                
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-950">Send Us a Direct Message</h3>
                  <p className="text-xs text-slate-500 mt-1">Fill out the form below and we will respond within 24 hours.</p>
                </div>

                {isSubmitted ? (
                  <div className="py-12 text-center flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-950">Message Sent Successfully!</h4>
                    <p className="text-sm text-slate-600 max-w-sm">
                      Thank you for contacting us, <span className="font-bold text-slate-900">{formData.name}</span>. Our desk representative will get back to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Rahul Krishnan"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.name ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Your Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="rahul@example.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                            errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400'
                          }`}
                        />
                        {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 9876543210"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Subject</label>
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Fashion Designing Admissions">Fashion Designing Admissions</option>
                          <option value="Computer Diploma Admission">Computer Diploma Admission</option>
                          <option value="Hospitality Management Admission">Hospitality Management Admission</option>
                          <option value="Campus Visit Request">Campus Visit Request</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Your Message *</label>
                      <textarea
                        rows="4"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Write your questions here..."
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                          errors.message ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400'
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
                        {loading ? 'Sending Message...' : 'Send Message'}
                      </Button>
                    </div>

                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MAP PLACEHOLDER SECTION */}
      <section className="py-12 bg-amber-50/40 border-t border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading
            badge="Visit Us"
            title="Campus Location & Map"
            subtitle="Located conveniently at Mavoor Road Junction, Calicut — accessible via public transport and cyberpark metro routes."
          />

          <div className="rounded-3xl overflow-hidden shadow-xl border-2 border-amber-300 relative h-96 bg-slate-200">
            {/* Interactive Map Iframe Placeholder */}
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
        </div>
      </section>

    </div>
  );
};

export default Contact;
