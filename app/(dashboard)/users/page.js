"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { getUsersApi } from "@/lib/userApi";
import { AccessRestricted } from "@/components/auth/AccessRestricted";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/Button";
import { CreateUserDrawer } from "@/components/users/CreateUserDrawer";
import { UserDrawer } from "@/components/users/UserDrawer";
import { UserFilters } from "@/components/users/UserFilters";
import { UsersTable } from "@/components/users/UsersTable";

const USER_CATEGORIES = [
  { id: "all", label: "All Users", icon: FiUsers },
  { id: "admins", label: "Admins", icon: FiShield },
  { id: "instructors", label: "Instructors", icon: FiBriefcase },
];

const ADMIN_ROLE_VALUES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

function UsersListContent() {
  const { isCheckingAuth, isAuthenticated, hasPermission } = useAuth();
  const canManageUsers = hasPermission(PERMISSIONS.USERS_MANAGE);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const requestIdRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    if (isCheckingAuth || !isAuthenticated || !canManageUsers) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError("");

    try {
      if (category === "admins" && !ADMIN_ROLE_VALUES.includes(role)) {
        const [superAdminRes, adminRes] = await Promise.all([
          getUsersApi({
            page: 1,
            limit: 100,
            search,
            role: ROLES.SUPER_ADMIN,
            status,
          }),
          getUsersApi({
            page: 1,
            limit: 100,
            search,
            role: ROLES.ADMIN,
            status,
          }),
        ]);

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const mergedById = new Map();
        const combinedRows = [
          ...(Array.isArray(superAdminRes?.data) ? superAdminRes.data : []),
          ...(Array.isArray(adminRes?.data) ? adminRes.data : []),
        ];

        for (const item of combinedRows) {
          if (item?.id && !mergedById.has(item.id)) {
            mergedById.set(item.id, item);
          }
        }

        const sortedUsers = Array.from(mergedById.values()).sort((a, b) => {
          const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });

        const total = sortedUsers.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPages);
        const startIndex = (safePage - 1) * limit;

        setUsers(sortedUsers.slice(startIndex, startIndex + limit));
        setPagination({
          page: safePage,
          limit,
          total,
          totalPages,
        });
        return;
      }

      const effectiveRole =
        category === "instructors"
          ? ROLES.INSTRUCTOR
          : category === "admins"
            ? role
            : role;

      const res = await getUsersApi({
        page,
        limit,
        search,
        role: effectiveRole,
        status,
      });

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setUsers(Array.isArray(res?.data) ? res.data : []);
      setPagination(
        res?.pagination || { page, limit, total: 0, totalPages: 1 }
      );
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      setError(
        err.status === 0
          ? "Unable to reach the server. Please check your connection and try again."
          : err.message || "Unable to load users."
      );
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    isCheckingAuth,
    isAuthenticated,
    canManageUsers,
    page,
    limit,
    category,
    search,
    role,
    status,
  ]);

  useEffect(() => {
    if (isCheckingAuth || !isAuthenticated || !canManageUsers) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);

    return () => clearTimeout(timer);
  }, [isCheckingAuth, isAuthenticated, canManageUsers, fetchUsers]);

  const handleCategoryChange = (nextCategory) => {
    if (nextCategory === category) {
      return;
    }

    setCategory(nextCategory);
    if (nextCategory === "instructors") {
      setRole(ROLES.INSTRUCTOR);
    } else if (nextCategory === "admins") {
      setRole((prev) => (ADMIN_ROLE_VALUES.includes(prev) ? prev : ""));
    } else {
      setRole("");
    }
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setRole(category === "instructors" ? ROLES.INSTRUCTOR : "");
    setStatus("");
    setPage(1);
  };

  const handleUserCreated = (createdUser) => {
    const label = createdUser?.full_name || createdUser?.email || "User";
    setSuccessMessage(`${label} created successfully.`);
    if (page !== 1) {
      setPage(1);
    } else {
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Users
            </h1>
            {!isLoading && !error && (
              <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {pagination.total} {pagination.total === 1 ? "user" : "users"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse, search, and filter LMS user accounts and roles.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setSuccessMessage("");
            setIsCreateOpen(true);
          }}
          className="shrink-0 px-5 py-2.5"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
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

      <div
        role="group"
        aria-label="User category"
        className="inline-flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-border-default bg-surface p-1.5 sm:w-fit"
      >
        {USER_CATEGORIES.map((item) => {
          const Icon = item.icon;
          const isSelected = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleCategoryChange(item.id)}
              className={[
                "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-initial",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-text-secondary hover:bg-neutral-hover hover:text-text-primary",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <UserFilters
        category={category}
        search={search}
        role={role}
        status={status}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onRoleChange={(val) => {
          setRole(val);
          setPage(1);
        }}
        onStatusChange={(val) => {
          setStatus(val);
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
            Unable to Load Users
          </h2>
          <p className="mt-1 max-w-md text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
          <Button
            type="button"
            onClick={fetchUsers}
            className="mt-4 px-5 py-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : (
        <UsersTable
          users={users}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onViewUser={(id) => setSelectedUserId(id)}
        />
      )}

      <CreateUserDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleUserCreated}
      />

      {selectedUserId && (
        <UserDrawer
          key={selectedUserId}
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdated={fetchUsers}
        />
      )}
    </div>
  );
}

export default function UsersPage() {
  const { isCheckingAuth, isAuthenticated } = useAuth();

  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.USERS_MANAGE}
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Users
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Browse, search, and filter LMS user accounts and roles.
            </p>
          </div>
          <AccessRestricted
            title="Users Access Restricted"
            message="Your account does not have permission to view or manage users."
          />
        </div>
      }
    >
      <UsersListContent />
    </PermissionGate>
  );
}
