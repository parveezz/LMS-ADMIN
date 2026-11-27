"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { getInstructorsApi } from "@/lib/instructorApi";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/Button";
import { InstructorFilters } from "@/components/instructors/InstructorFilters";
import { InstructorsTable } from "@/components/instructors/InstructorsTable";
import { InstructorDetailsDrawer } from "@/components/instructors/InstructorDetailsDrawer";

const ALLOWED_INSTRUCTOR_LIST_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
];

function InstructorsListContent() {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();
  const canAccessInstructors =
    hasPermission(PERMISSIONS.USERS_READ) &&
    hasAnyRole(ALLOWED_INSTRUCTOR_LIST_ROLES);
  const canViewInstructorDetails = hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

  const [instructors, setInstructors] = useState([]);
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
  const [teachingEligible, setTeachingEligible] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const requestIdRef = useRef(0);

  const fetchInstructors = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canAccessInstructors) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      const res = await getInstructorsApi({
        page,
        limit,
        search,
        status,
        is_teaching_eligible: teachingEligible,
        sortBy,
        sortOrder,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setInstructors(Array.isArray(res?.data) ? res.data : []);
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
          "You do not have permission to access the instructors directory."
        );
      } else {
        setError(err.message || "Unable to load instructors.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canAccessInstructors,
    page,
    limit,
    search,
    status,
    teachingEligible,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canAccessInstructors) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchInstructors();
    }, 300);

    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canAccessInstructors, fetchInstructors]);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setTeachingEligible("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) || Boolean(status) || Boolean(teachingEligible);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Instructors
            </h1>
            {!isLoading && !error && (
              <span className="inline-flex w-fit items-center rounded-full border border-border-default bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
                {pagination.total}{" "}
                {pagination.total === 1 ? "instructor" : "instructors"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Browse, search, and filter LMS instructors, specializations, and
            teaching eligibility.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInstructors}
          disabled={isLoading}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-sm border border-border-default bg-surface px-3.5 py-2 text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover disabled:opacity-50"
        >
          <FiRefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      <InstructorFilters
        search={search}
        status={status}
        teachingEligible={teachingEligible}
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
        onTeachingEligibleChange={(val) => {
          setTeachingEligible(val);
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
          className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-surface px-6 py-10 text-center dark:border-red-900/50"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <FiAlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">
            Unable to Load Instructors
          </h2>
          <p className="mt-1 max-w-md text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button
            type="button"
            onClick={fetchInstructors}
            className="mt-4 px-5 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : (
        <InstructorsTable
          instructors={instructors}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          pagination={pagination}
          canViewDetails={canViewInstructorDetails}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onViewInstructor={
            canViewInstructorDetails
              ? (instructor) => setSelectedInstructor(instructor)
              : undefined
          }
        />
      )}

      {canViewInstructorDetails && selectedInstructor && (
        <InstructorDetailsDrawer
          key={selectedInstructor.user_id}
          instructorSummary={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onUpdated={fetchInstructors}
        />
      )}
    </div>
  );
}

export default function InstructorsPage() {
  const { isCheckingAuth, isAuthenticated, hasAnyRole } = useAuth();

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  const hasAllowedRole = hasAnyRole(ALLOWED_INSTRUCTOR_LIST_ROLES);

  const restrictedFallback = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Instructors
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Browse, search, and filter LMS instructors, specializations, and
          teaching eligibility.
        </p>
      </div>
      <AccessRestricted
        title="Instructors Access Restricted"
        message="You do not have permission to view the instructors directory."
      />
    </div>
  );

  if (!hasAllowedRole) {
    return restrictedFallback;
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.USERS_READ}
      fallback={restrictedFallback}
    >
      <InstructorsListContent />
    </PermissionGate>
  );
}
