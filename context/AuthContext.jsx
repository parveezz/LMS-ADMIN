"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { setUnauthorizedHandler } from "@/lib/apiClient";
import { getMeApi, logoutApi } from "@/lib/authApi";
import {
  hasAnyPermission as checkAnyPermission,
  hasAnyRole as checkAnyRole,
  hasPermission as checkPermission,
  hasRole as checkRole,
} from "@/lib/permissions";

const AUTH_ROUTES = new Set([
  "/",
  "/login",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const inFlightRefreshRef = useRef(null);
  const isRedirectingRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    if (AUTH_ROUTES.has(pathname)) {
      isRedirectingRef.current = false;
    }
  }, [pathname]);

  const refreshSession = useCallback(async () => {
    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    const promise = (async () => {
      try {
        const res = await getMeApi();
        const nextUser = res?.data?.user || null;
        setUser(nextUser);
        return nextUser;
      } catch {
        setUser(null);
        return null;
      } finally {
        setIsCheckingAuth(false);
        inFlightRefreshRef.current = null;
      }
    })();

    inFlightRefreshRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    return setUnauthorizedHandler(() => {
      setUser(null);
      setIsCheckingAuth(false);

      const currentPath = pathnameRef.current;
      if (AUTH_ROUTES.has(currentPath) || isRedirectingRef.current) {
        return;
      }

      isRedirectingRef.current = true;
      router.replace("/login");
    });
  }, [router]);

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;
    try {
      await logoutApi();
    } catch {
      // Clear client state and redirect even if backend logout fails
    } finally {
      setUser(null);
      setIsCheckingAuth(false);
      isRedirectingRef.current = true;
      router.replace("/login");
      router.refresh();
      isLoggingOutRef.current = false;
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isCheckingAuth,
      isAuthenticated: Boolean(user),
      setUser,
      refreshSession,
      logout,
      hasPermission: (permission) => checkPermission(user, permission),
      hasAnyPermission: (permissions) => checkAnyPermission(user, permissions),
      hasRole: (role) => checkRole(user, role),
      hasAnyRole: (roles) => checkAnyRole(user, roles),
    }),
    [user, isCheckingAuth, refreshSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
