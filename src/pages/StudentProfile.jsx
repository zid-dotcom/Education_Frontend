import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Building2,
  Users,
  BookOpen,
  Clock,
  Receipt,
  Star,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStudentProfileApi, updateStudentProfileApi, getProfileImageUrl } from '../services/studentProfile';
import { getMyEnrollmentsApi, getEnrollmentInstallmentsApi } from '../services/enrollments';
import { getCourseImageUrl } from '../services/courses';
import StudentPaymentEnrollmentModal from '../components/common/StudentPaymentEnrollmentModal';

const StudentProfile = () => {
  const { token, user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    highest_qualification: '',
    address: '',
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const handleOpenDetails = (enr) => {
    setSelectedEnrollment(enr);
  };

  const handleCloseDetails = () => {
    setSelectedEnrollment(null);
  };

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    setLoadingEnrollments(true);
    setError('');
    try {
      const [profileRes, enrollmentsRes] = await Promise.allSettled([
        getStudentProfileApi(token),
        getMyEnrollmentsApi(token),
      ]);

      if (profileRes.status === 'fulfilled') {
        const data = profileRes.value;
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          parent_name: data.parent_name || '',
          parent_phone: data.parent_phone || '',
          highest_qualification: data.highest_qualification || '',
          address: data.address || '',
        });
        if (data.profile_image) {
          setImagePreview(getProfileImageUrl(data.profile_image));
        }
      } else {
        setError(profileRes.reason?.message || 'Failed to load profile details.');
      }

      if (enrollmentsRes.status === 'fulfilled') {
        const list = Array.isArray(enrollmentsRes.value) ? enrollmentsRes.value : [];
        setEnrollments(list);
      } else {
        setEnrollments([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill in all required fields (Name, Email, Phone).');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim());
      payload.append('phone', formData.phone.trim());
      payload.append('parent_name', formData.parent_name.trim());
      payload.append('parent_phone', formData.parent_phone.trim());
      payload.append('highest_qualification', formData.highest_qualification.trim());
      payload.append('address', formData.address.trim());

      if (selectedImage) {
        payload.append('image', selectedImage);
      }

      const updated = await updateStudentProfileApi(payload, token);
      const newImg = updated.profile_image || (updated.image ? getProfileImageUrl(updated.image) : null) || imagePreview || profile?.profile_image;

      setProfile((prev) => ({
        ...prev,
        ...updated,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        parent_name: formData.parent_name.trim(),
        parent_phone: formData.parent_phone.trim(),
        highest_qualification: formData.highest_qualification.trim(),
        address: formData.address.trim(),
        profile_image: newImg,
      }));

      if (updateUser) {
        updateUser({
          ...user,
          ...updated,
          name: formData.name.trim(),
          profile_image: newImg,
        });
      }
      try {
        localStorage.setItem(
          'studentUser',
          JSON.stringify({ ...user, ...updated, name: formData.name.trim(), profile_image: newImg })
        );
      } catch { /* ignore */ }

      window.dispatchEvent(
        new CustomEvent('student-profile-updated', {
          detail: { ...updated, name: formData.name.trim(), profile_image: newImg },
        })
      );

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        parent_name: profile.parent_name || '',
        parent_phone: profile.parent_phone || '',
        highest_qualification: profile.highest_qualification || '',
        address: profile.address || '',
      });
      setImagePreview(profile.profile_image ? getProfileImageUrl(profile.profile_image) : null);
      setSelectedImage(null);
    }
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-9 w-9 animate-spin text-[#9C6B2E]" />
        <p className="text-sm font-semibold text-slate-500">Loading student profile...</p>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'Student';
  const displayImage = imagePreview || getProfileImageUrl(profile?.profile_image);

  return (
    <div className="w-full space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Alert Banners */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Profile Hero Card */}
      <div className="bg-[#FFFDF9] rounded-3xl p-6 sm:p-8 border border-[#E7DFD3] shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Soft amber accent on top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FED7AA]" />

        {/* Profile Avatar / Image */}
        <div className="relative group shrink-0 mt-1">
          <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl overflow-hidden bg-[#FAF6EE] border-2 border-[#E7DFD3] shadow-md flex items-center justify-center">
            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#9C6B2E]">
                <User className="h-14 w-14 stroke-[1.6]" />
                <span className="text-[10px] font-bold uppercase mt-1 text-[#B45309]">Student</span>
              </div>
            )}
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-[#9C6B2E] text-white shadow-lg hover:bg-[#835622] transition-transform hover:scale-105 cursor-pointer"
              title="Upload profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Student Overview Header Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF4E8] text-[#9C6B2E] border border-[#E8DFC9]">
              <GraduationCap className="h-3.5 w-3.5 text-[#D97706]" />
              Student Portal
            </span>
            {profile?.id && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                ID #{profile.id}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Student
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17140F] tracking-tight">
            {displayName}
          </h1>

          <p className="text-xs sm:text-sm text-[#6B5E4E] font-medium mt-1">
            {profile?.email || user?.email || 'Student Email'}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-[#5B5346] font-semibold">
            {profile?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#9C6B2E]" />
                {profile.phone}
              </span>
            )}
            {profile?.highest_qualification && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-[#9C6B2E]" />
                {profile.highest_qualification}
              </span>
            )}
            {profile?.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#9C6B2E]" />
                {profile.address}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 self-center sm:self-start">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#9C6B2E] text-white hover:bg-[#835622] transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Profile Details Display / Edit Form */}
      {!isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Personal & Contact Details */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7DFD3] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F1EDE4]">
              <div className="h-9 w-9 rounded-xl bg-[#FAF4E8] text-[#9C6B2E] flex items-center justify-center border border-[#E8DFC9]">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17140F]">Personal Information</h3>
                <p className="text-[11px] text-[#8A8175]">Primary contact & personal credentials</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Full Name</span>
                <p className="text-sm font-bold text-[#17140F] mt-0.5">{profile?.name || '—'}</p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Email Address</span>
                <p className="text-sm font-bold text-[#17140F] mt-0.5 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  {profile?.email || '—'}
                </p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Phone Number</span>
                <p className="text-sm font-bold text-[#17140F] mt-0.5 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  {profile?.phone || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Parent / Guardian Information */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7DFD3] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F1EDE4]">
              <div className="h-9 w-9 rounded-xl bg-[#FAF4E8] text-[#9C6B2E] flex items-center justify-center border border-[#E8DFC9]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17140F]">Parent / Guardian</h3>
                <p className="text-[11px] text-[#8A8175]">Emergency & family contact records</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Parent / Guardian Name</span>
                <p className="text-sm font-bold text-[#17140F] mt-0.5">{profile?.parent_name || '—'}</p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Parent Phone Number</span>
                <p className="text-sm font-bold text-[#17140F] mt-0.5 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#9C6B2E]" />
                  {profile?.parent_phone || '—'}
                </p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Emergency Contact Status</span>
                <p className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Verified on Record
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Academic Qualifications */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7DFD3] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F1EDE4]">
              <div className="h-9 w-9 rounded-xl bg-[#FAF4E8] text-[#9C6B2E] flex items-center justify-center border border-[#E8DFC9]">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17140F]">Academic Qualification</h3>
                <p className="text-[11px] text-[#8A8175]">Highest completed educational milestone</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Highest Qualification</span>
                <p className="text-sm font-bold text-[#17140F] mt-0.5 capitalize">
                  {profile?.highest_qualification || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Residential Address */}
          <div className="bg-white rounded-3xl p-6 border border-[#E7DFD3] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F1EDE4]">
              <div className="h-9 w-9 rounded-xl bg-[#FAF4E8] text-[#9C6B2E] flex items-center justify-center border border-[#E8DFC9]">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17140F]">Residential Address</h3>
                <p className="text-[11px] text-[#8A8175]">Current residence & location</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A8175]">Address</span>
                <p className="text-sm font-bold text-[#17140F] mt-0.5 capitalize">
                  {profile?.address || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Profile Form */
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7DFD3] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1EDE4]">
            <div>
              <h2 className="text-lg font-bold text-[#17140F]">Edit Student Profile</h2>
              <p className="text-xs text-[#8A8175]">Update your personal, parental, and contact details</p>
            </div>
            <span className="text-xs font-semibold text-[#9C6B2E] bg-[#FAF4E8] px-3 py-1 rounded-full border border-[#E8DFC9]">
              Live Profile Update
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name - Read only */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Name
                </label>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Read-only
                </span>
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                readOnly
                tabIndex={-1}
                className="w-full rounded-2xl border border-[#E3DDD0] bg-slate-100/90 px-4 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed select-none focus:outline-none"
                placeholder="Full name"
              />
            </div>

            {/* Email - Read only */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Read-only
                </span>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                tabIndex={-1}
                className="w-full rounded-2xl border border-[#E3DDD0] bg-slate-100/90 px-4 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed select-none focus:outline-none"
                placeholder="Email address"
              />
            </div>

            {/* Phone - Read only */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Phone Number
                </label>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Read-only
                </span>
              </div>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                readOnly
                tabIndex={-1}
                className="w-full rounded-2xl border border-[#E3DDD0] bg-slate-100/90 px-4 py-2.5 text-sm font-semibold text-slate-600 cursor-not-allowed select-none focus:outline-none"
                placeholder="Phone number"
              />
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Parent / Guardian Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleInputChange}
                required
                className="w-full rounded-2xl border border-[#E3DDD0] bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/40 focus:border-[#9C6B2E] transition"
                placeholder="Enter parent or guardian name"
              />
            </div>

            {/* Parent Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Parent Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleInputChange}
                required
                className="w-full rounded-2xl border border-[#E3DDD0] bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/40 focus:border-[#9C6B2E] transition"
                placeholder="Enter parent phone number"
              />
            </div>

            {/* Highest Qualification */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Highest Qualification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="highest_qualification"
                value={formData.highest_qualification}
                onChange={handleInputChange}
                required
                className="w-full rounded-2xl border border-[#E3DDD0] bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/40 focus:border-[#9C6B2E] transition"
                placeholder="e.g. Degree, Plus Two, B.Tech"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Residential Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full rounded-2xl border border-[#E3DDD0] bg-slate-50/60 px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9C6B2E]/40 focus:border-[#9C6B2E] transition"
                placeholder="Enter full residential address"
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1EDE4]">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#9C6B2E] hover:bg-[#835622] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Enrolled Courses Section ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7DFD3] shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1EDE4]">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Enrolled Courses
          </h3>
          <Link
            to="/student-dashboard/courses"
            className="text-xs font-bold text-[#9C6B2E] hover:text-[#855923] transition flex items-center gap-1"
          >
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingEnrollments ? (
          <div className="flex items-center justify-center py-10 space-x-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-[#9C6B2E]" />
            <span className="text-xs font-semibold">Loading enrolled courses...</span>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#FAF8F4] rounded-2xl border border-dashed border-[#E3DDD0]">
            <BookOpen className="h-10 w-10 text-[#C4B7A5] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#17140F]">No Enrolled Courses Found</p>
            <p className="text-xs text-[#8A8175] mt-1">You haven't enrolled in any active course yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {enrollments.map((enr, idx) => {
              const courseTitle =
                enr.course_title ||
                enr.course_details?.title ||
                'Enrolled Program';
              const courseDuration =
                enr.course_duration ||
                enr.course_details?.duration ||
                'Program Duration';
              const branchApproval = (enr.branch_approval_status || '').toLowerCase();
              const superApproval = (enr.super_admin_approval_status || '').toLowerCase();
              const courseImg = getCourseImageUrl(
                enr.course_image || enr.course_details?.image || enr.course_details?.image_url
              );
              const paidAmount = Number(enr.total_paid || 0);
              const category = enr.course_details?.category;

              return (
                <div
                  key={enr.id || enr.enrollment_id || idx}
                  className="flex flex-col justify-between rounded-2xl bg-[#FAF8F4] border border-[#E3DDD0] hover:border-[#9C6B2E] hover:bg-white hover:shadow-lg transition-all duration-300 overflow-hidden group h-full"
                >
                  {/* Course Image on Top */}
                  <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden shrink-0">
                    {courseImg ? (
                      <img
                        src={courseImg}
                        alt={courseTitle}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#F1EDE4] to-[#FAF8F4]">
                        <BookOpen className="h-12 w-12 text-[#9C6B2E]/60" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                    {/* Floating Duration Badge on Image */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#9C6B2E] shadow-sm border border-white/60">
                        <Clock className="h-3 w-3 text-[#9C6B2E]" />
                        {courseDuration}
                      </span>
                    </div>
                  </div>

                  {/* Text Contents Below Image */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {category && (
                        <p className="text-[11px] font-bold tracking-wider uppercase text-[#9C6B2E] mb-1">
                          {category}
                        </p>
                      )}
                      <h4 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#9C6B2E] transition-colors">
                        {courseTitle}
                      </h4>

                      {/* Approval Status Pills */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold capitalize ${
                            branchApproval === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : branchApproval === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {branchApproval === 'approved'
                            ? 'Branch Admin Approved'
                            : branchApproval === 'rejected'
                            ? 'Branch Admin Rejected'
                            : 'Branch Admin Approval Pending'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold capitalize ${
                            superApproval === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : superApproval === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {superApproval === 'approved'
                            ? 'Super Admin Approved'
                            : superApproval === 'rejected'
                            ? 'Super Admin Rejected'
                            : 'Super Admin Approval Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Paid Amount + Action Buttons */}
                    <div className="mt-5 pt-3.5 border-t border-[#E3DDD0] flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8A8175] block leading-none mb-1">
                          Paid Amount
                        </span>
                        <span className="text-sm font-extrabold text-emerald-700">
                          ₹{paidAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to="/student-dashboard/reviews"
                          className="rounded-xl border border-[#E3DDD0] bg-[#FAF8F4] px-3 py-2 text-xs font-bold text-[#9C6B2E] transition hover:bg-[#F1EDE4] flex items-center gap-1.5 cursor-pointer"
                          title="Write a review for this course"
                        >
                          <Star className="h-3.5 w-3.5 fill-[#9C6B2E]/20 text-[#9C6B2E]" />
                          <span>Review</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(enr)}
                          className="rounded-xl bg-[#9C6B2E] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#855923] flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Enrollment Details Modal ── */}
      {selectedEnrollment && (
        <StudentPaymentEnrollmentModal
          isOpen={Boolean(selectedEnrollment)}
          enrollment={selectedEnrollment}
          onClose={handleCloseDetails}
          token={token}
          user={user}
          onRefresh={fetchProfile}
        />
      )}
    </div>
  );
};

export default StudentProfile;
