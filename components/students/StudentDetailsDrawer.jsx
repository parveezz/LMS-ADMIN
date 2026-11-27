"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import {
  getStudentByIdApi,
  getStudentEnrollmentsApi,
  upsertStudentProfileApi,
} from "@/lib/studentApi";
import { Button } from "@/components/Button";

const ADMIN_DETAIL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const ENROLLMENT_READ_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
];

const STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  pending_verification: "Pending Verification",
};

const STATUS_STYLES = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-zinc-200 bg-zinc-100 text-zinc-600",
  suspended: "border-red-200 bg-red-50 text-red-700",
  pending_verification: "border-amber-200 bg-amber-50 text-amber-700",
};

const GENDER_LABELS = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const GENDER_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const PROFILE_FIELDS = [
  "student_code",
  "date_of_birth",
  "gender",
  "address",
  "city",
  "state",
  "country",
  "postal_code",
  "guardian_name",
  "guardian_phone",
  "education_level",
  "institution",
  "notes",
];

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const LABEL_CLASS =
  "mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300";

function buildProfileForm(profile) {
  return {
    student_code: profile?.student_code || "",
    date_of_birth: profile?.date_of_birth || "",
    gender: profile?.gender || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    country: profile?.country || "",
    postal_code: profile?.postal_code || "",
    guardian_name: profile?.guardian_name || "",
    guardian_phone: profile?.guardian_phone || "",
    education_level: profile?.education_level || "",
    institution: profile?.institution || "",
    notes: profile?.notes || "",
  };
}

function normalizeProfileValues(form) {
  const normalized = {};
  for (const field of PROFILE_FIELDS) {
    const trimmed = String(form?.[field] ?? "").trim();
    normalized[field] = trimmed || null;
  }
  return normalized;
}

function isValidPastCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || !date.toISOString().startsWith(value)) {
    return false;
  }
  const todayUtc = new Date().toISOString().slice(0, 10);
  return value < todayUtc;
}

function validateProfileForm(form) {
  const errors = {};
  const studentCode = String(form.student_code ?? "").trim();
  const dob = String(form.date_of_birth ?? "").trim();
  const gender = String(form.gender ?? "").trim();
  const address = String(form.address ?? "").trim();
  const city = String(form.city ?? "").trim();
  const state = String(form.state ?? "").trim();
  const country = String(form.country ?? "").trim();
  const postalCode = String(form.postal_code ?? "").trim();
  const guardianName = String(form.guardian_name ?? "").trim();
  const guardianPhone = String(form.guardian_phone ?? "").trim();
  const educationLevel = String(form.education_level ?? "").trim();
  const institution = String(form.institution ?? "").trim();
  const notes = String(form.notes ?? "").trim();

  if (studentCode && (studentCode.length < 2 || studentCode.length > 50)) {
    errors.student_code = "Student code must be between 2 and 50 characters.";
  }
  if (dob && !isValidPastCalendarDate(dob)) {
    errors.date_of_birth =
      "Date of birth must be a valid past calendar date (YYYY-MM-DD).";
  }
  if (
    gender &&
    !["male", "female", "other", "prefer_not_to_say"].includes(gender)
  ) {
    errors.gender = "Please select a valid gender option.";
  }
  if (address.length > 1000) {
    errors.address = "Address cannot exceed 1000 characters.";
  }
  if (city.length > 100) {
    errors.city = "City cannot exceed 100 characters.";
  }
  if (state.length > 100) {
    errors.state = "State cannot exceed 100 characters.";
  }
  if (country.length > 100) {
    errors.country = "Country cannot exceed 100 characters.";
  }
  if (postalCode.length > 20) {
    errors.postal_code = "Postal code cannot exceed 20 characters.";
  }
  if (guardianName.length > 255) {
    errors.guardian_name = "Guardian name cannot exceed 255 characters.";
  }
  if (
    guardianPhone &&
    (guardianPhone.length < 7 || guardianPhone.length > 30)
  ) {
    errors.guardian_phone =
      "Guardian phone must be between 7 and 30 characters.";
  }
  if (educationLevel.length > 100) {
    errors.education_level = "Education level cannot exceed 100 characters.";
  }
  if (institution.length > 255) {
    errors.institution = "Institution cannot exceed 255 characters.";
  }
  if (notes.length > 5000) {
    errors.notes = "Notes cannot exceed 5000 characters.";
  }

  return errors;
}

const ENROLLMENT_STATUS_STYLES = {
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-sky-200 bg-sky-50 text-sky-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  deferred: "border-purple-200 bg-purple-50 text-purple-700",
  dropped: "border-red-200 bg-red-50 text-red-700",
};

function formatDateTime(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLabel(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function DetailItem({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-sm text-zinc-900 dark:text-zinc-100 ${mono ? "font-mono text-xs" : "font-medium"
          }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

export function StudentDetailsDrawer({ studentSummary, onClose }) {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();

  const userId = studentSummary?.user_id || "";
  const isAdminOrSuperAdmin = hasAnyRole(ADMIN_DETAIL_ROLES);
  const canEditProfile =
    isAdminOrSuperAdmin && hasPermission(PERMISSIONS.USERS_MANAGE);
  const canReadEnrollments =
    hasPermission(PERMISSIONS.USERS_READ) && hasAnyRole(ENROLLMENT_READ_ROLES);

  // Admin/Super Admin full student details state
  const [studentDetails, setStudentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(
    Boolean(isAdminOrSuperAdmin)
  );
  const [detailsError, setDetailsError] = useState("");

  // Admin/Super Admin profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(null));
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Enrollment history state (Admin, Super Admin, Staff)
  const [enrollments, setEnrollments] = useState([]);
  const [enrollPagination, setEnrollPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });
  const [enrollPage, setEnrollPage] = useState(1);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true);
  const [enrollmentsError, setEnrollmentsError] = useState("");

  const detailRequestIdRef = useRef(0);
  const enrollRequestIdRef = useRef(0);
  const saveRequestIdRef = useRef(0);
  const isSavingProfileRef = useRef(isSavingProfile);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isSavingProfileRef.current = isSavingProfile;
  }, [isSavingProfile]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape" && !isSavingProfileRef.current) {
        onCloseRef.current?.();
      }
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow");
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const fetchStudentDetails = useCallback(async () => {
    if (
      isCheckingAuth ||
      !isAuthenticated ||
      !isAdminOrSuperAdmin ||
      !userId
    ) {
      return;
    }

    const currentRequestId = ++detailRequestIdRef.current;
    setIsLoadingDetails(true);
    setDetailsError("");

    try {
      const res = await getStudentByIdApi(userId);
      if (currentRequestId !== detailRequestIdRef.current) {
        return;
      }

      const fetched = res?.data?.student || null;
      if (!fetched) {
        setStudentDetails(null);
        setDetailsError("Student record is unavailable.");
      } else {
        setStudentDetails(fetched);
      }
    } catch (err) {
      if (currentRequestId !== detailRequestIdRef.current) {
        return;
      }

      if (err.status === 0) {
        setDetailsError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 404) {
        setDetailsError("This student could not be found.");
      } else if (err.status === 403) {
        setDetailsError(
          err.message || "You do not have permission to view student details."
        );
      } else {
        setDetailsError(err.message || "Unable to load student details.");
      }
    } finally {
      if (currentRequestId === detailRequestIdRef.current) {
        setIsLoadingDetails(false);
      }
    }
  }, [isCheckingAuth, isAuthenticated, isAdminOrSuperAdmin, userId]);

  const fetchStudentEnrollments = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canReadEnrollments || !userId) {
      return;
    }

    const currentRequestId = ++enrollRequestIdRef.current;
    setIsLoadingEnrollments(true);
    setEnrollmentsError("");

    try {
      const res = await getStudentEnrollmentsApi(userId, {
        page: enrollPage,
        limit: 5,
      });

      if (currentRequestId !== enrollRequestIdRef.current) {
        return;
      }

      setEnrollments(Array.isArray(res?.data) ? res.data : []);
      setEnrollPagination(
        res?.pagination || { page: enrollPage, limit: 5, total: 0, totalPages: 1 }
      );
    } catch (err) {
      if (currentRequestId !== enrollRequestIdRef.current) {
        return;
      }

      if (err.status === 0) {
        setEnrollmentsError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 404) {
        setEnrollmentsError("Student enrollments could not be found.");
      } else if (err.status === 403) {
        setEnrollmentsError(
          err.message || "You do not have permission to view enrollments."
        );
      } else {
        setEnrollmentsError(
          err.message || "Unable to load student enrollments."
        );
      }
    } finally {
      if (currentRequestId === enrollRequestIdRef.current) {
        setIsLoadingEnrollments(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canReadEnrollments,
    userId,
    enrollPage,
  ]);

  useEffect(() => {
    if (
      isCheckingAuth ||
      !isAuthenticated ||
      !isAdminOrSuperAdmin ||
      !userId
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchStudentDetails();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    isCheckingAuth,
    isAuthenticated,
    isAdminOrSuperAdmin,
    userId,
    fetchStudentDetails,
  ]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canReadEnrollments || !userId) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchStudentEnrollments();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    isCheckingAuth,
    isAuthenticated,
    canReadEnrollments,
    userId,
    fetchStudentEnrollments,
  ]);

  if (!studentSummary) return null;

  const displayRecord = studentDetails || studentSummary;
  const statusKey = (displayRecord?.status || "inactive").toLowerCase();
  const statusStyle =
    STATUS_STYLES[statusKey] || "border-zinc-200 bg-zinc-100 text-zinc-600";

  const profile = studentDetails?.profile || null;
  const completeness = studentDetails?.profile_completeness || null;
  const enrollmentSummary = studentDetails?.enrollment_summary || null;

  const safeEnrollTotalPages = Math.max(1, enrollPagination.totalPages || 1);

  const handleStartEditProfile = () => {
    if (!canEditProfile || !studentDetails || isSavingProfile) return;
    setProfileForm(buildProfileForm(studentDetails.profile));
    setProfileFieldErrors({});
    setProfileError("");
    setProfileSuccess("");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    if (isSavingProfile) return;
    setIsEditingProfile(false);
    setProfileFieldErrors({});
    setProfileError("");
  };

  const updateProfileField = (field) => (e) => {
    const value = e.target.value;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (profileFieldErrors[field]) {
      setProfileFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (profileError) setProfileError("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (
      isSavingProfile ||
      isCheckingAuth ||
      !isAuthenticated ||
      !canEditProfile ||
      !userId ||
      !studentDetails
    ) {
      return;
    }

    setProfileError("");
    setProfileSuccess("");

    const errors = validateProfileForm(profileForm);
    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors);
      return;
    }

    const baseline = normalizeProfileValues(
      buildProfileForm(studentDetails.profile)
    );
    const current = normalizeProfileValues(profileForm);
    const diffPayload = {};

    for (const field of PROFILE_FIELDS) {
      if (current[field] !== baseline[field]) {
        diffPayload[field] = current[field];
      }
    }

    if (Object.keys(diffPayload).length === 0) {
      setProfileError(
        "No changes detected. Modify at least one profile field before saving."
      );
      return;
    }

    const hasNonEmptyValue = Object.values(diffPayload).some(
      (value) => value !== undefined && value !== null && value !== ""
    );
    if (!hasNonEmptyValue) {
      setProfileError(
        "Profile update must include at least one non-empty field."
      );
      return;
    }

    const currentSaveId = ++saveRequestIdRef.current;
    const targetUserId = userId;
    setIsSavingProfile(true);

    try {
      await upsertStudentProfileApi(targetUserId, diffPayload);
      if (currentSaveId !== saveRequestIdRef.current) {
        return;
      }

      setIsEditingProfile(false);
      setProfileFieldErrors({});
      setProfileSuccess("Student profile updated successfully.");
      await fetchStudentDetails();
    } catch (err) {
      if (currentSaveId !== saveRequestIdRef.current) {
        return;
      }

      const mapped = {};
      if (Array.isArray(err?.errors) && err.errors.length > 0) {
        for (const item of err.errors) {
          if (item.field && !mapped[item.field]) {
            mapped[item.field] = item.message;
          }
        }
      }

      if (err.status === 409 && Object.keys(mapped).length === 0) {
        mapped.student_code =
          err.message || "Student code already exists.";
      }

      if (Object.keys(mapped).length > 0) {
        setProfileFieldErrors(mapped);
      }

      if (err.status === 0) {
        setProfileError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 403) {
        setProfileError(
          err.message ||
          "You do not have permission to update this student's profile."
        );
      } else if (err.status === 404) {
        setProfileError(err.message || "Student account could not be found.");
      } else {
        setProfileError(err.message || "Failed to update student profile.");
      }
    } finally {
      if (currentSaveId === saveRequestIdRef.current) {
        setIsSavingProfile(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-details-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSavingProfile) onClose?.();
      }}
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id="student-details-title"
                className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {displayRecord.full_name || "Student Details"}
              </h2>
              {displayRecord.status && (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                >
                  {STATUS_LABELS[statusKey] || displayRecord.status}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {displayRecord.email || "Student account overview and enrollments"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingProfile}
            aria-label="Close drawer"
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
          {/* Admin / Super Admin Full Details */}
          {isAdminOrSuperAdmin ? (
            isLoadingDetails ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                Loading student details...
              </div>
            ) : detailsError ? (
              <div
                role="alert"
                className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/40 px-6 py-8 text-center dark:border-red-900/50 dark:bg-red-950/20"
              >
                <FiAlertTriangle className="mb-2 h-6 w-6 text-red-600" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {detailsError}
                </p>
                <Button
                  type="button"
                  onClick={fetchStudentDetails}
                  className="mt-4 px-5 py-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </Button>
              </div>
            ) : studentDetails ? (
              <>
                {/* Summary Cards: Completeness + Enrollment Summary */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {completeness && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Profile Completeness
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {completeness.percentage}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-[#163300] dark:bg-[#9FE870]"
                          style={{
                            width: `${Math.min(100, Math.max(0, completeness.percentage || 0))}%`,
                          }}
                        />
                      </div>
                      {Array.isArray(completeness.missing_fields) &&
                        completeness.missing_fields.length > 0 && (
                          <p className="mt-2 text-[11px] text-zinc-500">
                            Missing:{" "}
                            {completeness.missing_fields
                              .map(formatLabel)
                              .join(", ")}
                          </p>
                        )}
                    </div>
                  )}

                  {enrollmentSummary && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Enrollment Summary
                      </span>
                      <div className="mt-2 flex items-baseline gap-6">
                        <div>
                          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {enrollmentSummary.total_enrollments ?? 0}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Total Enrollments
                          </p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                            {enrollmentSummary.active_enrollments ?? 0}
                          </p>
                          <p className="text-[11px] text-zinc-500">Active</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Information */}
                <div>
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Account Information
                  </h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Full Name"
                      value={studentDetails.full_name}
                    />
                    <DetailItem label="Email" value={studentDetails.email} />
                    <DetailItem
                      label="Phone Number"
                      value={studentDetails.phone_number}
                    />
                    <DetailItem
                      label="Account Status"
                      value={
                        STATUS_LABELS[statusKey] || studentDetails.status
                      }
                    />
                    <DetailItem
                      label="Email Verified"
                      value={
                        studentDetails.email_verified_at
                          ? formatDateTime(studentDetails.email_verified_at)
                          : "Not verified"
                      }
                    />
                    <DetailItem
                      label="Last Login"
                      value={formatDateTime(
                        studentDetails.last_login_at,
                        "Never"
                      )}
                    />
                    <DetailItem
                      label="Registered"
                      value={formatDateTime(studentDetails.created_at)}
                    />
                    <DetailItem
                      label="Account Updated"
                      value={formatDateTime(studentDetails.updated_at)}
                    />
                  </dl>
                </div>

                {/* Student Profile */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Student Profile
                    </h3>
                    {canEditProfile && !isEditingProfile && (
                      <button
                        type="button"
                        onClick={handleStartEditProfile}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <FiEdit2 className="h-3.5 w-3.5" />
                        <span>{profile ? "Edit Profile" : "Create Profile"}</span>
                      </button>
                    )}
                  </div>

                  {profileSuccess && (
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
                      <span className="flex items-center gap-2">
                        <FiCheckCircle className="h-4 w-4 shrink-0" />
                        <span>{profileSuccess}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setProfileSuccess("")}
                        className="cursor-pointer text-emerald-700 hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {canEditProfile && isEditingProfile ? (
                    <form
                      onSubmit={handleSaveProfile}
                      noValidate
                      className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
                    >
                      {profileError && (
                        <div
                          role="alert"
                          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
                        >
                          {profileError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="student-profile-code"
                            className={LABEL_CLASS}
                          >
                            Student Code
                          </label>
                          <input
                            id="student-profile-code"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.student_code}
                            onChange={updateProfileField("student_code")}
                            placeholder="e.g. STU-2026-001"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.student_code && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.student_code}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-dob"
                            className={LABEL_CLASS}
                          >
                            Date of Birth
                          </label>
                          <input
                            id="student-profile-dob"
                            type="date"
                            disabled={isSavingProfile}
                            value={profileForm.date_of_birth}
                            onChange={updateProfileField("date_of_birth")}
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.date_of_birth && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.date_of_birth}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-gender"
                            className={LABEL_CLASS}
                          >
                            Gender
                          </label>
                          <select
                            id="student-profile-gender"
                            disabled={isSavingProfile}
                            value={profileForm.gender}
                            onChange={updateProfileField("gender")}
                            className={INPUT_CLASS}
                          >
                            {GENDER_OPTIONS.map((opt) => (
                              <option
                                key={opt.value || "empty"}
                                value={opt.value}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {profileFieldErrors.gender && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.gender}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-education"
                            className={LABEL_CLASS}
                          >
                            Education Level
                          </label>
                          <input
                            id="student-profile-education"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.education_level}
                            onChange={updateProfileField("education_level")}
                            placeholder="e.g. Undergraduate"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.education_level && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.education_level}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-institution"
                            className={LABEL_CLASS}
                          >
                            Institution
                          </label>
                          <input
                            id="student-profile-institution"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.institution}
                            onChange={updateProfileField("institution")}
                            placeholder="School or university"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.institution && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.institution}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-guardian-name"
                            className={LABEL_CLASS}
                          >
                            Guardian Name
                          </label>
                          <input
                            id="student-profile-guardian-name"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.guardian_name}
                            onChange={updateProfileField("guardian_name")}
                            placeholder="Guardian full name"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.guardian_name && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.guardian_name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-guardian-phone"
                            className={LABEL_CLASS}
                          >
                            Guardian Phone
                          </label>
                          <input
                            id="student-profile-guardian-phone"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.guardian_phone}
                            onChange={updateProfileField("guardian_phone")}
                            placeholder="e.g. +15551234567"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.guardian_phone && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.guardian_phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-city"
                            className={LABEL_CLASS}
                          >
                            City
                          </label>
                          <input
                            id="student-profile-city"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.city}
                            onChange={updateProfileField("city")}
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.city && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.city}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-state"
                            className={LABEL_CLASS}
                          >
                            State
                          </label>
                          <input
                            id="student-profile-state"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.state}
                            onChange={updateProfileField("state")}
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.state && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.state}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-country"
                            className={LABEL_CLASS}
                          >
                            Country
                          </label>
                          <input
                            id="student-profile-country"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.country}
                            onChange={updateProfileField("country")}
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.country && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.country}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-profile-postal-code"
                            className={LABEL_CLASS}
                          >
                            Postal Code
                          </label>
                          <input
                            id="student-profile-postal-code"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.postal_code}
                            onChange={updateProfileField("postal_code")}
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.postal_code && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.postal_code}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="student-profile-address"
                          className={LABEL_CLASS}
                        >
                          Address
                        </label>
                        <textarea
                          id="student-profile-address"
                          rows={2}
                          disabled={isSavingProfile}
                          value={profileForm.address}
                          onChange={updateProfileField("address")}
                          placeholder="Street address"
                          className={INPUT_CLASS}
                        />
                        {profileFieldErrors.address && (
                          <p className="mt-1 text-xs text-red-600">
                            {profileFieldErrors.address}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="student-profile-notes"
                          className={LABEL_CLASS}
                        >
                          Notes
                        </label>
                        <textarea
                          id="student-profile-notes"
                          rows={3}
                          disabled={isSavingProfile}
                          value={profileForm.notes}
                          onChange={updateProfileField("notes")}
                          placeholder="Internal student profile notes..."
                          className={INPUT_CLASS}
                        />
                        {profileFieldErrors.notes && (
                          <p className="mt-1 text-xs text-red-600">
                            {profileFieldErrors.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                        <button
                          type="button"
                          disabled={isSavingProfile}
                          onClick={handleCancelEditProfile}
                          className="cursor-pointer rounded-sm border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                        <Button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-5 py-2 text-xs"
                        >
                          {isSavingProfile ? "Saving..." : "Save Profile"}
                        </Button>
                      </div>
                    </form>
                  ) : !profile ? (
                    <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800">
                      No student profile record has been created yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailItem
                          label="Student Code"
                          value={profile.student_code}
                          mono
                        />
                        <DetailItem
                          label="Date of Birth"
                          value={profile.date_of_birth}
                        />
                        <DetailItem
                          label="Gender"
                          value={
                            GENDER_LABELS[profile.gender] || profile.gender
                          }
                        />
                        <DetailItem
                          label="Education Level"
                          value={profile.education_level}
                        />
                        <DetailItem
                          label="Institution"
                          value={profile.institution}
                        />
                        <DetailItem
                          label="Guardian Name"
                          value={profile.guardian_name}
                        />
                        <DetailItem
                          label="Guardian Phone"
                          value={profile.guardian_phone}
                        />
                        <DetailItem label="City" value={profile.city} />
                        <DetailItem label="State" value={profile.state} />
                        <DetailItem label="Country" value={profile.country} />
                        <DetailItem
                          label="Postal Code"
                          value={profile.postal_code}
                        />
                        <DetailItem
                          label="Profile Updated"
                          value={formatDateTime(profile.updated_at)}
                        />
                      </dl>

                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          Address
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
                          {profile.address || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
                          {profile.notes || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null
          ) : (
            /* Staff Read-Only Basic Summary (Listing Row Data Only) */
            <div>
              <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                Showing basic student summary and enrollment history. Detailed
                personal profile fields are restricted to Admin and Super Admin.
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Student Code"
                  value={studentSummary.student_code}
                  mono
                />
                <DetailItem
                  label="Full Name"
                  value={studentSummary.full_name}
                />
                <DetailItem label="Email" value={studentSummary.email} />
                <DetailItem
                  label="Phone Number"
                  value={studentSummary.phone_number}
                />
                <DetailItem
                  label="Account Status"
                  value={STATUS_LABELS[statusKey] || studentSummary.status}
                />
                <DetailItem
                  label="Registration Date"
                  value={formatDate(studentSummary.created_at)}
                />
              </dl>
            </div>
          )}

          {/* Enrollment History (All Authorized Roles) */}
          {canReadEnrollments && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Enrollment History ({enrollPagination.total ?? 0})
                </h3>
              </div>

              {isLoadingEnrollments ? (
                <div className="rounded-lg border border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
                  Loading student enrollments...
                </div>
              ) : enrollmentsError ? (
                <div
                  role="alert"
                  className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50/40 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-950/20"
                >
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    {enrollmentsError}
                  </p>
                  <Button
                    type="button"
                    onClick={fetchStudentEnrollments}
                    className="mt-3 px-4 py-1.5 text-xs"
                  >
                    <FiRefreshCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                  </Button>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
                  No enrollments found for this student.
                </div>
              ) : (
                <>
                  <ul className="space-y-2.5">
                    {enrollments.map((enrollment) => {
                      const enrollStatusKey = (
                        enrollment.enrollment_status || ""
                      ).toLowerCase();
                      const enrollStyle =
                        ENROLLMENT_STATUS_STYLES[enrollStatusKey] ||
                        "border-zinc-200 bg-zinc-100 text-zinc-600";

                      return (
                        <li
                          key={enrollment.id}
                          className="rounded-lg border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {enrollment.enrollment_number || "Enrollment"}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {enrollment.enrollment_status && (
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${enrollStyle}`}
                                >
                                  {formatLabel(enrollment.enrollment_status)}
                                </span>
                              )}
                              {enrollment.registration_status && (
                                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                                  Reg: {formatLabel(enrollment.registration_status)}
                                </span>
                              )}
                              {enrollment.payment_status && (
                                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                                  Pay: {formatLabel(enrollment.payment_status)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-[11px] text-zinc-500">
                                Total Fee
                              </span>
                              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                                {formatAmount(enrollment.total_fee)}
                              </p>
                            </div>
                            <div>
                              <span className="text-[11px] text-zinc-500">
                                Paid
                              </span>
                              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                                {formatAmount(enrollment.paid_amount)}
                              </p>
                            </div>
                            <div>
                              <span className="text-[11px] text-zinc-500">
                                Pending
                              </span>
                              <p className="font-medium text-amber-700 dark:text-amber-400">
                                {formatAmount(enrollment.pending_amount)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                            <span>
                              Registered:{" "}
                              {formatDate(
                                enrollment.registered_at || enrollment.created_at
                              )}
                            </span>
                            {enrollment.enrolled_at && (
                              <span>
                                Enrolled: {formatDate(enrollment.enrolled_at)}
                              </span>
                            )}
                            {enrollment.dropped_at && (
                              <span>
                                Dropped: {formatDate(enrollment.dropped_at)}
                              </span>
                            )}
                          </div>

                          {enrollment.drop_reason && (
                            <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                              Drop Reason: {enrollment.drop_reason}
                            </p>
                          )}
                          {enrollment.notes && (
                            <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                              Notes: {enrollment.notes}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Independent Enrollment Pagination */}
                  <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    <span>
                      Page{" "}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {enrollPagination.page || enrollPage}
                      </strong>{" "}
                      of{" "}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {safeEnrollTotalPages}
                      </strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={enrollPage <= 1 || isLoadingEnrollments}
                        onClick={() => setEnrollPage((p) => Math.max(1, p - 1))}
                        className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={
                          enrollPage >= safeEnrollTotalPages ||
                          isLoadingEnrollments
                        }
                        onClick={() => setEnrollPage((p) => p + 1)}
                        className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            disabled={isSavingProfile}
            onClick={onClose}
            className="cursor-pointer rounded-sm border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
