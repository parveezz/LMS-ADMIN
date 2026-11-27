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
import { listBatchesApi } from "@/lib/batchApi";
import { getCoursesApi } from "@/lib/courseApi";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/Button";
import { BatchFilters } from "@/components/batches/BatchFilters";
import { BatchesTable } from "@/components/batches/BatchesTable";
import { CreateBatchDrawer } from "@/components/batches/CreateBatchDrawer";
import { BatchDetailsDrawer } from "@/components/batches/BatchDetailsDrawer";

const ALLOWED_BATCH_LIST_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
];

const ALLOWED_BATCH_MANAGE_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

function BatchesListContent() {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();
  const canAccessBatches =
    hasPermission(PERMISSIONS.BATCHES_READ) &&
    hasAnyRole(ALLOWED_BATCH_LIST_ROLES);
  const canManageBatches =
    hasPermission(PERMISSIONS.BATCHES_MANAGE) &&
    hasAnyRole(ALLOWED_BATCH_MANAGE_ROLES);
  const canReadCourses = hasPermission(PERMISSIONS.COURSES_READ);

  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Course filter options (paginated via getCoursesApi)
  const [courses, setCourses] = useState([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseTotalPages, setCourseTotalPages] = useState(1);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState("");

  const requestIdRef = useRef(0);
  const courseRequestIdRef = useRef(0);

  const fetchBatches = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canAccessBatches) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      const res = await listBatchesApi({
        page,
        limit,
        search,
        course_id: courseId,
        status,
        sortBy,
        sortOrder,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setBatches(Array.isArray(res?.data) ? res.data : []);
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
          "You do not have permission to access batch management."
        );
      } else {
        setError(err.message || "Unable to load batches.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canAccessBatches,
    page,
    limit,
    search,
    courseId,
    status,
    sortBy,
    sortOrder,
  ]);

  const fetchCoursesPage = useCallback(
    async (targetPage = 1, append = false) => {
      if (isCheckingAuth || !isAuthenticated || !canReadCourses) {
        return;
      }

      const currentCourseReqId = ++courseRequestIdRef.current;
      setIsLoadingCourses(true);
      setCoursesError("");

      try {
        const res = await getCoursesApi({
          page: targetPage,
          limit: 100,
          sortBy: "title",
          sortOrder: "asc",
        });

        if (currentCourseReqId !== courseRequestIdRef.current) {
          return;
        }

        const rows = Array.isArray(res?.data) ? res.data : [];
        setCourses((prev) => {
          if (!append) return rows;
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...rows.filter((c) => !seen.has(c.id))];
        });
        setCoursePage(res?.pagination?.page || targetPage);
        setCourseTotalPages(res?.pagination?.totalPages || 1);
      } catch (err) {
        if (currentCourseReqId !== courseRequestIdRef.current) {
          return;
        }
        setCoursesError(
          err?.message || "Unable to load courses for filtering."
        );
      } finally {
        if (currentCourseReqId === courseRequestIdRef.current) {
          setIsLoadingCourses(false);
        }
      }
    },
    [isCheckingAuth, isAuthenticated, canReadCourses]
  );

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canAccessBatches) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchBatches();
    }, 300);

    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canAccessBatches, fetchBatches]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canReadCourses) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchCoursesPage(1, false);
    }, 0);

    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canReadCourses, fetchCoursesPage]);

  const handleReset = () => {
    setSearch("");
    setCourseId("");
    setStatus("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) || Boolean(courseId) || Boolean(status);

  const handleBatchCreated = (createdBatch) => {
    const label =
      createdBatch?.batch_name || createdBatch?.batch_code || "Batch";
    const mayBeHidden =
      (status && status !== "draft") ||
      Boolean(search) ||
      (courseId && createdBatch?.course_id !== courseId);

    setSuccessMessage(
      mayBeHidden
        ? `${label} created in Draft status. Active search or filters may hide it from the current view.`
        : `${label} created successfully in Draft status.`
    );

    if (page !== 1) {
      setPage(1);
    } else {
      fetchBatches();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Batches
            </h1>
            {!isLoading && !error && (
              <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {pagination.total}{" "}
                {pagination.total === 1 ? "batch" : "batches"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse, search, and filter course batches, schedules, and seat
            capacity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBatches}
            disabled={isLoading}
            className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-sm border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FiRefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {canManageBatches && (
            <Button
              type="button"
              onClick={() => {
                setSuccessMessage("");
                setIsCreateOpen(true);
              }}
              className="shrink-0 px-5 py-2.5"
            >
              <FiPlus className="h-4 w-4" />
              <span>Create Batch</span>
            </Button>
          )}
        </div>
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

      <BatchFilters
        search={search}
        courseId={courseId}
        status={status}
        sortBy={sortBy}
        sortOrder={sortOrder}
        courses={courses}
        isLoadingCourses={isLoadingCourses}
        coursesError={coursesError}
        hasMoreCourses={coursePage < courseTotalPages}
        onLoadMoreCourses={() => fetchCoursesPage(coursePage + 1, true)}
        onRetryCourses={() => fetchCoursesPage(1, false)}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onCourseChange={(val) => {
          setCourseId(val);
          setPage(1);
        }}
        onStatusChange={(val) => {
          setStatus(val);
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
            Unable to Load Batches
          </h2>
          <p className="mt-1 max-w-md text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button
            type="button"
            onClick={fetchBatches}
            className="mt-4 px-5 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : (
        <BatchesTable
          batches={batches}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onViewBatch={(id) => setSelectedBatchId(id)}
        />
      )}

      {canManageBatches && (
        <CreateBatchDrawer
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleBatchCreated}
          courses={courses}
          isLoadingCourses={isLoadingCourses}
          coursesError={coursesError}
          hasMoreCourses={coursePage < courseTotalPages}
          onLoadMoreCourses={() => fetchCoursesPage(coursePage + 1, true)}
          onRetryCourses={() => fetchCoursesPage(1, false)}
        />
      )}

      {selectedBatchId && (
        <BatchDetailsDrawer
          key={selectedBatchId}
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
          onUpdated={fetchBatches}
        />
      )}
    </div>
  );
}

export default function BatchesPage() {
  const { isCheckingAuth, isAuthenticated, hasAnyRole } = useAuth();

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  const hasAllowedRole = hasAnyRole(ALLOWED_BATCH_LIST_ROLES);

  const restrictedFallback = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Batches
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Browse, search, and filter course batches, schedules, and seat
          capacity.
        </p>
      </div>
      <AccessRestricted
        title="Batches Access Restricted"
        message="You do not have permission to view batch management."
      />
    </div>
  );

  if (!hasAllowedRole) {
    return restrictedFallback;
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.BATCHES_READ}
      fallback={restrictedFallback}
    >
      <BatchesListContent />
    </PermissionGate>
  );
}
