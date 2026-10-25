import React, { useEffect, useState } from "react";
import {
  Bell,
  Clock,
  Edit3,
  ImagePlus,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import {
  createBranchAnnouncementApi,
  deleteBranchAnnouncementApi,
  getBranchAnnouncementApi,
  getBranchAnnouncementsApi,
  updateBranchAnnouncementApi,
} from "../services/branchadminannouncements";
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
@keyframes ba-pop  { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.ba-rise  { opacity: 0; animation: ba-rise .55s cubic-bezier(.2,.7,.2,1) forwards; }
.ba-fade  { animation: ba-fade .4s ease both; }
.ba-pop   { animation: ba-pop .3s cubic-bezier(.2,.7,.2,1) both; }
.ba-card  { transition: box-shadow .3s ease, border-color .3s ease; }
.ba-card:hover { border-color: #d9cdb5; box-shadow: 0 16px 36px -22px rgba(23,20,15,.3); }
.ba-press { transition: transform .15s ease, opacity .2s ease; }
.ba-press:hover { transform: translateY(-1px); }
.ba-press:active { transform: translateY(0) scale(.98); }
@media (prefers-reduced-motion: reduce) {
  .ba-rise, .ba-fade, .ba-pop { animation: none !important; opacity: 1 !important; }
  .ba-card, .ba-press { transition: none !important; }
  .ba-press:hover { transform: none; }
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

export const formatPostedDateTime = (dateStr) => {
  if (!dateStr) return "Recently posted";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dateFormatted = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return String(dateStr);
  }
};

const EMPTY_FORM = { title: "", message: "", audience: "both" };

const BranchAdminAnnouncements = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAnnouncements = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getBranchAnnouncementsApi(token);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load branch announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [token]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingAnnouncement(null);
    setImageFile(null);
    setPreviewImage("");
  };

  const openCreate = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  const openEdit = async (announcement) => {
    try {
      setError("");
      setSuccess("");
      const details = await getBranchAnnouncementApi(announcement.id, token);
      setEditingAnnouncement(details);
      setForm({
        title: details.title || "",
        message: details.message || "",
        audience: details.audience || "both",
      });
      setPreviewImage(details.image ? getCourseImageUrl(details.image) : "");
      setImageFile(null);
    } catch (err) {
      setError(err.message || "Failed to load announcement.");
    }
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("message", form.message.trim());
      data.append("audience", form.audience || "both");
      if (imageFile) data.append("image", imageFile);
      const saved = editingAnnouncement
        ? await updateBranchAnnouncementApi(editingAnnouncement.id, data, token)
        : await createBranchAnnouncementApi(data, token);
      setAnnouncements((current) =>
        editingAnnouncement
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current],
      );
      setSuccess(
        `Announcement ${editingAnnouncement ? "updated" : "created"} successfully.`,
      );
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const removeAnnouncement = async (announcement) => {
    if (!window.confirm(`Delete ${announcement.title}? This cannot be undone.`))
      return;
    try {
      setDeletingId(announcement.id);
      setError("");
      await deleteBranchAnnouncementApi(announcement.id, token);
      setAnnouncements((current) =>
        current.filter((item) => item.id !== announcement.id),
      );
      if (editingAnnouncement?.id === announcement.id) resetForm();
      setSuccess("Announcement deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="branch-announcements-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openCreate={() => navigate("/branch-admin/courses", { state: { openCreate: true } })}
        activePage="announcements"
      />

      <main className="min-w-0 flex-1">
        {/* ---- Header ---- */}
        <header className="sticky top-0 z-20 flex h-[92px] items-center justify-between border-b border-[#e3ddd0] bg-[#faf8f4]/95 px-6 backdrop-blur-md sm:px-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3ddd0] bg-white text-slate-600 shadow-sm transition hover:bg-[#f0ebe1] md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9c6b2e]">
                Branch Portal
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Announcements
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || "Branch Admin"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {user?.branch_name || "Branch Administrator"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17140f] text-sm font-extrabold text-[#f4b942] shadow-sm ring-2 ring-[#e3ddd0]">
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10">
          {/* ---- Alerts ---- */}
          {error && (
            <div
              role="alert"
              className="ba-pop mb-6 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}
          {!error && success && (
            <div
              role="status"
              className="ba-pop mb-6 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
            >
              {success}
            </div>
          )}

          {/* ---- Published by Branch View (Manage Announcements) ---- */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              {/* ---- Published list ---- */}
              <section
                className="order-2 rounded-2xl p-6 sm:p-7 lg:order-1"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div
                  className="mb-5 flex items-center justify-between pb-5"
                  style={{ borderBottom: "1px solid #e3ddd0" }}
                >
                  <div>
                    <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                      Published updates
                    </h2>
                    <p className="mt-0.5 text-xs" style={{ color: "#a39a8c" }}>
                      Visible to students and staff in your branch
                    </p>
                  </div>
                  <span className="text-sm tabular-nums" style={{ color: "#a39a8c" }}>
                    {announcements.length}
                  </span>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 py-12 text-sm" style={{ color: "#8a8175" }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading announcements…
                  </div>
                ) : announcements.length === 0 ? (
                  <div
                    className="rounded-xl px-5 py-12 text-center"
                    style={{ border: "1px dashed #dfc9a9" }}
                  >
                    <Megaphone className="mx-auto h-5 w-5" style={{ color: "#d9b77b" }} />
                    <p className="mt-3 text-sm" style={{ color: "#8a8175" }}>
                      No announcements yet. Write your first update on the right.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement, index) => {
                      const targetAudience = announcement.audience || "both";
                      return (
                        <article
                          key={announcement.id}
                          className="ba-card ba-rise overflow-hidden rounded-xl"
                          style={{
                            border: "1px solid #e3ddd0",
                            background: "#ffffff",
                            animationDelay: `${Math.min(index, 6) * 60}ms`,
                          }}
                        >
                          <div className="flex flex-col sm:flex-row">
                            {announcement.image && (
                              <div
                                className="flex h-44 w-full items-center justify-center p-2 sm:h-auto sm:w-40 sm:shrink-0"
                                style={{ background: "#f1ede4" }}
                              >
                                <img
                                  src={getCourseImageUrl(announcement.image)}
                                  alt={announcement.title}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1 p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3
                                    className="text-base leading-snug"
                                    style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                                  >
                                    {announcement.title}
                                  </h3>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <p className="flex items-center gap-1 text-xs" style={{ color: "#a39a8c" }}>
                                      <Clock className="h-3 w-3 shrink-0" />
                                      Posted on: {formatPostedDateTime(announcement.created_at)}
                                    </p>
                                    <span
                                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold"
                                      style={{
                                        background:
                                          targetAudience === "staff"
                                            ? "#fef3c7"
                                            : targetAudience === "students"
                                            ? "#e0f2fe"
                                            : "#f1ede4",
                                        color:
                                          targetAudience === "staff"
                                            ? "#92400e"
                                            : targetAudience === "students"
                                            ? "#0369a1"
                                            : "#5b5346",
                                        border: "1px solid rgba(0,0,0,0.06)",
                                      }}
                                    >
                                      Target:{" "}
                                      {targetAudience === "staff"
                                        ? "Staff"
                                        : targetAudience === "students"
                                        ? "Students"
                                        : "Students & Staff"}
                                    </span>
                                  </div>
                                </div>
                                <span className="shrink-0 text-xs" style={{ color: "#a39a8c" }}>
                                  #{announcement.id}
                                </span>
                              </div>
                              <p
                                className="mt-3 whitespace-pre-wrap text-sm leading-6"
                                style={{ color: "#5b5346" }}
                              >
                                {announcement.message}
                              </p>
                              <div
                                className="mt-4 flex gap-4 pt-3"
                                style={{ borderTop: "1px solid #efe9dd" }}
                              >
                                <button
                                  type="button"
                                  onClick={() => openEdit(announcement)}
                                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING}`}
                                  style={{ color: "#9c6b2e" }}
                                >
                                  <Edit3 className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAnnouncement(announcement)}
                                  disabled={deletingId !== null}
                                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium disabled:opacity-60 ${FOCUS_RING}`}
                                  style={{ color: "#a24a3a" }}
                                >
                                  {deletingId === announcement.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                  {deletingId === announcement.id ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* ---- Create / edit form ---- */}
              <form
                onSubmit={submit}
                className="order-1 h-fit rounded-2xl p-6 sm:p-7 lg:sticky lg:top-6 lg:order-2"
                style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
              >
                <div
                  className="mb-5 flex items-center justify-between pb-5"
                  style={{ borderBottom: "1px solid #e3ddd0" }}
                >
                  <h2 className="text-lg" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>
                    {editingAnnouncement ? "Update announcement" : "Create announcement"}
                  </h2>
                  {editingAnnouncement ? (
                    <button
                      type="button"
                      onClick={openCreate}
                      className={`rounded-lg p-1.5 ${FOCUS_RING}`}
                      style={{ color: "#a39a8c" }}
                      aria-label="Cancel editing"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <Plus className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                  )}
                </div>

                <div className="space-y-4">
                  {/* Audience Target Field */}
                  <label className="block text-sm font-medium" style={{ color: "#5b5346" }}>
                    Audience / Target
                    <select
                      value={form.audience}
                      onChange={(event) => setForm({ ...form, audience: event.target.value })}
                      className={inputClass}
                      style={inputStyle}
                    >
                      <option value="both">Both (Students & Staff)</option>
                      <option value="students">Students</option>
                      <option value="staff">Staff</option>
                    </select>
                    <p className="mt-1 text-[11px]" style={{ color: "#8a8175" }}>
                      Branch announcements accept students, staff, or both.
                    </p>
                  </label>

                  <label className="block text-sm font-medium" style={{ color: "#5b5346" }}>
                    Title
                    <input
                      required
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="New batch admissions open"
                    />
                  </label>
                  <label className="block text-sm font-medium" style={{ color: "#5b5346" }}>
                    Message
                    <textarea
                      required
                      rows={6}
                      value={form.message}
                      onChange={(event) => setForm({ ...form, message: event.target.value })}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="Write the announcement details…"
                    />
                  </label>
                  <label className="block text-sm font-medium" style={{ color: "#5b5346" }}>
                    Image (optional)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImage}
                      className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#f7efe0] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#7a531f]`}
                      style={inputStyle}
                    />
                  </label>
                  {previewImage && (
                    <div className="relative rounded-xl border border-[#e3ddd0] bg-[#f1ede4] p-2 flex items-center justify-center">
                      <img
                        src={previewImage}
                        alt="Announcement preview"
                        className="max-h-40 w-auto max-w-full rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setPreviewImage("");
                        }}
                        className="absolute top-2 right-2 rounded-lg bg-black/60 p-1 text-white hover:bg-black/80 transition"
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-2 pt-5" style={{ borderTop: "1px solid #e3ddd0" }}>
                  {editingAnnouncement && (
                    <button
                      type="button"
                      onClick={openCreate}
                      className={`rounded-lg px-4 py-3 text-sm font-medium ${FOCUS_RING}`}
                      style={{ color: "#8a8175", border: "1px solid #e3ddd0" }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className={`ba-press flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50 ${FOCUS_RING}`}
                    style={{ background: "#17140f" }}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingAnnouncement ? (
                      <Save className="h-4 w-4" style={{ color: "#f4b942" }} />
                    ) : (
                      <Bell className="h-4 w-4" style={{ color: "#f4b942" }} />
                    )}
                    {saving
                      ? "Saving…"
                      : editingAnnouncement
                        ? "Save changes"
                        : "Publish announcement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
      </main>
    </div>
  );
};

export default BranchAdminAnnouncements;