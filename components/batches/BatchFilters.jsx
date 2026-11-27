"use client";

import { FiRefreshCw, FiSearch } from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "archived", label: "Archived" },
];

const SORT_BY_OPTIONS = [
  { value: "created_at", label: "Sort: Created Date" },
  { value: "start_date", label: "Sort: Start Date" },
  { value: "batch_name", label: "Sort: Batch Name" },
  { value: "batch_code", label: "Sort: Batch Code" },
  { value: "status", label: "Sort: Status" },
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

export function BatchFilters({
  search,
  courseId,
  status,
  sortBy,
  sortOrder,
  courses,
  isLoadingCourses,
  coursesError,
  hasMoreCourses,
  onLoadMoreCourses,
  onRetryCourses,
  onSearchChange,
  onCourseChange,
  onStatusChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
}) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(courseId) ||
    Boolean(status) ||
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
            placeholder="Search by batch name or code..."
            aria-label="Search batches"
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <select
              value={courseId}
              disabled={isLoadingCourses && courses.length === 0}
              onChange={(e) => onCourseChange(e.target.value)}
              aria-label="Filter by course"
              className="max-w-56 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-[#163300] disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="">
                {isLoadingCourses && courses.length === 0
                  ? "Loading courses..."
                  : "All Courses"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code
                    ? `${course.course_code} — ${course.title}`
                    : course.title}
                </option>
              ))}
            </select>

            {coursesError && (
              <button
                type="button"
                onClick={onRetryCourses}
                title={coursesError}
                aria-label="Retry loading courses"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                <span>Courses</span>
              </button>
            )}

            {hasMoreCourses && !coursesError && (
              <button
                type="button"
                disabled={isLoadingCourses}
                onClick={onLoadMoreCourses}
                className="cursor-pointer rounded-lg border border-zinc-200 px-2.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {isLoadingCourses ? "Loading..." : "More courses"}
              </button>
            )}
          </div>

          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            aria-label="Sort batches by"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-[#163300] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
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
