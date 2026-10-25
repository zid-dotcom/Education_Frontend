import React, { useEffect, useMemo, useState } from "react";
import { IndianRupee, Mail, Phone, Search, Loader2, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getDueAdmissionsApi } from "../services/branchadminadmissions";

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

function BranchAdminFeesDue() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dueAdmissions, setDueAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (document.getElementById("ba-attendance-fonts")) return;
    const link = document.createElement("link");
    link.id = "ba-attendance-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getDueAdmissionsApi(token);
        if (isMounted) {
          setDueAdmissions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load fees due data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const flattenedRecords = useMemo(() => {
    return dueAdmissions.map((admission) => {
      return {
        id: admission.enrollment_id || Math.random(),
        studentName: admission.name || admission.student_name,
        studentEmail: admission.email,
        studentPhone: admission.phone,
        courseName: admission.course_title || admission.course_name,
        balance: Number(admission.balance_amount ?? admission.remaining_amount ?? 0),
        totalFees: Number(admission.total_fee ?? admission.amount ?? 0),
        paidAmount: Number(admission.total_paid ?? admission.paid_amount ?? 0),
        pendingTerms: Number(admission.pending_terms ?? admission.installment_count ?? 1),
        firstDue: admission.next_due_date ?? admission.due_date ?? admission.admission_date ?? null,
        lastDue: admission.latest_due_date ?? null,
      };
    });
  }, [dueAdmissions]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return flattenedRecords;
    return flattenedRecords.filter((record) =>
      [record.studentName, record.courseName, record.studentEmail, record.studentPhone]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [flattenedRecords, search]);

  const totalOutstanding = useMemo(() => {
    return dueAdmissions.reduce((sum, admission) => sum + Number(admission.balance_amount ?? admission.remaining_amount ?? 0), 0);
  }, [dueAdmissions]);

  return (
    <div
      className="min-h-screen md:flex"
      style={{ ...sans, background: "#faf8f4", color: "#17140f" }}
    >
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="fees-due"
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
                Fees Due
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

        <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8 sm:px-10">
          <section className="grid gap-4 sm:grid-cols-2" aria-label="Fees due summary">
            <div
              className="rounded-xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <p className="text-sm" style={{ color: "#8a8175" }}>
                Students with dues
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "#17140f" }}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mt-1" /> : dueAdmissions.length}
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <p className="text-sm" style={{ color: "#8a8175" }}>
                Total outstanding
              </p>
              <p className="mt-2 flex items-center gap-1 text-2xl font-semibold" style={{ color: "#9c6b2e" }}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mt-1" />
                ) : (
                  <>
                    <IndianRupee className="h-5 w-5" />
                    {formatCurrency(totalOutstanding).replace("₹", "")}
                  </>
                )}
              </p>
            </div>
          </section>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl" style={{ ...serif, fontWeight: 500 }}>
                Outstanding fee records
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                {loading ? "Loading records..." : `${filteredRecords.length} record(s) found`}
              </p>
            </div>
            <label
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 sm:max-w-sm ${FOCUS_RING}`}
              style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: "#9c6b2e" }} />
              <span className="sr-only">Search students, courses, or contact details</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students or courses"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a39a8c]"
              />
            </label>
          </div>

          {loading ? (
            <div
              className="rounded-xl px-5 py-12 flex items-center justify-center gap-3 text-sm"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0", color: "#8a8175" }}
            >
              <Loader2 className="h-5 w-5 animate-spin" /> Fetching outstanding fees...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div
              className="rounded-xl px-5 py-12 text-center text-sm"
              style={{ background: "#ffffff", border: "1px solid #e3ddd0", color: "#8a8175" }}
            >
              No outstanding fees match “{search}”.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                const paidPercent = record.totalFees > 0 ? Math.round((record.paidAmount / record.totalFees) * 100) : 0;

                return (
                  <article
                    key={record.id}
                    className="overflow-hidden rounded-xl ba-card"
                    style={{ background: "#ffffff", border: "1px solid #e3ddd0", transition: "all 0.25s ease" }}
                  >
                    <div
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                      style={{ borderBottom: "1px solid #efe9dd" }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                          style={{ background: "#f7efe0", color: "#7a531f" }}
                          aria-hidden="true"
                        >
                          {record.studentName
                            ?.split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-medium">{record.studentName}</h3>
                          <p className="truncate text-sm" style={{ color: "#8a8175" }}>
                            {record.courseName}
                          </p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs" style={{ color: "#8a8175" }}>
                          Remaining to pay
                        </p>
                        <p className="mt-0.5 text-xl font-semibold" style={{ color: "#9c6b2e" }}>
                          {formatCurrency(record.balance)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
                      <section>
                        <h4 className="text-xs font-semibold uppercase text-[#8a8175]">Upcoming Dues</h4>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
                          <div>
                            <dt className="text-xs" style={{ color: "#a39a8c" }}>Next due</dt>
                            <dd className="mt-1 text-sm font-medium">{record.firstDue ? formatDate(record.firstDue) : "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs" style={{ color: "#a39a8c" }}>Latest due</dt>
                            <dd className="mt-1 text-sm font-medium">{record.lastDue && record.lastDue !== record.firstDue ? formatDate(record.lastDue) : "—"}</dd>
                          </div>
                        </dl>
                      </section>

                      <section>
                        <h4 className="text-xs font-semibold uppercase text-[#8a8175]">Pending Payment terms</h4>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span style={{ color: "#5b5346" }}>Pending terms</span>
                          <span className="font-medium" style={{ color: "#a24a3a" }}>{record.pendingTerms}</span>
                        </div>
                        <div
                          className="mt-3 h-1.5 overflow-hidden rounded-full"
                          style={{ background: "#f1ede4" }}
                          role="progressbar"
                          aria-label={`${record.studentName} fee paid`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={paidPercent}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${paidPercent}%`, background: "#5c7a5a" }}
                          />
                        </div>
                      </section>
                    </div>

                    <div
                      className="grid gap-4 px-5 py-4 sm:grid-cols-3 sm:px-6"
                      style={{ borderTop: "1px solid #efe9dd", background: "#faf8f4" }}
                    >
                      <div>
                        <p className="text-xs" style={{ color: "#a39a8c" }}>Amount billed (Due terms)</p>
                        <p className="mt-1 text-sm font-medium">{formatCurrency(record.totalFees)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: "#a39a8c" }}>Amount paid (Towards dues)</p>
                        <p className="mt-1 text-sm font-medium" style={{ color: "#39533a" }}>
                          {formatCurrency(record.paidAmount)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: "#a39a8c" }}>Contact details</p>
                        <div className="mt-1 flex flex-col gap-1">
                          {record.studentPhone && (
                            <a
                              href={`tel:${record.studentPhone.replaceAll(" ", "")}`}
                              className={`flex min-w-0 items-center gap-2 text-sm font-medium hover:underline ${FOCUS_RING}`}
                              style={{ color: "#5b5346" }}
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                              {record.studentPhone}
                            </a>
                          )}
                          {record.studentEmail && (
                            <a
                              href={`mailto:${record.studentEmail}`}
                              className={`flex min-w-0 items-center gap-2 break-all text-sm font-medium hover:underline ${FOCUS_RING}`}
                              style={{ color: "#5b5346" }}
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "#9c6b2e" }} />
                              {record.studentEmail}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default BranchAdminFeesDue;