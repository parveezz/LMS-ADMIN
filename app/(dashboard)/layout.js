"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiChevronsLeft,
  FiChevronsRight,
  FiGrid,
  FiKey,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { ChangePasswordDrawer } from "@/components/auth/ChangePasswordDrawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "admin_portal_sidebar_collapsed";
const SIDEBAR_CHANGE_EVENT = "admin-portal-sidebar-change";

function subscribeSidebarCollapsed(callback) {
  if (typeof window === "undefined") {
    return () => { };
  }

  const handleStorage = (event) => {
    if (event.key === null || event.key === SIDEBAR_COLLAPSED_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback);
  };
}

function getSidebarCollapsedSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

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
    label: "Instructors",
    href: "/instructors",
    icon: FiBriefcase,
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
  {
    label: "Settings",
    href: "/settings",
    icon: FiSettings,
    permission: PERMISSIONS.TENANTS_MANAGE,
    roles: [ROLES.SUPER_ADMIN],
  },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isCheckingAuth, isAuthenticated, logout, hasPermission, hasAnyRole } =
    useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);
  const mobileCloseButtonRef = useRef(null);
  const isSidebarCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot
  );

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      (!item.permission || hasPermission(item.permission)) &&
      (!item.roles || hasAnyRole(item.roles))
  );

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    mobileMenuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    mobileCloseButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  const handleToggleSidebar = () => {
    if (typeof window === "undefined") {
      return;
    }

    const nextValue = !isSidebarCollapsed;
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(nextValue)
      );
      window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
    } catch {
      // Ignore storage write errors in restricted browsing contexts
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-workspace">
      {isCheckingAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-workspace text-sm text-text-muted">
          Verifying session...
        </div>
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-20 hidden shrink-0 flex-col justify-between border-r border-border-default bg-surface transition-[width,padding] duration-200 ease-in-out md:flex",
          isSidebarCollapsed ? "w-20 px-3 py-6" : "w-64 p-6",
        ].join(" ")}
      >
        <div>
          <div
            className={[
              "flex items-center",
              isSidebarCollapsed ? "justify-center" : "justify-between gap-2",
            ].join(" ")}
          >
            {!isSidebarCollapsed && (
              <div className="truncate text-lg font-semibold tracking-tight text-text-primary">
                Admin Portal
              </div>
            )}
            <Tooltip side="right">
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleToggleSidebar}
                  aria-label={
                    isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                  aria-expanded={!isSidebarCollapsed}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-default bg-surface text-text-secondary transition-colors hover:bg-neutral-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                >
                  {isSidebarCollapsed ? (
                    <FiChevronsRight className="h-4 w-4" />
                  ) : (
                    <FiChevronsLeft className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <nav
            aria-label="Sidebar navigation"
            className="mt-8 flex flex-col gap-1.5 text-sm"
          >
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              const Icon = item.icon;
              return (
                <Tooltip
                  key={item.href}
                  side="right"
                  disabled={!isSidebarCollapsed}
                  className="w-full"
                >
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      aria-label={isSidebarCollapsed ? item.label : undefined}
                      className={[
                        "flex w-full items-center rounded-md font-medium transition-colors",
                        isSidebarCollapsed
                          ? "justify-center p-2.5"
                          : "gap-2.5 px-3 py-2",
                        isActive
                          ? "bg-brand-soft text-brand-accent"
                          : "text-text-secondary hover:bg-neutral-hover hover:text-text-primary",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border-default pt-4">
          {user && (
            <Tooltip
              side="right"
              disabled={!isSidebarCollapsed}
              className="mb-3 w-full"
            >
              <TooltipTrigger asChild>
                <div
                  className={[
                    "flex w-full items-center",
                    isSidebarCollapsed ? "justify-center" : "gap-3",
                  ].join(" ")}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-accent">
                    {(user.full_name || user.email || "A")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {user.full_name}
                      </p>
                      <p className="truncate text-xs text-text-muted">{user.email}</p>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {user.full_name || "User"}
                  {user.email ? ` (${user.email})` : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className="space-y-2">
            <Tooltip
              side="right"
              disabled={!isSidebarCollapsed}
              className="w-full"
            >
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(true)}
                  aria-label={isSidebarCollapsed ? "Change Password" : undefined}
                  className={[
                    "flex w-full cursor-pointer items-center rounded-sm border border-border-default text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover",
                    isSidebarCollapsed
                      ? "justify-center px-2 py-2"
                      : "gap-2 px-3 py-2 text-left",
                  ].join(" ")}
                >
                  <FiKey className="h-3.5 w-3.5 shrink-0" />
                  {!isSidebarCollapsed && <span>Change Password</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change Password</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip
              side="right"
              disabled={!isSidebarCollapsed}
              className="w-full"
            >
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-label={isSidebarCollapsed ? "Sign Out" : undefined}
                  className={[
                    "flex w-full cursor-pointer items-center rounded-sm border border-border-default text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover disabled:opacity-60",
                    isSidebarCollapsed
                      ? "justify-center px-2 py-2"
                      : "gap-2 px-3 py-2 text-left",
                  ].join(" ")}
                >
                  <FiLogOut className="h-3.5 w-3.5 shrink-0" />
                  {!isSidebarCollapsed && (
                    <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isLoggingOut ? "Signing out..." : "Sign Out"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
      <div
        className={[
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-in-out",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-default bg-surface px-4 py-3 md:hidden">
          <div className="truncate text-base font-semibold tracking-tight text-text-primary">
            Admin Portal
          </div>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-default bg-surface text-text-secondary transition-colors hover:bg-neutral-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            <FiMenu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <aside
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between border-r border-border-default bg-surface p-5 shadow-xl"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-lg font-semibold tracking-tight text-text-primary">
                  Admin Portal
                </div>
                <button
                  ref={mobileCloseButtonRef}
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Close navigation menu"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-default bg-surface text-text-secondary transition-colors hover:bg-neutral-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <nav
                aria-label="Mobile navigation"
                className="mt-6 flex flex-1 flex-col gap-1.5 overflow-y-auto text-sm"
              >
                {visibleNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={[
                        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
                        isActive
                          ? "bg-brand-soft text-brand-accent"
                          : "text-text-secondary hover:bg-neutral-hover hover:text-text-primary",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="mt-4 border-t border-border-default pt-4">
              {user && (
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-accent">
                    {(user.full_name || user.email || "A")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {user.full_name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm border border-border-default px-3 py-2 text-left text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                >
                  <FiKey className="h-3.5 w-3.5 shrink-0" />
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm border border-border-default px-3 py-2 text-left text-xs font-semibold text-text-secondary transition hover:bg-neutral-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:opacity-60"
                >
                  <FiLogOut className="h-3.5 w-3.5 shrink-0" />
                  <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <ChangePasswordDrawer
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
