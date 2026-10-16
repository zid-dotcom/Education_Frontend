import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, BarChart, ArrowLeft, Send, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../components/common/Button';
import CurriculumAccordion from '../components/courses/CurriculumAccordion';
import CourseCard from '../components/courses/CourseCard';
import { getCourseByIdApi, getAllCoursesApi, getCourseImageUrl } from '../services/courses';
import { createPaymentOrderApi, loadRazorpayScript, verifyPaymentApi } from '../services/payments';
import { getPublicBranchesWithCoursesApi } from '../services/branches';
import { useAuth } from '../context/AuthContext';

const CourseDetails = ({ onOpenApplyModal, studentView = false }) => {
  const { courseId } = useParams();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentType, setPaymentType] = useState('full');
  const [selectedInstallment, setSelectedInstallment] = useState(1);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        let fetchedCourse = null;

        // First try to fetch from API if courseId is provided
        if (courseId && !isNaN(courseId)) {
          try {
            const apiCourse = await getCourseByIdApi(courseId);
            if (apiCourse) {
              fetchedCourse = apiCourse;
            }
          } catch (err) {
            console.warn('Direct course fetch failed:', err);
          }
        }

        // Fetch from branches API to get installment_terms and all courses
        try {
          const branches = await getPublicBranchesWithCoursesApi();
          if (Array.isArray(branches)) {
            const allBranchCourses = [];
            const seenIds = new Set();
            branches.forEach(branch => {
              if (Array.isArray(branch.courses)) {
                branch.courses.forEach(c => {
                  if (!seenIds.has(c.id)) {
                    seenIds.add(c.id);
                    allBranchCourses.push(c);
                  }
                });
              }
            });
            setAllCourses(allBranchCourses);

            // Find the matching course from branches data (has installment_terms)
            const branchCourse = allBranchCourses.find(c => String(c.id) === String(courseId));
            if (branchCourse) {
              if (fetchedCourse) {
                // Merge: keep direct API data but add installment_terms from branches if missing
                if (!fetchedCourse.installment_terms && branchCourse.installment_terms) {
                  fetchedCourse.installment_terms = branchCourse.installment_terms;
                }
                if (!fetchedCourse.installment_schedule && branchCourse.installment_schedule) {
                  fetchedCourse.installment_schedule = branchCourse.installment_schedule;
                }
                if (!fetchedCourse.installment_count && branchCourse.installment_count) {
                  fetchedCourse.installment_count = branchCourse.installment_count;
                }
              } else {
                fetchedCourse = branchCourse;
              }
            }
          }
        } catch (err) {
          console.warn('Branches API fetch failed:', err);
          // Still try allCourses as fallback
          try {
            const allApiCourses = await getAllCoursesApi();
            if (Array.isArray(allApiCourses) && allApiCourses.length > 0) {
              setAllCourses(allApiCourses);
              if (!fetchedCourse) {
                const foundInAll = allApiCourses.find((c) => String(c.id) === String(courseId));
                if (foundInAll) fetchedCourse = foundInAll;
              }
            }
          } catch (e) {
            console.warn('getAllCoursesApi also failed:', e);
          }
        }

        if (fetchedCourse) {
          setCourse(fetchedCourse);
        }
      } catch (err) {
        console.warn('API Course fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  if (loading) {
    return (
      <div className="py-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm font-bold text-slate-600">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Course Not Found</h2>
        <p className="mt-2 text-slate-600 text-sm max-w-md">
          The course you are looking for does not exist or may have been moved.
        </p>
        <Button to="/courses" variant="primary" size="md" className="mt-6" icon={ArrowLeft} iconPosition="left">
          Back to All Courses
        </Button>
      </div>
    );
  }

  // Normalized course properties from real database
  const title = course.title || course.name || 'Course Program';
  const shortDesc = course.shortDescription || course.description || '';
  const fullDesc = course.fullDescription || course.description || shortDesc;
  const priceDisplay = course.price ? `₹${course.price}` : (course.fee || '₹0');
  const category = course.category || 'Certification';
  const duration = course.duration || 'Flexible';
  const level = course.level || 'All Levels';
  
  let imageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
  if (course.image) {
    imageUrl = getCourseImageUrl(course.image);
  }

  // Related courses
  const relatedCourses = allCourses
    .filter((c) => String(c.id) !== String(course.id))
    .slice(0, 3);
  const coursePath = studentView ? '/student-dashboard/courses' : '/courses';

  const handleApplyClick = async () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          message: 'Please log in to your student account to apply for courses and submit inquiries.',
          targetCourse: title
        }
      });
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentMessage('');
      setPaymentError('');
      const order = await createPaymentOrderApi(course.id, paymentType, selectedInstallment, token);
      await loadRazorpayScript();

      if (!order.order_id || !order.razorpay_key_id || !order.enrollment_id) {
        throw new Error('Payment order response is incomplete. Please try again.');
      }

      const razorpay = new window.Razorpay({
        key: order.razorpay_key_id,
        amount: order.amount_paise,
        currency: order.currency || 'INR',
        name: 'Aurum FX Academy',
        description: order.course?.title || title,
        order_id: order.order_id,
        prefill: order.student || {},
        notes: { enrollment_id: String(order.enrollment_id) },
        theme: { color: '#f59e0b' },
        handler: async (paymentResponse) => {
          try {
            setPaymentLoading(true);
            await verifyPaymentApi({
              enrollment_id: order.enrollment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }, token);
            setPaymentMessage('Payment successful. Your enrollment is confirmed.');
          } catch (err) {
            setPaymentError(err.message || 'Payment verification failed. Please contact support.');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      });

      razorpay.on('payment.failed', (response) => {
        setPaymentError(response.error?.description || 'Payment failed. Please try again.');
        setPaymentLoading(false);
      });

      razorpay.open();
      setPaymentLoading(false);
    } catch (err) {
      setPaymentError(err.message || 'Unable to start payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 opacity-0 animate-[detailOpen_0.5s_ease-out_forwards]">
      <style>{`
        @keyframes detailOpen {
          0% { opacity: 0; transform: translateY(16px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      
      {/* BREADCRUMB & HERO BANNER */}
      <section className="bg-white py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Link
            to={coursePath}
            className={`mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              studentView
                ? 'text-purple-600 hover:text-purple-800'
                : 'text-slate-500 hover:text-amber-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Courses
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="space-y-5 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    studentView
                      ? 'rounded-full border border-purple-200/80 bg-purple-50 text-purple-700'
                      : 'border border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  {category}
                </span>
              </div>

              <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                {title}
              </h1>

              <p className="max-w-3xl text-base font-normal leading-relaxed text-slate-600 sm:text-lg">
                {shortDesc}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-700 sm:text-sm">
                <span
                  className={`flex items-center gap-1.5 px-3 py-2 ${
                    studentView
                      ? 'rounded-xl border border-purple-200/80 bg-purple-50 text-purple-700 font-bold'
                      : 'rounded-lg border border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  <Clock className={`h-4 w-4 ${studentView ? 'text-purple-600' : 'text-amber-700'}`} /> Duration: {duration}
                </span>
                <span
                  className={`flex items-center gap-1.5 px-3 py-2 ${
                    studentView
                      ? 'rounded-xl border border-purple-100 bg-[#FAF8FE] text-slate-700 font-bold'
                      : 'rounded-lg border border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <BarChart className={`w-4 h-4 ${studentView ? 'text-purple-500' : 'text-slate-500'}`} /> Level: {level}
                </span>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div
                className={`overflow-hidden ${
                  studentView
                    ? 'rounded-2xl border border-purple-100/90 bg-[#FAF8FE] shadow-[0_15px_35px_rgba(110,80,200,0.06)]'
                    : 'rounded-[1.75rem] border-[1.5px] border-[#f0d9a8] bg-[#fffdf8] shadow-[0_22px_45px_rgba(169,132,74,0.1)]'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={title}
                  className="h-64 w-full object-cover sm:h-72"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* MAIN CONTENT & SIDEBAR ENROLMENT CARD */}
      <section className="bg-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start lg:grid-cols-12 gap-8">
            
            {/* LEFT MAIN DETAILS */}
            <div className="space-y-6 lg:col-span-8">
              
              {/* Course Overview */}
              <div>
                <h3 className="mb-3 text-2xl font-bold text-slate-950">
                  Course Overview & Description
                </h3>
                <p className="text-base font-normal leading-relaxed text-slate-600">
                  {fullDesc}
                </p>
              </div>

              {/* Skills Acquired (Only rendered if dynamic skills are present in DB) */}
              {Array.isArray(course.skills) && course.skills.length > 0 && (
                <div>
                  <h3
                    className={`mb-4 border-b pb-3 text-2xl font-bold text-slate-950 ${
                      studentView ? 'border-purple-100' : 'border-amber-200'
                    }`}
                  >
                    Key Skills You Will Acquire
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.skills.map((skill, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm font-semibold text-slate-900 ${
                          studentView
                            ? 'border-purple-100 bg-[#FAF8FE]'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                            studentView
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          ✓
                        </div>
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Module Curriculum Accordion */}
              {course.curriculum && (
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-slate-950">
                    Detailed Course Curriculum
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Click on any module below to inspect topics covered.</p>
                  <CurriculumAccordion curriculum={course.curriculum} studentView={studentView} />
                </div>
              )}

            </div>

            {/* RIGHT SIDEBAR ENROLMENT CARD */}
            <div className="lg:col-span-4">
              <div
                className={`sticky top-24 space-y-6 bg-white p-6 ${
                  studentView
                    ? 'rounded-2xl border border-purple-100 shadow-[0_15px_40px_rgba(110,80,200,0.06)]'
                    : 'rounded-[1.75rem] border-[1.5px] border-[#f0d9a8] shadow-[0_22px_45px_rgba(169,132,74,0.1)]'
                }`}
              >
                
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Program Fee</span>
                  <div className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl">
                    {priceDisplay}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-medium text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-900">{duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Skill Level:</span>
                    <span className="font-bold text-slate-900">{level}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Payment Plan</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold mb-2 outline-none transition ${
                      studentView
                        ? 'border-purple-200 bg-[#F5F2FC] text-slate-800 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200'
                        : 'border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-amber-400'
                    }`}
                  >
                    <option value="full">Full Amount</option>
                    {course.installment_count > 1 && (
                      <option value="installment">Installment Plan</option>
                    )}
                  </select>

                  {paymentType === 'installment' && (
                    <div
                      className={`mt-3 p-3 rounded-xl space-y-2 border ${
                        studentView
                          ? 'bg-purple-50/70 border-purple-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            studentView ? 'text-purple-800' : 'text-amber-800'
                          }`}
                        >
                          Installment Terms
                        </h4>
                        {course.installment_schedule && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              studentView
                                ? 'text-purple-700 bg-purple-200/60'
                                : 'text-amber-700 bg-amber-200/50'
                            }`}
                          >
                            {course.installment_schedule}
                          </span>
                        )}
                      </div>
                      {course.installment_terms && course.installment_terms.length > 0 ? (
                        <div className="space-y-1.5">
                          {course.installment_terms.map((term, index) => (
                            <label
                              key={index}
                              className={`flex justify-between items-center text-xs p-2 rounded-lg cursor-pointer transition-colors border ${
                                selectedInstallment === term.term_number
                                  ? studentView
                                    ? 'bg-purple-100/70 border-purple-300'
                                    : 'bg-amber-100 border-amber-300'
                                  : studentView
                                  ? 'bg-transparent border-transparent hover:bg-purple-100/40'
                                  : 'bg-transparent border-transparent hover:bg-amber-100/50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  name="installmentSelection"
                                  value={term.term_number}
                                  checked={selectedInstallment === term.term_number}
                                  onChange={() => setSelectedInstallment(term.term_number)}
                                  className={
                                    studentView
                                      ? 'text-[#7C3AED] focus:ring-purple-400'
                                      : 'text-amber-600 focus:ring-amber-500'
                                  }
                                />
                                <span
                                  className={`font-semibold ${
                                    studentView ? 'text-purple-950' : 'text-amber-900'
                                  }`}
                                >
                                  Installment {term.term_number}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">₹{term.amount}</div>
                                <div
                                  className={`text-[10px] ${
                                    studentView ? 'text-purple-600' : 'text-amber-700'
                                  }`}
                                >
                                  Due: {new Date(term.due_date).toLocaleDateString()}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`text-xs font-medium ${
                            studentView ? 'text-purple-900' : 'text-amber-900'
                          }`}
                        >
                          {course.installment_count} installments of approx. ₹{Math.round((course.price || course.fee || 0) / course.installment_count)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleApplyClick}
                  disabled={paymentLoading}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-95 disabled:cursor-wait disabled:opacity-70 ${
                    studentView
                      ? 'bg-[#7C3AED] hover:bg-[#6D28D9] shadow-purple-600/20'
                      : 'bg-slate-950 hover:bg-slate-800 shadow-sm'
                  }`}
                >
                  {paymentLoading ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${studentView ? 'text-purple-200' : 'text-amber-400'}`} />
                  ) : (
                    <Send className={`h-4 w-4 ${studentView ? 'text-purple-200' : 'text-amber-400'}`} />
                  )}
                  <span>{paymentLoading ? 'Processing Payment...' : 'Pay & Enroll'}</span>
                </button>

                {paymentMessage && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[11px] font-semibold text-emerald-700">{paymentMessage}</p>}
                {paymentError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-[11px] font-semibold text-rose-700">{paymentError}</p>}
                {!paymentMessage && !paymentError && <p className="text-center text-[11px] text-slate-500">Secure payment through Razorpay.</p>}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* RELATED COURSES */}
      {relatedCourses.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="mb-8 text-2xl font-bold text-slate-950">
              Explore Other Related Courses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCourses.map((rCourse) => (
                <CourseCard key={rCourse.id} course={rCourse} onApply={onOpenApplyModal} linkPrefix={coursePath} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default CourseDetails;
