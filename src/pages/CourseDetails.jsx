import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  BarChart,
  ArrowLeft,
  Send,
  AlertCircle,
  Loader2,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Award,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Check,
  Lock,
} from 'lucide-react';
import Button from '../components/common/Button';
import CurriculumAccordion from '../components/courses/CurriculumAccordion';
import CourseCard from '../components/courses/CourseCard';
import { getCourseByIdApi, getAllCoursesApi, getCourseImageUrl } from '../services/courses';
import { createPaymentOrderApi, loadRazorpayScript, verifyPaymentApi } from '../services/payments';
import { getPublicBranchesWithCoursesApi } from '../services/branches';
import { useAuth } from '../context/AuthContext';
import PaymentSuccessReceiptModal from '../components/common/PaymentSuccessReceiptModal';

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };

/* ── Enhanced Student Portal Course Detail View ── */
const StudentCourseDetailView = ({
  course,
  title,
  shortDesc,
  fullDesc,
  priceDisplay,
  category,
  duration,
  level,
  imageUrl,
  coursePath,
  paymentType,
  setPaymentType,
  selectedInstallment,
  setSelectedInstallment,
  handleApplyClick,
  paymentLoading,
  paymentMessage,
  paymentError,
  relatedCourses,
  onOpenApplyModal,
  showReceiptModal,
  setShowReceiptModal,
  successReceipt,
  token,
  navigate,
}) => {
  let parsedCurriculum = course?.curriculum || [];
  if (typeof parsedCurriculum === 'string') {
    try {
      parsedCurriculum = JSON.parse(parsedCurriculum);
    } catch {
      parsedCurriculum = [];
    }
  }
  if (!Array.isArray(parsedCurriculum)) {
    parsedCurriculum = [];
  }

  const totalTopics = useMemo(() => {
    return parsedCurriculum.reduce(
      (acc, mod) => acc + (Array.isArray(mod.topics) ? mod.topics.length : 0),
      0
    );
  }, [parsedCurriculum]);

  const hasInstallments = Boolean(course?.installment_count && course.installment_count > 1);

  return (
    <div className="w-full pb-14 space-y-8 font-['Plus_Jakarta_Sans',sans-serif] opacity-0 animate-[studentCourseOpen_0.4s_ease-out_forwards]">
      <style>{`
        @keyframes studentCourseOpen {
          0% { opacity: 0; transform: translateY(12px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* 1. Header Navigation Bar & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={coursePath}
          className="group inline-flex items-center gap-2 rounded-xl bg-white border border-[#E3DDD0] px-4 py-2 text-xs font-bold text-[#5B5346] shadow-2xs transition-all hover:bg-[#F1EDE4] hover:text-[#17140F] hover:border-[#9C6B2E]/40"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-[#9C6B2E]" />
          <span>Back to All Courses</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#8A8175]">
          <span>Student Catalog</span>
          <span>/</span>
          <span className="text-[#9C6B2E]">{category}</span>
          <span>/</span>
          <span className="text-[#17140F] font-bold max-w-[220px] truncate">{title}</span>
        </div>
      </div>

      {/* 2. Hero Showcase Banner Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF6EE] via-[#FDFBF7] to-[#F5ECE0] border border-[#ECDDC6] shadow-sm p-6 sm:p-8 lg:p-10">
        {/* Ambient warm glow in background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-bl from-[#F4B942]/20 via-[#9C6B2E]/10 to-transparent pointer-events-none blur-2xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <div className="space-y-4 lg:col-span-7 xl:col-span-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
                <BookOpen className="h-3.5 w-3.5 text-[#9C6B2E]" />
                <span>{category}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Aurum FX Certified</span>
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-[#17140F] leading-[1.18]"
              style={serif}
            >
              {title}
            </h1>

            <p className="text-sm sm:text-base text-[#5B5346] leading-relaxed max-w-2xl font-normal">
              {shortDesc}
            </p>

            {/* Quick Spec Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-[#ECDDC6] px-3.5 py-2 text-xs font-bold text-[#17140F] shadow-2xs">
                <Clock className="h-4 w-4 text-[#9C6B2E]" />
                <span>Duration: <span className="font-normal text-[#5B5346]">{duration}</span></span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-[#ECDDC6] px-3.5 py-2 text-xs font-bold text-[#17140F] shadow-2xs">
                <BarChart className="h-4 w-4 text-[#9C6B2E]" />
                <span>Level: <span className="font-normal text-[#5B5346]">{level}</span></span>
              </div>
              {parsedCurriculum.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-[#ECDDC6] px-3.5 py-2 text-xs font-bold text-[#17140F] shadow-2xs">
                  <Layers className="h-4 w-4 text-[#9C6B2E]" />
                  <span>Modules: <span className="font-normal text-[#5B5346]">{parsedCurriculum.length} Sections</span></span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-[#ECDDC6] px-3.5 py-2 text-xs font-bold text-[#17140F] shadow-2xs">
                <Award className="h-4 w-4 text-[#9C6B2E]" />
                <span>Certificate: <span className="font-normal text-[#5B5346]">Included</span></span>
              </div>
            </div>
          </div>

          {/* Right Visual Image Card */}
          <div className="lg:col-span-5 xl:col-span-4 flex justify-center">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white border-2 border-white shadow-xl shadow-[#9C6B2E]/10 relative group">
              <div className="aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-[#FAF8F4]">
                <img
                  src={imageUrl}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
              <div className="p-3 bg-white/95 backdrop-blur-xs border-t border-[#F1EDE4] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#9C6B2E]">
                  Official Academy Program
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  Enrolling Now
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Two-Column Workspace (Left: Details Cards / Right: Sticky Enrollment Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Course details cards */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Course Overview & Objectives */}
          <div className="rounded-3xl bg-white border border-[#E3DDD0] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF8F4] border border-[#ECDDC6] text-[#9C6B2E]">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                  Program Overview
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight" style={serif}>
                  Course Overview & Objectives
                </h2>
              </div>
            </div>

            <p className="text-sm sm:text-base font-normal leading-relaxed text-[#5B5346] mt-4">
              {fullDesc}
            </p>

            {/* 4 Program Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 pt-6 border-t border-[#F1EDE4]">
              <div className="flex items-start gap-3 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#ECD8B5] text-[#9C6B2E] shadow-2xs">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17140F]">Industry-Standard Syllabus</h4>
                  <p className="text-[11px] text-[#8A8175] mt-0.5 leading-relaxed">
                    Curated by domain specialists with up-to-date real-world tools and workflows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#ECD8B5] text-[#9C6B2E] shadow-2xs">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17140F]">Assignments & Evaluation</h4>
                  <p className="text-[11px] text-[#8A8175] mt-0.5 leading-relaxed">
                    Hands-on practical tasks submitted directly to faculty for personalized grading.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#ECD8B5] text-[#9C6B2E] shadow-2xs">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17140F]">Accredited Certification</h4>
                  <p className="text-[11px] text-[#8A8175] mt-0.5 leading-relaxed">
                    Receive a verifiable course completion certificate backed by Aurum FX Academy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0]/80 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#ECD8B5] text-[#9C6B2E] shadow-2xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#17140F]">Faculty Mentorship</h4>
                  <p className="text-[11px] text-[#8A8175] mt-0.5 leading-relaxed">
                    Communicate with branch instructors through direct student-faculty message channels.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Key Skills Acquired (if skills array exists) */}
          {Array.isArray(course?.skills) && course.skills.length > 0 && (
            <div className="rounded-3xl bg-white border border-[#E3DDD0] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF8F4] border border-[#ECDDC6] text-[#9C6B2E]">
                  <Award className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                    Core Competencies
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight" style={serif}>
                    Key Skills You Will Acquire
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-2">
                {course.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] p-3 text-xs font-semibold text-[#17140F] hover:border-[#9C6B2E]/40 transition"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F1EDE4] text-[#9C6B2E] font-bold text-xs">
                      ✓
                    </div>
                    <span className="truncate">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 3: Detailed Curriculum Accordion */}
          {parsedCurriculum.length > 0 && (
            <div className="rounded-3xl bg-white border border-[#E3DDD0] p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F1EDE4]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF8F4] border border-[#ECDDC6] text-[#9C6B2E]">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                      Syllabus Architecture
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight" style={serif}>
                      Detailed Course Curriculum
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#8A8175]">
                  <span className="rounded-full bg-[#FAF8F4] border border-[#E3DDD0] px-3 py-1 text-[#9C6B2E] font-bold">
                    {parsedCurriculum.length} Modules
                  </span>
                  {totalTopics > 0 && (
                    <span className="rounded-full bg-[#FAF8F4] border border-[#E3DDD0] px-3 py-1 text-[#5B5346]">
                      {totalTopics} Topics
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#8A8175] mb-5">
                Click on any module below to inspect the topics, lessons, and practical exercises included.
              </p>

              <CurriculumAccordion curriculum={parsedCurriculum} studentView={true} />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Premium Enrollment Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 rounded-3xl border border-[#ECD8B5] bg-gradient-to-b from-white via-[#FAF8F4] to-[#FAF6EE] p-6 sm:p-7 shadow-lg shadow-[#9C6B2E]/10 space-y-6">
            {/* Top Enrollment Header Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-[#ECDDC6]">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9C6B2E] uppercase tracking-wider">
                <GraduationCap className="h-4 w-4 text-[#9C6B2E]" />
                <span>Program Enrollment</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Branch
              </span>
            </div>

            {/* Price Display */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8175]">
                Total Program Fee
              </span>
              <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#17140F] tracking-tight">
                  {priceDisplay}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Includes GST
                </span>
              </div>
            </div>

            {/* Quick Specs Overview */}
            <div className="space-y-2.5 py-3 border-y border-[#ECDDC6] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8A8175] flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  <span>Program Duration:</span>
                </span>
                <span className="font-bold text-[#17140F]">{duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8175] flex items-center gap-1.5 font-medium">
                  <BarChart className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  <span>Target Level:</span>
                </span>
                <span className="font-bold text-[#17140F]">{level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8175] flex items-center gap-1.5 font-medium">
                  <Award className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  <span>Certification:</span>
                </span>
                <span className="font-bold text-[#17140F]">Verifiable Credential</span>
              </div>
            </div>

            {/* Payment Plan Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#17140F] mb-2">
                Payment Plan
              </label>

              {hasInstallments ? (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-center border transition-all ${
                      paymentType === 'full'
                        ? 'bg-[#17140F] text-[#F4B942] border-[#17140F] shadow-xs'
                        : 'bg-white text-[#5B5346] border-[#E3DDD0] hover:bg-[#FAF8F4]'
                    }`}
                  >
                    Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('installment')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-center border transition-all ${
                      paymentType === 'installment'
                        ? 'bg-[#17140F] text-[#F4B942] border-[#17140F] shadow-xs'
                        : 'bg-white text-[#5B5346] border-[#E3DDD0] hover:bg-[#FAF8F4]'
                    }`}
                  >
                    Installments
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E3DDD0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#17140F] mb-3 flex items-center justify-between">
                  <span>Full Course Payment</span>
                  <span className="font-bold text-[#9C6B2E]">{priceDisplay}</span>
                </div>
              )}

              {/* Installments Breakdown Card */}
              {paymentType === 'installment' && hasInstallments && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-white border border-[#ECD8B5] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#F1EDE4]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                      Select Installment Term
                    </span>
                    {course.installment_schedule && (
                      <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#9C6B2E] bg-[#F1EDE4]">
                        {course.installment_schedule}
                      </span>
                    )}
                  </div>

                  {Array.isArray(course.installment_terms) && course.installment_terms.length > 0 ? (
                    <div className="space-y-2">
                      {course.installment_terms.map((term, index) => {
                        const isSelected = selectedInstallment === term.term_number;
                        return (
                          <label
                            key={index}
                            className={`flex justify-between items-center text-xs p-2.5 rounded-xl cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-[#FAF6EE] border-[#9C6B2E] shadow-2xs ring-1 ring-[#9C6B2E]/30'
                                : 'bg-[#FAF8F4] border-[#E3DDD0] hover:border-[#9C6B2E]/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="studentInstallmentTerm"
                                value={term.term_number}
                                checked={isSelected}
                                onChange={() => setSelectedInstallment(term.term_number)}
                                className="text-[#9C6B2E] focus:ring-[#9C6B2E] h-4 w-4"
                              />
                              <span className="font-bold text-[#17140F]">
                                Installment {term.term_number}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-extrabold text-[#17140F]">₹{term.amount}</div>
                              {term.due_date && (
                                <div className="text-[10px] text-[#9C6B2E] font-medium">
                                  Due: {new Date(term.due_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-[#5B5346] py-1">
                      {course.installment_count} installments of approx. ₹
                      {Math.round((course.price || course.fee || 0) / course.installment_count)} each
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CTA Enroll Button */}
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={paymentLoading}
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#9C6B2E] to-[#B37E38] hover:from-[#855923] hover:to-[#9C6B2E] py-4 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-[#9C6B2E]/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-75 disabled:pointer-events-none"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-white" />
                  <span>Pay & Enroll</span>
                </>
              )}
            </button>

            {/* Notification messages */}
            {paymentMessage && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-center text-xs font-semibold text-emerald-800">
                {paymentMessage}
              </p>
            )}
            {paymentError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-center text-xs font-semibold text-rose-800">
                {paymentError}
              </p>
            )}

            {/* Value checklist */}
            <div className="space-y-2 pt-2 text-xs font-semibold text-[#5B5346]">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Instant curriculum & materials access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Direct student-faculty message access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Verified digital credential upon graduation</span>
              </div>
            </div>

            {/* Trust Footer */}
            <div className="pt-2 border-t border-[#ECDDC6] flex items-center justify-center gap-2 text-[11px] text-[#8A8175]">
              <Lock className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>256-bit SSL encrypted checkout via Razorpay</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Related Recommended Courses */}
      {relatedCourses.length > 0 && (
        <section className="mt-12 pt-10 border-t border-[#E3DDD0]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF8F4] border border-[#ECDDC6] text-[#9C6B2E]">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9C6B2E]">
                  Related Programs
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#17140F] tracking-tight" style={serif}>
                  Explore Other Recommended Courses
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedCourses.map((rCourse) => (
              <CourseCard
                key={rCourse.id}
                course={rCourse}
                onApply={onOpenApplyModal}
                linkPrefix={coursePath}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Payment Success Receipt Modal */}
      <PaymentSuccessReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          navigate('/student-dashboard');
        }}
        receipt={successReceipt}
        receiptUrl={successReceipt?.receipt_url}
        downloadUrl={successReceipt?.download_url}
        token={token}
        title="Congratulations! Your course has been purchased"
        subtitle="Your enrollment has been successfully confirmed. Below is your official fee payment receipt."
        onViewReceipt={(rcpt, url) => {
          if (url) window.open(url, '_blank');
          else navigate('/student-dashboard/receipts');
        }}
      />
    </div>
  );
};

const CourseDetails = ({ onOpenApplyModal, studentView = false }) => {
  const { courseId } = useParams();
  const { isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentType, setPaymentType] = useState('full');
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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
    if (studentView) {
      return (
        <div className="py-20 px-4 text-center min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#FAF8F4] border border-[#ECDDC6] flex items-center justify-center shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-[#9C6B2E]" />
          </div>
          <p className="text-sm font-bold text-[#17140F]">Loading course program...</p>
          <p className="text-xs text-[#8A8175]">Retrieving curriculum and branch details</p>
        </div>
      );
    }
    return (
      <div className="py-24 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm font-bold text-slate-600">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    if (studentView) {
      return (
        <div className="py-16 px-4 text-center min-h-[50vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F4] border border-[#ECDDC6] text-[#9C6B2E] flex items-center justify-center mb-4 shadow-xs">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#17140F]">Course Not Found</h2>
          <p className="mt-2 text-[#5B5346] text-xs sm:text-sm max-w-md">
            The course you are looking for is currently unavailable or may have been updated.
          </p>
          <Link
            to="/student-dashboard/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#9C6B2E] hover:bg-[#855923] text-white px-5 py-2.5 text-xs font-bold shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
        </div>
      );
    }
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
            const verifyRes = await verifyPaymentApi({
              enrollment_id: order.enrollment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }, token);
            setPaymentMessage('Payment successful! Your course enrollment is confirmed.');

            // Build receipt payload
            const receiptData = verifyRes?.receipt || {
              ...verifyRes,
              receipt_id: verifyRes?.receipt_id || (verifyRes?.receipt_url ? verifyRes.receipt_url.split('/').pop() : null),
              receipt_url: verifyRes?.receipt_url,
              download_url: verifyRes?.download_url,
              student_name: order.student?.name || user?.name || user?.full_name || 'Student',
              student_email: order.student?.email || user?.email || '',
              student_phone: order.student?.phone || user?.phone || '',
              course_title: order.course?.title || course?.title || title,
              course_fee: course?.fee || course?.price,
              amount_paid: (order.amount_paise ? order.amount_paise / 100 : null) || verifyRes?.amount || verifyRes?.amount_paid,
              payment_method: 'online',
              payment_type: paymentType,
              installment_number: paymentType === 'installment' ? selectedInstallment : null,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              payment_date: new Date().toISOString(),
            };

            setSuccessReceipt(receiptData);
            setShowReceiptModal(false);
            navigate('/student-dashboard', {
              state: {
                newPurchaseReceipt: receiptData,
                paymentSuccess: true,
              },
            });
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

  const scrollToDetails = () => {
    const el = document.getElementById('course-details-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* ── When rendered within the Student Portal, return the dedicated enhanced view ── */
  if (studentView) {
    return (
      <StudentCourseDetailView
        course={course}
        title={title}
        shortDesc={shortDesc}
        fullDesc={fullDesc}
        priceDisplay={priceDisplay}
        category={category}
        duration={duration}
        level={level}
        imageUrl={imageUrl}
        coursePath={coursePath}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        selectedInstallment={selectedInstallment}
        setSelectedInstallment={setSelectedInstallment}
        handleApplyClick={handleApplyClick}
        paymentLoading={paymentLoading}
        paymentMessage={paymentMessage}
        paymentError={paymentError}
        relatedCourses={relatedCourses}
        onOpenApplyModal={onOpenApplyModal}
        showReceiptModal={showReceiptModal}
        setShowReceiptModal={setShowReceiptModal}
        successReceipt={successReceipt}
        token={token}
        navigate={navigate}
      />
    );
  }

  return (
    <div className="bg-white text-slate-900 opacity-0 animate-[detailOpen_0.5s_ease-out_forwards]">
      <style>{`
        @keyframes detailOpen {
          0% { opacity: 0; transform: translateY(16px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      
      {/* BREADCRUMB & HERO BANNER */}
      {studentView ? (
        <section className="bg-white py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to={coursePath}
              className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors text-[#9C6B2E] hover:text-[#855923]"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Courses
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="space-y-5 lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border border-[#E3DDD0] bg-[#FAF8F4] text-[#9C6B2E]">
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
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] text-[#9C6B2E] font-bold">
                    <Clock className="h-4 w-4 text-[#9C6B2E]" /> Duration: {duration}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] text-slate-700 font-bold">
                    <BarChart className="w-4 h-4 text-[#9C6B2E]" /> Level: {level}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="overflow-hidden rounded-2xl border border-[#E3DDD0] bg-[#FAF8F4] shadow-xs">
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
      ) : (
        /* PUBLIC VIEW: TOP HERO IMAGE (RESPONSIVE 16/9 ON MOBILE, FULL HERO ON DESKTOP) */
        <section className="w-full relative bg-stone-950 border-b border-stone-200/40 overflow-hidden">
          {/* Responsive Banner Image Container */}
          <div className="relative w-full aspect-[16/9] sm:aspect-auto sm:h-[80vh] lg:h-[calc(100vh-80px)] sm:min-h-[520px] lg:min-h-[640px] overflow-hidden flex items-center justify-center bg-stone-950">
            <img
              src={imageUrl}
              alt={title}
              className="hero-pop-in block w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80';
              }}
            />

            {/* Simple Slide Down Button (Desktop / Tablet only - hidden in mobile view) */}
            <div className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              <button
                type="button"
                onClick={scrollToDetails}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 hover:bg-white text-stone-800 hover:text-stone-950 text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:shadow-lg backdrop-blur-md border border-stone-200/80 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Slide down for details"
                aria-label="Slide down for details"
              >
                <span>Slide Down</span>
                <ChevronDown className="h-4 w-4 text-[#9C6B2E] group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT & SIDEBAR ENROLMENT CARD */}
      <section id="course-details-section" className="bg-white py-8 sm:py-12 scroll-mt-16 sm:scroll-mt-20">
        <div className={studentView ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"}>
          {!studentView && (
            <div className="mb-6 flex items-center">
              <Link
                to={coursePath}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors text-slate-500 hover:text-amber-700"
              >
                <ArrowLeft className="w-4 h-4" /> Back to All Courses
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 items-start lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12">
            
            {/* LEFT MAIN DETAILS */}
            <div className="space-y-6 lg:col-span-8">
              {!studentView && (
                <div className="space-y-4 pb-6 border-b border-stone-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                      {category}
                    </span>
                  </div>

                  <h1 className="w-full text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl break-words">
                    {title}
                  </h1>

                  <p className="w-full text-base font-normal leading-relaxed text-slate-600 sm:text-lg">
                    {shortDesc}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-700 sm:text-sm">
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 font-bold">
                      <Clock className="h-4 w-4 text-amber-700" /> Duration: {duration}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold">
                      <BarChart className="w-4 h-4 text-slate-500" /> Level: {level}
                    </span>
                  </div>
                </div>
              )}

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
                      studentView ? 'border-[#E3DDD0]' : 'border-amber-200'
                    }`}
                  >
                    Key Skills You Will Acquire
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {course.skills.map((skill, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm font-semibold text-slate-900 ${
                          studentView
                            ? 'border-[#E3DDD0] bg-[#FAF8F4]'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                            studentView
                              ? 'bg-[#F1EDE4] text-[#9C6B2E]'
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
                    ? 'rounded-2xl border border-[#E3DDD0] shadow-xs'
                    : 'rounded-[1.75rem] border-[1.5px] border-[#f0d9a8] shadow-[0_22px_45px_rgba(169,132,74,0.1)]'
                }`}
              >
                
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Program Fee</span>
                  <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-black text-slate-950 sm:text-4xl">
                      {priceDisplay}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Includes GST
                    </span>
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
                        ? 'border-[#E3DDD0] bg-[#FAF8F4] text-slate-800 focus:border-[#9C6B2E] focus:bg-white'
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
                          ? 'bg-[#FAF8F4] border-[#E3DDD0]'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            studentView ? 'text-[#9C6B2E]' : 'text-amber-800'
                          }`}
                        >
                          Installment Terms
                        </h4>
                        {course.installment_schedule && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              studentView
                                ? 'text-[#9C6B2E] bg-[#F1EDE4]'
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
                                    ? 'bg-[#F1EDE4] border-[#9C6B2E]'
                                    : 'bg-amber-100 border-amber-300'
                                  : studentView
                                  ? 'bg-transparent border-transparent hover:bg-[#F1EDE4]/50'
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
                                      ? 'text-[#9C6B2E] focus:ring-[#9C6B2E]'
                                      : 'text-amber-600 focus:ring-amber-500'
                                  }
                                />
                                <span
                                  className={`font-semibold ${
                                    studentView ? 'text-[#17140F]' : 'text-amber-900'
                                  }`}
                                >
                                  Installment {term.term_number}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-slate-900">₹{term.amount}</div>
                                <div
                                  className={`text-[10px] ${
                                    studentView ? 'text-[#9C6B2E]' : 'text-amber-700'
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
                            studentView ? 'text-[#17140F]' : 'text-amber-900'
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
                      ? 'bg-[#9C6B2E] hover:bg-[#855923] shadow-xs'
                      : 'bg-slate-950 hover:bg-slate-800 shadow-sm'
                  }`}
                >
                  {paymentLoading ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${studentView ? 'text-white' : 'text-amber-400'}`} />
                  ) : (
                    <Send className={`h-4 w-4 ${studentView ? 'text-white' : 'text-amber-400'}`} />
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
          <div className={studentView ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"}>
            <h3 className="mb-8 text-2xl font-bold text-slate-950">
              Explore Other Related Courses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedCourses.map((rCourse) => (
                <CourseCard key={rCourse.id} course={rCourse} onApply={onOpenApplyModal} linkPrefix={coursePath} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PAYMENT SUCCESS & RECEIPT POPUP MODAL */}
      <PaymentSuccessReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          navigate('/student-dashboard');
        }}
        receipt={successReceipt}
        receiptUrl={successReceipt?.receipt_url}
        downloadUrl={successReceipt?.download_url}
        token={token}
        title="Congratulations! Your course has been purchased"
        subtitle="Your enrollment has been successfully confirmed. Below is your official fee payment receipt."
        onViewReceipt={(rcpt, url) => {
          if (url) window.open(url, '_blank');
          else navigate('/student-dashboard/receipts');
        }}
      />

    </div>
  );
};

export default CourseDetails;
