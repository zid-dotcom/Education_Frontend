import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ImagePlus,
  IndianRupee,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  createBranchCourseApi,
  deleteBranchCourseApi,
  getMyCourseApi,
  getMyCoursesApi,
  updateBranchCourseApi,
} from "../services/branchadmincourses";
import { getCourseImageUrl } from "../services/courses";

/* Same display-font pairing used across the branch admin pages
   (Fraunces headings, Inter body). No-op if already injected. */
const useDisplayFonts = () => {
  useEffect(() => {
    if (document.getElementById("ba-attendance-fonts")) return;
    const link = document.createElement("link");
    link.id = "ba-attendance-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

/* Page-scoped motion. Disabled for users who prefer reduced motion. */
const PAGE_CSS = `
@keyframes ba-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ba-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ba-pop  { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.ba-rise  { opacity: 0; animation: ba-rise .55s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .4s ease both; }
.ba-pop   { animation: ba-pop .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-card  { transition: box-shadow .3s ease, border-color .3s ease, transform .3s ease; }
.ba-card:hover { border-color: #d9cdb5; box-shadow: 0 16px 36px -20px rgba(23,20,15,.32); transform: translateY(-4px); }
.ba-card:hover .ba-cover { transform: scale(1.04); }
.ba-cover { transition: transform .6s cubic-bezier(.2,.7,.2,1); }
.ba-press { transition: transform .15s ease, opacity .2s ease, background-color .2s ease; }
.ba-press:hover { transform: translateY(-1px); }
.ba-press:active { transform: translateY(0) scale(.98); }
@media (prefers-reduced-motion: reduce) {
  .ba-rise, .ba-fade, .ba-pop { animation: none !important; opacity: 1 !important; }
  .ba-card, .ba-press, .ba-cover { transition: none !important; }
  .ba-card:hover, .ba-press:hover, .ba-card:hover .ba-cover { transform: none; }
}
`;

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };

const inputStyle = {
  border: "1px solid #e3ddd0",
  color: "#1c1a17",
  background: "#ffffff",
};

const inputClass = `mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`;

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatCourseDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  duration: "",
  category: "",
  level: "",
  start_date: "",
  end_date: "",
  installment_schedule: "",
  installment_count: "",
  installment_terms: [],
  curriculum: [{ title: "", topics: [""] }],
};

/** Build a default empty term for a given 1-based index. */
const emptyTerm = (termNumber) => ({
  term_number: termNumber,
  amount: "",
  due_date: "",
});

const BranchAdminCourses = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingCourse, setEditingCourse] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadCourses = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getMyCoursesApi(token);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [token]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingCourse(null);
    setImageFile(null);
    setPreviewImage("");
  };

  const openCreate = () => {
    resetForm();
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  useEffect(() => {
    if (!location.state?.openCreate) return;
    openCreate();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  /* Close the modal with Escape */
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const openEdit = async (course) => {
    setEditingCourseId(course.id);
    setError("");
    setSuccess("");
    try {
      const loadedCourse = await getMyCourseApi(course.id, token);
      const details = { ...course, ...loadedCourse };
      setEditingCourse(details);
      /* Parse existing installment_terms – could be a JSON string or array */
      let parsedTerms = [];
      if (details.installment_terms) {
        try {
          parsedTerms =
            typeof details.installment_terms === "string"
              ? JSON.parse(details.installment_terms)
              : details.installment_terms;
        } catch {
          parsedTerms = [];
        }
      }
      if (!Array.isArray(parsedTerms)) parsedTerms = [];

      const count = Number(details.installment_count || 0);
      /* Ensure parsedTerms length matches installment_count */
      while (parsedTerms.length < count) {
        parsedTerms.push(emptyTerm(parsedTerms.length + 1));
      }
      parsedTerms = parsedTerms.slice(0, Math.max(count, 0));
      /* Normalise due_date to YYYY-MM-DD for date inputs */
      parsedTerms = parsedTerms.map((t, i) => ({
        term_number: i + 1,
        amount: t.amount ?? "",
        due_date: String(t.due_date || "").slice(0, 10),
      }));

      setForm({
        title: details.title || "",
        description: details.description || "",
        price: details.price ?? "",
        duration: details.duration || "",
        category: details.category || "",
        level: details.level || "",
        start_date: String(details.start_date || "").slice(0, 10),
        end_date: String(details.end_date || "").slice(0, 10),
        installment_schedule: String(details.installment_schedule || "").toLowerCase(),
        installment_count: details.installment_count ?? "",
        installment_terms: parsedTerms,
        curriculum:
          Array.isArray(details.curriculum) && details.curriculum.length
            ? details.curriculum.map((module) => ({
                title: module.title || "",
                topics:
                  Array.isArray(module.topics) && module.topics.length
                    ? module.topics
                    : [""],
              }))
            : [{ title: "", topics: [""] }],
      });
      setPreviewImage(details.image ? getCourseImageUrl(details.image) : "");
      setImageFile(null);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to load course details.");
    } finally {
      setEditingCourseId(null);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      /* When installment_count changes, resize installment_terms array */
      if (name === "installment_count") {
        const count = Math.max(0, parseInt(value, 10) || 0);
        const terms = [...current.installment_terms];
        while (terms.length < count) terms.push(emptyTerm(terms.length + 1));
        next.installment_terms = terms.slice(0, count);
      }
      /* When schedule is set to empty (full payment), reset count and terms */
      if (name === "installment_schedule" && !value) {
        next.installment_count = "";
        next.installment_terms = [];
      }
      return next;
    });
  };

  const updateTermField = (termIndex, field, value) =>
    setForm((current) => ({
      ...current,
      installment_terms: current.installment_terms.map((term, i) =>
        i === termIndex ? { ...term, [field]: value } : term,
      ),
    }));
  const updateModule = (moduleIndex, value) =>
    setForm((current) => ({
      ...current,
      curriculum: current.curriculum.map((module, index) =>
        index === moduleIndex ? { ...module, title: value } : module,
      ),
    }));
  const updateTopic = (moduleIndex, topicIndex, value) =>
    setForm((current) => ({
      ...current,
      curriculum: current.curriculum.map((module, index) =>
        index === moduleIndex
          ? {
              ...module,
              topics: module.topics.map((topic, itemIndex) =>
                itemIndex === topicIndex ? value : topic,
              ),
            }
          : module,
      ),
    }));
  const addModule = () =>
    setForm((current) => ({
      ...current,
      curriculum: [...current.curriculum, { title: "", topics: [""] }],
    }));
  const removeModule = (moduleIndex) =>
    setForm((current) => ({
      ...current,
      curriculum:
        current.curriculum.length === 1
          ? current.curriculum
          : current.curriculum.filter((_, index) => index !== moduleIndex),
    }));
  const addTopic = (moduleIndex) =>
    setForm((current) => ({
      ...current,
      curriculum: current.curriculum.map((module, index) =>
        index === moduleIndex
          ? { ...module, topics: [...module.topics, ""] }
          : module,
      ),
    }));
  const removeTopic = (moduleIndex, topicIndex) =>
    setForm((current) => ({
      ...current,
      curriculum: current.curriculum.map((module, index) =>
        index === moduleIndex && module.topics.length > 1
          ? {
              ...module,
              topics: module.topics.filter(
                (_, itemIndex) => itemIndex !== topicIndex,
              ),
            }
          : module,
      ),
    }));

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  /* Derived: installment price validation */
  const installmentCount = Math.max(0, parseInt(form.installment_count, 10) || 0);
  const coursePrice = Number(form.price || 0);
  const installmentTotal = useMemo(
    () =>
      form.installment_terms.reduce(
        (sum, t) => sum + (Number(t.amount) || 0),
        0,
      ),
    [form.installment_terms],
  );
  const installmentDiff = coursePrice - installmentTotal;
  const installmentAmountValid =
    installmentCount === 0 || installmentTotal === coursePrice;
  /* Check every term has amount and due_date filled */
  const termsComplete =
    installmentCount === 0 ||
    form.installment_terms.every(
      (t) => Number(t.amount) > 0 && t.due_date,
    );

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!editingCourse && !imageFile) {
      setError("Please choose a course image.");
      return;
    }
    if (
      installmentCount > 0 &&
      (!form.installment_schedule || form.installment_schedule === "full_payment")
    ) {
      setError(
        'When installment count is greater than 0, please select "Monthly" or "Weekly" as the installment schedule.',
      );
      return;
    }
    if (installmentCount > 0 && !installmentAmountValid) {
      setError(
        `Installment amounts must equal the course price. Current total: ${formatPrice(installmentTotal)}, Course price: ${formatPrice(coursePrice)}.`,
      );
      return;
    }
    if (installmentCount > 0 && !termsComplete) {
      setError("Please fill in the amount and due date for every installment term.");
      return;
    }
    try {
      setSaving(true);
      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("description", form.description.trim());
      data.append("price", String(form.price));
      data.append("duration", form.duration.trim());
      data.append("category", form.category.trim());
      data.append("level", form.level.trim());
      data.append("start_date", form.start_date);
      data.append("end_date", form.end_date);
      if (installmentCount > 0 && form.installment_schedule) {
        data.append("installment_schedule", form.installment_schedule);
        data.append("installment_count", String(installmentCount));
        data.append(
          "installment_terms",
          JSON.stringify(
            form.installment_terms.map((t, i) => ({
              term_number: i + 1,
              amount: Number(t.amount),
              due_date: t.due_date,
            })),
          ),
        );
      } else {
        /* Full payment – send empty/cleared installment fields */
        data.append("installment_schedule", "full_payment");
        data.append("installment_count", "0");
        data.append("installment_terms", JSON.stringify([]));
      }
      data.append(
        "curriculum",
        JSON.stringify(
          form.curriculum.map((module) => ({
            title: module.title.trim(),
            topics: module.topics.map((topic) => topic.trim()).filter(Boolean),
          })),
        ),
      );
      if (imageFile) data.append("image", imageFile);
      const saved = editingCourse
        ? await updateBranchCourseApi(editingCourse.id, data, token)
        : await createBranchCourseApi(data, token);
      setCourses((current) =>
        editingCourse
          ? current.map((course) => (course.id === saved.id ? saved : course))
          : [saved, ...current],
      );
      setSuccess(
        `${saved.title} ${editingCourse ? "updated" : "created"} successfully.`,
      );
      closeModal();
    } catch (err) {
      setError(err.message || "Failed to save course.");
    } finally {
      setSaving(false);
    }
  };

  const removeCourse = async (course) => {
    if (!window.confirm(`Delete ${course.title}? This cannot be undone.`))
      return;
    try {
      setDeletingId(course.id);
      setError("");
      await deleteBranchCourseApi(course.id, token);
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setSuccess(`${course.title} deleted successfully.`);
    } catch (err) {
      setError(err.message || "Failed to delete course.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="branch-courses-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openCreate={openCreate}
        activePage="courses"
      />

      <main className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header
          className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-xl bg-[#faf8f4] border border-[#e3ddd0] p-2 text-[#17140f] hover:bg-[#f1ede4] transition md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Courses
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                Branch Administrator
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8 sm:px-10">
          {/* ---- Alerts ---- */}
          {error && (
            <div
              role="alert"
              className="ba-pop rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}
          {!error && success && (
            <div
              role="status"
              className="ba-pop rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
            >
              {success}
            </div>
          )}

          {/* ---- Section heading + add ---- */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                Branch courses
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                {courses.length} course{courses.length === 1 ? "" : "s"} in your catalogue.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className={`ba-press inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${FOCUS_RING}`}
              style={{ background: "#17140f" }}
            >
              <Plus className="h-4 w-4" style={{ color: "#f4b942" }} /> Add course
            </button>
          </div>

          {/* ---- Course grid ---- */}
          {loading ? (
            <div className="flex items-center gap-2 py-16 text-sm" style={{ color: "#8a8175" }}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-16 text-center"
              style={{ border: "1px dashed #dfc9a9", background: "#ffffff" }}
            >
              <BookOpen className="mx-auto h-6 w-6" style={{ color: "#d9b77b" }} />
              <h3 className="mt-4 text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                No courses yet
              </h3>
              <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                Create the first course for your branch catalogue.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className={`ba-press mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${FOCUS_RING}`}
                style={{ background: "#17140f" }}
              >
                <Plus className="h-4 w-4" style={{ color: "#f4b942" }} /> Create first course
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course, index) => (
                <article
                  key={course.id}
                  className="ba-card ba-rise flex flex-col overflow-hidden rounded-2xl"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e3ddd0",
                    animationDelay: `${Math.min(index, 8) * 70}ms`,
                  }}
                >
                  <div className="relative h-44 overflow-hidden" style={{ background: "#f1ede4" }}>
                    {course.image ? (
                      <img
                        src={getCourseImageUrl(course.image)}
                        alt={course.title}
                        className="ba-cover h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ color: "#d9b77b" }}>
                        <ImagePlus className="h-8 w-8" />
                      </div>
                    )}
                    <span
                      className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: "rgba(255,255,255,.92)", color: "#7a531f" }}
                    >
                      {course.category || "Course"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="text-lg leading-snug"
                        style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                      >
                        {course.title}
                      </h3>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ background: "#f7efe0", color: "#7a531f" }}
                      >
                        {course.level || "All levels"}
                      </span>
                    </div>
                    <p
                      className="mt-2 line-clamp-3 text-sm leading-6"
                      style={{ color: "#5b5346" }}
                    >
                      {course.description}
                    </p>

                    <div
                      className="mt-auto flex items-center justify-between pt-4"
                      style={{ borderTop: "1px solid #efe9dd", marginTop: "1rem" }}
                    >
                      <span
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "#8a8175" }}
                      >
                        <Clock className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                        {course.duration || "Flexible"}
                      </span>
                      <span
                        className="text-xl tabular-nums"
                        style={{ ...serif, fontWeight: 500, color: "#5c7a5a" }}
                      >
                        {formatPrice(course.price)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs" style={{ color: "#8a8175" }}>
                      <div className="flex min-w-0 items-start gap-1.5">
                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                        <span className="min-w-0">
                          {formatCourseDate(course.start_date)} – {formatCourseDate(course.end_date)}
                        </span>
                      </div>
                      <div className="min-w-0 text-right">
                        {course.installment_schedule && course.installment_count
                          ? `${course.installment_count} ${String(course.installment_schedule).toLowerCase()} installments`
                          : "No installment plan"}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-4 pt-3" style={{ borderTop: "1px solid #efe9dd" }}>
                      <button
                        type="button"
                        onClick={() => openEdit(course)}
                        disabled={editingCourseId === course.id}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium disabled:opacity-60 ${FOCUS_RING}`}
                        style={{ color: "#9c6b2e" }}
                      >
                        {editingCourseId === course.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Edit3 className="h-3.5 w-3.5" />
                        )}
                        {editingCourseId === course.id ? "Loading…" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCourse(course)}
                        disabled={deletingId !== null}
                        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium disabled:opacity-60 ${FOCUS_RING}`}
                        style={{ color: "#a24a3a" }}
                        aria-label={`Delete ${course.title}`}
                      >
                        {deletingId === course.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {deletingId === course.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ---- Create / edit modal ---- */}
      {modalOpen && (
        <div
          className="ba-fade fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(23,20,15,.55)" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingCourse ? "Edit course" : "Add new course"}
            className="ba-pop max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl"
            style={{
              background: "#ffffff",
              border: "1px solid #e3ddd0",
              boxShadow: "0 30px 60px -30px rgba(23,20,15,.5)",
            }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-5"
              style={{ background: "#ffffff", borderBottom: "1px solid #e3ddd0" }}
            >
              <div>
                <h2 className="text-xl" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                  {editingCourse ? "Edit course" : "Add new course"}
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "#a39a8c" }}>
                  Course catalogue
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className={`rounded-lg p-1.5 ${FOCUS_RING}`}
                style={{ color: "#a39a8c" }}
                aria-label="Close course form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Course title
                  <input
                    name="title"
                    required
                    value={form.title}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Advanced Fashion Design"
                  />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Category
                  <input
                    name="category"
                    required
                    value={form.category}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Fashion Designing"
                  />
                </label>
                <label className="block text-sm sm:col-span-2" style={{ color: "#5b5346" }}>
                  Description
                  <textarea
                    name="description"
                    required
                    rows="4"
                    value={form.description}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Describe the course outcomes and experience."
                  />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Price
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="25000"
                  />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Duration
                  <input
                    name="duration"
                    required
                    value={form.duration}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="6 months"
                  />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Level
                  <input
                    name="level"
                    required
                    value={form.level}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Beginner"
                  />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Course start date
                  <input
                    name="start_date"
                    type="date"
                    required
                    value={form.start_date}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                  />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Course end date
                  <input
                    name="end_date"
                    type="date"
                    required
                    min={form.start_date || undefined}
                    value={form.end_date}
                    onChange={updateField}
                    className={inputClass}
                    style={inputStyle}
                  />
                </label>
                <label className="block text-sm sm:col-span-2" style={{ color: "#5b5346" }}>
                  Course image
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingCourse}
                    onChange={handleImage}
                    className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#f7efe0] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#7a531f]`}
                    style={inputStyle}
                  />
                </label>
              </div>

              {/* ──── Payment & Installments ──── */}
              <div
                className="rounded-xl p-4 sm:p-5"
                style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "#f7efe0", color: "#9c6b2e" }}
                  >
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-base" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                      Payment & Installments
                    </h3>
                    <p className="mt-0.5 text-xs" style={{ color: "#a39a8c" }}>
                      Configure installment plans for this course.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm" style={{ color: "#5b5346" }}>
                    Installment Schedule
                    <select
                      name="installment_schedule"
                      value={form.installment_schedule}
                      onChange={updateField}
                      className={inputClass}
                      style={inputStyle}
                    >
                      <option value="">Select schedule</option>
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </label>
                  <label className="block text-sm" style={{ color: "#5b5346" }}>
                    Installment Count
                    <input
                      name="installment_count"
                      type="number"
                      min="0"
                      step="1"
                      value={form.installment_count}
                      onChange={updateField}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="0"
                    />
                  </label>
                </div>

                {/* ── Installment Term Cards ── */}
                {installmentCount > 0 && (
                  <div className="mt-5">
                    <div
                      className="mb-4 pb-3"
                      style={{ borderBottom: "1px solid #e3ddd0" }}
                    >
                      <h4
                        className="text-sm font-medium"
                        style={{ color: "#17140f" }}
                      >
                        Installment Terms
                      </h4>
                      <p className="mt-0.5 text-xs" style={{ color: "#a39a8c" }}>
                        Define amount and due date for each installment.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {form.installment_terms.map((term, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl p-4"
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e3ddd0",
                          }}
                        >
                          <p
                            className="mb-3 text-xs font-semibold tracking-wide uppercase"
                            style={{ color: "#9c6b2e" }}
                          >
                            Term {idx + 1}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label
                              className="block text-sm"
                              style={{ color: "#5b5346" }}
                            >
                              Amount
                              <div className="relative mt-1">
                                <span
                                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                                  style={{ color: "#a39a8c" }}
                                >
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  required
                                  value={term.amount}
                                  onChange={(e) =>
                                    updateTermField(idx, "amount", e.target.value)
                                  }
                                  className={`${inputClass} mt-0 pl-7`}
                                  style={inputStyle}
                                  placeholder="10000"
                                />
                              </div>
                            </label>
                            <label
                              className="block text-sm"
                              style={{ color: "#5b5346" }}
                            >
                              Due Date
                              <input
                                type="date"
                                required
                                value={term.due_date}
                                onChange={(e) =>
                                  updateTermField(idx, "due_date", e.target.value)
                                }
                                className={inputClass}
                                style={inputStyle}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Price Summary ── */}
                    <div
                      className="mt-4 rounded-xl p-4"
                      style={{
                        background: installmentAmountValid
                          ? "#eef2ea"
                          : "#fef2f2",
                        border: `1px solid ${
                          installmentAmountValid ? "#d3e0cd" : "#fecaca"
                        }`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: installmentAmountValid
                              ? "#d3e0cd"
                              : "#fecaca",
                            color: installmentAmountValid
                              ? "#39533a"
                              : "#b91c1c",
                          }}
                        >
                          {installmentAmountValid ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                            <div>
                              <span
                                className="text-xs"
                                style={{ color: "#8a8175" }}
                              >
                                Total Installments
                              </span>
                              <p
                                className="font-medium tabular-nums"
                                style={{ color: "#17140f" }}
                              >
                                {formatPrice(installmentTotal)}
                              </p>
                            </div>
                            <div>
                              <span
                                className="text-xs"
                                style={{ color: "#8a8175" }}
                              >
                                Course Price
                              </span>
                              <p
                                className="font-medium tabular-nums"
                                style={{ color: "#17140f" }}
                              >
                                {formatPrice(coursePrice)}
                              </p>
                            </div>
                            <div>
                              <span
                                className="text-xs"
                                style={{ color: "#8a8175" }}
                              >
                                Difference
                              </span>
                              <p
                                className="font-medium tabular-nums"
                                style={{
                                  color: installmentAmountValid
                                    ? "#5c7a5a"
                                    : "#b91c1c",
                                }}
                              >
                                {installmentDiff === 0
                                  ? "₹0"
                                  : installmentDiff > 0
                                    ? `−${formatPrice(Math.abs(installmentDiff))}`
                                    : `+${formatPrice(Math.abs(installmentDiff))}`}
                              </p>
                            </div>
                          </div>
                          {!installmentAmountValid && (
                            <p
                              className="mt-2 text-xs font-medium"
                              style={{ color: "#b91c1c" }}
                            >
                              Installment amounts must equal the course price.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {previewImage && (
                <img
                  src={previewImage}
                  alt="Course preview"
                  className="h-40 w-full rounded-xl object-cover"
                  style={{ border: "1px solid #e3ddd0" }}
                />
              )}

              {/* Curriculum */}
              <div
                className="rounded-xl p-4 sm:p-5"
                style={{ background: "#faf8f4", border: "1px solid #e3ddd0" }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                      Modules and topics
                    </h3>
                    <p className="mt-0.5 text-xs" style={{ color: "#a39a8c" }}>
                      Curriculum
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addModule}
                    className={`ba-press inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${FOCUS_RING}`}
                    style={{ border: "1px solid #e3ddd0", background: "#ffffff", color: "#7a531f" }}
                  >
                    <Plus className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} /> Module
                  </button>
                </div>

                <div className="space-y-4">
                  {form.curriculum.map((module, moduleIndex) => (
                    <div
                      key={moduleIndex}
                      className="rounded-xl p-4"
                      style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
                    >
                      <div className="flex gap-2">
                        <input
                          required
                          value={module.title}
                          onChange={(event) => updateModule(moduleIndex, event.target.value)}
                          className={`${inputClass} mt-0`}
                          style={inputStyle}
                          placeholder={`Module ${moduleIndex + 1} title`}
                        />
                        <button
                          type="button"
                          onClick={() => removeModule(moduleIndex)}
                          className={`shrink-0 rounded-lg p-2 ${FOCUS_RING}`}
                          style={{ color: "#a24a3a" }}
                          aria-label="Remove module"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {module.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="flex gap-2">
                            <input
                              required
                              value={topic}
                              onChange={(event) =>
                                updateTopic(moduleIndex, topicIndex, event.target.value)
                              }
                              className={`${inputClass} mt-0`}
                              style={inputStyle}
                              placeholder="Topic covered"
                            />
                            <button
                              type="button"
                              onClick={() => removeTopic(moduleIndex, topicIndex)}
                              className={`shrink-0 rounded-lg p-2 ${FOCUS_RING}`}
                              style={{ color: "#a39a8c" }}
                              aria-label="Remove topic"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addTopic(moduleIndex)}
                        className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING}`}
                        style={{ color: "#9c6b2e" }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add topic
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`ba-press flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50 ${FOCUS_RING}`}
                style={{ background: "#17140f" }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" style={{ color: "#f4b942" }} />
                )}
                {saving ? "Saving…" : editingCourse ? "Update course" : "Create course"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchAdminCourses;