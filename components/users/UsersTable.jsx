"use client";

import { FiEye } from "react-icons/fi";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  instructor: "Instructor",
  student: "Student",
};

const ROLE_STYLES = {
  super_admin: "border-purple-200 bg-purple-50 text-purple-700",
  admin: "border-[#9FE870] bg-[#9FE870]/30 text-[#163300]",
  staff: "border-sky-200 bg-sky-50 text-sky-700",
  instructor: "border-indigo-200 bg-indigo-50 text-indigo-700",
  student: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

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

function formatDate(value, emptyFallback = "—") {
  if (!value) return emptyFallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyFallback;
  return date.toLocaleDateString();
}

export function UsersTable({
  users,
  isLoading,
  pagination,
  onPageChange,
  onLimitChange,
  onViewUser,
}) {
  const { page = 1, limit = 10, totalPages = 1, total = 0 } = pagination || {};
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roles = Array.isArray(user.roles) ? user.roles : [];
                const statusKey = (user.status || "inactive").toLowerCase();
                const statusStyle =
                  STATUS_STYLES[statusKey] ||
                  "border-zinc-200 bg-zinc-100 text-zinc-600";

                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {user.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {user.phone_number || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {roles.length === 0 ? (
                          <span className="text-xs text-zinc-400">—</span>
                        ) : (
                          roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[role] ||
                                "border-zinc-200 bg-zinc-100 text-zinc-700"
                                }`}
                            >
                              {ROLE_LABELS[role] || role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                      >
                        {STATUS_LABELS[statusKey] || statusKey}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(user.last_login_at, "Never")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onViewUser?.(user.id)}
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
            Page <strong className="text-zinc-900 dark:text-zinc-100">{page}</strong> of{" "}
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
