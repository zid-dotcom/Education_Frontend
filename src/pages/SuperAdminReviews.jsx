import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../components/layout/SuperAdminSidebar';
import { getSuperAdminReviewsApi } from '../services/reviews';
import { getSuperAdminCourseBranchesApi, getSuperAdminRecordBranchesApi } from '../services/superadmin';
import { getBranchesApi, getStoredBranches } from '../services/adminbranches';

const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById('sa-review-fonts')) return;
    const link = document.createElement('link');
    link.id = 'sa-review-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

const PAGE_CSS = `
@keyframes sa-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sa-fade { from { opacity: 0; } to { opacity: 1; } }
.sa-rise  { opacity: 0; animation: sa-rise .55s cubic-bezier(.2,.7,.2,1) forwards; }
.sa-fade  { animation: sa-fade .4s ease both; }
.sa-card  { transition: box-shadow .3s ease, border-color .3s ease; }
.sa-card:hover { border-color: #d9cdb5; box-shadow: 0 16px 36px -22px rgba(23,20,15,.3); }
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

const SuperAdminReviews = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Helper to normalize branch objects from any endpoint
  const normalizeBranch = (b) => {
    if (!b) return null;
    const id = b.id ?? b.branch_id ?? b._id;
    if (id === undefined || id === null || id === '') return null;
    const name = b.name || b.branch_name || b.title || `Branch #${id}`;
    return {
      id: String(id),
      name: String(name),
      location: b.location || b.branch_location || '',
    };
  };

  const [reviews, setReviews] = useState([]);
  const [branches, setBranches] = useState(() => {
    const stored = getStoredBranches();
    if (!Array.isArray(stored)) return [];
    return stored
      .map(normalizeBranch)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Safely merge branches into state without wiping existing entries
  const mergeBranches = (newList) => {
    if (!Array.isArray(newList) || newList.length === 0) return;
    setBranches((prev) => {
      const map = new Map(prev.map((b) => [String(b.id), b]));
      newList.forEach((item) => {
        const norm = normalizeBranch(item);
        if (norm) {
          const existing = map.get(norm.id);
          map.set(norm.id, {
            id: norm.id,
            name: norm.name || existing?.name || `Branch #${norm.id}`,
            location: norm.location || existing?.location || '',
          });
        }
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const loadData = async (isSilent = false) => {
    if (!token) return;
    if (isSilent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [reviewsRes, courseBranchesRes, globalBranchesRes, recordBranchesRes] =
        await Promise.allSettled([
          getSuperAdminReviewsApi(selectedBranchId, token),
          getSuperAdminCourseBranchesApi(token),
          getBranchesApi(token),
          getSuperAdminRecordBranchesApi(token),
        ]);

      if (reviewsRes.status === 'fulfilled') {
        const val = reviewsRes.value;
        const raw = Array.isArray(val)
          ? val
          : Array.isArray(val?.reviews)
          ? val.reviews
          : Array.isArray(val?.data)
          ? val.data
          : [];
        setReviews(raw);

        // Extract branch references directly from reviews to guarantee review branches exist
        const fromReviews = [];
        raw.forEach((r) => {
          const bId = r.branch_id ?? r.branch?.id;
          const bName = r.branch_name ?? r.branch?.name;
          if (bId) {
            fromReviews.push({ id: bId, name: bName });
          }
        });
        if (fromReviews.length > 0) mergeBranches(fromReviews);
      } else {
        console.warn('Failed to load super admin reviews:', reviewsRes.reason);
      }

      if (courseBranchesRes.status === 'fulfilled') {
        const val = courseBranchesRes.value;
        const list = Array.isArray(val) ? val : val?.branches ?? val?.data ?? [];
        mergeBranches(list);
      }

      if (globalBranchesRes.status === 'fulfilled') {
        const val = globalBranchesRes.value;
        const list = Array.isArray(val) ? val : val?.branches ?? val?.data ?? [];
        mergeBranches(list);
      }

      if (recordBranchesRes.status === 'fulfilled') {
        const val = recordBranchesRes.value;
        const list = Array.isArray(val) ? val : val?.branches ?? val?.data ?? [];
        mergeBranches(list);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load institution reviews.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, selectedBranchId]);

  // Client filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        (r.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.course_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.branch_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.review || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRating =
        ratingFilter === 'all' || String(r.rating) === String(ratingFilter);

      const matchesBranch =
        !selectedBranchId ||
        String(r.branch_id ?? r.branch?.id ?? '') === String(selectedBranchId);

      return matchesSearch && matchesRating && matchesBranch;
    });
  }, [reviews, searchQuery, ratingFilter, selectedBranchId]);

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
  const uniqueBranchesCovered = new Set(
    reviews.map((r) => r.branch_id ?? r.branch?.id ?? r.branch_name).filter(Boolean)
  ).size;

  return (
    <div
      className="flex min-h-screen w-full"
      style={{ ...sans, background: '#faf8f4', color: '#17140f' }}
    >
      <style>{PAGE_CSS}</style>

      {/* Sidebar */}
      <SuperAdminSidebar
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
            <div className="flex items-center gap-3">
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
                  Institution Management
                </p>
                <h1
                  className="text-xl sm:text-2xl font-bold text-[#17140f] leading-tight"
                  style={{ ...serif }}
                >
                  Course Reviews & Ratings
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
              className="sa-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                Total Reviews
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#17140f] mt-1" style={{ ...serif }}>
                {totalReviews}
              </p>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Across all branches institution-wide
              </span>
            </div>

            <div
              className="sa-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                Institution Rating
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
              className="sa-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                5-Star Ratings
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1" style={{ ...serif }}>
                {fiveStarCount}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                {totalReviews > 0 ? `${Math.round((fiveStarCount / totalReviews) * 100)}% excellence rate` : 'No reviews yet'}
              </span>
            </div>

            <div
              className="sa-card rounded-2xl border p-4 sm:p-5 bg-white"
              style={{ borderColor: '#e3ddd0' }}
            >
              <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">
                Active Branches
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#17140f] mt-1" style={{ ...serif }}>
                {uniqueBranchesCovered}
              </p>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                {branches.length} registered campus branches
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
                placeholder="Search student, branch, course, review..."
                className="w-full rounded-xl border border-[#e3ddd0] bg-[#faf8f4] py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 focus:border-[#9c6b2e]"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Branch Selector */}
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="rounded-xl border border-[#e3ddd0] bg-[#faf8f4] px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9c6b2e]/30 focus:border-[#9c6b2e] cursor-pointer max-w-[240px] truncate"
              >
                <option value="">All Branches ({branches.length})</option>
                {branches.map((b) => {
                  const id = String(b.id ?? b.branch_id);
                  const name = b.name || b.branch_name || `Branch #${id}`;
                  return (
                    <option key={id} value={id}>
                      {name}
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
              {(searchQuery || selectedBranchId || ratingFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBranchId('');
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
              <p className="text-xs font-semibold text-stone-500">Loading institution reviews...</p>
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
                {searchQuery || ratingFilter !== 'all' || selectedBranchId
                  ? 'No matching reviews found'
                  : 'No Student Reviews Recorded'}
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                {searchQuery || ratingFilter !== 'all' || selectedBranchId
                  ? 'Try adjusting your search query, branch filter, or star rating filter.'
                  : 'Student submitted course reviews and ratings across all campuses will be organized here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((item) => (
                <div
                  key={item.id}
                  className="sa-card flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs"
                  style={{ borderColor: '#e3ddd0' }}
                >
                  <div>
                    {/* Header: Student, Course, Branch */}
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
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c6b2e] bg-[#faf4ea] px-2 py-0.5 rounded-md border border-[#e3ddd0] truncate max-w-full">
                              <BookOpen className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.course_title || 'Course'}</span>
                            </span>
                            {item.branch_name && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                                <Building2 className="h-3 w-3 text-stone-400 shrink-0" />
                                <span>{item.branch_name}</span>
                              </span>
                            )}
                          </div>
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
                      Verified Enrollment
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

export default SuperAdminReviews;

