import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Send, GraduationCap, Loader2 } from 'lucide-react';
import Button from './Button';
import { createEnquiryApi } from '../../services/enquiries';
import { getAllCoursesApi } from '../../services/courses';
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
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    course: defaultCourse || 'Diploma in Fashion Designing',
    qualification: '12th Pass',
    message: ''
  });

  const [availableCourses, setAvailableCourses] = useState([]);
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
        course: defaultCourse || 'Diploma in Fashion Designing',
        qualification: prev.qualification || '12th Pass',
        message: prev.message || ''
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

      await createEnquiryApi({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        course: formData.course,
        qualification: formData.qualification,
        message: formData.message || `Application for ${formData.course}`
      });

      setIsSubmitted(true);
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
      course: defaultCourse || 'Diploma in Fashion Designing',
      qualification: '12th Pass',
      message: ''
    });
    onClose();
  };

  const allKnownCourses = [...STATIC_COURSES, ...availableCourses];
  const isCurrentCourseKnown = allKnownCourses.includes(formData.course);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-200 relative overflow-hidden">
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
            <h3 className="text-2xl font-bold text-slate-900">Application Submitted!</h3>
            <p className="mt-3 text-slate-600 text-sm max-w-xs leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900">{formData.fullName}</span>! Our admissions team will contact you at <span className="font-semibold text-slate-900">{formData.phone}</span> within 24 hours.
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
            <h3 className="text-2xl font-extrabold text-slate-900">Quick Course Application</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">Fill in your details below to reserve your seat in the upcoming batch.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <button
                    type="button"
                    onClick={() => setIsChangingCourse(!isChangingCourse)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer flex-shrink-0"
                  >
                    {isChangingCourse ? 'Hide Options' : 'Change Course'}
                  </button>
                </div>
              ) : null}

              {(!defaultCourse || isChangingCourse) && (
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
                  {loading ? 'Submitting Application...' : 'Submit Application'}
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
