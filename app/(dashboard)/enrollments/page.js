"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listEnrollmentsApi } from "@/lib/enrollmentApi";
import { PERMISSIONS } from "@/lib/permissions";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { Button } from "@/components/Button";
import { CreateEnrollmentModal } from "@/components/enrollment/CreateEnrollmentModal";
import { EnrollmentDrawer } from "@/components/enrollment/EnrollmentDrawer";
import { EnrollmentFilters } from "@/components/enrollment/EnrollmentFilters";
import { EnrollmentTable } from "@/components/enrollment/EnrollmentTable";

export default function EnrollmentsPage() {
  const { isCheckingAuth, isAuthenticated, hasPermission } = useAuth();
  const canRead = hasPermission(PERMISSIONS.ENROLLMENTS_READ);
  const canCreate = hasPermission(PERMISSIONS.ENROLLMENTS_CREATE);

  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchEnrollments = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canRead) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const res = await listEnrollmentsApi({
        page,
        limit: 10,
        search,
        registration_status: registrationStatus,
        payment_status: paymentStatus,
        enrollment_status: enrollmentStatus,
      });
      setEnrollments(Array.isArray(res?.data) ? res.data : []);
      setPagination(
        res?.pagination || { page, limit: 10, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setError(err.message || "Unable to load enrollments.");
    } finally {
      setIsLoading(false);
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canRead,
    page,
    search,
    registrationStatus,
    paymentStatus,
    enrollmentStatus,
  ]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canRead) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchEnrollments();
    }, 250);
    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canRead, fetchEnrollments]);

  const handleFilterReset = () => {
    setSearch("");
    setRegistrationStatus("");
    setPaymentStatus("");
    setEnrollmentStatus("");
    setPage(1);
  };

  if (!isCheckingAuth && isAuthenticated && !canRead) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Enrollments
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage and review student course enrollments across the LMS platform.
          </p>
        </div>
        <AccessRestricted
          title="Enrollments Access Restricted"
          message="Your account does not have permission to view enrollments."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Enrollments
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage and review student course enrollments across the LMS platform.
          </p>
        </div>

        {canCreate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0 px-5 py-2.5"
          >
            + New Enrollment
          </Button>
        )}
      </div>

      <EnrollmentFilters
        search={search}
        registrationStatus={registrationStatus}
        paymentStatus={paymentStatus}
        enrollmentStatus={enrollmentStatus}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onRegistrationStatusChange={(val) => {
          setRegistrationStatus(val);
          setPage(1);
        }}
        onPaymentStatusChange={(val) => {
          setPaymentStatus(val);
          setPage(1);
        }}
        onEnrollmentStatusChange={(val) => {
          setEnrollmentStatus(val);
          setPage(1);
        }}
        onOpenCreate={canCreate ? () => setIsCreateOpen(true) : undefined}
        onReset={handleFilterReset}
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <EnrollmentTable
        enrollments={enrollments}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onSelectEnrollment={(id) => setSelectedId(id)}
      />

      {canCreate && (
        <CreateEnrollmentModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={fetchEnrollments}
        />
      )}

      <EnrollmentDrawer
        enrollmentId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={fetchEnrollments}
      />
    </div>
  );
}
