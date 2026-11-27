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
  assignCourseInstructorApi,
  removeCourseInstructorApi,
} from "@/lib/courseApi";
import { getInstructorsApi } from "@/lib/instructorApi";
import { Button } from "@/components/Button";

const MANAGE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

function formatErrorMessage(err, fallback) {
  if (err?.status === 0) {
    return "Unable to reach the server. Please check your connection and try again.";
  }
  if (err?.status === 403) {
    return (
      err.message ||
      "You do not have permission to manage instructors for this course."
    );
  }
  if (err?.status === 404) {
    return err.message || "Course or instructor could not be found.";
  }
  return err?.message || fallback;
}

export function CourseInstructorManager({
  course,
  instructors = [],
  disabled = false,
  onChanged,
}) {
  const { hasPermission, hasAnyRole } = useAuth();
  const canManageInstructors =
    hasPermission(PERMISSIONS.COURSES_UPDATE) && hasAnyRole(MANAGE_ROLES);

  const isArchived = (course?.status || "").toLowerCase() === "archived";

  // Action feedback & mutation state
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [confirmRemoveInstructor, setConfirmRemoveInstructor] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Directory search & assignment state
  const [searchTerm, setSearchTerm] = useState("");
  const [directoryInstructors, setDirectoryInstructors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directoryError, setDirectoryError] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const directoryRequestIdRef = useRef(0);

  const assignedInstructorIds = useMemo(
    () => new Set(instructors.map((inst) => inst.instructor_id).filter(Boolean)),
    [instructors]
  );

  const availableInstructors = useMemo(
    () =>
      directoryInstructors.filter(
        (inst) => inst.user_id && !assignedInstructorIds.has(inst.user_id)
      ),
    [directoryInstructors, assignedInstructorIds]
  );

  const isMutating = isRemoving || isAssigning || disabled;

  const fetchEligibleInstructors = useCallback(async () => {
    if (!canManageInstructors || isArchived || !course?.id) {
      return;
    }

    const currentRequestId = ++directoryRequestIdRef.current;
    setIsSearching(true);
    setDirectoryError("");

    try {
      const res = await getInstructorsApi({
        page: 1,
        limit: 10,
        search: searchTerm,
        status: "active",
        is_teaching_eligible: true,
      });

      if (currentRequestId !== directoryRequestIdRef.current) {
        return;
      }

      setDirectoryInstructors(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      if (currentRequestId !== directoryRequestIdRef.current) {
        return;
      }
      setDirectoryError(
        formatErrorMessage(err, "Unable to load eligible instructors.")
      );
    } finally {
      if (currentRequestId === directoryRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, [canManageInstructors, isArchived, course?.id, searchTerm]);

  useEffect(() => {
    if (!canManageInstructors || isArchived || !course?.id) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchEligibleInstructors();
    }, 300);

    return () => clearTimeout(timer);
  }, [canManageInstructors, isArchived, course?.id, fetchEligibleInstructors]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!course?.id || !selectedInstructor?.user_id || isArchived || isMutating) {
      return;
    }

    setIsAssigning(true);
    setActionError("");
    setActionSuccess("");

    try {
      await assignCourseInstructorApi(course.id, {
        instructor_id: selectedInstructor.user_id,
        is_primary: Boolean(isPrimary),
      });

      const assignedName =
        selectedInstructor.full_name || selectedInstructor.email || "Instructor";
      setSelectedInstructor(null);
      setIsPrimary(false);
      setActionSuccess(`${assignedName} assigned to course successfully.`);
      await onChanged?.();
    } catch (err) {
      setActionError(
        formatErrorMessage(err, "Unable to assign instructor to this course.")
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!course?.id || !confirmRemoveInstructor?.instructor_id || isMutating) {
      return;
    }

    setIsRemoving(true);
    setActionError("");
    setActionSuccess("");

    try {
      await removeCourseInstructorApi(
        course.id,
        confirmRemoveInstructor.instructor_id
      );

      const removedName =
        confirmRemoveInstructor.full_name ||
        confirmRemoveInstructor.email ||
        "Instructor";
      setConfirmRemoveInstructor(null);
      setActionSuccess(`${removedName} removed from course.`);
      await onChanged?.();
    } catch (err) {
      setConfirmRemoveInstructor(null);
      setActionError(
        formatErrorMessage(err, "Unable to remove instructor from this course.")
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

      {/* Assigned Instructors List */}
      {instructors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800">
          No instructors assigned to this course.
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

                {canManageInstructors && (
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
      {canManageInstructors && confirmRemoveInstructor && (
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
              from this course?
            </p>
            {confirmRemoveInstructor.is_primary && (
              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                This instructor is currently marked as the Primary instructor.
                Removing them will leave the course without a primary
                instructor until a new one is assigned.
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
              Assign Eligible Instructor
            </h4>
          </div>

          {isArchived ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
              This course is archived. Archived courses cannot receive new
              instructor assignments. Restore the course to Draft to assign
              instructors.
            </p>
          ) : (
            <form onSubmit={handleAssignSubmit} className="space-y-3">
              {/* Searchable Directory Input */}
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={searchTerm}
                  disabled={isMutating}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search active, eligible instructors by name, email, code, or specialization..."
                  aria-label="Search eligible instructors"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Directory Results */}
              {directoryError ? (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  <span>{directoryError}</span>
                  <button
                    type="button"
                    onClick={fetchEligibleInstructors}
                    className="inline-flex cursor-pointer items-center gap-1 font-semibold underline"
                  >
                    <FiRefreshCw className="h-3 w-3" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : isSearching ? (
                <p className="py-2 text-xs text-zinc-500">
                  Searching eligible instructors...
                </p>
              ) : availableInstructors.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800">
                  No unassigned eligible instructors match your search.
                </p>
              ) : (
                <div
                  role="listbox"
                  aria-label="Eligible instructors"
                  className="max-h-48 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {availableInstructors.map((inst) => {
                    const isSelected =
                      selectedInstructor?.user_id === inst.user_id;
                    return (
                      <button
                        key={inst.user_id}
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

              {/* Selected Instructor & Primary Toggle */}
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
                        current primary instructor designation on this course.
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
