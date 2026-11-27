export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  STAFF: "staff",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
};

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_MANAGE: "permissions.manage",
  TENANTS_MANAGE: "tenants.manage",
  ENROLLMENTS_READ: "enrollments.read",
  ENROLLMENTS_CREATE: "enrollments.create",
  ENROLLMENTS_UPDATE: "enrollments.update",
  ENROLLMENTS_MANAGE: "enrollments.manage",
  COURSES_READ: "courses.read",
  COURSES_CREATE: "courses.create",
  COURSES_UPDATE: "courses.update",
  COURSES_PUBLISH: "courses.publish",
  BATCHES_READ: "batches.read",
  BATCHES_MANAGE: "batches.manage",
  LEARNING_ACCESS: "learning.access",
  ASSESSMENTS_MANAGE: "assessments.manage",
  CERTIFICATES_MANAGE: "certificates.manage",
  ORDERS_READ: "orders.read",
  ORDERS_MANAGE: "orders.manage",
  CMS_MANAGE: "cms.manage",
  ANALYTICS_READ: "analytics.read",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Mirrors backend seeded role-to-permission mappings from
 * 007_seed_permissions_and_role_mappings.sql for UI visibility.
 * Backend authorization remains authoritative.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.ENROLLMENTS_READ,
    PERMISSIONS.ENROLLMENTS_CREATE,
    PERMISSIONS.ENROLLMENTS_UPDATE,
    PERMISSIONS.ENROLLMENTS_MANAGE,
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_PUBLISH,
    PERMISSIONS.BATCHES_READ,
    PERMISSIONS.BATCHES_MANAGE,
    PERMISSIONS.CERTIFICATES_MANAGE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.CMS_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ENROLLMENTS_READ,
    PERMISSIONS.ENROLLMENTS_CREATE,
    PERMISSIONS.ENROLLMENTS_UPDATE,
    PERMISSIONS.ENROLLMENTS_MANAGE,
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.BATCHES_READ,
    PERMISSIONS.ORDERS_READ,
  ],
  [ROLES.INSTRUCTOR]: [
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.ASSESSMENTS_MANAGE,
    PERMISSIONS.ENROLLMENTS_READ,
  ],
  [ROLES.STUDENT]: [PERMISSIONS.COURSES_READ, PERMISSIONS.LEARNING_ACCESS],
};

function normalizeValue(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getUserRoles(user) {
  if (!user || !Array.isArray(user.roles)) {
    return [];
  }
  return user.roles.map(normalizeValue).filter(Boolean);
}

export function getUserPermissions(user) {
  if (!user) {
    return new Set();
  }

  // Prefer dynamic permissions if provided by a future /api/auth/me response
  if (Array.isArray(user.permissions)) {
    return new Set(user.permissions.map(normalizeValue).filter(Boolean));
  }

  const roles = getUserRoles(user);
  const resolved = new Set();

  for (const role of roles) {
    const mapped = ROLE_PERMISSIONS[role];
    if (Array.isArray(mapped)) {
      for (const perm of mapped) {
        resolved.add(perm);
      }
    }
  }

  return resolved;
}

export function hasRole(user, role) {
  const normalized = normalizeValue(role);
  if (!normalized) return false;
  return getUserRoles(user).includes(normalized);
}

export function hasAnyRole(user, roles) {
  if (!Array.isArray(roles) || roles.length === 0) return false;
  const userRoles = getUserRoles(user);
  return roles.some((r) => userRoles.includes(normalizeValue(r)));
}

export function hasPermission(user, permission) {
  const normalized = normalizeValue(permission);
  if (!normalized) return false;
  return getUserPermissions(user).has(normalized);
}

export function hasAnyPermission(user, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  const userPermissions = getUserPermissions(user);
  return permissions.some((p) => userPermissions.has(normalizeValue(p)));
}
