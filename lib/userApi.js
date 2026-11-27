import { apiClient } from "@/lib/apiClient";

export function getUsersApi({
  page = 1,
  limit = 10,
  search = "",
  role = "",
  status = "",
  sortBy = "",
  sortOrder = "",
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (typeof search === "string" && search.trim()) {
    params.set("search", search.trim());
  }
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);

  return apiClient(`/api/admin/users?${params.toString()}`, {
    method: "GET",
  });
}

export function getUserByIdApi(id) {
  return apiClient(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function createUserApi({
  full_name,
  email,
  password,
  phone_number,
  role,
}) {
  const body = {
    full_name,
    email,
    password,
    role,
    ...(phone_number !== undefined ? { phone_number } : {}),
  };

  return apiClient("/api/admin/users", {
    method: "POST",
    body,
  });
}

export function updateUserApi(id, payload = {}) {
  const body = {};
  if (Object.prototype.hasOwnProperty.call(payload, "full_name")) {
    body.full_name = payload.full_name;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "email")) {
    body.email = payload.email;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "phone_number")) {
    body.phone_number = payload.phone_number;
  }

  return apiClient(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body,
  });
}

export function updateUserStatusApi(id, { status }) {
  return apiClient(`/api/admin/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function getUserRolesApi(id) {
  return apiClient(`/api/admin/users/${encodeURIComponent(id)}/roles`, {
    method: "GET",
  });
}

export function assignUserRoleApi(id, { role, reason }) {
  return apiClient(`/api/admin/users/${encodeURIComponent(id)}/roles`, {
    method: "POST",
    body: {
      role,
      ...(reason !== undefined ? { reason } : {}),
    },
  });
}

export function replaceUserRolesApi(id, { roles, reason }) {
  return apiClient(`/api/admin/users/${encodeURIComponent(id)}/roles`, {
    method: "PUT",
    body: {
      roles,
      ...(reason !== undefined ? { reason } : {}),
    },
  });
}

export function removeUserRoleApi(id, roleName, payload) {
  const hasReason =
    payload && Object.prototype.hasOwnProperty.call(payload, "reason");

  return apiClient(
    `/api/admin/users/${encodeURIComponent(id)}/roles/${encodeURIComponent(roleName)}`,
    {
      method: "DELETE",
      ...(hasReason ? { body: { reason: payload.reason } } : {}),
    }
  );
}
