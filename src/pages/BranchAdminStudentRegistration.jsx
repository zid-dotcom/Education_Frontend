import React, { useEffect, useState } from "react";
import { Check, IndianRupee, Mail, Menu, Phone, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BranchAdminSidebar from "../components/layout/BranchAdminSidebar";
import { getMyCoursesApi, getMyCourseApi } from "../services/branchadmincourses";
import {
  addBranchAdmissionPaymentApi,
  createBranchAdmissionApi,
  getBranchAdmissionsApi,
} from "../services/branchadminadmissions";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  qualification: "",
  address: "",
  password: "",
  courseId: "",
  paymentPlan: "full",
  paymentAmount: "",
  paymentMethod: "cash",
  paymentStatus: "received",
  selectedInstallment: 1,
};

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" };
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#9c6b2e]/40";
const INPUT_CLASS = `mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ${FOCUS_RING}`;
const INPUT_STYLE = {
  border: "1px solid #e3ddd0",
  color: "#1c1a17",
  background: "#ffffff",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "Not provided";
  const parsedDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

function ChoiceGroup({ label, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm" style={{ color: "#5b5346" }}>{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={`rounded-lg border px-3.5 py-2 text-sm transition-colors ${FOCUS_RING}`}
              style={{
                borderColor: selected ? "#9c6b2e" : "#e3ddd0",
                background: selected ? "#f7efe0" : "#ffffff",
                color: selected ? "#7a531f" : "#5b5346",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function BranchAdminStudentRegistration() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("registration");
  const [form, setForm] = useState(INITIAL_FORM);
  const [courses, setCourses] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedAdmissionForPayment, setSelectedAdmissionForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ cash_amount: 0, upi_amount: 0, installment_number: 1, payment_date: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [editableInstallments, setEditableInstallments] = useState([]);
  const [registrationPayment, setRegistrationPayment] = useState({
    term_number: 1,
    cash_amount: "",
    upi_amount: "",
    status: "received"
  });

  useEffect(() => {
    if (!token || !form.courseId) return;
    let isMounted = true;
    const fetchCourseDetails = async () => {
      try {
        const details = await getMyCourseApi(form.courseId, token);
        if (isMounted) {
          setSelectedCourseDetails(details);
          const fee = Number(details.price) || 0;
          if (details?.installment_terms?.length > 0) {
            setEditableInstallments(details.installment_terms.map(t => ({ ...t })));
          } else if (details?.installment_count > 0) {
             const count = Number(details.installment_count);
             const amt = Math.round(fee / count);
             const today = new Date();
             const terms = Array.from({ length: count }, (_, i) => {
                const dueDate = new Date(today);
                dueDate.setMonth(today.getMonth() + i);
                return { term_number: i + 1, amount: amt, due_date: dueDate.toISOString().slice(0, 10) };
             });
             const totalSoFar = amt * (count - 1);
             terms[count - 1].amount = fee - totalSoFar;
             setEditableInstallments(terms);
          } else {
             setEditableInstallments([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course details:", err);
      }
    };
    fetchCourseDetails();
    return () => {
      isMounted = false;
    };
  }, [form.courseId, token]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadPageData = async () => {
      setLoading(true);
      setError("");
      try {
        const [courseResult, admissionResult] = await Promise.allSettled([
          getMyCoursesApi(token),
          getBranchAdmissionsApi(token),
        ]);
        if (!isMounted) return;
        const availableCourses = courseResult.status === "fulfilled" && Array.isArray(courseResult.value)
          ? courseResult.value
          : [];
        setCourses(availableCourses);
        setAdmissions(
          admissionResult.status === "fulfilled" && Array.isArray(admissionResult.value)
            ? admissionResult.value
            : [],
        );
        setForm((current) => {
          if (current.courseId || availableCourses.length === 0) return current;
          const firstCourse = availableCourses[0];
          return {
            ...current,
            courseId: String(firstCourse.id),
            paymentAmount: String(firstCourse.price || ""),
          };
        });
        const loadErrors = [courseResult, admissionResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason?.message)
          .filter(Boolean);
        if (loadErrors.length) setError(loadErrors.join(" "));
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load courses and admissions.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPageData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const selectedCourse = courses.find(
    (course) => String(course.id) === String(form.courseId),
  );
  const installmentCount = Number(selectedCourse?.installment_count) || 0;
  const installmentSchedule = selectedCourse?.installment_schedule || "";
  const hasInstallments = installmentCount > 0 && Boolean(installmentSchedule);
  const courseFee = Number(selectedCourse?.price) || 0;
  const currentPayment = Number(form.paymentAmount) || 0;

  const updateField = (event) => {
    const { name, value } = event.target;
    setSuccess("");
    setError("");
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "courseId"
        ? (() => {
            const nextCourse = courses.find((course) => String(course.id) === value);
            const nextCourseHasInstallments =
              Number(nextCourse?.installment_count) > 0 &&
              Boolean(nextCourse?.installment_schedule);
            const nextPaymentPlan = nextCourseHasInstallments
              ? current.paymentPlan
              : "full";
            return {
              paymentPlan: nextPaymentPlan,
              paymentAmount: String(
                nextPaymentPlan === "installment"
                  ? Math.round(
                      Number(nextCourse?.price || 0) /
                        Number(nextCourse?.installment_count || 1),
                    )
                  : Number(nextCourse?.price || 0),
              ),
            };
          })()
        : {}),
    }));
  };

  const changePaymentPlan = (paymentPlan) => {
    setError("");
    setSuccess("");
    setForm((current) => ({
      ...current,
      paymentPlan,
    }));
    setRegistrationPayment({
      term_number: 1,
      cash_amount: "",
      upi_amount: "",
      status: "received"
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedCourse) {
      setError("Select a course before registering the student.");
      return;
    }
    if (form.paymentPlan === "installment") {
       const totalInst = editableInstallments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
       if (totalInst !== courseFee) {
         setError(`The sum of all installments (${formatCurrency(totalInst)}) must equal the course fee (${formatCurrency(courseFee)}).`);
         return;
       }
    }

    const cashAmt = Number(registrationPayment.cash_amount) || 0;
    const upiAmt = Number(registrationPayment.upi_amount) || 0;
    const totalPay = cashAmt + upiAmt;

    if (registrationPayment.status === "received") {
       if (totalPay <= 0) {
         setError("Enter a payment amount greater than zero.");
         return;
       }
       if (form.paymentPlan === "installment") {
         const selectedTerm = editableInstallments.find(t => t.term_number === registrationPayment.term_number);
         if (selectedTerm && totalPay !== selectedTerm.amount) {
           setError(`Cash + UPI (${formatCurrency(totalPay)}) must equal Term ${selectedTerm.term_number}'s full amount (${formatCurrency(selectedTerm.amount)}).`);
           return;
         }
       } else {
         if (totalPay !== courseFee) {
           setError(`Cash + UPI (${formatCurrency(totalPay)}) must equal the course fee (${formatCurrency(courseFee)}).`);
           return;
         }
       }
    }

    setSaving(true);
    let createdAdmission;
    try {
      createdAdmission = await createBranchAdmissionApi(
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          parent_name: form.guardianName.trim(),
          parent_phone: form.guardianPhone.trim(),
          highest_qualification: form.qualification.trim(),
          address: form.address.trim(),
          password: form.password,
          course_id: Number(selectedCourse.id),
          payment_status: registrationPayment.status === "received" ? "received" : "not_received",
          cash_amount: registrationPayment.status === "received" ? cashAmt : 0,
          upi_amount: registrationPayment.status === "received" ? upiAmt : 0,
          payment_date: registrationPayment.status === "received" ? new Date().toISOString().slice(0, 10) : null,
          installment_number: form.paymentPlan === "installment" && registrationPayment.status === "received" ? registrationPayment.term_number : null,
          installments: editableInstallments.length > 0 ? editableInstallments.map(t => ({
            installment_number: t.term_number,
            amount: Number(t.amount) || 0,
            due_date: t.due_date
          })) : [],
        },
        token,
      );

      try {
        const updatedAdmissions = await getBranchAdmissionsApi(token);
        setAdmissions(Array.isArray(updatedAdmissions) ? updatedAdmissions : []);
      } catch {
        setAdmissions((current) => [createdAdmission, ...current]);
      }
      setSuccess(`${createdAdmission.name} registered successfully.`);
      setActiveTab("registrations");
      setForm({
        ...INITIAL_FORM,
        courseId: String(selectedCourse.id),
        paymentAmount: String(courseFee),
      });
    } catch (err) {
      if (createdAdmission) {
        setError(`Student was registered, but payment could not be recorded: ${err.message}`);
        setActiveTab("registrations");
        try {
          const updatedAdmissions = await getBranchAdmissionsApi(token);
          setAdmissions(Array.isArray(updatedAdmissions) ? updatedAdmissions : []);
        } catch {
          setAdmissions((current) => [createdAdmission, ...current]);
        }
      } else {
        setError(err.message || "Failed to register student.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen md:flex" style={{ ...sans, background: "#faf8f4", color: "#17140f" }}>
      <BranchAdminSidebar
        user={user}
        navigate={navigate}
        logout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage="registration"
      />

      <main className="min-w-0 flex-1">
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
                Student Registration
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
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ring-2 ring-[#e3ddd0]"
              style={{ background: "#17140f", color: "#f4b942" }}
              aria-hidden="true"
            >
              {user?.name?.charAt(0).toUpperCase() || "B"}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8 sm:px-10">
          {error && (
            <div
              role="alert"
              className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "#eef2ea", color: "#39533a", border: "1px solid #d3e0cd" }}
            >
              <Check className="h-4 w-4" /> {success}
            </div>
          )}

          <div
            className="flex gap-1 border-b"
            role="tablist"
            aria-label="Student registration views"
            style={{ borderColor: "#e3ddd0" }}
          >
            {[
              { id: "registration", label: "Registration" },
              { id: "registrations", label: `Registrations (${admissions.length})` },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${tab.id}-tab`}
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-panel`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors ${FOCUS_RING}`}
                  style={{ color: isActive ? "#7a531f" : "#8a8175" }}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full"
                      style={{ background: "#9c6b2e" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "registration" && (
            <div id="registration-panel" role="tabpanel" aria-labelledby="registration-tab">
          <form
            onSubmit={submit}
            className="overflow-hidden rounded-xl"
            style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}
          >
            <section className="p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl" style={{ ...serif, fontWeight: 500 }}>Student details</h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>Student identity and course registration</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Student full name
                  <input name="name" required value={form.name} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="Student name" />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Phone number
                  <input name="phone" type="tel" required value={form.phone} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="+91 90000 00000" />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Email address
                  <input name="email" type="email" required value={form.email} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="student@example.com" />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Parent / guardian name
                  <input name="guardianName" required value={form.guardianName} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Parent / guardian phone
                  <input name="guardianPhone" required type="tel" value={form.guardianPhone} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Highest qualification
                  <input name="qualification" required value={form.qualification} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm sm:col-span-2" style={{ color: "#5b5346" }}>
                  Address
                  <textarea name="address" required rows="2" value={form.address} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} />
                </label>
                <label className="block text-sm" style={{ color: "#5b5346" }}>
                  Student account password
                  <input name="password" type="password" minLength="8" required value={form.password} onChange={updateField} className={INPUT_CLASS} style={INPUT_STYLE} autoComplete="new-password" />
                </label>
                <label className="block text-sm sm:col-span-2" style={{ color: "#5b5346" }}>
                  Course purchased
                  <select
                    name="courseId"
                    required
                    disabled={loading || courses.length === 0}
                    value={form.courseId}
                    onChange={updateField}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  >
                    <option value="" disabled>
                      {loading ? "Loading courses…" : "Select a course"}
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} · {formatCurrency(course.price)}
                      </option>
                    ))}
                  </select>
                  {selectedCourse && (
                    <span className="mt-2 block text-xs" style={{ color: "#8a8175" }}>
                      {selectedCourse.start_date || "Start date unavailable"} to {selectedCourse.end_date || "End date unavailable"}
                      {hasInstallments && ` · ${installmentCount} ${installmentSchedule} installments`}
                    </span>
                  )}
                </label>
              </div>
            </section>

            <section className="grid gap-7 border-t p-5 sm:grid-cols-2 sm:p-7" style={{ borderColor: "#e3ddd0", background: "#fdfcf9" }}>
              <div className="space-y-5">
                <ChoiceGroup
                  label="Payment plan"
                  value={form.paymentPlan}
                  onChange={changePaymentPlan}
                  options={[
                    { value: "full", label: "Full amount" },
                    ...(hasInstallments
                      ? [{ value: "installment", label: "Installments" }]
                      : []),
                  ]}
                />

                {form.paymentPlan === "installment" && (
                  <div className="space-y-4">
                    <div className="rounded-lg px-4 py-3" style={{ background: "#f7efe0", border: "1px solid #ead9bc" }}>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs" style={{ color: "#8a6d43" }}>Course installment plan</p>
                          <p className="mt-1 text-sm font-medium" style={{ color: "#5b4529" }}>
                            {installmentCount} installments · {installmentSchedule}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-[3.5rem_1fr_1fr] gap-3 text-xs font-medium pb-2" style={{ color: "#8a6d43", borderBottom: "1px solid #ead9bc" }}>
                          <div>Term</div>
                          <div>Due date</div>
                          <div>Amount</div>
                        </div>
                        {editableInstallments.map((term, idx) => (
                          <div key={term.term_number} className="grid grid-cols-[3.5rem_1fr_1fr] gap-3 items-center">
                            <div className="text-sm font-medium" style={{ color: "#5b4529" }}>{term.term_number}</div>
                            <input
                              type="date"
                              required
                              value={term.due_date || ""}
                              onChange={(e) => {
                                const newInst = [...editableInstallments];
                                newInst[idx].due_date = e.target.value;
                                setEditableInstallments(newInst);
                              }}
                              className={INPUT_CLASS}
                              style={{ ...INPUT_STYLE, padding: '6px 8px' }}
                            />
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                              <input
                                type="number"
                                min="0"
                                required
                                value={term.amount === 0 ? "" : term.amount}
                                onChange={(e) => {
                                  const newInst = [...editableInstallments];
                                  newInst[idx].amount = Number(e.target.value) || 0;
                                  setEditableInstallments(newInst);
                                }}
                                className={INPUT_CLASS}
                                style={{ ...INPUT_STYLE, padding: '6px 8px 6px 24px' }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs pt-3 mt-2" style={{ borderTop: "1px dashed #ead9bc" }}>
                          <span style={{ color: editableInstallments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) === courseFee ? "#39533a" : "#7c3324" }}>
                            Total (Must equal {formatCurrency(courseFee)})
                          </span>
                          <span className="font-semibold text-sm" style={{ color: "#5b4529" }}>
                            {formatCurrency(editableInstallments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-5 border-t" style={{ borderColor: "#e3ddd0" }}>
                  <h3 className="text-sm font-medium" style={{ color: "#5b5346" }}>Payment at registration</h3>
                  <ChoiceGroup
                    label="Status"
                    value={registrationPayment.status}
                    onChange={(value) => {
                      setSuccess(""); setError("");
                      setRegistrationPayment(prev => ({ ...prev, status: value }));
                    }}
                    options={[
                      { value: "received", label: "Received" },
                      { value: "not-received", label: "Not received" },
                    ]}
                  />
                  {registrationPayment.status === "received" && (
                    <div className="space-y-4 mt-4">
                      {form.paymentPlan === "installment" && (
                        <label className="block text-sm" style={{ color: "#5b5346" }}>
                          Paying for Term
                          <select
                            value={registrationPayment.term_number}
                            onChange={(e) => setRegistrationPayment(prev => ({ ...prev, term_number: Number(e.target.value) }))}
                            className={INPUT_CLASS}
                            style={INPUT_STYLE}
                          >
                            {editableInstallments.map(term => (
                              <option key={term.term_number} value={term.term_number}>
                                Term {term.term_number} — {formatCurrency(term.amount)} (Due: {formatDate(term.due_date)})
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block text-sm" style={{ color: "#5b5346" }}>
                          Cash Amount
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                            <input type="number" min="0" value={registrationPayment.cash_amount} onChange={(e) => setRegistrationPayment(prev => ({ ...prev, cash_amount: e.target.value }))} className={INPUT_CLASS} style={{ ...INPUT_STYLE, paddingLeft: '28px', marginTop: 0 }} />
                          </div>
                        </label>
                        <label className="block text-sm" style={{ color: "#5b5346" }}>
                          UPI Amount
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                            <input type="number" min="0" value={registrationPayment.upi_amount} onChange={(e) => setRegistrationPayment(prev => ({ ...prev, upi_amount: e.target.value }))} className={INPUT_CLASS} style={{ ...INPUT_STYLE, paddingLeft: '28px', marginTop: 0 }} />
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside className="rounded-lg p-5" style={{ background: "#f7efe0", border: "1px solid #ead9bc" }}>
                <h3 className="text-base" style={{ ...serif, fontWeight: 500 }}>Payment summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt style={{ color: "#7a6b55" }}>Course fee</dt>
                    <dd className="text-right font-medium">{formatCurrency(courseFee)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt style={{ color: "#7a6b55" }}>Plan</dt>
                    <dd className="text-right font-medium">
                      {form.paymentPlan === "full"
                        ? "Full payment"
                        : `${installmentCount} installments · ${installmentSchedule}`}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt style={{ color: "#7a6b55" }}>Payment status</dt>
                    <dd className="text-right font-medium" style={{ color: registrationPayment.status === "received" ? "#39533a" : "#8a571f" }}>
                      {registrationPayment.status === "received" ? "Received" : "Not received"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-t pt-3" style={{ borderColor: "#ead9bc" }}>
                    <dt style={{ color: "#7a6b55" }}>Amount received</dt>
                    <dd className="flex items-center gap-1 text-right text-lg font-semibold" style={{ color: "#7a531f" }}>
                      <IndianRupee className="h-4 w-4" />
                      {formatCurrency(registrationPayment.status === "received" ? (Number(registrationPayment.cash_amount) || 0) + (Number(registrationPayment.upi_amount) || 0) : 0).replace("₹", "")}
                    </dd>
                  </div>
                </dl>
                <button
                  type="submit"
                  disabled={saving || loading || !selectedCourse || courses.length === 0}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#30291f] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
                  style={{ background: "#17140f" }}
                >
                  <UserPlus className="h-4 w-4" style={{ color: "#f4b942" }} />
                  {saving ? "Registering…" : "Register student"}
                </button>
              </aside>
            </section>
          </form>
            </div>
          )}

          {activeTab === "registrations" && (
          <section id="registrations-panel" role="tabpanel" aria-labelledby="registrations-tab">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl" style={{ ...serif, fontWeight: 500 }}>Recent registrations</h2>
                <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                  {admissions.length} admissions from this branch
                </p>
              </div>
            </div>
            {loading ? (
              <div className="rounded-xl px-5 py-12 text-center text-sm" style={{ background: "#ffffff", border: "1px solid #e3ddd0", color: "#8a8175" }}>
                Loading courses and admissions…
              </div>
            ) : admissions.length === 0 ? (
              <div className="rounded-xl px-5 py-12 text-center text-sm" style={{ background: "#ffffff", border: "1px solid #e3ddd0", color: "#8a8175" }}>
                No admissions have been registered for this branch yet.
              </div>
            ) : (
              <div className="space-y-3">
                {admissions.map((admission) => {
                  const payments = Array.isArray(admission.payments) ? admission.payments : [];
                  const latestPayment = payments[payments.length - 1];
                  const totalPaid = Number(admission.total_paid) || 0;
                  const rawStatus = String(admission.status || "").toLowerCase();
                  const paymentStatus = totalPaid > 0
                    ? "Received"
                    : ["not_received", "pending", "unpaid"].includes(rawStatus)
                      ? "Not received"
                      : admission.status || "Unknown";
                  const paymentMethod = latestPayment
                    ? Number(latestPayment.cash_amount) > 0 && Number(latestPayment.upi_amount) > 0
                      ? "Cash + UPI"
                      : Number(latestPayment.cash_amount) > 0
                        ? "Cash"
                        : Number(latestPayment.upi_amount) > 0
                          ? "UPI"
                          : "Payment recorded"
                    : "No payment recorded";

                  return (
                    <article key={admission.enrollment_id} className="rounded-xl p-5 sm:p-6" style={{ background: "#ffffff", border: "1px solid #e3ddd0" }}>
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <h3 className="text-lg font-medium">{admission.name}</h3>
                          <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>{admission.course_title}</p>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "#5b5346" }}>
                            {admission.phone && (
                              <a className="flex items-center gap-1.5 hover:underline" href={`tel:${admission.phone.replaceAll(" ", "")}`}>
                                <Phone className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} /> {admission.phone}
                              </a>
                            )}
                            {admission.email && (
                              <a className="flex items-center gap-1.5 hover:underline" href={`mailto:${admission.email}`}>
                                <Mail className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} /> {admission.email}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              background: paymentStatus === "Received" ? "#eef2ea" : "#f7efe0",
                              color: paymentStatus === "Received" ? "#39533a" : "#7a531f",
                            }}
                          >
                            {paymentStatus}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                               const payments = Array.isArray(admission.payments) ? admission.payments : [];
                               const maxInst = payments.length > 0 ? Math.max(...payments.map(p => Number(p.installment_number) || 1)) : 0;
                               const nextInstNum = maxInst + 1;
                               let nextInstAmt = Number(admission.balance_amount) || 0;
                               if (admission.installment_terms && Array.isArray(admission.installment_terms)) {
                                 const term = admission.installment_terms.find(t => t.term_number === nextInstNum);
                                 if (term) nextInstAmt = Number(term.amount);
                               }
                               setPaymentForm({
                                 cash_amount: nextInstAmt,
                                 upi_amount: 0,
                                 installment_number: nextInstNum,
                                 payment_date: new Date().toISOString().slice(0, 10)
                               });
                               setSelectedAdmissionForPayment(admission);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#e3ddd0] ${FOCUS_RING}`}
                            style={{ background: "#f1ede4", color: "#7a531f" }}
                          >
                            + Add Payment
                          </button>
                        </div>
                      </div>
                      <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3 lg:grid-cols-6" style={{ borderColor: "#efe9dd" }}>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Course fee</dt>
                          <dd className="mt-1 text-sm font-medium">{formatCurrency(admission.total_fee)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Paid</dt>
                          <dd className="mt-1 text-sm font-medium">{formatCurrency(totalPaid)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Balance</dt>
                          <dd className="mt-1 text-sm font-medium">{formatCurrency(admission.balance_amount)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Payment plan</dt>
                          <dd className="mt-1 text-sm font-medium">
                            {Number(admission.installment_count) > 1
                              ? `${admission.installment_count} installments${admission.installment_schedule ? ` · ${admission.installment_schedule}` : ""}`
                              : "Full payment"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Latest payment</dt>
                          <dd className="mt-1 text-sm font-medium">
                            {latestPayment ? `${paymentMethod} · ${formatCurrency(latestPayment.amount)}` : paymentMethod}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "#a39a8c" }}>Admission date</dt>
                          <dd className="mt-1 text-sm font-medium">{formatDate(admission.admission_date)}</dd>
                        </div>
                      </dl>

                      <div className="mt-5 grid gap-5 border-t pt-4 lg:grid-cols-[minmax(180px,1fr)_2fr]" style={{ borderColor: "#efe9dd" }}>
                        <section>
                          <h4 className="text-xs font-medium" style={{ color: "#a39a8c" }}>Parent / guardian</h4>
                          <p className="mt-1 text-sm font-medium">{admission.parent_name || "Not provided"}</p>
                          {admission.parent_phone ? (
                            <a
                              className="mt-1 inline-flex items-center gap-1.5 text-sm hover:underline"
                              style={{ color: "#5b5346" }}
                              href={`tel:${admission.parent_phone.replaceAll(" ", "")}`}
                            >
                              <Phone className="h-3.5 w-3.5" style={{ color: "#9c6b2e" }} />
                              {admission.parent_phone}
                            </a>
                          ) : (
                            <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>Phone not provided</p>
                          )}
                        </section>

                        <section className="min-w-0">
                          <h4 className="text-xs font-medium" style={{ color: "#a39a8c" }}>
                            Payment details ({payments.length})
                          </h4>
                          {payments.length === 0 ? (
                            <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>No payment entries returned.</p>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {payments.map((payment, index) => (
                                <div
                                  key={payment.id || `${admission.enrollment_id}-${index}`}
                                  className="grid gap-2 rounded-lg px-3 py-2 sm:grid-cols-2 lg:grid-cols-4"
                                  style={{ background: "#faf8f4", border: "1px solid #efe9dd" }}
                                >
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Installment</p>
                                    <p className="mt-0.5 text-sm font-medium">
                                      {payment.installment_number || "Full payment"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Date</p>
                                    <p className="mt-0.5 text-sm font-medium">{formatDate(payment.payment_date)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Cash / UPI</p>
                                    <p className="mt-0.5 text-sm font-medium">
                                      {formatCurrency(payment.cash_amount)} / {formatCurrency(payment.upi_amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs" style={{ color: "#a39a8c" }}>Total · status</p>
                                    <p className="mt-0.5 text-sm font-medium">
                                      {formatCurrency(payment.amount)} · {payment.status || "Unknown"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          )}
        </div>
      </main>

      {selectedAdmissionForPayment && (() => {
        const admission = selectedAdmissionForPayment;
        // Use the installments array from BranchAdmissionResponse which has all pre-computed fields
        const installments = Array.isArray(admission.installments) ? admission.installments : [];
        const payments = admission.payments || [];
        
        const totalFee = Number(admission.total_fee) || 0;
        const totalPaid = Number(admission.total_paid) || 0;
        const balance = Number(admission.balance_amount) || 0;
        const isFullyPaid = balance <= 0;
        
        const totalInstallments = Number(admission.installment_count) || 1;
        
        // Build termDetails directly from the API's installments array
        const termDetails = installments.map(inst => {
          const paidAmount = Number(inst.paid_amount) || 0;
          const isTermPaid = String(inst.status).toLowerCase() === "paid" || paidAmount >= Number(inst.amount);
          const pCash = Number(inst.cash_amount) || 0;
          const pUpi = Number(inst.upi_amount) || 0;
          let paymentMethod = "No payment recorded";
          if (pCash > 0 && pUpi > 0) paymentMethod = `Cash: ${formatCurrency(pCash)} + UPI: ${formatCurrency(pUpi)}`;
          else if (pCash > 0) paymentMethod = `Cash: ${formatCurrency(pCash)}`;
          else if (pUpi > 0) paymentMethod = `UPI: ${formatCurrency(pUpi)}`;
          else if (paidAmount > 0) paymentMethod = "Recorded";
          return {
            term_number: inst.installment_number,
            amount: Number(inst.amount),
            paidAmount,
            remaining: Number(inst.remaining_amount),
            dueDate: inst.due_date,
            paidDate: inst.paid_date || null,
            paymentMethod,
            isPaid: isTermPaid,
            isDue: inst.is_due,
          };
        });

        // If installments array is empty (full payment plan), synthesize one row
        if (termDetails.length === 0 && totalInstallments <= 1) {
          termDetails.push({
            term_number: 1,
            amount: totalFee,
            paidAmount: totalPaid,
            remaining: balance,
            dueDate: null,
            paidDate: payments[0]?.payment_date || null,
            paymentMethod: (() => {
              const p = payments[0];
              if (!p) return "No payment recorded";
              const pCash = Number(p.cash_amount) || 0;
              const pUpi = Number(p.upi_amount) || 0;
              if (pCash > 0 && pUpi > 0) return `Cash: ${formatCurrency(pCash)} + UPI: ${formatCurrency(pUpi)}`;
              if (pCash > 0) return `Cash: ${formatCurrency(pCash)}`;
              if (pUpi > 0) return `UPI: ${formatCurrency(pUpi)}`;
              return "Recorded";
            })(),
            isPaid: balance <= 0,
            isDue: false,
          });
        }

        const paidCount = Number(admission.terms_paid) || termDetails.filter(t => t.isPaid).length;
        const dueCount = Number(admission.due_installment_count) || termDetails.filter(t => t.isDue).length;
        const remainingCount = totalInstallments - paidCount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm ba-fade overflow-y-auto">
            <div className="w-full max-w-5xl rounded-2xl shadow-xl ba-rise bg-white my-8 flex flex-col md:flex-row overflow-hidden" style={{ border: "1px solid #e3ddd0", maxHeight: "90vh" }}>
              {/* Left Panel: Details (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ background: "#fdfcf9" }}>
                <h2 className="text-xl mb-6" style={{ ...serif, fontWeight: 500, color: "#17140f" }}>Payment Details</h2>
                
                {/* Payment Summary */}
                <section className="mb-8">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#5b5346" }}>
                    <IndianRupee className="h-4 w-4" /> Payment Summary
                  </h3>
                  <div className="rounded-xl p-5 flex flex-wrap gap-6 justify-between" style={{ background: "#f7efe0", border: "1px solid #ead9bc" }}>
                    <div>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Total Fee</p>
                      <p className="text-xl font-medium mt-1" style={{ color: "#17140f" }}>{formatCurrency(totalFee)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Total Paid</p>
                      <p className="text-xl font-medium mt-1" style={{ color: "#39533a" }}>{formatCurrency(totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Balance</p>
                      <p className="text-xl font-medium mt-1" style={{ color: "#7c3324" }}>{formatCurrency(balance)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-sm">
                    <span style={{ color: "#a39a8c" }}>Payment Status</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: isFullyPaid ? "#eef2ea" : "#f7efe0", color: isFullyPaid ? "#39533a" : "#7a531f" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: isFullyPaid ? "#39533a" : "#7a531f" }}></span>
                      {isFullyPaid ? "Completed" : "Pending"}
                    </span>
                  </div>
                </section>

                {/* Installment Summary */}
                <section className="mb-8">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#5b5346" }}>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">i</span> Installment Summary
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Total Installments</p>
                      <p className="text-lg font-medium mt-1" style={{ color: "#17140f" }}>{totalInstallments}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Paid</p>
                      <p className="text-lg font-medium mt-1" style={{ color: "#39533a" }}>{paidCount}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Remaining</p>
                      <p className="text-lg font-medium mt-1" style={{ color: "#7a531f" }}>{remainingCount}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                      <p className="text-xs" style={{ color: "#a39a8c" }}>Due</p>
                      <p className="text-lg font-medium mt-1" style={{ color: dueCount > 0 ? "#7c3324" : "#17140f" }}>{dueCount}</p>
                    </div>
                  </div>
                </section>

                {/* Installment Details */}
                <section>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "#5b5346" }}>
                    <IndianRupee className="h-4 w-4" /> Installment Details
                  </h3>
                  <div className="space-y-4">
                    {termDetails.map(term => (
                      <div key={term.term_number} className="rounded-xl p-5" style={{ border: "1px solid #ead9bc", background: "#ffffff" }}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#8a6d43" }}>INSTALLMENT {term.term_number}</h4>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: term.isPaid ? "#eef2ea" : "#f7efe0", color: term.isPaid ? "#39533a" : "#7a531f" }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: term.isPaid ? "#39533a" : "#7a531f" }}></span>
                            {term.isPaid ? "Paid" : "Pending"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Amount</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatCurrency(term.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Paid Amount</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatCurrency(term.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Remaining</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatCurrency(term.remaining)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Due Date</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{formatDate(term.dueDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Paid Date</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{term.paidDate ? formatDate(term.paidDate) : "Not yet paid"}</p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: "#a39a8c" }}>Payment Method</p>
                            <p className="font-medium mt-0.5" style={{ color: "#17140f" }}>{term.paymentMethod}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Panel: Add Payment Form */}
              <div className="w-full md:w-[360px] flex flex-col" style={{ borderLeft: "1px solid #e3ddd0", background: "#ffffff" }}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (paymentForm.cash_amount <= 0 && paymentForm.upi_amount <= 0) {
                       setPaymentError("Please enter a valid amount.");
                       return;
                    }
                    setPaymentLoading(true);
                    setPaymentError("");
                    try {
                      await addBranchAdmissionPaymentApi(
                        selectedAdmissionForPayment.enrollment_id,
                        {
                          installment_number: Number(paymentForm.installment_number),
                          cash_amount: Number(paymentForm.cash_amount),
                          upi_amount: Number(paymentForm.upi_amount),
                          payment_date: paymentForm.payment_date,
                        },
                        token
                      );
                      const updatedAdmissions = await getBranchAdmissionsApi(token);
                      setAdmissions(Array.isArray(updatedAdmissions) ? updatedAdmissions : []);
                      setSuccess(`Payment added.`);
                      setSelectedAdmissionForPayment(null);
                    } catch (err) {
                      setPaymentError(err.message || "Failed to add payment.");
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                  className="flex-1 flex flex-col"
                >
                  <div className="px-6 py-6" style={{ borderBottom: "1px solid #efe9dd" }}>
                    <h3 className="text-lg" style={{ ...serif, fontWeight: 500 }}>Add Payment</h3>
                    <p className="text-sm mt-1" style={{ color: "#8a8175" }}>Record a new payment</p>
                  </div>
                  
                  <div className="p-6 flex-1 space-y-4 overflow-y-auto">
                    {paymentError && (
                      <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "#f8eae5", color: "#7c3324", border: "1px solid #eccec4" }}>
                        {paymentError}
                      </div>
                    )}
                    <label className="block text-sm" style={{ color: "#5b5346" }}>
                      Cash Amount
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                        <input type="number" min="0" value={paymentForm.cash_amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, cash_amount: e.target.value }))} className={INPUT_CLASS} style={{ ...INPUT_STYLE, paddingLeft: '28px' }} />
                      </div>
                    </label>
                    <label className="block text-sm" style={{ color: "#5b5346" }}>
                      UPI Amount
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#8a8175" }}>₹</span>
                        <input type="number" min="0" value={paymentForm.upi_amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, upi_amount: e.target.value }))} className={INPUT_CLASS} style={{ ...INPUT_STYLE, paddingLeft: '28px' }} />
                      </div>
                    </label>
                    <label className="block text-sm" style={{ color: "#5b5346" }}>
                      Payment Date
                      <input required type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))} className={INPUT_CLASS} style={{ ...INPUT_STYLE, marginTop: '4px' }} />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 px-6 py-5" style={{ background: "#faf8f4", borderTop: "1px solid #efe9dd" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedAdmissionForPayment(null)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#e3ddd0] transition-colors ${FOCUS_RING}`}
                      style={{ color: "#5b5346" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-[#30291f] disabled:opacity-60 transition-colors ${FOCUS_RING}`}
                      style={{ background: "#17140f" }}
                    >
                      {paymentLoading ? "Saving..." : "Save Payment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default BranchAdminStudentRegistration;