import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  BookOpen,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createStudentReviewApi, getStudentReviewsApi } from '../services/reviews';
import { getMyEnrollmentsApi } from '../services/enrollments';
import reviewsImage from '../assets/reviews.png';

const useReviewFonts = () => {
  useEffect(() => {
    const id = 'student-reviews-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

const RATING_LABELS = {
  0: 'Select Rating',
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const StudentReviews = () => {
  useReviewFonts();
  const { token, user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Create Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    course_id: '',
    rating: 5,
    review: '',
  });

  // Fetch reviews & enrollments
  const fetchData = async (isSilent = false) => {
    if (!token) return;
    if (isSilent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [reviewsRes, enrollmentsRes] = await Promise.allSettled([
        getStudentReviewsApi(token),
        getMyEnrollmentsApi(token),
      ]);

      if (reviewsRes.status === 'fulfilled') {
        const rawReviews = Array.isArray(reviewsRes.value) ? reviewsRes.value : [];
        setReviews(rawReviews);
      } else {
        console.warn('Failed to load student reviews:', reviewsRes.reason);
      }

      if (enrollmentsRes.status === 'fulfilled') {
        const rawEnrollments = Array.isArray(enrollmentsRes.value)
          ? enrollmentsRes.value
          : [];
        setEnrollments(rawEnrollments);
        // Pre-select first course if not selected
        if (rawEnrollments.length > 0 && !formData.course_id) {
          const firstCourseId = rawEnrollments[0].course_id || rawEnrollments[0].id;
          if (firstCourseId) {
            setFormData((prev) => ({ ...prev, course_id: String(firstCourseId) }));
          }
        }
      }
    } catch (err) {
      setError(err?.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Unique list of enrolled courses
  const enrolledCourses = useMemo(() => {
    const map = new Map();
    enrollments.forEach((enr) => {
      const cId = enr.course_id || enr.id;
      const cTitle = enr.course_title || enr.course_name || enr.course?.title || `Course #${cId}`;
      const bName = enr.branch_name || enr.branch?.name || '';
      if (cId && !map.has(String(cId))) {
        map.set(String(cId), { id: cId, title: cTitle, branchName: bName });
      }
    });
    return Array.from(map.values());
  }, [enrollments]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        (r.course_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.review || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.branch_name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRating =
        ratingFilter === 'all' || String(r.rating) === String(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, ratingFilter]);

  // Stats calculation
  const totalReviewsCount = reviews.length;
  const avgRating =
    totalReviewsCount > 0
      ? (
          reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) /
          totalReviewsCount
        ).toFixed(1)
      : '0.0';

  const handleOpenModal = (preselectedCourseId = '') => {
    const defaultCourseId =
      preselectedCourseId ||
      formData.course_id ||
      (enrolledCourses[0]?.id ? String(enrolledCourses[0].id) : '');

    setFormData({
      course_id: String(defaultCourseId),
      rating: 5,
      review: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.course_id) {
      setFormError('Please select a course to review.');
      return;
    }

    if (!formData.rating || Number(formData.rating) < 1) {
      setFormError('Please select a star rating (1 to 5 stars).');
      return;
    }

    if (!formData.review || formData.review.trim().length < 3) {
      setFormError('Please share at least a few words about your experience.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        course_id: Number(formData.course_id),
        review: formData.review.trim(),
        rating: Number(formData.rating),
      };

      const createdReview = await createStudentReviewApi(payload, token);

      setSuccessMsg('Thank you! Your course review has been submitted successfully.');
      setTimeout(() => setSuccessMsg(''), 6000);
      setIsModalOpen(false);

      // Optimistically update reviews or re-fetch
      if (createdReview) {
        setReviews((prev) => [createdReview, ...prev]);
      }
      fetchData(true);
    } catch (err) {
      setFormError(err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full pb-12 space-y-6 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 opacity-0 animate-[pageFadeIn_0.4s_ease-out_forwards]">
      <style>{`
        @keyframes pageFadeIn {
          0% { opacity: 0; transform: translateY(14px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-stretch justify-between min-h-[190px] sm:min-h-[210px] md:min-h-[230px]">
          {/* Left Text Content */}
          <div className="p-6 sm:p-8 md:p-10 max-w-xl lg:max-w-2xl space-y-2.5 z-10 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
              <Star className="h-3.5 w-3.5 text-[#9C6B2E] fill-[#9C6B2E]" />
              <span>Student Experience & Feedback</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17140F] leading-tight">
              Course Reviews
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
              Rate your learning journey, provide valuable feedback for your enrolled courses, and view all your shared testimonials.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECDDC6] bg-white/90 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-[#F1EDE4] transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#9C6B2E]' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#9C6B2E] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#855923] transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Write a Review</span>
              </button>
            </div>
          </div>

          {/* Right reviews illustration */}
          <div className="w-full md:w-auto flex justify-end items-end md:self-stretch shrink-0 select-none overflow-hidden pr-0">
            <div className="w-full sm:w-[460px] md:w-[480px] lg:w-[540px] xl:w-[600px] h-[190px] sm:h-[220px] md:h-full flex items-end justify-center md:justify-end">
              <img
                src={reviewsImage}
                alt="Course reviews"
                className="w-full h-full object-contain object-center md:object-right-bottom block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E3DDD0] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF4EA] text-[#9C6B2E] border border-[#E3DDD0]">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Reviews Submitted
            </p>
            <h3
              className="text-2xl font-extrabold text-[#17140F]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {totalReviewsCount}
            </h3>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E3DDD0] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Average Rating
            </p>
            <div className="flex items-baseline gap-1.5">
              <h3
                className="text-2xl font-extrabold text-[#17140F]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {avgRating}
              </h3>
              <span className="text-xs text-stone-400">/ 5.0</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E3DDD0] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF4EA] text-[#9C6B2E] border border-[#E3DDD0]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Eligible Courses
            </p>
            <h3
              className="text-2xl font-extrabold text-[#17140F]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {enrolledCourses.length}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="rounded-2xl border border-[#E3DDD0] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course or review..."
            className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/30 focus:border-[#9C6B2E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-medium text-stone-500 hidden sm:inline">Rating:</span>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/30 focus:border-[#9C6B2E]"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
        </div>
      </div>

      {/* 4. Reviews List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E3DDD0]">
          <Loader2 className="h-8 w-8 animate-spin text-[#9C6B2E] mb-3" />
          <p className="text-xs font-semibold text-stone-500">Loading your course reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-[#E3DDD0] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF4EA] text-[#9C6B2E] border border-[#E3DDD0] mb-4">
            <Star className="h-7 w-7 text-[#9C6B2E]" />
          </div>
          <h3
            className="text-lg font-bold text-slate-900"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {searchQuery || ratingFilter !== 'all' ? 'No matching reviews found' : 'No Course Reviews Yet'}
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {searchQuery || ratingFilter !== 'all'
              ? 'Try modifying your search query or rating filter to view other reviews.'
              : 'Share your genuine experience about the faculty, assignments, and curriculum for your enrolled courses.'}
          </p>
          {enrolledCourses.length > 0 && !searchQuery && ratingFilter === 'all' && (
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#9C6B2E] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#855923] transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Write Your First Review</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-[#E3DDD0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#9C6B2E]/50 transition"
            >
              <div>
                {/* Top Badge & Rating */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1 min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF4EA] px-2.5 py-1 text-[11px] font-bold text-[#9C6B2E] border border-[#E3DDD0] truncate max-w-full">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.course_title || 'Enrolled Course'}</span>
                    </span>
                    {item.branch_name && (
                      <p className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-stone-400" />
                        <span>{item.branch_name}</span>
                      </p>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= (item.rating || 5)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-200'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] font-bold text-amber-900 ml-1">
                      {item.rating || 5}.0
                    </span>
                  </div>
                </div>

                {/* Review Quote */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic bg-[#FAF8F4] p-3.5 rounded-xl border border-[#E3DDD0]/60">
                  "{item.review}"
                </p>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-3 border-t border-[#E3DDD0]/60 flex items-center justify-between text-[11px] text-stone-400">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.created_at)}
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                  Verified Student
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Create Review Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E3DDD0] p-6 sm:p-7 shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E3DDD0]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF4EA] text-[#9C6B2E] border border-[#E3DDD0]">
                  <Star className="h-5 w-5 fill-[#9C6B2E] text-[#9C6B2E]" />
                </div>
                <div>
                  <h3
                    className="text-base font-bold text-[#17140F]"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    Write a Course Review
                  </h3>
                  <p className="text-xs text-stone-500">
                    Share your genuine thoughts to help fellow students.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message inside modal */}
            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              {/* Select Course */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Enrolled Course <span className="text-rose-500">*</span>
                </label>
                {enrolledCourses.length === 0 ? (
                  <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    No active enrollments found for this account.
                  </p>
                ) : (
                  <select
                    value={formData.course_id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, course_id: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/30 focus:border-[#9C6B2E]"
                  >
                    <option value="" disabled>
                      Choose your course...
                    </option>
                    {enrolledCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.branchName ? `(${c.branchName})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= formData.rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              rating: prev.rating === star ? star - 1 : star,
                            }))
                          }
                          className="p-1 cursor-pointer focus:outline-none"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-stone-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-[#9C6B2E] ml-2">
                    {RATING_LABELS[formData.rating] || 'Select Rating'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Your Review & Experience <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-stone-400">
                    {formData.review.length} / 2000
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={formData.review}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, review: e.target.value }))
                  }
                  placeholder="Share details about the faculty instruction, lab facilities, project guidance, and overall learning experience..."
                  required
                  className="w-full rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] p-3 text-xs font-medium text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/30 focus:border-[#9C6B2E]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3DDD0]">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#E3DDD0] px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || enrolledCourses.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#9C6B2E] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#855923] transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReviews;
