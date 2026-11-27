"use client";

import { FiSearch } from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const LEVEL_OPTIONS = [
  { value: "", label: "Any Level" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All Levels" },
];

const SORT_BY_OPTIONS = [
  { value: "created_at", label: "Sort: Created Date" },
  { value: "updated_at", label: "Sort: Updated Date" },
  { value: "title", label: "Sort: Title" },
  { value: "course_code", label: "Sort: Course Code" },
  { value: "fee", label: "Sort: Fee" },
  { value: "status", label: "Sort: Status" },
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

export function CourseFilters({
  search,
  status,
  level,
  category,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onLevelChange,
  onCategoryChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
}) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(level) ||
    Boolean(category) ||
    sortBy !== "created_at" ||
    sortOrder !== "desc";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, code, slug, or category..."
            aria-label="Search courses"
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
            value={level}
            onChange={(e) => onLevelChange(e.target.value)}
            aria-label="Filter by level"
            className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            placeholder="Category..."
            aria-label="Filter by category"
            className="w-36 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
          />

          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            aria-label="Sort courses by"
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
              className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
