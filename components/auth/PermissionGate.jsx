"use client";

import { useAuth } from "@/context/AuthContext";

export function PermissionGate({
  permission,
  permissions,
  fallback = null,
  children,
}) {
  const { hasPermission, hasAnyPermission } = useAuth();

  let allowed = false;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (Array.isArray(permissions) && permissions.length > 0) {
    allowed = hasAnyPermission(permissions);
  }

  return allowed ? children : fallback;
}
