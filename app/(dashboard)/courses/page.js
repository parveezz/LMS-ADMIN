"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { getCoursesApi } from "@/lib/courseApi";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/Button";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { CoursesTable } from "@/components/courses/CoursesTable";
import { CreateCourseDrawer } from "@/components/courses/CreateCourseDrawer";
import { CourseDetailsDrawer } from "@/components/courses/CourseDetailsDrawer";

const ALLOWED_COURSE_LIST_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
];

const ALLOWED_COURSE_CREATE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

function CoursesListContent() {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();
  const canAccessCourses =
    hasPermission(PERMISSIONS.COURSES_READ) &&
    hasAnyRole(ALLOWED_COURSE_LIST_ROLES);
  const canCreateCourse =
    hasPermission(PERMISSIONS.COURSES_CREATE) &&
    hasAnyRole(ALLOWED_COURSE_CREATE_ROLES);

  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const requestIdRef = useRef(0);

  const fetchCourses = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canAccessCourses) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      const res = await getCoursesApi({
        page,
        limit,
        search,
        status,
        category,
        level,
        sortBy,
        sortOrder,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setCourses(Array.isArray(res?.data) ? res.data : []);
      setPagination(
        res?.pagination || { page, limit, total: 0, totalPages: 1 }
      );
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (err.status === 0) {
        setError(
          "Unable to reach the server. Please check your connection and try again."
        );
      } else if (err.status === 403) {
        setError(
          err.message ||
          "You do not have permission to access the courses directory."
        );
      } else {
        setError(err.message || "Unable to load courses.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canAccessCourses,
    page,
    limit,
    search,
    status,
    category,
    level,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canAccessCourses) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchCourses();
    }, 300);

    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canAccessCourses, fetchCourses]);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setLevel("");
    setCategory("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) || Boolean(status) || Boolean(level) || Boolean(category);

  const handleCourseCreated = (createdCourse) => {
    const label = createdCourse?.title || createdCourse?.course_code || "Course";
    const mayBeHidden =
      (status && status !== "draft") ||
      Boolean(search) ||
      Boolean(level) ||
      Boolean(category);

    setSuccessMessage(
      mayBeHidden
        ? `${label} created in Draft status. Active search or filters may hide it from the current view.`
        : `${label} created successfully in Draft status.`
    );

    if (page !== 1) {
      setPage(1);
    } else {
      fetchCourses();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Courses
            </h1>
            {!isLoading && !error && (
              <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {pagination.total}{" "}
                {pagination.total === 1 ? "course" : "courses"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse, search, and filter LMS courses, levels, and publication
            statuses.
          </p>
        </div>

        {canCreateCourse && (
          <Button
            type="button"
            onClick={() => {
              setSuccessMessage("");
              setIsCreateOpen(true);
            }}
            className="shrink-0 px-5 py-2.5"
          >
            <FiPlus className="h-4 w-4" />
            <span>Create Course</span>
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span className="flex items-center gap-2">
            <FiCheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="cursor-pointer text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <CourseFilters
        search={search}
        status={status}
        level={level}
        category={category}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        onLevelChange={(val) => {
          setLevel(val);
          setPage(1);
        }}
        onCategoryChange={(val) => {
          setCategory(val);
          setPage(1);
        }}
        onSortByChange={(val) => {
          setSortBy(val);
          setPage(1);
        }}
        onSortOrderChange={(val) => {
          setSortOrder(val);
          setPage(1);
        }}
        onReset={handleReset}
      />

      {error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-10 text-center dark:border-red-900/50 dark:bg-zinc-900"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <FiAlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Unable to Load Courses
          </h2>
          <p className="mt-1 max-w-md text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button
            type="button"
            onClick={fetchCourses}
            className="mt-4 px-5 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : (
        <CoursesTable
          courses={courses}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onViewCourse={(id) => setSelectedCourseId(id)}
        />
      )}

      {canCreateCourse && (
        <CreateCourseDrawer
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleCourseCreated}
        />
      )}

      {selectedCourseId && (
        <CourseDetailsDrawer
          key={selectedCourseId}
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
          onUpdated={fetchCourses}
        />
      )}
    </div>
  );
}

export default function CoursesPage() {
  const { isCheckingAuth, isAuthenticated, hasAnyRole } = useAuth();

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  const hasAllowedRole = hasAnyRole(ALLOWED_COURSE_LIST_ROLES);

  const restrictedFallback = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Courses
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Browse, search, and filter LMS courses, levels, and publication
          statuses.
        </p>
      </div>
      <AccessRestricted
        title="Courses Access Restricted"
        message="You do not have permission to view the admin courses directory."
      />
    </div>
  );

  if (!hasAllowedRole) {
    return restrictedFallback;
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.COURSES_READ}
      fallback={restrictedFallback}
    >
      <CoursesListContent />
    </PermissionGate>
  );
}
