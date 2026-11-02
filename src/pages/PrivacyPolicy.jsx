import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  CreditCard,
  Building2,
  Mail,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-[#FAF8F4] min-h-screen font-['Inter',sans-serif] text-slate-800">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');
        .pp-serif { font-family: 'Fraunces', serif; }
      `}</style>

      {/* 1. Header Banner */}
      <section className="relative overflow-hidden bg-white border-b border-[#E3DDD0] pt-8 sm:pt-14 lg:pt-16 pb-10 sm:pb-14 lg:pb-16">
        {/* Soft background ambient gradient glows */}
        <div className="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 w-72 h-72 rounded-full bg-[#FAF8F4] blur-2xl" />

        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top navigation & badge row: cleanly separated on all screen sizes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#9C6B2E] hover:text-[#855923] transition-colors group px-3.5 py-2 rounded-xl bg-[#FAF8F4] hover:bg-[#F1EDE4] border border-[#E3DDD0] shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Home</span>
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 self-start sm:self-auto shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Legal & Privacy Compliance</span>
            </div>
          </div>

          {/* Main Title & Lead Text */}
          <div className="max-w-3xl">
            <h1 className="pp-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#17140F] tracking-tight leading-[1.15]">
              Privacy Policy
            </h1>

            <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
              This Privacy Policy explains how AurumFX Academy collects, uses, protects, and discloses personal information when you use our website, student portal, and educational services across all campus locations.
            </p>
          </div>

          {/* Metadata pill row */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium pt-5 border-t border-[#E3DDD0]">
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active Policy
            </span>
            <span>•</span>
            <span>Last Updated: November 2026</span>
            <span>•</span>
            <span>Effective for all AurumFX Academy campuses & portals</span>
          </div>
        </div>
      </section>

      {/* 2. Main Content Body: fully responsive container */}
      <main className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 space-y-8 sm:space-y-10">

        {/* Commitment Highlight Box */}
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 p-5 sm:p-7 lg:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <div className="h-11 w-11 rounded-2xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-[#17140F]">
                Our Privacy Commitment to Students & Families
              </h2>
              <p>
                AurumFX Academy is committed to maintaining the highest level of confidentiality, integrity, and security for the personal and academic records of all our students, faculty, and website visitors. We comply with applicable Indian information technology and digital personal data protection principles.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1 */}
        <section className="bg-white rounded-3xl border border-[#E3DDD0] p-5 sm:p-7 lg:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#9C6B2E]">
            <FileText className="h-5 w-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#17140F]">
              1. Information We Collect
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            When you register for courses, request admission enquiries, submit assignments, or use our digital portals, we may collect the following categories of information:
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Personal Identification Data:</strong> Full name, email address, phone number, date of birth, gender, and residential address.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Parent & Guardian Information:</strong> Parent/guardian name, relationship, and emergency contact numbers.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Academic & Enrollment Details:</strong> Selected program, branch campus, qualification records, assignment submissions, marks, and certificates.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>KYC & Verification Documents:</strong> Government photo ID (such as Aadhaar card, PAN, or voter ID) required strictly for student identity validation.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Technical Usage Data:</strong> IP address, device browser type, login timestamps, and session identifiers to safeguard student portal accounts.</span>
            </li>
          </ul>
        </section>

        {/* SECTION 2 */}
        <section className="bg-white rounded-3xl border border-[#E3DDD0] p-5 sm:p-7 lg:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#9C6B2E]">
            <Eye className="h-5 w-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#17140F]">
              2. How We Use Your Information
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We use the collected information strictly for academic, administrative, and operational educational objectives, including:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80">
              <h3 className="text-xs sm:text-sm font-bold text-[#17140F] mb-1">Academic Administration</h3>
              <p className="text-xs text-slate-600">Processing admissions, verifying course eligibility, issuing student enrollment IDs, and assigning branch batches.</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80">
              <h3 className="text-xs sm:text-sm font-bold text-[#17140F] mb-1">Course Delivery & Evaluation</h3>
              <p className="text-xs text-slate-600">Providing lecture study materials, reviewing homework submissions, conducting faculty evaluations, and awarding certificates.</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80">
              <h3 className="text-xs sm:text-sm font-bold text-[#17140F] mb-1">Fee & Receipt Accounting</h3>
              <p className="text-xs text-slate-600">Managing tuition plans, installments, payment verification, and automated digital tax receipt generation.</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80">
              <h3 className="text-xs sm:text-sm font-bold text-[#17140F] mb-1">Communications & Bulletins</h3>
              <p className="text-xs text-slate-600">Sending urgent campus announcements, faculty circulars, exam notifications, and installment reminders.</p>
            </div>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="bg-white rounded-3xl border border-[#E3DDD0] p-5 sm:p-7 lg:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#9C6B2E]">
            <CreditCard className="h-5 w-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#17140F]">
              3. Payment Security & Financial Details
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            AurumFX Academy does <strong>not</strong> collect or store credit card numbers, debit card PINs, CVVs, or online banking passwords on our academy servers.
          </p>
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 sm:p-5 text-xs sm:text-sm text-emerald-900 leading-relaxed flex items-start gap-3.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">PCI-DSS Certified Gateway Processing:</span> All digital transactions, installment fees, and application payments are handled directly by industry-standard PCI-DSS compliant third-party payment gateways (such as Razorpay). We retain only transaction references, amounts paid, and timestamp receipts for accounting audit requirements.
            </div>
          </div>
        </section>

        {/* SECTION 4 */}
        <section className="bg-white rounded-3xl border border-[#E3DDD0] p-5 sm:p-7 lg:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#9C6B2E]">
            <Building2 className="h-5 w-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#17140F]">
              4. Data Sharing & Third Parties
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We do not sell, rent, or trade your personal information to third parties for marketing or advertising purposes. Information is only shared under the following conditions:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Authorized Campus Leadership:</strong> Branch administrators and designated faculty instructors access records necessary to facilitate your enrolled program.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Placement & Hiring Partners:</strong> For career assistance programs, student resumes and verified credentials are forwarded only upon explicit student consent.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Legal Requirements:</strong> Disclosures made when strictly required by applicable law, regulatory authority, or court order.</span>
            </li>
          </ul>
        </section>

        {/* SECTION 5 */}
        <section className="bg-white rounded-3xl border border-[#E3DDD0] p-5 sm:p-7 lg:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#9C6B2E]">
            <UserCheck className="h-5 w-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#17140F]">
              5. Student Rights & Control Over Data
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every enrolled student and registered applicant has the right to:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm text-slate-700">
            <div className="p-4 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4]">
              <strong>Review & Access:</strong> View all your enrolled courses, uploaded submissions, receipts, and grades directly in the Student Portal.
            </div>
            <div className="p-4 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4]">
              <strong>Profile Correction:</strong> Request updates to inaccurate phone numbers, address, or guardian contact info via your branch administrator.
            </div>
            <div className="p-4 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4]">
              <strong>Account Deactivation:</strong> Request termination of portal access upon completing all coursework and settlement of institutional dues.
            </div>
            <div className="p-4 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4]">
              <strong>Grievance Redressal:</strong> Submit enquiries or concerns regarding data handling directly to our administrative team.
            </div>
          </div>
        </section>

        {/* SECTION 6 */}
        <section className="bg-white rounded-3xl border border-[#E3DDD0] p-5 sm:p-7 lg:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#9C6B2E]">
            <Mail className="h-5 w-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#17140F]">
              6. Contact & Grievance Officer
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            If you have any questions, feedback, or concerns regarding this Privacy Policy or your personal data handling at AurumFX Academy, please contact our administrative office:
          </p>
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0] text-xs sm:text-sm text-slate-800 space-y-2">
            <p className="font-bold text-[#17140F]">AurumFX Academy Grievance & Compliance Cell</p>
            <p>Email: <a href="mailto:privacy@aurumfx.com" className="text-[#9C6B2E] font-semibold underline">privacy@aurumfx.com</a></p>
            <p>Website Support: <Link to="/contact" className="text-[#9C6B2E] font-semibold underline">Contact Us Form</Link></p>
            <p className="text-slate-500 text-xs mt-2">Hours of Operation: Monday to Saturday, 9:00 AM – 6:00 PM IST</p>
          </div>
        </section>

      </main>
    </div>
  );
};

export default PrivacyPolicy;
