"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiAward, FiBookOpen, FiGrid, FiKey, FiLayers, FiLogOut, FiUserCheck, FiUsers } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { ChangePasswordDrawer } from "@/components/auth/ChangePasswordDrawer";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: FiGrid },
  {
    label: "Courses",
    href: "/courses",
    icon: FiBookOpen,
    permission: PERMISSIONS.COURSES_READ,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  },
  {
    label: "Batches",
    href: "/batches",
    icon: FiLayers,
    permission: PERMISSIONS.BATCHES_READ,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  },
  {
    label: "Students",
    href: "/students",
    icon: FiAward,
    permission: PERMISSIONS.USERS_READ,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF],
  },
  {
    label: "Enrollments",
    href: "/enrollments",
    icon: FiUsers,
    permission: PERMISSIONS.ENROLLMENTS_READ,
  },
  {
    label: "Users",
    href: "/users",
    icon: FiUserCheck,
    permission: PERMISSIONS.USERS_MANAGE,
  },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isCheckingAuth, isAuthenticated, logout, hasPermission, hasAnyRole } =
    useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      (!item.permission || hasPermission(item.permission)) &&
      (!item.roles || hasAnyRole(item.roles))
  );

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      {isCheckingAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950">
          Verifying session...
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <div>
          <div className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Admin Portal
          </div>
          <nav className="mt-8 flex flex-col gap-1.5 text-sm">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-2.5 rounded-md px-3 py-2 font-medium transition-colors",
                    isActive
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#163300] text-xs font-semibold text-[#9FE870]">
                {(user.full_name || user.email || "A")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {user.full_name}
                </p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm border border-zinc-200 px-3 py-2 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiKey className="h-3.5 w-3.5" />
              <span>Change Password</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm border border-zinc-200 px-3 py-2 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col justify-between md:pl-64">
        <main className="flex-1 p-6 md:p-8">{children}</main>

        {/* Mobile bottom user bar powered by GET /api/auth/me */}
        <footer className="flex items-center justify-between border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          {user ? (
            <div className="min-w-0 pr-3">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user.full_name}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          ) : (
            <div />
          )}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Password
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </footer>
      </div>

      <ChangePasswordDrawer
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
