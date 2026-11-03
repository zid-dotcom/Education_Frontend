import os
import re

def update_file(path, modifier_fn):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = modifier_fn(content)
    if new_content != content:
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(new_content)
        print(f"Updated: {path}")
    else:
        print(f"No changes needed or pattern not found: {path}")

# ==============================================================================
# 1. StudentCourses.jsx
# ==============================================================================
def modify_student_courses(content):
    # Add import
    if "CoursesBannerIllustration" not in content:
        content = content.replace(
            "import { getPublicBranchesWithCoursesApi } from '../services/branches';",
            "import { getPublicBranchesWithCoursesApi } from '../services/branches';\nimport { CoursesBannerIllustration } from '../components/common/StudentBannerIllustrations';"
        )
    
    # Replace header banner
    old_banner_pattern = r'\{/\* 1\. Header Banner \*/\}\s*<header[\s\S]*?</header>'
    new_banner = '''{/* 1. Hero Banner Matching System Style */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
          {/* Left Text Content */}
          <div className="p-6 sm:p-8 md:p-10 max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
              <BookOpen className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Academic Programs & Courses</span>
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17140F] leading-tight">
              Find your next course
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
              Explore programs open for enrollment and step into a course to review its curriculum, fee, and next steps.
            </p>
            {totalCourses > 0 && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-1.5 text-xs font-bold text-[#17140F]">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{totalCourses} Courses open for enrollment</span>
                </span>
              </div>
            )}
          </div>

          {/* Right SVG Illustration - Fitted flush to bottom and right */}
          <div className="w-full md:w-auto flex justify-end md:self-end shrink-0 select-none overflow-hidden pr-0 -mb-1">
            <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] xl:max-w-[580px] flex items-end">
              <CoursesBannerIllustration className="w-full h-auto block align-bottom" />
            </div>
          </div>
        </div>
      </section>'''
    
    content = re.sub(old_banner_pattern, new_banner, content)
    return content

update_file('src/pages/StudentCourses.jsx', modify_student_courses)

# ==============================================================================
# 2. StudentAnnouncements.jsx
# ==============================================================================
def modify_student_announcements(content):
    if "AnnouncementsBannerIllustration" not in content:
        content = content.replace(
            "import { getUserAnnouncementsApi } from '../services/userannouncements';",
            "import { getUserAnnouncementsApi } from '../services/userannouncements';\nimport { AnnouncementsBannerIllustration } from '../components/common/StudentBannerIllustrations';"
        )
    
    old_banner_pattern = r'\{/\* Header Banner \*/\}\s*<section className="relative overflow-hidden rounded-\[2rem\] bg-gradient-to-r from-\[#FAF8F4\][\s\S]*?</section>'
    new_banner = '''{/* Header Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
            {/* Left Text Content */}
            <div className="p-6 sm:p-8 md:p-10 max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
                <Megaphone className="h-3.5 w-3.5 text-[#9C6B2E]" />
                <span>Course & Academic Bulletins</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17140F] leading-tight">
                Course Announcements
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
                Stay informed with the latest course notices, schedule changes, exam times, and learning updates from your instructors.
              </p>
              <div className="pt-1 flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-1.5 text-xs font-bold text-[#17140F]">
                  <span className="text-[#9C6B2E] font-black">{announcements.length}</span>
                  <span>Active Updates</span>
                </span>
                <button
                  type="button"
                  onClick={fetchAnnouncements}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#F1EDE4] transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 text-[#9C6B2E] ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Right SVG Illustration - Fitted flush to bottom and right */}
            <div className="w-full md:w-auto flex justify-end md:self-end shrink-0 select-none overflow-hidden pr-0 -mb-1">
              <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] xl:max-w-[580px] flex items-end">
                <AnnouncementsBannerIllustration className="w-full h-auto block align-bottom" />
              </div>
            </div>
          </div>
        </section>'''
    
    content = re.sub(old_banner_pattern, new_banner, content)
    return content

update_file('src/pages/StudentAnnouncements.jsx', modify_student_announcements)

# ==============================================================================
# 3. StudentInstitutionAnnouncements.jsx
# ==============================================================================
def modify_student_inst_announcements(content):
    if "InstitutionBannerIllustration" not in content:
        content = content.replace(
            "import { getUserAnnouncementsApi } from '../services/userannouncements';",
            "import { getUserAnnouncementsApi } from '../services/userannouncements';\nimport { InstitutionBannerIllustration } from '../components/common/StudentBannerIllustrations';"
        )
    
    old_banner_pattern = r'\{/\* Header Banner \*/\}\s*<section className="relative overflow-hidden rounded-\[2rem\] bg-gradient-to-r from-\[#FAF8F4\][\s\S]*?</section>'
    new_banner = '''{/* Header Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
            {/* Left Text Content */}
            <div className="p-6 sm:p-8 md:p-10 max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
                <Building2 className="h-3.5 w-3.5 text-[#9C6B2E]" />
                <span>Campus & Branch Bulletins</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17140F] leading-tight">
                Institution Announcements
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
                Official notices, circulars, and administrative updates issued by branch leadership and central administration.
              </p>
              <div className="pt-1 flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-1.5 text-xs font-bold text-[#17140F]">
                  <span className="text-[#9C6B2E] font-black">{announcements.length}</span>
                  <span>Official Circulars</span>
                </span>
                <button
                  type="button"
                  onClick={fetchAnnouncements}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-[#F1EDE4] transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 text-[#9C6B2E] ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Right SVG Illustration - Fitted flush to bottom and right */}
            <div className="w-full md:w-auto flex justify-end md:self-end shrink-0 select-none overflow-hidden pr-0 -mb-1">
              <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] xl:max-w-[580px] flex items-end">
                <InstitutionBannerIllustration className="w-full h-auto block align-bottom" />
              </div>
            </div>
          </div>
        </section>'''
    
    content = re.sub(old_banner_pattern, new_banner, content)
    return content

update_file('src/pages/StudentInstitutionAnnouncements.jsx', modify_student_inst_announcements)

# ==============================================================================
# 4. StudentStudyMaterials.jsx
# ==============================================================================
def modify_student_study_materials(content):
    if "StudyMaterialsBannerIllustration" not in content:
        content = content.replace(
            "import { getStudentStudyMaterialsApi } from '../services/studyMaterials';",
            "import { getStudentStudyMaterialsApi } from '../services/studyMaterials';\nimport { StudyMaterialsBannerIllustration } from '../components/common/StudentBannerIllustrations';"
        )
    
    old_banner_pattern = r'\{/\* 1\. Header Banner \(Warm Light Theme\) \*/\}[\s\S]*?\{/\* Quick Stats Grid \*/\}[\s\S]*?</div>\s*</div>\s*</div>'
    new_banner = '''{/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
          {/* Left Text Content */}
          <div className="p-6 sm:p-8 md:p-10 max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
              <FolderDown className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Academic Resources</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17140F] leading-tight">
              Study Materials & Notes
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
              Access and download verified course PDFs, lecture presentations, and reference guides provided by your faculty.
            </p>
            <div className="pt-1 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fetchMaterials(selectedCourseId)}
                title="Refresh materials"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 border border-[#ECDDC6] px-3.5 py-2 text-xs font-bold text-[#17140F] hover:bg-[#F1EDE4] transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#9C6B2E] ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Materials</span>
              </button>
            </div>
          </div>

          {/* Right SVG Illustration - Fitted flush to bottom and right */}
          <div className="w-full md:w-auto flex justify-end md:self-end shrink-0 select-none overflow-hidden pr-0 -mb-1">
            <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] xl:max-w-[580px] flex items-end">
              <StudyMaterialsBannerIllustration className="w-full h-auto block align-bottom" />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 md:px-10 border-t border-[#ECDDC6]/60 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white/90 rounded-2xl p-3 border border-[#ECDDC6] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8175] block">Total Materials</span>
            <span className="text-lg font-extrabold text-[#9C6B2E]">{materials.length}</span>
          </div>
          <div className="bg-white/90 rounded-2xl p-3 border border-[#ECDDC6] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8175] block">Enrolled Courses</span>
            <span className="text-lg font-extrabold text-[#17140F]">{enrolledCourses.length}</span>
          </div>
        </div>
      </section>'''
    
    content = re.sub(old_banner_pattern, new_banner, content)
    return content

update_file('src/pages/StudentStudyMaterials.jsx', modify_student_study_materials)

# ==============================================================================
# 5. StudentReceipts.jsx
# ==============================================================================
def modify_student_receipts(content):
    if "ReceiptsBannerIllustration" not in content:
        content = content.replace(
            "import OfficialReceiptVoucherCard from \"../components/common/OfficialReceiptVoucherCard\";",
            "import OfficialReceiptVoucherCard from \"../components/common/OfficialReceiptVoucherCard\";\nimport { ReceiptsBannerIllustration } from \"../components/common/StudentBannerIllustrations\";"
        )
    
    old_banner_pattern = r'\{/\* Header Banner \*/\}\s*<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-\[#e3ddd0\] pb-6">[\s\S]*?</div>\s*</div>'
    new_banner = '''{/* Header Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
          {/* Left Text Content */}
          <div className="p-6 sm:p-8 md:p-10 max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
              <Receipt className="h-3.5 w-3.5 text-[#9C6B2E]" />
              <span>Student Financial Records</span>
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17140F] leading-tight">
              Payment Receipts
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
              View and download official fee receipts for all online and branch-recorded payments.
            </p>
            <div className="pt-1 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fetchReceipts(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-[#ECDDC6] bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-[#faf8f4] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#9c6b2e] ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <Link
                to="/student-dashboard"
                className="flex items-center gap-1.5 rounded-xl bg-[#17140f] px-3.5 py-2 text-xs font-bold text-[#f4b942] shadow-2xs transition hover:bg-slate-800"
              >
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Right SVG Illustration - Fitted flush to bottom and right */}
          <div className="w-full md:w-auto flex justify-end md:self-end shrink-0 select-none overflow-hidden pr-0 -mb-1">
            <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] xl:max-w-[580px] flex items-end">
              <ReceiptsBannerIllustration className="w-full h-auto block align-bottom" />
            </div>
          </div>
        </div>
      </section>'''
    
    content = re.sub(old_banner_pattern, new_banner, content)
    return content

update_file('src/pages/StudentReceipts.jsx', modify_student_receipts)

# ==============================================================================
# 6. StudentReviews.jsx
# ==============================================================================
def modify_student_reviews(content):
    if "ReviewsBannerIllustration" not in content:
        content = content.replace(
            "import { getCourseImageUrl } from '../services/courses';",
            "import { getCourseImageUrl } from '../services/courses';\nimport { ReviewsBannerIllustration } from '../components/common/StudentBannerIllustrations';"
        )
    
    old_banner_pattern = r'\{/\* 1\. Header Banner \*/\}\s*<header[\s\S]*?</header>'
    new_banner = '''{/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
          {/* Left Text Content */}
          <div className="p-6 sm:p-8 md:p-10 max-w-2xl space-y-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
              <Star className="h-3.5 w-3.5 text-[#9C6B2E] fill-[#9C6B2E]" />
              <span>Student Experience & Feedback</span>
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17140F] leading-tight">
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

          {/* Right SVG Illustration - Fitted flush to bottom and right */}
          <div className="w-full md:w-auto flex justify-end md:self-end shrink-0 select-none overflow-hidden pr-0 -mb-1">
            <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] xl:max-w-[580px] flex items-end">
              <ReviewsBannerIllustration className="w-full h-auto block align-bottom" />
            </div>
          </div>
        </div>
      </section>'''
    
    content = re.sub(old_banner_pattern, new_banner, content)
    return content

update_file('src/pages/StudentReviews.jsx', modify_student_reviews)

# ==============================================================================
# 7. StudentEnquiries.jsx
# ==============================================================================
def modify_student_enquiries(content):
    if "EnquiriesBannerIllustration" not in content:
        content = content.replace(
            "import { getStudentEnquiriesApi, submitEnquiryApi } from '../services/enquiries';",
            "import { getStudentEnquiriesApi, submitEnquiryApi } from '../services/enquiries';\nimport { EnquiriesBannerIllustration } from '../components/common/StudentBannerIllustrations';"
        )
    
    old_banner_pattern = r'<section className="rounded-2xl border border-\[#E3DDD0\] bg-white p-6 sm:p-8 shadow-2xs">[\s\S]*?</section>'
    new_banner = '''<section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FAF6EE] via-[#FDF9F2] to-[#FAF1DF] text-[#17140F] border border-[#ECDDC6] shadow-xs mb-6">
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between">
            {/* Left Text Content */}
            <div className="p-6 sm:p-8 md:p-10 max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#9C6B2E] border border-[#ECD8B5] shadow-2xs">
                <MessageCircle className="h-3.5 w-3.5 text-[#9C6B2E]" />
                <span>Student Support & Queries</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17140F] leading-tight">
                Student Enquiries
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-[#6B6252] font-medium leading-relaxed max-w-xl">
                Send admission requests, academic questions, or fee queries directly to your branch administrator and track answers.
              </p>
            </div>

            {/* Right SVG Illustration - Fitted flush to bottom and right */}
            <div className="w-full md:w-auto flex justify-end md:self-end shrink-0 select-none overflow-hidden pr-0 -mb-1">
              <div className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[560px] xl:max-w-[580px] flex items-end">
                <EnquiriesBannerIllustration className="w-full h-auto block align-bottom" />
              </div>
            </div>
          </div>
        </section>'''
    
    content = re.sub(old_banner_pattern, new_banner, content)
    return content

update_file('src/pages/StudentEnquiries.jsx', modify_student_enquiries)

print("All student page banners updated successfully!")

