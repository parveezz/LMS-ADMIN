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
  assignBatchInstructorApi,
  listBatchInstructorsApi,
  removeBatchInstructorApi,
} from "@/lib/batchApi";
import { getCourseInstructorsApi } from "@/lib/courseApi";
import { Button } from "@/components/Button";

const MANAGE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const TERMINAL_INSTRUCTOR_STATUSES = new Set([
  "completed",
  "cancelled",
  "archived",
]);

function formatErrorMessage(err, fallback) {
  if (err?.status === 0) {
    return "Unable to reach the server. Please check your connection and try again.";
  }
  if (err?.status === 403) {
    return (
      err.message ||
      "You do not have permission to manage instructors for this batch."
    );
  }
  if (err?.status === 404) {
    return err.message || "Batch or instructor could not be found.";
  }
  return err?.message || fallback;
}

export function BatchInstructorManager({
  batch,
  initialInstructors = [],
  disabled = false,
  onChanged,
  onMutatingChange,
}) {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();
  const canReadBatch =
    hasPermission(PERMISSIONS.BATCHES_READ) &&
    hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF]);
  const canManageInstructors =
    hasPermission(PERMISSIONS.BATCHES_MANAGE) && hasAnyRole(MANAGE_ROLES);
  const canReadCourseInstructors = hasPermission(PERMISSIONS.COURSES_READ);

  const batchId = batch?.id || "";
  const courseId = batch?.course_id || "";
  const batchStatus = (batch?.status || "").toLowerCase();
  const isTerminalStatus = TERMINAL_INSTRUCTOR_STATUSES.has(batchStatus);

  // Assigned batch instructors state
  const [instructors, setInstructors] = useState(initialInstructors);
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(false);
  const [instructorsError, setInstructorsError] = useState("");

  // Course-associated eligible instructors state (for assignment)
  const [courseInstructors, setCourseInstructors] = useState([]);
  const [isLoadingCourseInstructors, setIsLoadingCourseInstructors] =
    useState(false);
  const [courseInstructorsError, setCourseInstructorsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);

  // Mutation state
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [confirmRemoveInstructor, setConfirmRemoveInstructor] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const instructorsReqIdRef = useRef(0);
  const courseInstructorsReqIdRef = useRef(0);

  const isMutating = isAssigning || isRemoving || disabled;

  useEffect(() => {
    onMutatingChange?.(isAssigning || isRemoving);
  }, [isAssigning, isRemoving, onMutatingChange]);

  const fetchBatchInstructors = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canReadBatch || !batchId) {
      return;
    }

    const reqId = ++instructorsReqIdRef.current;
    setIsLoadingInstructors(true);
    setInstructorsError("");

    try {
      const res = await listBatchInstructorsApi(batchId);
      if (reqId !== instructorsReqIdRef.current) return;
      setInstructors(
        Array.isArray(res?.data?.instructors) ? res.data.instructors : []
      );
    } catch (err) {
      if (reqId !== instructorsReqIdRef.current) return;
      setInstructorsError(
        formatErrorMessage(err, "Unable to load assigned instructors.")
      );
    } finally {
      if (reqId === instructorsReqIdRef.current) {
        setIsLoadingInstructors(false);
      }
    }
  }, [isCheckingAuth, isAuthenticated, canReadBatch, batchId]);

  const fetchCourseInstructors = useCallback(async () => {
    if (
      isCheckingAuth ||
      !isAuthenticated ||
      !canManageInstructors ||
      !canReadCourseInstructors ||
      isTerminalStatus ||
      !courseId
    ) {
      return;
    }

    const reqId = ++courseInstructorsReqIdRef.current;
    setIsLoadingCourseInstructors(true);
    setCourseInstructorsError("");

    try {
      const res = await getCourseInstructorsApi(courseId);
      if (reqId !== courseInstructorsReqIdRef.current) return;
      setCourseInstructors(
        Array.isArray(res?.data?.instructors) ? res.data.instructors : []
      );
    } catch (err) {
      if (reqId !== courseInstructorsReqIdRef.current) return;
      setCourseInstructorsError(
        formatErrorMessage(
          err,
          "Unable to load instructors assigned to the batch course."
        )
      );
    } finally {
      if (reqId === courseInstructorsReqIdRef.current) {
        setIsLoadingCourseInstructors(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canManageInstructors,
    canReadCourseInstructors,
    isTerminalStatus,
    courseId,
  ]);

  useEffect(() => {
    if (
      !canManageInstructors ||
      !canReadCourseInstructors ||
      isTerminalStatus ||
      !courseId
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchCourseInstructors();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    canManageInstructors,
    canReadCourseInstructors,
    isTerminalStatus,
    courseId,
    fetchCourseInstructors,
  ]);

  const assignedInstructorIds = useMemo(
    () =>
      new Set(instructors.map((inst) => inst.instructor_id).filter(Boolean)),
    [instructors]
  );

  const availableCourseInstructors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return courseInstructors.filter((inst) => {
      if (!inst.instructor_id || assignedInstructorIds.has(inst.instructor_id)) {
        return false;
      }
      if (!inst.effective_teaching_eligible) {
        return false;
      }
      if (!query) return true;
      return (
        (inst.full_name || "").toLowerCase().includes(query) ||
        (inst.email || "").toLowerCase().includes(query) ||
        (inst.instructor_code || "").toLowerCase().includes(query) ||
        (inst.specialization || "").toLowerCase().includes(query)
      );
    });
  }, [courseInstructors, assignedInstructorIds, searchTerm]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (
      !canManageInstructors ||
      !batch?.id ||
      !selectedInstructor?.instructor_id ||
      isTerminalStatus ||
      isMutating
    ) {
      return;
    }

    setIsAssigning(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await assignBatchInstructorApi(batch.id, {
        instructor_id: selectedInstructor.instructor_id,
        is_primary: Boolean(isPrimary),
      });

      const updatedList = Array.isArray(res?.data?.instructors)
        ? res.data.instructors
        : null;
      if (updatedList) {
        setInstructors(updatedList);
      } else {
        await fetchBatchInstructors();
      }

      const assignedName =
        selectedInstructor.full_name ||
        selectedInstructor.email ||
        "Instructor";
      setSelectedInstructor(null);
      setIsPrimary(false);
      setActionSuccess(`${assignedName} assigned to batch successfully.`);
      await onChanged?.();
    } catch (err) {
      setActionError(
        formatErrorMessage(err, "Unable to assign instructor to this batch.")
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (
      !canManageInstructors ||
      !batch?.id ||
      !confirmRemoveInstructor?.instructor_id ||
      isTerminalStatus ||
      isMutating
    ) {
      return;
    }

    setIsRemoving(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await removeBatchInstructorApi(
        batch.id,
        confirmRemoveInstructor.instructor_id
      );

      const updatedList = Array.isArray(res?.data?.instructors)
        ? res.data.instructors
        : null;
      if (updatedList) {
        setInstructors(updatedList);
      } else {
        await fetchBatchInstructors();
      }

      const removedName =
        confirmRemoveInstructor.full_name ||
        confirmRemoveInstructor.email ||
        "Instructor";
      setConfirmRemoveInstructor(null);
      setActionSuccess(`${removedName} removed from batch.`);
      await onChanged?.();
    } catch (err) {
      setConfirmRemoveInstructor(null);
      setActionError(
        formatErrorMessage(err, "Unable to remove instructor from this batch.")
      );
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Assigned Instructors ({instructors.length})
        </h3>
        <button
          type="button"
          disabled={isLoadingInstructors || isMutating}
          onClick={fetchBatchInstructors}
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiRefreshCw
            className={`h-3 w-3 ${isLoadingInstructors ? "animate-spin" : ""}`}
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

      {instructorsError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          <span>{instructorsError}</span>
          <button
            type="button"
            onClick={fetchBatchInstructors}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold underline"
          >
            <FiRefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      ) : isLoadingInstructors ? (
        <div className="rounded-lg border border-zinc-200 px-4 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Loading assigned instructors...
        </div>
      ) : instructors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800">
          No instructors assigned to this batch.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {instructors.map((inst, index) => (
            <li
              key={inst.instructor_id || inst.email || index}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {inst.full_name || "Instructor"}
                  </span>
                  {inst.is_primary && (
                    <span className="inline-flex items-center rounded-full border border-[#9FE870] bg-[#9FE870]/30 px-2 py-0.5 text-[11px] font-semibold text-[#163300]">
                      Primary
                    </span>
                  )}
                </div>
                {inst.email && (
                  <p className="truncate text-xs text-zinc-500">{inst.email}</p>
                )}
                {(inst.headline || inst.specialization) && (
                  <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {[inst.headline, inst.specialization]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {inst.instructor_code && (
                  <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {inst.instructor_code}
                  </span>
                )}
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    inst.effective_teaching_eligible
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {inst.effective_teaching_eligible
                    ? "Eligible"
                    : "Not Eligible"}
                </span>

                {canManageInstructors && !isTerminalStatus && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => {
                      setActionError("");
                      setActionSuccess("");
                      setConfirmRemoveInstructor(inst);
                    }}
                    aria-label={`Remove ${inst.full_name || "instructor"}`}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Inline Remove Confirmation */}
      {canManageInstructors &&
        !isTerminalStatus &&
        confirmRemoveInstructor && (
          <div
            role="region"
            aria-label="Confirm instructor removal"
            className="space-y-3 rounded-lg border border-red-200 bg-red-50/70 p-3.5 dark:border-red-900/50 dark:bg-red-950/20"
          >
            <div>
              <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                Confirm removing{" "}
                <strong>
                  {confirmRemoveInstructor.full_name ||
                    confirmRemoveInstructor.email ||
                    "this instructor"}
                </strong>{" "}
                from this batch?
              </p>
              {confirmRemoveInstructor.is_primary && (
                <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                  This instructor is currently marked as the Primary instructor
                  for this batch.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => setConfirmRemoveInstructor(null)}
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

      {/* Assign Instructor Panel (Admin / Super Admin Only) */}
      {canManageInstructors && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="mb-3 flex items-center gap-2">
            <FiUserPlus className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Assign Course Instructor
            </h4>
          </div>

          {isTerminalStatus ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
              Instructors cannot be assigned or removed while the batch status
              is <strong>{batch.status}</strong>.
            </p>
          ) : (
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <p className="text-[11px] text-zinc-500">
                Only active, teaching-eligible instructors already assigned to
                the parent course can be assigned to this batch.
              </p>

              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={searchTerm}
                  disabled={isMutating}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter eligible course instructors by name, email, or code..."
                  aria-label="Filter eligible course instructors"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              {courseInstructorsError ? (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  <span>{courseInstructorsError}</span>
                  <button
                    type="button"
                    onClick={fetchCourseInstructors}
                    className="inline-flex cursor-pointer items-center gap-1 font-semibold underline"
                  >
                    <FiRefreshCw className="h-3 w-3" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : isLoadingCourseInstructors ? (
                <p className="py-2 text-xs text-zinc-500">
                  Loading course instructors...
                </p>
              ) : availableCourseInstructors.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
                  No unassigned eligible course instructors available. Assign
                  eligible instructors to the parent course first.
                </p>
              ) : (
                <div
                  role="listbox"
                  aria-label="Eligible course instructors"
                  className="max-h-48 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {availableCourseInstructors.map((inst) => {
                    const isSelected =
                      selectedInstructor?.instructor_id === inst.instructor_id;
                    return (
                      <button
                        key={inst.instructor_id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={isMutating}
                        onClick={() => {
                          setSelectedInstructor(inst);
                          setActionError("");
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                          isSelected
                            ? "bg-[#9FE870]/25 text-[#163300] dark:bg-[#9FE870]/15 dark:text-[#9FE870]"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {inst.full_name || "Instructor"}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">
                            {[
                              inst.email,
                              inst.instructor_code,
                              inst.specialization,
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

              {selectedInstructor && (
                <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Selected Instructor
                      </p>
                      <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedInstructor.full_name}{" "}
                        <span className="font-normal text-zinc-500">
                          ({selectedInstructor.email})
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => setSelectedInstructor(null)}
                      className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Clear
                    </button>
                  </div>

                  <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      disabled={isMutating}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 accent-[#163300]"
                    />
                    <span>
                      <span className="font-semibold">
                        Set as primary instructor
                      </span>
                      <span className="block text-[11px] text-zinc-500">
                        Assigning a new primary instructor will replace any
                        current primary instructor designation on this batch.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!selectedInstructor || isMutating}
                  className="px-4 py-2 text-xs"
                >
                  <FiUserPlus className="h-3.5 w-3.5" />
                  <span>
                    {isAssigning ? "Assigning..." : "Assign Instructor"}
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
