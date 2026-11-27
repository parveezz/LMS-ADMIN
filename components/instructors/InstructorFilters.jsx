"use client";

import { FiSearch } from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending_verification", label: "Pending Verification" },
];

const ELIGIBILITY_OPTIONS = [
  { value: "", label: "All Eligibility" },
  { value: "true", label: "Eligible" },
  { value: "false", label: "Not Eligible" },
];

const SORT_BY_OPTIONS = [
  { value: "created_at", label: "Sort: Created Date" },
  { value: "full_name", label: "Sort: Full Name" },
  { value: "email", label: "Sort: Email" },
  { value: "status", label: "Sort: Status" },
  { value: "instructor_code", label: "Sort: Instructor Code" },
  { value: "years_of_experience", label: "Sort: Experience" },
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

export function InstructorFilters({
  search,
  status,
  teachingEligible,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onTeachingEligibleChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
}) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(teachingEligible) ||
    sortBy !== "created_at" ||
    sortOrder !== "desc";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex-1 lg:max-w-sm">
        <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, phone, code, or specialization..."
          aria-label="Search instructors"
          className="w-full rounded-lg border border-border-default bg-surface py-2 pl-10 pr-3.5 text-sm text-text-primary placeholder:text-text-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
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

        <select
          value={teachingEligible}
          onChange={(e) => onTeachingEligibleChange(e.target.value)}
          aria-label="Filter by teaching eligibility"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
        >
          {ELIGIBILITY_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          aria-label="Sort instructors by"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
        >
          {SORT_BY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
          aria-label="Sort order"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
        >
          {SORT_ORDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded-lg border border-border-default px-3 py-2 text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
