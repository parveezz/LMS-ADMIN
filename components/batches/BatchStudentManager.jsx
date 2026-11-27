"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUserPlus,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import {
  assignBatchStudentApi,
  listBatchStudentsApi,
  removeBatchStudentApi,
} from "@/lib/batchApi";
import { listEnrollmentsApi } from "@/lib/enrollmentApi";
import { Button } from "@/components/Button";

const ALLOWED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];
const ASSIGNABLE_BATCH_STATUSES = new Set(["upcoming", "active"]);
const ELIGIBLE_ENROLLMENT_STATUSES = new Set([
  "pending",
  "confirmed",
  "deferred",
]);

const ENROLLMENT_STATUS_STYLES = {
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-sky-200 bg-sky-50 text-sky-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  deferred: "border-purple-200 bg-purple-50 text-purple-700",
  dropped: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
}

function formatLabel(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatErrorMessage(err, fallback) {
  if (err?.status === 0) {
    return "Unable to reach the server. Please check your connection and try again.";
  }
  if (err?.status === 403) {
    return (
      err.message ||
      "You do not have permission to manage students in this batch."
    );
  }
  if (err?.status === 404) {
    return err.message || "Batch or enrollment could not be found.";
  }
  return err?.message || fallback;
}

export function BatchStudentManager({
  batch,
  disabled = false,
  onChanged,
  onMutatingChange,
}) {
  const {
    isCheckingAuth,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAnyRole,
  } = useAuth();

  const canReadStudents =
    hasPermission(PERMISSIONS.BATCHES_READ) && hasAnyRole(ALLOWED_ROLES);
  const canManageStudents =
    hasAnyPermission([
      PERMISSIONS.BATCHES_MANAGE,
      PERMISSIONS.ENROLLMENTS_MANAGE,
    ]) && hasAnyRole(ALLOWED_ROLES);
  const canReadEnrollments = hasPermission(PERMISSIONS.ENROLLMENTS_READ);

  const batchId = batch?.id || "";
  const courseId = batch?.course_id || "";
  const batchStatus = (batch?.status || "").toLowerCase();
  const canAssignToBatch = ASSIGNABLE_BATCH_STATUSES.has(batchStatus);
  const hasCapacityLimit =
    batch?.capacity !== null && batch?.capacity !== undefined;
  const enrolledCount = batch?.enrolled_count ?? 0;
  const isAtCapacity = hasCapacityLimit && enrolledCount >= batch.capacity;

  // Assigned students state
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [studentPage, setStudentPage] = useState(1);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  // Enrollment search & assignment state
  const [searchTerm, setSearchTerm] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [isSearchingEnrollments, setIsSearchingEnrollments] = useState(false);
  const [enrollmentSearchError, setEnrollmentSearchError] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [assignReason, setAssignReason] = useState("");

  // Removal & mutation state
  const [confirmRemoveStudent, setConfirmRemoveStudent] = useState(null);
  const [removeReason, setRemoveReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const studentsReqIdRef = useRef(0);
  const enrollSearchReqIdRef = useRef(0);

  const isMutating = isAssigning || isRemoving || disabled;

  useEffect(() => {
    onMutatingChange?.(isAssigning || isRemoving);
  }, [isAssigning, isRemoving, onMutatingChange]);

  const fetchBatchStudents = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canReadStudents || !batchId) {
      return;
    }

    const reqId = ++studentsReqIdRef.current;
    setIsLoadingStudents(true);
    setStudentsError("");

    try {
      const res = await listBatchStudentsApi(batchId, {
        page: studentPage,
        limit: 10,
      });

      if (reqId !== studentsReqIdRef.current) return;

      setStudents(Array.isArray(res?.data) ? res.data : []);
      setPagination(
        res?.pagination || {
          page: studentPage,
          limit: 10,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      if (reqId !== studentsReqIdRef.current) return;
      setStudentsError(
        formatErrorMessage(err, "Unable to load students assigned to this batch.")
      );
    } finally {
      if (reqId === studentsReqIdRef.current) {
        setIsLoadingStudents(false);
      }
    }
  }, [isCheckingAuth, isAuthenticated, canReadStudents, batchId, studentPage]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canReadStudents || !batchId) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchBatchStudents();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    isCheckingAuth,
    isAuthenticated,
    canReadStudents,
    batchId,
    fetchBatchStudents,
  ]);

  const fetchEligibleEnrollments = useCallback(async () => {
    if (
      isCheckingAuth ||
      !isAuthenticated ||
      !canManageStudents ||
      !canReadEnrollments ||
      !canAssignToBatch ||
      isAtCapacity ||
      !batchId
    ) {
      return;
    }

    const reqId = ++enrollSearchReqIdRef.current;
    setIsSearchingEnrollments(true);
    setEnrollmentSearchError("");

    try {
      const res = await listEnrollmentsApi({
        page: 1,
        limit: 25,
        search: searchTerm,
      });

      if (reqId !== enrollSearchReqIdRef.current) return;
      setEnrollments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      if (reqId !== enrollSearchReqIdRef.current) return;
      setEnrollmentSearchError(
        formatErrorMessage(err, "Unable to search enrollments.")
      );
    } finally {
      if (reqId === enrollSearchReqIdRef.current) {
        setIsSearchingEnrollments(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canManageStudents,
    canReadEnrollments,
    canAssignToBatch,
    isAtCapacity,
    batchId,
    searchTerm,
  ]);

  useEffect(() => {
    if (
      isCheckingAuth ||
      !isAuthenticated ||
      !canManageStudents ||
      !canReadEnrollments ||
      !canAssignToBatch ||
      isAtCapacity ||
      !batchId
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchEligibleEnrollments();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    isCheckingAuth,
    isAuthenticated,
    canManageStudents,
    canReadEnrollments,
    canAssignToBatch,
    isAtCapacity,
    batchId,
    fetchEligibleEnrollments,
  ]);

  const eligibleEnrollments = useMemo(() => {
    return enrollments.filter((item) => {
      if (!item?.id) return false;
      if (courseId && item.course_id && item.course_id !== courseId) {
        return false;
      }
      if (item.batch_id === batchId) {
        return false;
      }
      if (
        (item.registration_status || "").toLowerCase() === "cancelled" ||
        !ELIGIBLE_ENROLLMENT_STATUSES.has(
          (item.enrollment_status || "").toLowerCase()
        )
      ) {
        return false;
      }
      return true;
    });
  }, [enrollments, courseId, batchId]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (
      !canManageStudents ||
      !batchId ||
      !selectedEnrollment?.id ||
      !canAssignToBatch ||
      isAtCapacity ||
      isMutating
    ) {
      return;
    }

    const trimmedReason = assignReason.trim();
    if (trimmedReason.length > 1000) {
      setActionError("Reason cannot exceed 1000 characters.");
      return;
    }

    setIsAssigning(true);
    setActionError("");
    setActionSuccess("");

    try {
      await assignBatchStudentApi(batchId, {
        enrollment_id: selectedEnrollment.id,
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      });

      const label =
        selectedEnrollment.student_name ||
        selectedEnrollment.enrollment_number ||
        "Enrollment";
      setSelectedEnrollment(null);
      setAssignReason("");
      setActionSuccess(`${label} assigned to batch successfully.`);
      await Promise.all([fetchBatchStudents(), onChanged?.()]);
    } catch (err) {
      setActionError(
        formatErrorMessage(err, "Unable to assign enrollment to this batch.")
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (
      !canManageStudents ||
      !batchId ||
      !confirmRemoveStudent?.enrollment_id ||
      isMutating
    ) {
      return;
    }

    const trimmedReason = removeReason.trim();
    if (trimmedReason.length > 1000) {
      setActionError("Removal reason cannot exceed 1000 characters.");
      return;
    }

    setIsRemoving(true);
    setActionError("");
    setActionSuccess("");

    try {
      await removeBatchStudentApi(
        batchId,
        confirmRemoveStudent.enrollment_id,
        trimmedReason ? { reason: trimmedReason } : undefined
      );

      const label =
        confirmRemoveStudent.student_name ||
        confirmRemoveStudent.enrollment_number ||
        "Student";
      setConfirmRemoveStudent(null);
      setRemoveReason("");
      setActionSuccess(
        `${label} removed from batch. Enrollment record and history preserved.`
      );
      await Promise.all([fetchBatchStudents(), onChanged?.()]);
    } catch (err) {
      setActionError(
        formatErrorMessage(err, "Unable to remove student from this batch.")
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const safeTotalPages = Math.max(1, pagination.totalPages || 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Assigned Students ({pagination.total ?? students.length})
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {hasCapacityLimit
              ? `Capacity: ${enrolledCount} / ${batch.capacity} (${batch.available_seats ?? Math.max(batch.capacity - enrolledCount, 0)} seats available)`
              : `Enrolled: ${enrolledCount} (Unlimited capacity)`}
          </p>
        </div>

        <button
          type="button"
          disabled={isLoadingStudents || isMutating}
          onClick={fetchBatchStudents}
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiRefreshCw
            className={`h-3 w-3 ${isLoadingStudents ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
        >
          <span className="flex items-start gap-2">
            <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="cursor-pointer shrink-0 text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span className="flex items-center gap-2">
            <FiCheckCircle className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionSuccess("")}
            className="cursor-pointer shrink-0 text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {studentsError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          <span>{studentsError}</span>
          <button
            type="button"
            onClick={fetchBatchStudents}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold underline"
          >
            <FiRefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      ) : isLoadingStudents ? (
        <div className="rounded-lg border border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Loading assigned students...
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          No active students assigned to this batch.
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {students.map((item) => {
              const enrollStatusKey = (
                item.enrollment_status || ""
              ).toLowerCase();
              const enrollStyle =
                ENROLLMENT_STATUS_STYLES[enrollStatusKey] ||
                "border-zinc-200 bg-zinc-100 text-zinc-600";

              return (
                <li
                  key={item.enrollment_id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.student_name || "Student"}
                      </span>
                      {item.enrollment_number && (
                        <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          {item.enrollment_number}
                        </span>
                      )}
                    </div>
                    {item.student_email && (
                      <p className="truncate text-xs text-zinc-500">
                        {item.student_email}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      Added: {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {item.enrollment_status && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${enrollStyle}`}
                      >
                        {formatLabel(item.enrollment_status)}
                      </span>
                    )}

                    {canManageStudents && (
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => {
                          setActionError("");
                          setActionSuccess("");
                          setRemoveReason("");
                          setConfirmRemoveStudent(item);
                        }}
                        aria-label={`Remove ${item.student_name || "student"}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Student List Pagination */}
          {safeTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 pt-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <span>
                Page{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {pagination.page || studentPage}
                </strong>{" "}
                of{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {safeTotalPages}
                </strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={studentPage <= 1 || isLoadingStudents}
                  onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={
                    studentPage >= safeTotalPages || isLoadingStudents
                  }
                  onClick={() => setStudentPage((p) => p + 1)}
                  className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inline Remove Confirmation */}
      {canManageStudents && confirmRemoveStudent && (
        <div
          role="region"
          aria-label="Confirm student removal from batch"
          className="space-y-3 rounded-lg border border-red-200 bg-red-50/70 p-3.5 dark:border-red-900/50 dark:bg-red-950/20"
        >
          <div>
            <p className="text-xs font-semibold text-red-800 dark:text-red-300">
              Confirm removing{" "}
              <strong>
                {confirmRemoveStudent.student_name ||
                  confirmRemoveStudent.enrollment_number ||
                  "this student"}
              </strong>{" "}
              from this batch?
            </p>
            <p className="mt-1 text-[11px] text-red-700 dark:text-red-400">
              This unassigns the enrollment from the batch while preserving the
              student, enrollment record, and batch history.
            </p>
          </div>

          <input
            type="text"
            value={removeReason}
            disabled={isRemoving}
            onChange={(e) => setRemoveReason(e.target.value)}
            maxLength={1000}
            placeholder="Reason for removal (optional)"
            aria-label="Removal reason"
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isRemoving}
              onClick={() => {
                setConfirmRemoveStudent(null);
                setRemoveReason("");
              }}
              className="cursor-pointer rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isRemoving}
              onClick={handleConfirmRemove}
              className="cursor-pointer rounded-sm bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isRemoving ? "Removing..." : "Confirm Remove"}
            </button>
          </div>
        </div>
      )}

      {/* Assign Enrollment Panel */}
      {canManageStudents && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="mb-3 flex items-center gap-2">
            <FiUserPlus className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Assign Student Enrollment
            </h4>
          </div>

          {!canAssignToBatch ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
              Enrollments can only be assigned when the batch status is{" "}
              <strong>Upcoming</strong> or <strong>Active</strong> (current
              status: <strong>{batch.status}</strong>).
            </p>
          ) : isAtCapacity ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
              This batch has reached its maximum capacity ({enrolledCount} /{" "}
              {batch.capacity}). Remove an enrollment or increase capacity to
              assign more students.
            </p>
          ) : !canReadEnrollments ? (
            <p className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Enrollment search requires enrollment read access.
            </p>
          ) : (
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <p className="text-[11px] text-zinc-500">
                Search eligible enrollments for this course (pending, confirmed,
                or deferred, non-cancelled). Assigning an enrollment currently in
                another batch will transfer it to this batch.
              </p>

              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={searchTerm}
                  disabled={isMutating}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by enrollment number, student name, or email..."
                  aria-label="Search eligible enrollments"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              {enrollmentSearchError ? (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  <span>{enrollmentSearchError}</span>
                  <button
                    type="button"
                    onClick={fetchEligibleEnrollments}
                    className="inline-flex cursor-pointer items-center gap-1 font-semibold underline"
                  >
                    <FiRefreshCw className="h-3 w-3" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : isSearchingEnrollments ? (
                <p className="py-2 text-xs text-zinc-500">
                  Searching eligible enrollments...
                </p>
              ) : eligibleEnrollments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
                  No eligible unassigned or transferable enrollments match your
                  search for this course.
                </p>
              ) : (
                <div
                  role="listbox"
                  aria-label="Eligible course enrollments"
                  className="max-h-48 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {eligibleEnrollments.map((item) => {
                    const isSelected = selectedEnrollment?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={isMutating}
                        onClick={() => {
                          setSelectedEnrollment(item);
                          setActionError("");
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                          isSelected
                            ? "bg-[#9FE870]/25 text-[#163300] dark:bg-[#9FE870]/15 dark:text-[#9FE870]"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.student_name || "Student"}
                            </span>
                            {item.enrollment_number && (
                              <span className="font-mono text-[11px] text-zinc-500">
                                {item.enrollment_number}
                              </span>
                            )}
                            {item.batch_id && (
                              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                Transfer
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-zinc-500">
                            {[
                              item.student_email,
                              formatLabel(item.enrollment_status),
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        </div>
                        {isSelected && (
                          <FiCheck className="h-4 w-4 shrink-0 text-[#163300] dark:text-[#9FE870]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedEnrollment && (
                <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Selected Enrollment
                      </p>
                      <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedEnrollment.student_name || "Student"}{" "}
                        {selectedEnrollment.enrollment_number && (
                          <span className="font-mono font-normal text-zinc-500">
                            ({selectedEnrollment.enrollment_number})
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => setSelectedEnrollment(null)}
                      className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Clear
                    </button>
                  </div>

                  <input
                    type="text"
                    value={assignReason}
                    disabled={isMutating}
                    onChange={(e) => setAssignReason(e.target.value)}
                    maxLength={1000}
                    placeholder={
                      selectedEnrollment.batch_id
                        ? "Reason for batch transfer (optional)"
                        : "Assignment reason (optional)"
                    }
                    aria-label="Assignment reason"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!selectedEnrollment || isMutating}
                  className="px-4 py-2 text-xs"
                >
                  <FiUserPlus className="h-3.5 w-3.5" />
                  <span>
                    {isAssigning
                      ? "Assigning..."
                      : selectedEnrollment?.batch_id
                        ? "Transfer to Batch"
                        : "Assign to Batch"}
                  </span>
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
