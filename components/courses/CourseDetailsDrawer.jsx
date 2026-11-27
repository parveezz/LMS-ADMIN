"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiExternalLink,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import {
  getCourseByIdApi,
  updateCourseStatusApi,
} from "@/lib/courseApi";
import { Button } from "@/components/Button";
import { CourseInstructorManager } from "@/components/courses/CourseInstructorManager";
import { EditCourseDrawer } from "@/components/courses/EditCourseDrawer";

const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All Levels",
};

const STATUS_LABELS = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const STATUS_STYLES = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

const EDIT_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const ALLOWED_STATUS_ACTIONS = {
  draft: [
    {
      nextStatus: "published",
      label: "Publish Course",
      confirmLabel: "Confirm Publish",
      description:
        "Target status: Published. Publishing makes this course live and requires at least one active, teaching-eligible assigned instructor.",
      buttonClass:
        "border-primary bg-primary text-primary-foreground hover:bg-primary-hover",
    },
    {
      nextStatus: "archived",
      label: "Archive Course",
      confirmLabel: "Confirm Archive",
      description:
        "Target status: Archived. Archiving retires this draft course. You can restore it to Draft later.",
      buttonClass:
        "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
    },
  ],
  published: [
    {
      nextStatus: "draft",
      label: "Revert to Draft",
      confirmLabel: "Confirm Revert to Draft",
      description:
        "Target status: Draft. Reverting moves this published course back to Draft status.",
      buttonClass:
        "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
    },
    {
      nextStatus: "archived",
      label: "Archive Course",
      confirmLabel: "Confirm Archive",
      description:
        "Target status: Archived. Archiving retires this published course. You can restore it to Draft later.",
      buttonClass:
        "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
    },
  ],
  archived: [
    {
      nextStatus: "draft",
      label: "Restore to Draft",
      confirmLabel: "Confirm Restore to Draft",
      description:
        "Target status: Draft. Restoring moves this archived course back to Draft status.",
      buttonClass:
        "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    },
  ],
};

function formatDateTime(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function formatFee(value) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  if (numeric === 0) return "Free";
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDuration(hours) {
  if (hours === null || hours === undefined || hours === "") return "—";
  const numeric = Number(hours);
  if (Number.isNaN(numeric)) return "—";
  return `${numeric} ${numeric === 1 ? "hour" : "hours"}`;
}

function DetailItem({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-zinc-900 dark:text-zinc-100 ${mono ? "font-mono text-xs" : "font-medium"
          }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

export function CourseDetailsDrawer({ courseId, onClose, onUpdated }) {
  const { hasPermission, hasAnyRole } = useAuth();
  const canEditCourse =
    hasPermission(PERMISSIONS.COURSES_UPDATE) && hasAnyRole(EDIT_ROLES);
  const canPublishCourse =
    hasPermission(PERMISSIONS.COURSES_PUBLISH) && hasAnyRole(EDIT_ROLES);

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [pendingStatusAction, setPendingStatusAction] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const requestIdRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const isEditOpenRef = useRef(isEditOpen);
  const isTransitioningRef = useRef(isTransitioning);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isEditOpenRef.current = isEditOpen;
  }, [isEditOpen]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (
        e.key === "Escape" &&
        !isEditOpenRef.current &&
        !isTransitioningRef.current
      ) {
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

  const fetchCourseDetails = useCallback(async () => {
    if (!courseId) return;

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      const res = await getCourseByIdApi(courseId);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const fetched = res?.data?.course || null;
      if (!fetched) {
        setCourse(null);
        setError("Course record is unavailable.");
      } else {
        setCourse(fetched);
      }
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (err.status === 0) {
        setError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 404) {
        setError("This course could not be found.");
      } else if (err.status === 403) {
        setError(
          err.message || "You do not have permission to view this course."
        );
      } else {
        setError(err.message || "Unable to load course details.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [courseId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourseDetails();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCourseDetails]);

  const handleCourseUpdated = async () => {
    setStatusError("");
    setSuccessMessage("Course updated successfully.");
    await fetchCourseDetails();
    onUpdated?.();
  };

  const handleInstructorsChanged = async () => {
    await fetchCourseDetails();
    onUpdated?.();
  };

  const handleConfirmStatusTransition = async () => {
    if (!course || !pendingStatusAction || isTransitioning) return;

    const targetStatus = pendingStatusAction.nextStatus;
    setIsTransitioning(true);
    setStatusError("");
    setSuccessMessage("");

    try {
      await updateCourseStatusApi(course.id, { status: targetStatus });
      setPendingStatusAction(null);
      setSuccessMessage(
        `Course status updated to ${STATUS_LABELS[targetStatus] || targetStatus}.`
      );
      await fetchCourseDetails();
      onUpdated?.();
    } catch (err) {
      setPendingStatusAction(null);
      if (err.status === 0) {
        setStatusError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 403) {
        setStatusError(
          err.message ||
          "You do not have permission to change this course's status."
        );
      } else if (err.status === 404) {
        setStatusError(err.message || "This course could not be found.");
      } else {
        setStatusError(
          err.message || "Unable to update course status. Please try again."
        );
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  const statusKey = (course?.status || "").toLowerCase();
  const statusStyle =
    STATUS_STYLES[statusKey] ||
    "border-zinc-200 bg-zinc-100 text-zinc-600";
  const instructors = Array.isArray(course?.instructors)
    ? course.instructors
    : [];
  const availableStatusActions = canPublishCourse
    ? ALLOWED_STATUS_ACTIONS[statusKey] || []
    : [];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-details-title"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isTransitioning) onClose?.();
        }}
      >
        <div className="flex h-full w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id="course-details-title"
                  className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {course?.title || "Course Details"}
                </h2>
                {course?.status && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                  >
                    {STATUS_LABELS[statusKey] || course.status}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {course?.course_code
                  ? `Course Code: ${course.course_code}`
                  : "View full course metadata and assigned instructors."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isTransitioning}
              aria-label="Close drawer"
              className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">
            {statusError && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
              >
                <span className="flex items-start gap-2">
                  <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{statusError}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStatusError("")}
                  className="cursor-pointer shrink-0 text-red-700 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                <span className="flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage("")}
                  className="cursor-pointer text-emerald-700 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                Loading course details...
              </div>
            ) : error ? (
              <div
                role="alert"
                className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/40 px-6 py-10 text-center dark:border-red-900/50 dark:bg-red-950/20"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <FiAlertTriangle className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
                <Button
                  type="button"
                  onClick={fetchCourseDetails}
                  className="mt-4 px-5 py-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </Button>
              </div>
            ) : course ? (
              <>
                {/* Status Lifecycle Actions */}
                {availableStatusActions.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Course Lifecycle
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                          Current status:{" "}
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {STATUS_LABELS[statusKey] || course.status}
                          </strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {availableStatusActions.map((action) => (
                          <button
                            key={action.nextStatus}
                            type="button"
                            disabled={isTransitioning}
                            onClick={() => {
                              setStatusError("");
                              setSuccessMessage("");
                              setPendingStatusAction(action);
                            }}
                            className={`cursor-pointer rounded-sm border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${action.buttonClass}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {pendingStatusAction && (
                      <div
                        role="region"
                        aria-label="Confirm status transition"
                        className="mt-4 rounded-lg border border-zinc-300 bg-white p-3.5 dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Confirm Status Change:{" "}
                          {STATUS_LABELS[statusKey] || course.status} &rarr;{" "}
                          {STATUS_LABELS[pendingStatusAction.nextStatus] ||
                            pendingStatusAction.nextStatus}
                        </p>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {pendingStatusAction.description}
                        </p>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isTransitioning}
                            onClick={() => setPendingStatusAction(null)}
                            className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                          <Button
                            type="button"
                            disabled={isTransitioning}
                            onClick={handleConfirmStatusTransition}
                            className="px-4 py-1.5 text-xs"
                          >
                            {isTransitioning
                              ? "Updating..."
                              : pendingStatusAction.confirmLabel}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Core Metadata */}
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Course Code"
                    value={course.course_code}
                    mono
                  />
                  <DetailItem label="Slug" value={course.slug} mono />
                  <DetailItem label="Title" value={course.title} />
                  <DetailItem label="Category" value={course.category} />
                  <DetailItem
                    label="Level"
                    value={
                      LEVEL_LABELS[(course.level || "").toLowerCase()] ||
                      course.level
                    }
                  />
                  <DetailItem
                    label="Status"
                    value={STATUS_LABELS[statusKey] || course.status}
                  />
                  <DetailItem
                    label="Duration"
                    value={formatDuration(course.duration_hours)}
                  />
                  <DetailItem label="Fee" value={formatFee(course.fee)} />
                  <DetailItem
                    label="Created Date"
                    value={formatDateTime(course.created_at)}
                  />
                  <DetailItem
                    label="Updated Date"
                    value={formatDateTime(course.updated_at)}
                  />
                </dl>

                {/* Thumbnail */}
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Thumbnail
                  </h3>
                  {course.thumbnail_url ? (
                    <div className="mt-2 space-y-2">
                      <a
                        href={course.thumbnail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 break-all text-xs font-medium text-brand-accent underline"
                      >
                        <span>{course.thumbnail_url}</span>
                        <FiExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">—</p>
                  )}
                </div>

                {/* Descriptions */}
                <div className="space-y-3">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Short Description
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                      {course.short_description || "—"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Full Description
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                      {course.description || "—"}
                    </p>
                  </div>
                </div>

                {/* Assigned Instructors & Management */}
                <CourseInstructorManager
                  course={course}
                  instructors={instructors}
                  disabled={isTransitioning}
                  onChanged={handleInstructorsChanged}
                />
              </>
            ) : null}
          </div>

          {/* Fixed Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={onClose}
              disabled={isTransitioning}
              className="cursor-pointer rounded-sm border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close
            </button>

            {canEditCourse && course && !isLoading && !error && (
              <Button
                type="button"
                disabled={isTransitioning}
                onClick={() => {
                  setStatusError("");
                  setSuccessMessage("");
                  setIsEditOpen(true);
                }}
                className="px-5 py-2.5"
              >
                <FiEdit2 className="h-4 w-4" />
                <span>Edit Course</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {canEditCourse && isEditOpen && course && (
        <EditCourseDrawer
          key={`${course.id}-${course.updated_at || ""}`}
          isOpen={isEditOpen}
          course={course}
          onClose={() => setIsEditOpen(false)}
          onUpdated={handleCourseUpdated}
        />
      )}
    </>
  );
}
