import { apiClient } from "@/lib/apiClient";

const STUDENT_PROFILE_FIELDS = [
  "student_code",
  "date_of_birth",
  "gender",
  "address",
  "city",
  "state",
  "country",
  "postal_code",
  "guardian_name",
  "guardian_phone",
  "education_level",
  "institution",
  "notes",
];

function pickStudentProfilePayload(payload = {}) {
  const body = {};
  if (!payload || typeof payload !== "object") {
    return body;
  }

  for (const field of STUDENT_PROFILE_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(payload, field) &&
      payload[field] !== undefined
    ) {
      body[field] = payload[field];
    }
  }

  return body;
}

export function getStudentsApi({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  sortBy = "",
  sortOrder = "",
} = {}) {
  const params = new URLSearchParams();

  if (page !== undefined && page !== null && page !== "") {
    params.set("page", String(page));
  }
  if (limit !== undefined && limit !== null && limit !== "") {
    params.set("limit", String(limit));
  }
  if (typeof search === "string" && search.trim()) {
    params.set("search", search.trim());
  }
  if (typeof status === "string" && status.trim()) {
    params.set("status", status.trim());
  }
  if (typeof sortBy === "string" && sortBy.trim()) {
    params.set("sortBy", sortBy.trim());
  }
  if (typeof sortOrder === "string" && sortOrder.trim()) {
    params.set("sortOrder", sortOrder.trim());
  }

  const query = params.toString();
  const path = query ? `/api/admin/students?${query}` : "/api/admin/students";

  return apiClient(path, {
    method: "GET",
  });
}

export function getStudentByIdApi(userId) {
  return apiClient(`/api/admin/students/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}

export function upsertStudentProfileApi(userId, payload = {}) {
  return apiClient(
    `/api/admin/students/${encodeURIComponent(userId)}/profile`,
    {
      method: "PUT",
      body: pickStudentProfilePayload(payload),
    }
  );
}

export function getStudentEnrollmentsApi(
  userId,
  { page = 1, limit = 10 } = {}
) {
  const params = new URLSearchParams();

  if (page !== undefined && page !== null && page !== "") {
    params.set("page", String(page));
  }
  if (limit !== undefined && limit !== null && limit !== "") {
    params.set("limit", String(limit));
  }

  const query = params.toString();
  const basePath = `/api/admin/students/${encodeURIComponent(userId)}/enrollments`;
  const path = query ? `${basePath}?${query}` : basePath;

  return apiClient(path, {
    method: "GET",
  });
}
