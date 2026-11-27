"use client";

import { FiEye } from "react-icons/fi";

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

function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
}

export function BatchesTable({
  batches,
  isLoading,
  hasActiveFilters,
  pagination,
  onPageChange,
  onLimitChange,
  onViewBatch,
}) {
  const { page = 1, limit = 10, totalPages = 1, total = 0 } = pagination || {};
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
              <th className="px-4 py-3">Batch Code</th>
              <th className="px-4 py-3">Batch Name</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  Loading batches...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  {hasActiveFilters
                    ? "No batches match the current search or filter criteria."
                    : "No batches found."}
                </td>
              </tr>
            ) : (
              batches.map((batch) => {
                const statusKey = (batch.status || "draft").toLowerCase();
                const statusStyle =
                  STATUS_STYLES[statusKey] ||
                  "border-zinc-200 bg-zinc-100 text-zinc-600";

                const courseLabel =
                  batch.course_code && batch.course_title
                    ? `${batch.course_code} — ${batch.course_title}`
                    : batch.course_title || batch.course_code || "—";

                const capacityDisplay =
                  batch.capacity !== null && batch.capacity !== undefined
                    ? batch.available_seats !== null &&
                      batch.available_seats !== undefined
                      ? `${batch.capacity} (${batch.available_seats} left)`
                      : String(batch.capacity)
                    : "Unlimited";

                return (
                  <tr
                    key={batch.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {batch.batch_code || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {batch.batch_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {courseLabel}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {capacityDisplay}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {batch.enrolled_count ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                      {formatDate(batch.start_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                      {formatDate(batch.end_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {STATUS_LABELS[statusKey] || batch.status || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onViewBatch?.(batch.id)}
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
