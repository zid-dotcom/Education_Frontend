import React, { useEffect, useState, useMemo } from 'react';
import {
  Star,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  Menu,
  GraduationCap,
  BookOpen,
  Calendar,
  Building2,
  Award,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BranchAdminSidebar from '../components/layout/BranchAdminSidebar';
import NavLogoutButton from "../components/common/NavLogoutButton";
import { getBranchAdminReviewsApi } from '../services/reviews';
import { getMyCoursesApi } from '../services/branchadmincourses';

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById('ba-attendance-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ba-attendance-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const PAGE_CSS = `
@keyframes ba-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ba-fade { from { opacity: 0; } to { opacity: 1; } }
.ba-rise  { opacity: 0; animation: ba-rise .55s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .4s ease both; }
.ba-card  { transition: box-shadow .3s ease, border-color .3s ease; }
.ba-card:hover { border-color: #d9cdb5; box-shadow: 0 16px 36px -22px rgba(23,20,15,.3); }
`;

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'Recently';

const BranchAdminReviews = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const loadData = async (isSilent = false) => {
    if (!token) return;
    if (isSilent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [reviewsRes, coursesRes] = await Promise.allSettled([
        getBranchAdminReviewsApi(selectedCourseId, token),
        getMyCoursesApi(token),
      ]);

      if (reviewsRes.status === 'fulfilled') {
        const raw = Array.isArray(reviewsRes.value) ? reviewsRes.value : [];
        setReviews(raw);
      } else {
        console.warn('Failed to load branch reviews:', reviewsRes.reason);
      }

      if (coursesRes.status === 'fulfilled') {
        const rawCourses = Array.isArray(coursesRes.value) ? coursesRes.value : [];
        setCourses(rawCourses);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, selectedCourseId]);

  // Client filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.course_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.review || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRating =
        ratingFilter === 'all' || String(r.rating) === String(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, ratingFilter]);

  // Aggregate stats
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (
          reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) /
          totalReviews
        ).toFixed(1)
      : '0.0';

  const fiveStarCount = reviews.filter((r) => Number(r.rating) === 5).length;
  const uniqueCoursesReviewed = new Set(reviews.map((r) => r.course_id)).size;

  return (
    <div
      className="flex min-h-screen w-full"
      style={{ ...sans, background: '#faf8f4', color: '#17140f' }}
    >
      <style>{PAGE_CSS}</style>

      {/* Sidebar */}
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="reviews"
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Navbar */}
        <div
          className="sticky top-0 z-20 w-full border-b"
          style={{ background: '#faf8f4', borderColor: '#e3ddd0' }}
        >
          <div className="mx-auto max-w-7xl flex h-[72px] sm:h-[84px] items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-[#e3ddd0] bg-white p-2 text-stone-600 hover:bg-[#f1ede4] transition md:hidden cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                  Branch Management
                </p>
                <h1
                  className="text-xl sm:text-2xl font-bold text-[#17140f] leading-tight"
                  style={{ ...serif }}
                >
                  Course Reviews & Feedback
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-[#e3ddd0] bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-[#f1ede4] transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#9c6b2e]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            <NavLogoutButton redirectTo="/branch-admin-login" />
          </div>
        </div>

        {/* Content Body */}
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div
              className="ba-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                Total Reviews
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#17140f] mt-1" style={{ ...serif }}>
                {totalReviews}
              </p>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Across all courses in branch
              </span>
            </div>

            <div
              className="ba-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                Average Rating
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#9c6b2e]" style={{ ...serif }}>
                  {avgRating}
                </p>
                <span className="text-xs text-stone-400 font-bold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${
                      s <= Math.round(Number(avgRating))
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div
              className="ba-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                5-Star Ratings
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1" style={{ ...serif }}>
                {fiveStarCount}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                {totalReviews > 0 ? `${Math.round((fiveStarCount / totalReviews) * 100)}% of total` : 'No reviews yet'}
              </span>
            </div>

            <div
              className="ba-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                Courses Reviewed
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#17140f] mt-1" style={{ ...serif }}>
                {uniqueCoursesReviewed}
              </p>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                {courses.length} total active courses
              </span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div
            className="rounded-2xl border bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderColor: '#e3ddd0' }}
          >
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, course, review text..."
                className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 focus:border-[#9c6b2e]"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Course Selector */}
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 focus:border-[#9c6b2e] cursor-pointer max-w-[240px] truncate"
              >
                <option value="">All Courses ({courses.length})</option>
                {courses.map((c) => {
                  const cId = c.id ?? c.course_id;
                  const cTitle = c.title || c.course_title || c.name || `Course #${cId}`;
                  return (
                    <option key={cId} value={cId}>
                      {cTitle}
                    </option>
                  );
                })}
              </select>

              {/* Rating Selector */}
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 focus:border-[#9c6b2e] cursor-pointer"
              >
                <option value="all">All Stars</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
                <option value="2">⭐⭐ (2 Stars)</option>
                <option value="1">⭐ (1 Star)</option>
              </select>

              {/* Reset Filters */}
              {(searchQuery || selectedCourseId || ratingFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCourseId('');
                    setRatingFilter('all');
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-[#f1ede4] transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Reviews Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#e3ddd0]">
              <Loader2 className="h-8 w-8 animate-spin text-[#9c6b2e] mb-3" />
              <p className="text-xs font-semibold text-stone-500">Loading branch reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div
              className="rounded-2xl border bg-white p-12 text-center"
              style={{ borderColor: '#e3ddd0' }}
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                style={{ background: '#faf4ea', color: '#9c6b2e' }}
              >
                <Star className="h-7 w-7 text-[#9c6b2e]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900" style={{ ...serif }}>
                {searchQuery || ratingFilter !== 'all' || selectedCourseId
                  ? 'No matching reviews'
                  : 'No Student Reviews Yet'}
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                {searchQuery || ratingFilter !== 'all' || selectedCourseId
                  ? 'Try clearing the search or filters to see all student reviews for this branch.'
                  : 'When enrolled students submit feedback for courses at this branch, they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((item) => (
                <div
                  key={item.id}
                  className="ba-card flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <div>
                    {/* Header: Student & Course */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs"
                          style={{ background: '#17140f', color: '#f4b942' }}
                        >
                          {(item.student_name || 'S')
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {item.student_name || 'Student'}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c6b2e] bg-[#faf4ea] px-2 py-0.5 rounded-md border border-[#e3ddd0] mt-0.5 truncate max-w-full">
                            <BookOpen className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.course_title || 'Course'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
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

                    {/* Review text */}
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic bg-[#faf8f4] p-3.5 rounded-xl border border-[#e3ddd0]/70 mt-2">
                      "{item.review}"
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-[#e3ddd0]/60 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.created_at)}
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                      Verified Review
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BranchAdminReviews;
