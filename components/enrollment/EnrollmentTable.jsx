"use client";

import { StatusBadge } from "./StatusBadge";

export function EnrollmentTable({
  enrollments,
  isLoading,
  pagination,
  onPageChange,
  onSelectEnrollment,
}) {
  const { page = 1, totalPages = 1, total = 0 } = pagination || {};

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
              <th className="px-4 py-3">Enrollment #</th>
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Enrollment</th>
              <th className="px-4 py-3">Total Fee</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  Loading enrollments...
                </td>
              </tr>
            ) : enrollments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  No enrollments found.
                </td>
              </tr>
            ) : (
              enrollments.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    <div>{item.enrollment_number || item.id.slice(0, 8)}</div>
                    {item.notes && (
                      <p className="mt-0.5 max-w-xs truncate text-xs font-normal text-zinc-500">
                        {item.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.registration_status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.enrollment_status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {item.total_fee !== null && item.total_fee !== undefined
                      ? Number(item.total_fee).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectEnrollment(item.id)}
                      className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <span>
          Page <strong className="text-zinc-900 dark:text-zinc-100">{page}</strong> of{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {Math.max(1, totalPages)}
          </strong>{" "}
          ({total} total)
        </span>
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
            disabled={page >= totalPages || isLoading}
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
