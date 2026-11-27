"use client";

import { FiEye } from "react-icons/fi";

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

function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
}

function formatFee(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "—";
  }
  if (numeric === 0) {
    return "Free";
  }
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDuration(hours) {
  if (hours === null || hours === undefined || hours === "") {
    return "—";
  }
  const numeric = Number(hours);
  if (Number.isNaN(numeric)) {
    return "—";
  }
  return `${numeric} ${numeric === 1 ? "hr" : "hrs"}`;
}

export function CoursesTable({
  courses,
  isLoading,
  hasActiveFilters,
  pagination,
  onPageChange,
  onLimitChange,
  onViewCourse,
}) {
  const { page = 1, limit = 10, totalPages = 1, total = 0 } = pagination || {};
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
              <th className="px-4 py-3">Course Code</th>
              <th className="px-4 py-3">Course Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Instructors</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  Loading courses...
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  {hasActiveFilters
                    ? "No courses match the current search or filter criteria."
                    : "No courses found."}
                </td>
              </tr>
            ) : (
              courses.map((course) => {
                const statusKey = (course.status || "draft").toLowerCase();
                const statusStyle =
                  STATUS_STYLES[statusKey] ||
                  "border-zinc-200 bg-zinc-100 text-zinc-600";
                const levelKey = (course.level || "").toLowerCase();

                return (
                  <tr
                    key={course.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {course.course_code || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {course.title || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {course.category || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {LEVEL_LABELS[levelKey] || course.level || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatFee(course.fee)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDuration(course.duration_hours)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {STATUS_LABELS[statusKey] || course.status || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {course.instructor_count !== undefined &&
                        course.instructor_count !== null
                        ? course.instructor_count
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                      {formatDate(course.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onViewCourse?.(course.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <FiEye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span>
            Page{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">{page}</strong>{" "}
            of{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {safeTotalPages}
            </strong>{" "}
            ({total} total)
          </span>

          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
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
            className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1.5 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= safeTotalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1.5 font-medium transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
