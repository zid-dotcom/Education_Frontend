import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Send, GraduationCap, Loader2 } from 'lucide-react';
import Button from './Button';
import { getAllCoursesApi } from '../../services/courses';
import { createPaymentOrderApi, loadRazorpayScript, verifyPaymentApi } from '../../services/payments';
import { useAuth } from '../../context/AuthContext';

const STATIC_COURSES = [
  'Diploma in Fashion Designing',
  'Apparel Design & Merchandising',
  'Fashion Illustration & Digital Design',
  'Pattern Making & Draping Masterclass',
  'Textile & Garment Design',
  'Fashion Styling & Image Consulting',
  'Diploma in Computer Applications (DCA)',
  'Full Stack Web Development Diploma',
  'Diploma in Graphic Design & UI/UX',
  'Software Development & Python Programming',
  'Digital Marketing & Performance SEO',
  'Office Automation & Financial Computing',
  'Diploma in Hotel Management',
  'Hospitality & Resort Management',
  'Food & Beverage Management',
  'Front Office Management & Guest Relations',
  'Housekeeping & Accommodation Operations',
  'Tourism & Travel Operations Management'
];

const ApplicationModal = ({ isOpen, onClose, defaultCourse = '' }) => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isCourseLocked = typeof defaultCourse === 'object' && defaultCourse !== null;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    course: defaultCourse || 'Diploma in Fashion Designing',
    qualification: '12th Pass',
    parentName: '',
    parentPhone: '',
    address: '',
    paymentPlan: 'full_amount',
  });

  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableCourseRecords, setAvailableCourseRecords] = useState([]);
  const [isChangingCourse, setIsChangingCourse] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        onClose();
        navigate('/login', {
          state: {
            message: 'Please log in to your account to apply for courses and submit inquiries.',
            targetCourse: defaultCourse
          }
        });
        return;
      }

      setFormData(prev => ({
        fullName: user?.name || prev.fullName || '',
        email: user?.email || prev.email || '',
        phone: user?.phone || prev.phone || '',
        course: defaultCourse?.title || defaultCourse || 'Diploma in Fashion Designing',
        qualification: prev.qualification || '12th Pass',
        parentName: prev.parentName || '',
        parentPhone: prev.parentPhone || '',
        address: prev.address || '',
        paymentPlan: prev.paymentPlan || 'full_amount',
      }));
      setIsChangingCourse(false);
      setSubmitError('');
      setErrors({});
      setIsSubmitted(false);

      // Fetch dynamic courses from API
      getAllCoursesApi()
        .then(courses => {
          if (Array.isArray(courses)) {
            setAvailableCourses(courses.map(c => c.title).filter(Boolean));
            setAvailableCourseRecords(courses);
          }
        })
        .catch(err => console.warn('Could not fetch dynamic courses for modal:', err));
    }
  }, [isOpen, defaultCourse, isAuthenticated]);

  if (!isOpen || !isAuthenticated) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
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
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');
      setErrors({});

      const selectedCourse = typeof defaultCourse === 'object'
        ? defaultCourse
        : availableCourseRecords.find((course) => course.title === formData.course);

      if (!selectedCourse?.id) {
        setSubmitError('Please open this form from a course details page so the course can be identified.');
        return;
      }

      const paymentType = formData.paymentPlan === 'installment' ? 'installment' : 'full';
      const order = await createPaymentOrderApi(selectedCourse.id, paymentType, 1, token);
      await loadRazorpayScript();

      if (!order.order_id || !order.razorpay_key_id || !order.enrollment_id) {
        throw new Error('Payment order response is incomplete. Please try again.');
      }

      const razorpay = new window.Razorpay({
        key: order.razorpay_key_id,
        amount: order.amount_paise,
        currency: order.currency || 'INR',
        name: 'Aurum FX Academy',
        description: order.course?.title || formData.course,
        order_id: order.order_id,
        prefill: {
          name: order.student?.name || formData.fullName,
          email: order.student?.email || formData.email,
          contact: order.student?.phone || formData.phone,
        },
        notes: {
          enrollment_id: String(order.enrollment_id),
          qualification: formData.qualification,
        },
        theme: { color: '#f59e0b' },
        handler: async (paymentResponse) => {
          try {
            setLoading(true);
            await verifyPaymentApi({
              enrollment_id: order.enrollment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }, token);
            setIsSubmitted(true);
          } catch (err) {
            setSubmitError(err.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.on('payment.failed', (response) => {
        setSubmitError(response.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });

      razorpay.open();
      setLoading(false);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      course: defaultCourse?.title || defaultCourse || 'Diploma in Fashion Designing',
      qualification: '12th Pass',
      parentName: '',
      parentPhone: '',
      address: '',
      paymentPlan: 'full_amount',
    });
    onClose();
  };

  const allKnownCourses = [...STATIC_COURSES, ...availableCourses];
  const isCurrentCourseKnown = allKnownCourses.includes(formData.course);

  const selectedCourseData = typeof defaultCourse === 'object'
    ? defaultCourse
    : availableCourseRecords.find((course) => course.title === formData.course);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6">
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-[#e5d5ae] bg-[#fffdf8] p-5 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-3 duration-300 sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-5 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Payment Successful!</h3>
            <p className="mt-3 text-slate-600 text-sm max-w-xs leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900">{formData.fullName}</span>! Your enrollment is confirmed. Our admissions team will contact you at <span className="font-semibold text-slate-900">{formData.phone}</span> with the next steps.
            </p>
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 w-full space-y-1">
              <div className="font-bold">Applied Course:</div>
              <div className="text-amber-950 font-semibold">{formData.course}</div>
            </div>
            <Button
              onClick={handleResetAndClose}
              variant="dark"
              size="md"
              className="mt-6 w-full"
            >
              Done & Close
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" /> Start Your Career Journey
            </div>
            <h3 className="pr-10 text-2xl font-extrabold text-slate-900">Quick Course Application</h3>
            <p className="mt-1 mb-6 text-xs leading-5 text-slate-500">Fill in your details below to reserve your seat in the upcoming batch.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ananya Nair"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400 focus:border-amber-400'
                  }`}
                />
                {errors.fullName && <p className="text-rose-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.phone ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400 focus:border-amber-400'
                    }`}
                  />
                  {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ananya@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:ring-amber-400 focus:border-amber-400'
                    }`}
                  />
                  {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Selected Course Display Card */}
              {defaultCourse ? (
                <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                      Applying For Course
                    </span>
                    <span className="text-sm font-extrabold text-slate-950">
                      {formData.course}
                    </span>
                  </div>
                  {!isCourseLocked && (
                    <button
                      type="button"
                      onClick={() => setIsChangingCourse(!isChangingCourse)}
                      className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer flex-shrink-0"
                    >
                      {isChangingCourse ? 'Hide Options' : 'Change Course'}
                    </button>
                  )}
                </div>
              ) : null}

              {(!defaultCourse || (!isCourseLocked && isChangingCourse)) && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    {defaultCourse ? 'Select Different Course' : 'Select Course Program'}
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-medium"
                  >
                    {!isCurrentCourseKnown && formData.course && (
                      <option value={formData.course}>{formData.course}</option>
                    )}
                    {availableCourses.length > 0 && (
                      <optgroup label="Active Institute Courses">
                        {availableCourses.map((cTitle, idx) => (
                          <option key={idx} value={cTitle}>{cTitle}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Fashion Designing">
                      <option value="Diploma in Fashion Designing">Diploma in Fashion Designing</option>
                      <option value="Apparel Design & Merchandising">Apparel Design & Merchandising</option>
                      <option value="Fashion Illustration & Digital Design">Fashion Illustration & Digital Design</option>
                      <option value="Pattern Making & Draping Masterclass">Pattern Making & Draping Masterclass</option>
                      <option value="Textile & Garment Design">Textile & Garment Design</option>
                      <option value="Fashion Styling & Image Consulting">Fashion Styling & Image Consulting</option>
                    </optgroup>
                    <optgroup label="Computer Diploma Courses">
                      <option value="Diploma in Computer Applications (DCA)">Diploma in Computer Applications (DCA)</option>
                      <option value="Full Stack Web Development Diploma">Full Stack Web Development Diploma</option>
                      <option value="Diploma in Graphic Design & UI/UX">Diploma in Graphic Design & UI/UX</option>
                      <option value="Software Development & Python Programming">Software Development & Python Programming</option>
                      <option value="Digital Marketing & Performance SEO">Digital Marketing & Performance SEO</option>
                      <option value="Office Automation & Financial Computing">Office Automation & Financial Computing</option>
                    </optgroup>
                    <optgroup label="Hospitality Management">
                      <option value="Diploma in Hotel Management">Diploma in Hotel Management</option>
                      <option value="Hospitality & Resort Management">Hospitality & Resort Management</option>
                      <option value="Food & Beverage Management">Food & Beverage Management</option>
                      <option value="Front Office Management & Guest Relations">Front Office Management & Guest Relations</option>
                      <option value="Housekeeping & Accommodation Operations">Housekeeping & Accommodation Operations</option>
                      <option value="Tourism & Travel Operations Management">Tourism & Travel Operations Management</option>
                    </optgroup>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Highest Qualification</label>
                <select
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="10th Pass">10th Pass</option>
                  <option value="12th Pass">12th Pass</option>
                  <option value="Diploma Holder">Diploma Holder</option>
                  <option value="Graduate (Any Stream)">Graduate (Any Stream)</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Parent or guardian name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Parent / Guardian Phone</label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="Parent phone number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Your current address"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Payment Plan</label>
                <select
                  value={formData.paymentPlan}
                  onChange={(e) => setFormData({ ...formData, paymentPlan: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-medium"
                >
                  <option value="full_amount">Full amount paid</option>
                  {selectedCourseData?.installment_count > 1 && (
                    <option value="installment">Installment plan</option>
                  )}
                </select>

                {formData.paymentPlan === 'installment' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <h4 className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Installment Schedule</h4>
                    {selectedCourseData?.installment_terms && selectedCourseData.installment_terms.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedCourseData.installment_terms.map((term, index) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-amber-900">Installment {term.term_number}</span>
                            <div className="text-right">
                              <div className="font-bold text-slate-900">₹{term.amount}</div>
                              <div className="text-[10px] text-amber-700">Due: {new Date(term.due_date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-900 font-medium">
                        {selectedCourseData?.installment_count} installments of approx. ₹{Math.round((selectedCourseData?.price || selectedCourseData?.fee || 0) / (selectedCourseData?.installment_count || 1))}
                      </div>
                    )}
                  </div>
                )}
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
                  {loading ? 'Processing Payment...' : 'Pay & Enroll'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationModal;
