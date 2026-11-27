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
  getBatchByIdApi,
  updateBatchStatusApi,
} from "@/lib/batchApi";
import { Button } from "@/components/Button";
import { BatchInstructorManager } from "@/components/batches/BatchInstructorManager";
import { BatchStudentManager } from "@/components/batches/BatchStudentManager";
import { EditBatchDrawer } from "@/components/batches/EditBatchDrawer";

const STATUS_LABELS = {
  draft: "Draft",
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

const STATUS_STYLES = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  upcoming: "border-sky-200 bg-sky-50 text-sky-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-indigo-200 bg-indigo-50 text-indigo-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  archived: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

const READ_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];
const MANAGE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const ALLOWED_BATCH_TRANSITIONS = {
  draft: ["upcoming", "active", "cancelled", "archived"],
  upcoming: ["active", "cancelled", "draft"],
  active: ["completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived", "draft"],
  archived: ["draft"],
};

const STATUS_TRANSITION_META = {
  upcoming: {
    label: "Mark Upcoming",
    confirmLabel: "Confirm Upcoming",
    description:
      "Target status: Upcoming. Schedules this batch as upcoming. The parent course must be published.",
    buttonClass:
      "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100",
  },
  active: {
    label: "Activate Batch",
    confirmLabel: "Confirm Activate",
    description:
      "Target status: Active. Marks this batch as active. The parent course must be published.",
    buttonClass:
      "border-[#163300] bg-[#163300] text-[#9FE870] hover:bg-[#1e4600]",
  },
  completed: {
    label: "Mark Completed",
    confirmLabel: "Confirm Complete",
    description:
      "Target status: Completed. Marks this active batch as completed.",
    buttonClass:
      "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
  },
  cancelled: {
    label: "Cancel Batch",
    confirmLabel: "Confirm Cancel",
    description: "Target status: Cancelled. Cancels this batch.",
    buttonClass:
      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
  },
  archived: {
    label: "Archive Batch",
    confirmLabel: "Confirm Archive",
    description:
      "Target status: Archived. Retires this batch. Archived batches cannot be edited.",
    buttonClass:
      "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  },
  draft: {
    label: "Move to Draft",
    confirmLabel: "Confirm Move to Draft",
    description:
      "Target status: Draft. Returns this batch to Draft status.",
    buttonClass:
      "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
};

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

export function BatchDetailsDrawer({ batchId, onClose, onUpdated }) {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();
  const canReadBatch =
    hasPermission(PERMISSIONS.BATCHES_READ) && hasAnyRole(READ_ROLES);
  const canManageBatch =
    hasPermission(PERMISSIONS.BATCHES_MANAGE) && hasAnyRole(MANAGE_ROLES);

  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [pendingStatusAction, setPendingStatusAction] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInstructorMutating, setIsInstructorMutating] = useState(false);
  const [isStudentMutating, setIsStudentMutating] = useState(false);

  const requestIdRef = useRef(0);
  const transitionRequestIdRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const isEditOpenRef = useRef(isEditOpen);
  const isTransitioningRef = useRef(isTransitioning);
  const isInstructorMutatingRef = useRef(isInstructorMutating);
  const isStudentMutatingRef = useRef(isStudentMutating);

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
    isInstructorMutatingRef.current = isInstructorMutating;
  }, [isInstructorMutating]);

  useEffect(() => {
    isStudentMutatingRef.current = isStudentMutating;
  }, [isStudentMutating]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (
        e.key === "Escape" &&
        !isEditOpenRef.current &&
        !isTransitioningRef.current &&
        !isInstructorMutatingRef.current &&
        !isStudentMutatingRef.current
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

  const fetchBatchDetails = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canReadBatch || !batchId) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      const res = await getBatchByIdApi(batchId);
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const fetched = res?.data?.batch || null;
      if (!fetched) {
        setBatch(null);
        setError("Batch record is unavailable.");
      } else {
        setBatch(fetched);
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
        setError("This batch could not be found.");
      } else if (err.status === 403) {
        setError(
          err.message || "You do not have permission to view this batch."
        );
      } else {
        setError(err.message || "Unable to load batch details.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isCheckingAuth, isAuthenticated, canReadBatch, batchId]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canReadBatch || !batchId) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchBatchDetails();
    }, 0);
    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canReadBatch, batchId, fetchBatchDetails]);

  const handleBatchUpdated = async () => {
    setStatusError("");
    setSuccessMessage("Batch updated successfully.");
    await fetchBatchDetails();
    onUpdated?.();
  };

  const handleInstructorsChanged = async () => {
    await fetchBatchDetails();
    onUpdated?.();
  };

  const handleConfirmStatusTransition = async () => {
    if (
      !canManageBatch ||
      !batch ||
      !pendingStatusAction ||
      isTransitioning
    ) {
      return;
    }

    const targetStatus = pendingStatusAction.nextStatus;
    const currentTransitionId = ++transitionRequestIdRef.current;
    setIsTransitioning(true);
    setStatusError("");
    setSuccessMessage("");

    try {
      await updateBatchStatusApi(batch.id, { status: targetStatus });
      if (currentTransitionId !== transitionRequestIdRef.current) {
        return;
      }
      setPendingStatusAction(null);
      setSuccessMessage(
        `Batch status updated to ${STATUS_LABELS[targetStatus] || targetStatus}.`
      );
      await fetchBatchDetails();
      onUpdated?.();
    } catch (err) {
      if (currentTransitionId !== transitionRequestIdRef.current) {
        return;
      }
      setPendingStatusAction(null);
      if (err.status === 0) {
        setStatusError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 403) {
        setStatusError(
          err.message ||
          "You do not have permission to change this batch's status."
        );
      } else if (err.status === 404) {
        setStatusError(err.message || "This batch could not be found.");
      } else {
        setStatusError(
          err.message || "Unable to update batch status. Please try again."
        );
      }
    } finally {
      if (currentTransitionId === transitionRequestIdRef.current) {
        setIsTransitioning(false);
      }
    }
  };

  const statusKey = (batch?.status || "").toLowerCase();
  const statusStyle =
    STATUS_STYLES[statusKey] || "border-zinc-200 bg-zinc-100 text-zinc-600";
  const isArchived = statusKey === "archived";
  const instructors = Array.isArray(batch?.instructors)
    ? batch.instructors
    : [];
  const availableStatusActions = canManageBatch
    ? (ALLOWED_BATCH_TRANSITIONS[statusKey] || [])
      .map((nextStatus) => ({
        nextStatus,
        ...(STATUS_TRANSITION_META[nextStatus] || {
          label: STATUS_LABELS[nextStatus] || nextStatus,
          confirmLabel: "Confirm",
          description: `Target status: ${STATUS_LABELS[nextStatus] || nextStatus}.`,
          buttonClass:
            "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
        }),
      }))
    : [];

  const courseLabel =
    batch?.course_code && batch?.course_title
      ? `${batch.course_code} — ${batch.course_title}`
      : batch?.course_title || batch?.course_code || "—";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-details-title"
        onClick={(e) => {
          if (
            e.target === e.currentTarget &&
            !isTransitioning &&
            !isInstructorMutating &&
            !isStudentMutating
          ) {
            onClose?.();
          }
        }}
      >
        <div className="flex h-full w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id="batch-details-title"
                  className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {batch?.batch_name || "Batch Details"}
                </h2>
                {batch?.status && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                  >
                    {STATUS_LABELS[statusKey] || batch.status}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {batch?.batch_code
                  ? `Batch Code: ${batch.batch_code}`
                  : "View batch metadata, capacity, schedule, and assigned instructors."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={
                isTransitioning || isInstructorMutating || isStudentMutating
              }
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
                Loading batch details...
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
                  onClick={fetchBatchDetails}
                  className="mt-4 px-5 py-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  <span>Retry</span>
                </Button>
              </div>
            ) : batch ? (
              <>
                {canManageBatch && isArchived && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                    This batch is archived. Archived batches cannot be edited
                    until restored to Draft.
                  </div>
                )}

                {/* Batch Lifecycle Actions */}
                {availableStatusActions.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Batch Lifecycle
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                          Current status:{" "}
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {STATUS_LABELS[statusKey] || batch.status}
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
                            className={`cursor-pointer rounded-sm border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${action.buttonClass}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {pendingStatusAction && (
                      <div
                        role="region"
                        aria-label="Confirm batch status transition"
                        className="mt-4 rounded-lg border border-zinc-300 bg-white p-3.5 dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Confirm Status Change:{" "}
                          {STATUS_LABELS[statusKey] || batch.status} &rarr;{" "}
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

                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem label="Batch Code" value={batch.batch_code} mono />
                  <DetailItem label="Batch Name" value={batch.batch_name} />
                  <DetailItem label="Course" value={courseLabel} />
                  <DetailItem
                    label="Status"
                    value={STATUS_LABELS[statusKey] || batch.status}
                  />
                  <DetailItem
                    label="Capacity"
                    value={
                      batch.capacity !== null && batch.capacity !== undefined
                        ? String(batch.capacity)
                        : "Unlimited"
                    }
                  />
                  <DetailItem
                    label="Enrolled Students"
                    value={String(batch.enrolled_count ?? 0)}
                  />
                  <DetailItem
                    label="Available Seats"
                    value={
                      batch.available_seats !== null &&
                        batch.available_seats !== undefined
                        ? String(batch.available_seats)
                        : "Unlimited"
                    }
                  />
                  <DetailItem
                    label="Schedule Summary"
                    value={batch.schedule_summary}
                  />
                  <DetailItem
                    label="Start Date"
                    value={formatDate(batch.start_date)}
                  />
                  <DetailItem
                    label="End Date"
                    value={formatDate(batch.end_date)}
                  />
                  <DetailItem
                    label="Created Date"
                    value={formatDateTime(batch.created_at)}
                  />
                  <DetailItem
                    label="Updated Date"
                    value={formatDateTime(batch.updated_at)}
                  />
                </dl>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Description
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                    {batch.description || "—"}
                  </p>
                </div>

                {/* Assigned Instructors & Management */}
                <BatchInstructorManager
                  batch={batch}
                  initialInstructors={instructors}
                  disabled={isTransitioning || isStudentMutating}
                  onChanged={handleInstructorsChanged}
                  onMutatingChange={setIsInstructorMutating}
                />

                {/* Assigned Students & Management */}
                <BatchStudentManager
                  batch={batch}
                  disabled={isTransitioning || isInstructorMutating}
                  onChanged={handleInstructorsChanged}
                  onMutatingChange={setIsStudentMutating}
                />
              </>
            ) : null}
          </div>

          {/* Fixed Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              type="button"
              onClick={onClose}
              disabled={
                isTransitioning || isInstructorMutating || isStudentMutating
              }
              className="cursor-pointer rounded-sm border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close
            </button>

            {canManageBatch && batch && !isLoading && !error && !isArchived && (
              <Button
                type="button"
                disabled={
                  isTransitioning || isInstructorMutating || isStudentMutating
                }
                onClick={() => {
                  setStatusError("");
                  setSuccessMessage("");
                  setIsEditOpen(true);
                }}
                className="px-5 py-2.5"
              >
                <FiEdit2 className="h-4 w-4" />
                <span>Edit Batch</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {canManageBatch && isEditOpen && batch && !isArchived && (
        <EditBatchDrawer
          key={`${batch.id}-${batch.updated_at || ""}`}
          isOpen={isEditOpen}
          batch={batch}
          onClose={() => setIsEditOpen(false)}
          onUpdated={handleBatchUpdated}
        />
      )}
    </>
  );
}
