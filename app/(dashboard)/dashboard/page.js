"use client";

import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { EnrollmentAnalytics } from "@/components/analytics/EnrollmentAnalytics";

export default function DashboardPage() {
  const { isCheckingAuth, isAuthenticated } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enrollment analytics, status breakdowns, and recent activity.
        </p>
      </div>

      {!isCheckingAuth && isAuthenticated && (
        <PermissionGate
          permission={PERMISSIONS.ANALYTICS_READ}
          fallback={
            <AccessRestricted
              title="Analytics Access Restricted"
              message="Your account does not have permission to view enrollment analytics."
            />
          }
        >
          <EnrollmentAnalytics />
        </PermissionGate>
      )}
    </div>
  );
}
