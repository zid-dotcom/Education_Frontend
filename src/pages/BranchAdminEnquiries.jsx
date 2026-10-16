import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  Loader2,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getBranchAdminEnquiriesApi, markBranchAdminEnquiryReadApi } from "../services/enquiries";

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
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";

const BranchAdminEnquiries = () => {
  useDisplayFonts();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingReadId, setMarkingReadId] = useState(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadEnquiries = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await getBranchAdminEnquiriesApi(token);
      const list = Array.isArray(data) ? data : (data?.enquiries ?? data?.data ?? []);
      setEnquiries(list);
    } catch (err) {
      setError(err.message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [token]);

  const isRead = (enq) => {
    const status = String(enq?.branch_admin_status || enq?.status || '').toLowerCase();
    return status === 'read' || status === 'completed' || enq?.is_read === true;
  };

  const handleMarkAsRead = async (enquiryId) => {
    if (!token || !enquiryId) return;
    try {
      setMarkingReadId(enquiryId);
      const res = await markBranchAdminEnquiryReadApi(enquiryId, token);
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === enquiryId
            ? {
                ...e,
                ...(typeof res === 'object' && res !== null ? res : {}),
                branch_admin_status: 'read',
                status: 'read',
                is_read: true,
              }
            : e
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to mark enquiry as read.');
    } finally {
      setMarkingReadId(null);
    }
  };

  const isGeneral = (e) => {
    const type = (e.enquiry_type || e.type || '').toLowerCase();
    if (type.includes('admission')) return false;
    if (type.includes('general')) return true;
    const course = (e.course || '').toLowerCase();
    if (course.includes('general')) return true;
    if (!e.course && !e.qualification) return true;
    return false;
  };

  const admissionEnquiries = enquiries.filter((e) => !isGeneral(e));
  const generalEnquiries = enquiries.filter((e) => isGeneral(e));

  const pendingAdmissionCount = admissionEnquiries.filter((e) => !isRead(e)).length;
  const pendingGeneralCount = generalEnquiries.filter((e) => !isRead(e)).length;

  return (
    <div
      className="branch-enquiries-page min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#1c1a17" }}
    >
      <style>{PAGE_CSS}</style>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="enquiries"
      />

      <main className="min-w-0 flex-1 h-screen overflow-y-auto">
        <header
          className="ba-fade flex flex-col gap-5 px-6 pb-8 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-10"
          style={{ borderBottom: "1px solid #e3ddd0", background: "#faf8f4", position: "sticky", top: 0, zIndex: 10 }}
        >
          <div>
            <h1
              className="text-[2.1rem] leading-none tracking-tight sm:text-[2.5rem]"
              style={{ ...serif, fontWeight: 500, color: "#17140f" }}
            >
              Enquiries
            </h1>
            <p className="mt-2 max-w-md text-[0.95rem]" style={{ color: "#8a8175" }}>
              Admission queries and messages for your branch.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium" style={{ color: "#17140f" }}>
                {user?.name || "Branch admin"}
              </p>
              <p className="text-xs" style={{ color: "#a39a8c" }}>
                Branch administrator
              </p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium"
              style={{ background: "#17140f", color: "#f4b942" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1480px] px-6 py-8 sm:px-10">
          {error && (
            <div
              role="alert"
              className="ba-pop mb-6 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: "#8a8175" }}>
              <Loader2 className="h-5 w-5 animate-spin text-[#9c6b2e]" />
              <span className="font-medium">Loading enquiries…</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 xl:gap-36 2xl:gap-44 items-start">
              {/* LEFT SECTION CARD: Admission Applications */}
              <section
                className="ba-rise rounded-3xl border border-[#e3ddd0] bg-white p-5 sm:p-7 shadow-xs flex flex-col gap-6"
              >
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0ebe0]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e] shrink-0 shadow-2xs">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-[#17140f]" style={serif}>
                        Admission Applications
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        {pendingAdmissionCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" />
                            {pendingAdmissionCount} pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            All read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#faf8f4] border border-[#e3ddd0] text-[#5b5346]"
                  >
                    {admissionEnquiries.length} {admissionEnquiries.length === 1 ? "Application" : "Applications"}
                  </span>
                </div>

                {admissionEnquiries.length === 0 ? (
                  <div
                    className="rounded-2xl px-5 py-12 text-center border border-dashed border-[#dfc9a9] bg-[#faf8f4]"
                  >
                    <MessageCircle className="mx-auto h-8 w-8 mb-3 text-[#d9b77b]" />
                    <h3 className="text-base font-semibold text-[#17140f] mb-1" style={serif}>
                      No admission applications yet
                    </h3>
                    <p className="text-xs text-[#8a8175] max-w-sm mx-auto">
                      When students select your branch in the admission form, their applications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {admissionEnquiries.map((enq, index) => {
                      const readStatus = isRead(enq);
                      return (
                        <article
                          key={enq.id}
                          className="ba-card flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#e8e2d5] bg-[#faf8f4] hover:bg-white transition"
                          style={{
                            animationDelay: `${Math.min(index, 6) * 40}ms`,
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div className="min-w-0">
                                <h3 className="text-base font-semibold truncate text-[#17140f]">
                                  {enq.name}
                                </h3>
                                <span className="text-xs font-medium flex items-center gap-1.5 mt-0.5 text-[#8a8175]">
                                  <Calendar className="w-3.5 h-3.5 text-[#9c6b2e]" />
                                  {formatDate(enq.created_at)}
                                </span>
                              </div>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  readStatus
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {readStatus ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Read</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Pending</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="space-y-2 mb-4 text-xs text-[#5b5346]">
                              <p className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                                <a href={`mailto:${enq.email}`} className="hover:underline truncate">{enq.email}</a>
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                                <a href={`tel:${enq.phone}`} className="hover:underline">{enq.phone}</a>
                              </p>
                              {enq.course && (
                                <p className="flex items-center gap-2 font-medium text-[#7a531f]">
                                  <BookOpen className="w-3.5 h-3.5 text-[#9c6b2e] shrink-0" />
                                  <span className="truncate">{enq.course}</span>
                                </p>
                              )}
                              {enq.qualification && (
                                <p className="flex items-center gap-2 text-[#5b5346]">
                                  <GraduationCap className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                                  <span className="truncate">{enq.qualification}</span>
                                </p>
                              )}
                            </div>

                            <div className="p-3.5 rounded-xl text-xs bg-white border border-[#e3ddd0] text-[#17140f]">
                              <p className="text-[11px] mb-1 font-semibold text-[#8a7b68]">Message:</p>
                              <p className="whitespace-pre-wrap leading-relaxed">{enq.message}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-[#f1ede4] flex items-center justify-between gap-3">
                            <span className="text-xs text-[#8a7b68]">
                              Branch Admin Read Status:{" "}
                              <strong className={readStatus ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                                {readStatus ? "Read" : "Pending"}
                              </strong>
                            </span>

                            {!readStatus ? (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(enq.id)}
                                disabled={markingReadId === enq.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-60 shadow-2xs"
                                style={{ background: "#9c6b2e" }}
                              >
                                {markingReadId === enq.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Marking...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>Mark as Read</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Read
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* RIGHT SECTION CARD: General Enquiries */}
              <section
                className="ba-rise rounded-3xl border border-[#e3ddd0] bg-white p-5 sm:p-7 shadow-xs flex flex-col gap-6"
                style={{ animationDelay: "60ms" }}
              >
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0ebe0]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8edcf] text-[#9c6b2e] shrink-0 shadow-2xs">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-[#17140f]" style={serif}>
                        General Enquiries
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        {pendingGeneralCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3" />
                            {pendingGeneralCount} pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            All read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap bg-[#faf8f4] border border-[#e3ddd0] text-[#5b5346]"
                  >
                    {generalEnquiries.length} {generalEnquiries.length === 1 ? "Enquiry" : "Enquiries"}
                  </span>
                </div>

                {generalEnquiries.length === 0 ? (
                  <div
                    className="rounded-2xl px-5 py-12 text-center border border-dashed border-[#dfc9a9] bg-[#faf8f4]"
                  >
                    <MessageCircle className="mx-auto h-8 w-8 mb-3 text-[#d9b77b]" />
                    <h3 className="text-base font-semibold text-[#17140f] mb-1" style={serif}>
                      No general enquiries yet
                    </h3>
                    <p className="text-xs text-[#8a8175] max-w-sm mx-auto">
                      When visitors send a general message selecting your branch, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {generalEnquiries.map((enq, index) => {
                      const readStatus = isRead(enq);
                      return (
                        <article
                          key={enq.id}
                          className="ba-card flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#e8e2d5] bg-[#faf8f4] hover:bg-white transition"
                          style={{
                            animationDelay: `${Math.min(index, 6) * 40}ms`,
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div className="min-w-0">
                                <h3 className="text-base font-semibold truncate text-[#17140f]">
                                  {enq.name}
                                </h3>
                                <span className="text-xs font-medium flex items-center gap-1.5 mt-0.5 text-[#8a8175]">
                                  <Calendar className="w-3.5 h-3.5 text-[#9c6b2e]" />
                                  {formatDate(enq.created_at)}
                                </span>
                              </div>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  readStatus
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {readStatus ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Read</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Pending</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="space-y-2 mb-4 text-xs text-[#5b5346]">
                              <p className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                                <a href={`mailto:${enq.email}`} className="hover:underline truncate">{enq.email}</a>
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-[#a39a8c] shrink-0" />
                                <a href={`tel:${enq.phone}`} className="hover:underline">{enq.phone}</a>
                              </p>
                              {enq.course && !enq.course.toLowerCase().includes("general") && (
                                <p className="flex items-center gap-2 font-medium text-[#7a531f]">
                                  <BookOpen className="w-3.5 h-3.5 text-[#9c6b2e] shrink-0" />
                                  <span className="truncate">{enq.course}</span>
                                </p>
                              )}
                            </div>

                            <div className="p-3.5 rounded-xl text-xs bg-white border border-[#e3ddd0] text-[#17140f]">
                              <p className="text-[11px] mb-1 font-semibold text-[#8a7b68]">Message:</p>
                              <p className="whitespace-pre-wrap leading-relaxed">{enq.message}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-[#f1ede4] flex items-center justify-between gap-3">
                            <span className="text-xs text-[#8a7b68]">
                              Branch Admin Read Status:{" "}
                              <strong className={readStatus ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                                {readStatus ? "Read" : "Pending"}
                              </strong>
                            </span>

                            {!readStatus ? (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(enq.id)}
                                disabled={markingReadId === enq.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-60 shadow-2xs"
                                style={{ background: "#9c6b2e" }}
                              >
                                {markingReadId === enq.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Marking...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>Mark as Read</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Read
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BranchAdminEnquiries;
