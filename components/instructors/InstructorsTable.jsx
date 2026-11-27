"use client";

import { FiEye } from "react-icons/fi";

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

function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
}

export function InstructorsTable({
  instructors,
  isLoading,
  hasActiveFilters,
  pagination,
  canViewDetails = true,
  onPageChange,
  onLimitChange,
  onViewInstructor,
}) {
  const { page = 1, limit = 10, totalPages = 1, total = 0 } = pagination || {};
  const safeTotalPages = Math.max(1, totalPages);
  const columnCount = canViewDetails ? 11 : 10;

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-subtle text-xs font-semibold uppercase tracking-wider text-text-muted">
              <th className="px-4 py-3">Instructor Code</th>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Employment</th>
              <th className="px-4 py-3">Account Status</th>
              <th className="px-4 py-3">Eligibility</th>
              <th className="px-4 py-3">Created Date</th>
              {canViewDetails && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-10 text-center text-sm text-text-muted"
                >
                  Loading instructors...
                </td>
              </tr>
            ) : instructors.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-10 text-center text-sm text-text-muted"
                >
                  {hasActiveFilters
                    ? "No instructors match the current search or filter criteria."
                    : "No instructors found."}
                </td>
              </tr>
            ) : (
              instructors.map((instructor) => {
                const statusKey = (instructor.status || "inactive").toLowerCase();
                const statusStyle =
                  STATUS_STYLES[statusKey] ||
                  "border-zinc-200 bg-zinc-100 text-zinc-600";
                const empKey = (instructor.employment_type || "").toLowerCase();
                const hasExperience =
                  instructor.years_of_experience !== null &&
                  instructor.years_of_experience !== undefined;

                return (
                  <tr
                    key={instructor.user_id}
                    className="transition-colors hover:bg-neutral-hover/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-text-primary">
                      {instructor.instructor_code || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {instructor.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {instructor.email || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                      {instructor.phone_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {instructor.specialization || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {hasExperience
                        ? `${instructor.years_of_experience} ${instructor.years_of_experience === 1 ? "yr" : "yrs"
                        }`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {EMPLOYMENT_LABELS[empKey] ||
                        instructor.employment_type ||
                        "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {STATUS_LABELS[statusKey] || instructor.status || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${instructor.effective_teaching_eligible
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200 bg-zinc-100 text-zinc-600"
                          }`}
                      >
                        {instructor.effective_teaching_eligible
                          ? "Eligible"
                          : "Not Eligible"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">
                      {formatDate(instructor.created_at)}
                    </td>
                    {canViewDetails && (
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onViewInstructor?.(instructor)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border-default px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-border-default px-4 py-3 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span>
            Page <strong className="text-text-primary">{page}</strong> of{" "}
            <strong className="text-text-primary">{safeTotalPages}</strong> (
            {total} total)
          </span>

          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="rounded border border-border-default bg-surface px-2 py-1 text-xs text-text-secondary outline-none focus:border-primary"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="cursor-pointer rounded-sm border border-border-default px-3 py-1.5 font-medium text-text-secondary transition hover:bg-neutral-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= safeTotalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="cursor-pointer rounded-sm border border-border-default px-3 py-1.5 font-medium text-text-secondary transition hover:bg-neutral-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
