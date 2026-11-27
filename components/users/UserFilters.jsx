"use client";

import { FiSearch } from "react-icons/fi";

const ALL_ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "instructor", label: "Instructor" },
  { value: "student", label: "Student" },
];

const ADMIN_ROLE_OPTIONS = [
  { value: "", label: "All Admins" },
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending_verification", label: "Pending Verification" },
];

export function UserFilters({
  category = "all",
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onReset,
}) {
  const showRoleSelect = category !== "instructors";
  const roleOptions =
    category === "admins" ? ADMIN_ROLE_OPTIONS : ALL_ROLE_OPTIONS;
  const hasActiveFilters =
    Boolean(search) || (showRoleSelect && Boolean(role)) || Boolean(status);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex-1 lg:max-w-sm">
        <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, or phone..."
          aria-label="Search users"
          className="w-full rounded-lg border border-border-default bg-surface py-2 pl-10 pr-3.5 text-sm text-text-primary placeholder:text-text-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {showRoleSelect && (
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            aria-label="Filter by role"
            className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
