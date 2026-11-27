"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { getStudentsApi } from "@/lib/studentApi";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/Button";
import { StudentFilters } from "@/components/students/StudentFilters";
import { StudentsTable } from "@/components/students/StudentsTable";
import { StudentDetailsDrawer } from "@/components/students/StudentDetailsDrawer";

const ALLOWED_STUDENT_LIST_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
];

function StudentsListContent() {
  const { isCheckingAuth, isAuthenticated, hasPermission, hasAnyRole } =
    useAuth();
  const canAccessStudents =
    hasPermission(PERMISSIONS.USERS_READ) &&
    hasAnyRole(ALLOWED_STUDENT_LIST_ROLES);

  const [students, setStudents] = useState([]);
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
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const requestIdRef = useRef(0);

  const fetchStudents = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canAccessStudents) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      const res = await getStudentsApi({
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setStudents(Array.isArray(res?.data) ? res.data : []);
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
            "You do not have permission to access the students directory."
        );
      } else {
        setError(err.message || "Unable to load students.");
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canAccessStudents,
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canAccessStudents) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canAccessStudents, fetchStudents]);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search) || Boolean(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Students
            </h1>
            {!isLoading && !error && (
              <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {pagination.total}{" "}
                {pagination.total === 1 ? "student" : "students"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse, search, and filter registered LMS student accounts.
          </p>
        </div>
      </div>

      <StudentFilters
        search={search}
        status={status}
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
            Unable to Load Students
          </h2>
          <p className="mt-1 max-w-md text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button
            type="button"
            onClick={fetchStudents}
            className="mt-4 px-5 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : (
        <StudentsTable
          students={students}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onViewStudent={(student) => setSelectedStudent(student)}
        />
      )}

      {selectedStudent && (
        <StudentDetailsDrawer
          key={selectedStudent.user_id}
          studentSummary={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

export default function StudentsPage() {
  const { isCheckingAuth, isAuthenticated, hasAnyRole } = useAuth();

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  const hasAllowedRole = hasAnyRole(ALLOWED_STUDENT_LIST_ROLES);

  const restrictedFallback = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Students
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Browse, search, and filter registered LMS student accounts.
        </p>
      </div>
      <AccessRestricted
        title="Students Access Restricted"
        message="You do not have permission to view the students directory."
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
      <StudentsListContent />
    </PermissionGate>
  );
}
