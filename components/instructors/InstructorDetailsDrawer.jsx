"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiExternalLink,
  FiPlus,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import {
  getInstructorByIdApi,
  upsertInstructorProfileApi,
} from "@/lib/instructorApi";
import { Button } from "@/components/Button";

const ADMIN_DETAIL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

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

const EMPLOYMENT_LABELS = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  visiting: "Visiting",
};

const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "visiting", label: "Visiting" },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

const LABEL_CLASS = "mb-1 block text-xs font-semibold text-text-secondary";

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
}

function formatDateTime(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function formatLabel(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function buildProfileForm(profile) {
  return {
    instructor_code: profile?.instructor_code || "",
    headline: profile?.headline || "",
    bio: profile?.bio || "",
    qualification: profile?.qualification || "",
    specialization: profile?.specialization || "",
    expertise_areas: Array.isArray(profile?.expertise_areas)
      ? [...profile.expertise_areas]
      : [],
    years_of_experience:
      profile?.years_of_experience !== null &&
      profile?.years_of_experience !== undefined
        ? String(profile.years_of_experience)
        : "",
    employment_type: profile?.employment_type || "",
    linkedin_url: profile?.linkedin_url || "",
    portfolio_url: profile?.portfolio_url || "",
    is_teaching_eligible:
      typeof profile?.is_teaching_eligible === "boolean"
        ? profile.is_teaching_eligible
        : true,
    notes: profile?.notes || "",
  };
}

function normalizeProfileValues(form) {
  const yearsStr = String(form.years_of_experience ?? "").trim();
  const expertise = Array.isArray(form.expertise_areas)
    ? form.expertise_areas.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    instructor_code: String(form.instructor_code ?? "").trim() || null,
    headline: String(form.headline ?? "").trim() || null,
    bio: String(form.bio ?? "").trim() || null,
    qualification: String(form.qualification ?? "").trim() || null,
    specialization: String(form.specialization ?? "").trim() || null,
    expertise_areas: expertise.length > 0 ? expertise : null,
    years_of_experience: yearsStr ? Number(yearsStr) : null,
    employment_type: String(form.employment_type ?? "").trim() || null,
    linkedin_url: String(form.linkedin_url ?? "").trim() || null,
    portfolio_url: String(form.portfolio_url ?? "").trim() || null,
    is_teaching_eligible: Boolean(form.is_teaching_eligible),
    notes: String(form.notes ?? "").trim() || null,
  };
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

function validateProfileForm(form) {
  const errors = {};

  const instructorCode = String(form.instructor_code ?? "").trim();
  const headline = String(form.headline ?? "").trim();
  const bio = String(form.bio ?? "").trim();
  const qualification = String(form.qualification ?? "").trim();
  const specialization = String(form.specialization ?? "").trim();
  const yearsStr = String(form.years_of_experience ?? "").trim();
  const employmentType = String(form.employment_type ?? "").trim();
  const linkedinUrl = String(form.linkedin_url ?? "").trim();
  const portfolioUrl = String(form.portfolio_url ?? "").trim();
  const notes = String(form.notes ?? "").trim();
  const expertise = Array.isArray(form.expertise_areas)
    ? form.expertise_areas
    : [];

  if (
    instructorCode &&
    (instructorCode.length < 2 || instructorCode.length > 50)
  ) {
    errors.instructor_code =
      "Instructor code must be between 2 and 50 characters.";
  }

  if (headline.length > 255) {
    errors.headline = "Headline cannot exceed 255 characters.";
  }

  if (bio.length > 5000) {
    errors.bio = "Bio cannot exceed 5000 characters.";
  }

  if (qualification.length > 255) {
    errors.qualification = "Qualification cannot exceed 255 characters.";
  }

  if (specialization.length > 255) {
    errors.specialization = "Specialization cannot exceed 255 characters.";
  }

  if (expertise.length > 20) {
    errors.expertise_areas = "Expertise areas cannot exceed 20 items.";
  } else {
    const seen = new Set();
    for (const item of expertise) {
      const trimmed = String(item ?? "").trim();
      if (!trimmed || trimmed.length > 50) {
        errors.expertise_areas =
          "Each expertise area must be between 1 and 50 characters.";
        break;
      }
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) {
        errors.expertise_areas = "Duplicate expertise areas are not allowed.";
        break;
      }
      seen.add(lower);
    }
  }

  if (yearsStr) {
    if (!/^\d+$/.test(yearsStr)) {
      errors.years_of_experience =
        "Years of experience must be a whole number between 0 and 70.";
    } else {
      const parsedYears = Number(yearsStr);
      if (parsedYears < 0 || parsedYears > 70) {
        errors.years_of_experience =
          "Years of experience must be between 0 and 70.";
      }
    }
  }

  if (
    employmentType &&
    !["full_time", "part_time", "contract", "visiting"].includes(employmentType)
  ) {
    errors.employment_type = "Please select a valid employment type.";
  }

  if (linkedinUrl) {
    if (linkedinUrl.length > 500) {
      errors.linkedin_url = "LinkedIn URL cannot exceed 500 characters.";
    } else if (!isValidHttpUrl(linkedinUrl)) {
      errors.linkedin_url = "LinkedIn URL must be a valid HTTP or HTTPS URL.";
    }
  }

  if (portfolioUrl) {
    if (portfolioUrl.length > 500) {
      errors.portfolio_url = "Portfolio URL cannot exceed 500 characters.";
    } else if (!isValidHttpUrl(portfolioUrl)) {
      errors.portfolio_url =
        "Portfolio URL must be a valid HTTP or HTTPS URL.";
    }
  }

  if (notes.length > 5000) {
    errors.notes = "Notes cannot exceed 5000 characters.";
  }

  return errors;
}

function DetailItem({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-subtle px-3.5 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-sm text-text-primary ${
          mono ? "font-mono text-xs" : "font-medium"
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

export function InstructorDetailsDrawer({
  instructorSummary,
  onClose,
  onUpdated,
}) {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();

  const userId = instructorSummary?.user_id || "";
  const isAdminOrSuperAdmin = hasAnyRole(ADMIN_DETAIL_ROLES);
  const canEditProfile =
    isAdminOrSuperAdmin && hasPermission(PERMISSIONS.USERS_MANAGE);

  const [instructorDetails, setInstructorDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(
    Boolean(isAdminOrSuperAdmin)
  );
  const [detailsError, setDetailsError] = useState("");

  // Profile create/edit state (Admin / Super Admin only)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(null));
  const [expertiseInput, setExpertiseInput] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const detailRequestIdRef = useRef(0);
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

  const fetchInstructorDetails = useCallback(async () => {
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
      const res = await getInstructorByIdApi(userId);
      if (currentRequestId !== detailRequestIdRef.current) {
        return;
      }

      const fetched = res?.data?.instructor || null;
      if (!fetched) {
        setInstructorDetails(null);
        setDetailsError("Instructor record is unavailable.");
      } else {
        setInstructorDetails(fetched);
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
        setDetailsError("This instructor could not be found.");
      } else if (err.status === 403) {
        setDetailsError(
          err.message ||
            "You do not have permission to view instructor details."
        );
      } else {
        setDetailsError(err.message || "Unable to load instructor details.");
      }
    } finally {
      if (currentRequestId === detailRequestIdRef.current) {
        setIsLoadingDetails(false);
      }
    }
  }, [isCheckingAuth, isAuthenticated, isAdminOrSuperAdmin, userId]);

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
      fetchInstructorDetails();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    isCheckingAuth,
    isAuthenticated,
    isAdminOrSuperAdmin,
    userId,
    fetchInstructorDetails,
  ]);

  if (!instructorSummary) return null;

  const displayRecord = instructorDetails || instructorSummary;
  const statusKey = (displayRecord?.status || "inactive").toLowerCase();
  const statusStyle =
    STATUS_STYLES[statusKey] || "border-zinc-200 bg-zinc-100 text-zinc-600";

  const profile = instructorDetails?.profile || null;
  const completeness = instructorDetails?.profile_completeness || null;

  const handleStartEditProfile = () => {
    if (!canEditProfile || !instructorDetails || isSavingProfile) return;
    setProfileForm(buildProfileForm(instructorDetails.profile));
    setExpertiseInput("");
    setProfileFieldErrors({});
    setProfileError("");
    setProfileSuccess("");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    if (isSavingProfile) return;
    setIsEditingProfile(false);
    setExpertiseInput("");
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

  const handleAddExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (!trimmed) return;

    if (trimmed.length > 50) {
      setProfileFieldErrors((prev) => ({
        ...prev,
        expertise_areas: "Each expertise area cannot exceed 50 characters.",
      }));
      return;
    }

    const currentList = Array.isArray(profileForm.expertise_areas)
      ? profileForm.expertise_areas
      : [];

    if (currentList.length >= 20) {
      setProfileFieldErrors((prev) => ({
        ...prev,
        expertise_areas: "Expertise areas cannot exceed 20 items.",
      }));
      return;
    }

    const isDuplicate = currentList.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setProfileFieldErrors((prev) => ({
        ...prev,
        expertise_areas: "Duplicate expertise areas are not allowed.",
      }));
      return;
    }

    setProfileForm((prev) => ({
      ...prev,
      expertise_areas: [...currentList, trimmed],
    }));
    setExpertiseInput("");
    if (profileFieldErrors.expertise_areas) {
      setProfileFieldErrors((prev) => ({ ...prev, expertise_areas: "" }));
    }
    if (profileError) setProfileError("");
  };

  const handleRemoveExpertise = (indexToRemove) => {
    if (isSavingProfile) return;
    setProfileForm((prev) => ({
      ...prev,
      expertise_areas: (prev.expertise_areas || []).filter(
        (_, idx) => idx !== indexToRemove
      ),
    }));
    if (profileFieldErrors.expertise_areas) {
      setProfileFieldErrors((prev) => ({ ...prev, expertise_areas: "" }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (
      isSavingProfile ||
      isCheckingAuth ||
      !isAuthenticated ||
      !canEditProfile ||
      !userId ||
      !instructorDetails
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

    const isCreatingNewProfile = !instructorDetails.profile;
    const baseline = normalizeProfileValues(
      buildProfileForm(instructorDetails.profile)
    );
    const current = normalizeProfileValues(profileForm);
    const payload = {};

    if (isCreatingNewProfile) {
      for (const [key, val] of Object.entries(current)) {
        if (val !== null) {
          payload[key] = val;
        }
      }
      // Ensure explicit boolean is always included on profile creation
      payload.is_teaching_eligible = Boolean(current.is_teaching_eligible);
    } else {
      for (const key of Object.keys(current)) {
        const changed =
          key === "expertise_areas"
            ? !arraysEqual(current[key], baseline[key])
            : current[key] !== baseline[key];
        if (changed) {
          payload[key] = current[key];
        }
      }
    }

    if (Object.keys(payload).length === 0) {
      setProfileError(
        "No changes detected. Modify at least one profile field before saving."
      );
      return;
    }

    const hasNonEmptyValue = Object.values(payload).some(
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
      await upsertInstructorProfileApi(targetUserId, payload);
      if (currentSaveId !== saveRequestIdRef.current) {
        return;
      }

      setIsEditingProfile(false);
      setExpertiseInput("");
      setProfileFieldErrors({});
      setProfileSuccess(
        isCreatingNewProfile
          ? "Instructor profile created successfully."
          : "Instructor profile updated successfully."
      );
      await fetchInstructorDetails();
      await onUpdated?.();
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
        mapped.instructor_code =
          err.message || "Instructor code already exists.";
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
            "You do not have permission to update this instructor's profile."
        );
      } else if (err.status === 404) {
        setProfileError(
          err.message || "Instructor account could not be found."
        );
      } else {
        setProfileError(
          err.message || "Failed to update instructor profile."
        );
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
      aria-labelledby="instructor-details-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSavingProfile) onClose?.();
      }}
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-border-default bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border-default px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id="instructor-details-title"
                className="truncate text-lg font-semibold text-text-primary"
              >
                {displayRecord.full_name || "Instructor Details"}
              </h2>
              {displayRecord.status && (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                >
                  {STATUS_LABELS[statusKey] || displayRecord.status}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  displayRecord.effective_teaching_eligible
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-100 text-zinc-600"
                }`}
              >
                {displayRecord.effective_teaching_eligible
                  ? "Teaching Eligible"
                  : "Not Eligible"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {displayRecord.email || "Instructor account and profile overview"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingProfile}
            aria-label="Close drawer"
            className="cursor-pointer rounded-md p-1.5 text-text-subtle hover:bg-neutral-hover hover:text-text-secondary disabled:opacity-50"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
          {isAdminOrSuperAdmin ? (
            isLoadingDetails ? (
              <div className="py-12 text-center text-sm text-text-muted">
                Loading instructor details...
              </div>
            ) : detailsError ? (
              <div
                role="alert"
                className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/40 px-6 py-10 text-center dark:border-red-900/50 dark:bg-red-950/20"
              >
                <FiAlertTriangle className="mb-2 h-6 w-6 text-red-600" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {detailsError}
                </p>
                <Button
                  type="button"
                  onClick={fetchInstructorDetails}
                  className="mt-4 px-5 py-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </Button>
              </div>
            ) : instructorDetails ? (
              <>
                {/* Summary Cards: Completeness + Teaching Eligibility */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {completeness && (
                    <div className="rounded-xl border border-border-default bg-surface-subtle p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Profile Completeness
                        </span>
                        <span className="text-sm font-semibold text-text-primary">
                          {completeness.percentage}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, Math.max(0, completeness.percentage || 0))}%`,
                          }}
                        />
                      </div>
                      {Array.isArray(completeness.missing_fields) &&
                        completeness.missing_fields.length > 0 && (
                          <p className="mt-2 text-[11px] text-text-muted">
                            Missing:{" "}
                            {completeness.missing_fields
                              .map(formatLabel)
                              .join(", ")}
                          </p>
                        )}
                    </div>
                  )}

                  <div className="rounded-xl border border-border-default bg-surface-subtle p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Course &amp; Batch Assignment
                    </span>
                    <p className="mt-2 text-sm font-semibold text-text-primary">
                      {instructorDetails.effective_teaching_eligible
                        ? "Available for Assignment"
                        : "Unavailable for Assignment"}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">
                      Requires an active account and profile teaching
                      eligibility enabled.
                    </p>
                  </div>
                </div>

                {/* Account Information */}
                <div>
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Account Information
                  </h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Full Name"
                      value={instructorDetails.full_name}
                    />
                    <DetailItem label="Email" value={instructorDetails.email} />
                    <DetailItem
                      label="Phone Number"
                      value={instructorDetails.phone_number}
                    />
                    <DetailItem
                      label="Account Status"
                      value={
                        STATUS_LABELS[statusKey] || instructorDetails.status
                      }
                    />
                    <DetailItem
                      label="Email Verified"
                      value={
                        instructorDetails.email_verified_at
                          ? formatDateTime(instructorDetails.email_verified_at)
                          : "Not verified"
                      }
                    />
                    <DetailItem
                      label="Last Login"
                      value={formatDateTime(
                        instructorDetails.last_login_at,
                        "Never"
                      )}
                    />
                    <DetailItem
                      label="Registered"
                      value={formatDateTime(instructorDetails.created_at)}
                    />
                    <DetailItem
                      label="Account Updated"
                      value={formatDateTime(instructorDetails.updated_at)}
                    />
                  </dl>
                </div>

                {/* Instructor Profile Section */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Instructor Profile
                    </h3>
                    {canEditProfile && !isEditingProfile && (
                      <button
                        type="button"
                        onClick={handleStartEditProfile}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border-default px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover"
                      >
                        <FiEdit2 className="h-3.5 w-3.5" />
                        <span>
                          {profile ? "Edit Profile" : "Create Profile"}
                        </span>
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
                      className="space-y-4 rounded-xl border border-border-default bg-surface-subtle p-4"
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
                            htmlFor="instructor-profile-code"
                            className={LABEL_CLASS}
                          >
                            Instructor Code
                          </label>
                          <input
                            id="instructor-profile-code"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.instructor_code}
                            onChange={updateProfileField("instructor_code")}
                            placeholder="e.g. INST-2026-001"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.instructor_code && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.instructor_code}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="instructor-profile-employment"
                            className={LABEL_CLASS}
                          >
                            Employment Type
                          </label>
                          <select
                            id="instructor-profile-employment"
                            disabled={isSavingProfile}
                            value={profileForm.employment_type}
                            onChange={updateProfileField("employment_type")}
                            className={INPUT_CLASS}
                          >
                            {EMPLOYMENT_OPTIONS.map((opt) => (
                              <option
                                key={opt.value || "empty"}
                                value={opt.value}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {profileFieldErrors.employment_type && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.employment_type}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="instructor-profile-headline"
                            className={LABEL_CLASS}
                          >
                            Headline
                          </label>
                          <input
                            id="instructor-profile-headline"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.headline}
                            onChange={updateProfileField("headline")}
                            placeholder="e.g. Senior Full-Stack Instructor"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.headline && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.headline}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="instructor-profile-experience"
                            className={LABEL_CLASS}
                          >
                            Years of Experience
                          </label>
                          <input
                            id="instructor-profile-experience"
                            type="number"
                            min="0"
                            max="70"
                            step="1"
                            disabled={isSavingProfile}
                            value={profileForm.years_of_experience}
                            onChange={updateProfileField("years_of_experience")}
                            placeholder="0–70"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.years_of_experience && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.years_of_experience}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="instructor-profile-qualification"
                            className={LABEL_CLASS}
                          >
                            Qualification
                          </label>
                          <input
                            id="instructor-profile-qualification"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.qualification}
                            onChange={updateProfileField("qualification")}
                            placeholder="e.g. M.Sc. Computer Science"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.qualification && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.qualification}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="instructor-profile-specialization"
                            className={LABEL_CLASS}
                          >
                            Specialization
                          </label>
                          <input
                            id="instructor-profile-specialization"
                            type="text"
                            disabled={isSavingProfile}
                            value={profileForm.specialization}
                            onChange={updateProfileField("specialization")}
                            placeholder="e.g. Distributed Systems"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.specialization && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.specialization}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="instructor-profile-linkedin"
                            className={LABEL_CLASS}
                          >
                            LinkedIn URL
                          </label>
                          <input
                            id="instructor-profile-linkedin"
                            type="url"
                            disabled={isSavingProfile}
                            value={profileForm.linkedin_url}
                            onChange={updateProfileField("linkedin_url")}
                            placeholder="https://linkedin.com/in/..."
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.linkedin_url && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.linkedin_url}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="instructor-profile-portfolio"
                            className={LABEL_CLASS}
                          >
                            Portfolio URL
                          </label>
                          <input
                            id="instructor-profile-portfolio"
                            type="url"
                            disabled={isSavingProfile}
                            value={profileForm.portfolio_url}
                            onChange={updateProfileField("portfolio_url")}
                            placeholder="https://example.com"
                            className={INPUT_CLASS}
                          />
                          {profileFieldErrors.portfolio_url && (
                            <p className="mt-1 text-xs text-red-600">
                              {profileFieldErrors.portfolio_url}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expertise Areas */}
                      <div>
                        <label
                          htmlFor="instructor-profile-expertise"
                          className={LABEL_CLASS}
                        >
                          Expertise Areas{" "}
                          <span className="font-normal text-text-subtle">
                            ({profileForm.expertise_areas.length}/20)
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="instructor-profile-expertise"
                            type="text"
                            disabled={isSavingProfile}
                            value={expertiseInput}
                            onChange={(e) => setExpertiseInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddExpertise();
                              }
                            }}
                            placeholder="Add expertise area (e.g. React, PostgreSQL)..."
                            className={INPUT_CLASS}
                          />
                          <button
                            type="button"
                            disabled={isSavingProfile || !expertiseInput.trim()}
                            onClick={handleAddExpertise}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-border-default bg-surface px-3 py-2 text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FiPlus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                        {profileForm.expertise_areas.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {profileForm.expertise_areas.map((area, idx) => (
                              <span
                                key={`${area}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft-border bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-accent"
                              >
                                <span>{area}</span>
                                <button
                                  type="button"
                                  disabled={isSavingProfile}
                                  onClick={() => handleRemoveExpertise(idx)}
                                  aria-label={`Remove ${area}`}
                                  className="cursor-pointer rounded-full hover:opacity-75 disabled:opacity-50"
                                >
                                  <FiX className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {profileFieldErrors.expertise_areas && (
                          <p className="mt-1 text-xs text-red-600">
                            {profileFieldErrors.expertise_areas}
                          </p>
                        )}
                      </div>

                      {/* Teaching Eligibility Toggle */}
                      <div className="rounded-lg border border-border-default bg-surface p-3.5">
                        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-text-primary">
                          <input
                            type="checkbox"
                            checked={Boolean(profileForm.is_teaching_eligible)}
                            disabled={isSavingProfile}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                is_teaching_eligible: e.target.checked,
                              }))
                            }
                            className="mt-0.5 h-4 w-4 rounded border-border-strong accent-primary-active"
                          />
                          <span>
                            <span className="font-semibold">
                              Eligible for Teaching Assignments
                            </span>
                            <span className="mt-0.5 block text-[11px] text-text-muted">
                              When enabled (alongside an active account), this
                              instructor can be assigned to Courses and Batches.
                            </span>
                          </span>
                        </label>
                      </div>

                      <div>
                        <label
                          htmlFor="instructor-profile-bio"
                          className={LABEL_CLASS}
                        >
                          Bio
                        </label>
                        <textarea
                          id="instructor-profile-bio"
                          rows={3}
                          disabled={isSavingProfile}
                          value={profileForm.bio}
                          onChange={updateProfileField("bio")}
                          placeholder="Short instructor biography..."
                          className={INPUT_CLASS}
                        />
                        {profileFieldErrors.bio && (
                          <p className="mt-1 text-xs text-red-600">
                            {profileFieldErrors.bio}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="instructor-profile-notes"
                          className={LABEL_CLASS}
                        >
                          Notes
                        </label>
                        <textarea
                          id="instructor-profile-notes"
                          rows={3}
                          disabled={isSavingProfile}
                          value={profileForm.notes}
                          onChange={updateProfileField("notes")}
                          placeholder="Internal admin notes..."
                          className={INPUT_CLASS}
                        />
                        {profileFieldErrors.notes && (
                          <p className="mt-1 text-xs text-red-600">
                            {profileFieldErrors.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-border-default pt-3">
                        <button
                          type="button"
                          disabled={isSavingProfile}
                          onClick={handleCancelEditProfile}
                          className="cursor-pointer rounded-sm border border-border-default bg-surface px-4 py-2 text-xs font-medium text-text-secondary transition hover:bg-neutral-hover disabled:opacity-50"
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
                    <div className="rounded-lg border border-dashed border-border-default px-4 py-5 text-center text-xs text-text-muted">
                      No instructor profile record has been created yet. Create
                      a profile to configure specialization and teaching
                      eligibility.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailItem
                          label="Instructor Code"
                          value={profile.instructor_code}
                          mono
                        />
                        <DetailItem
                          label="Headline"
                          value={profile.headline}
                        />
                        <DetailItem
                          label="Qualification"
                          value={profile.qualification}
                        />
                        <DetailItem
                          label="Specialization"
                          value={profile.specialization}
                        />
                        <DetailItem
                          label="Years of Experience"
                          value={
                            profile.years_of_experience !== null &&
                            profile.years_of_experience !== undefined
                              ? `${profile.years_of_experience} ${
                                  profile.years_of_experience === 1
                                    ? "year"
                                    : "years"
                                }`
                              : "—"
                          }
                        />
                        <DetailItem
                          label="Employment Type"
                          value={
                            EMPLOYMENT_LABELS[profile.employment_type] ||
                            profile.employment_type
                          }
                        />
                        <DetailItem
                          label="Profile Teaching Eligible"
                          value={
                            profile.is_teaching_eligible ? "Yes" : "No"
                          }
                        />
                        <DetailItem
                          label="Profile Updated"
                          value={formatDateTime(profile.updated_at)}
                        />
                      </dl>

                      {/* Expertise Areas */}
                      <div className="rounded-lg border border-border-default bg-surface-subtle px-3.5 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Expertise Areas
                        </p>
                        {Array.isArray(profile.expertise_areas) &&
                        profile.expertise_areas.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {profile.expertise_areas.map((area, idx) => (
                              <span
                                key={`${area}-${idx}`}
                                className="inline-flex items-center rounded-full border border-brand-soft-border bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-accent"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-text-muted">—</p>
                        )}
                      </div>

                      {/* Links */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border-default bg-surface-subtle px-3.5 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                            LinkedIn URL
                          </p>
                          {profile.linkedin_url ? (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 break-all text-xs font-medium text-brand-accent underline"
                            >
                              <span>{profile.linkedin_url}</span>
                              <FiExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <p className="mt-1 text-sm text-text-muted">—</p>
                          )}
                        </div>

                        <div className="rounded-lg border border-border-default bg-surface-subtle px-3.5 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                            Portfolio URL
                          </p>
                          {profile.portfolio_url ? (
                            <a
                              href={profile.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 break-all text-xs font-medium text-brand-accent underline"
                            >
                              <span>{profile.portfolio_url}</span>
                              <FiExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <p className="mt-1 text-sm text-text-muted">—</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border-default bg-surface-subtle px-3.5 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Bio
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                          {profile.bio || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-border-default bg-surface-subtle px-3.5 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                          {profile.notes || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null
          ) : (
            /* Staff Read-Only Listing Summary */
            <div>
              <div className="mb-3 rounded-lg border border-border-default bg-surface-subtle px-3.5 py-2.5 text-xs text-text-muted">
                Showing basic instructor summary. Detailed profile fields and
                profile editing are restricted to Admin and Super Admin.
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Instructor Code"
                  value={instructorSummary.instructor_code}
                  mono
                />
                <DetailItem
                  label="Full Name"
                  value={instructorSummary.full_name}
                />
                <DetailItem label="Email" value={instructorSummary.email} />
                <DetailItem
                  label="Phone Number"
                  value={instructorSummary.phone_number}
                />
                <DetailItem
                  label="Specialization"
                  value={instructorSummary.specialization}
                />
                <DetailItem
                  label="Employment Type"
                  value={
                    EMPLOYMENT_LABELS[instructorSummary.employment_type] ||
                    instructorSummary.employment_type
                  }
                />
                <DetailItem
                  label="Account Status"
                  value={STATUS_LABELS[statusKey] || instructorSummary.status}
                />
                <DetailItem
                  label="Teaching Eligibility"
                  value={
                    instructorSummary.effective_teaching_eligible
                      ? "Eligible"
                      : "Not Eligible"
                  }
                />
                <DetailItem
                  label="Created Date"
                  value={formatDate(instructorSummary.created_at)}
                />
              </dl>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end border-t border-border-default bg-surface px-6 py-4">
          <button
            type="button"
            disabled={isSavingProfile}
            onClick={onClose}
            className="cursor-pointer rounded-sm border border-border-default px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-neutral-hover disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
