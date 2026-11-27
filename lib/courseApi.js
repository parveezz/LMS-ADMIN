import { apiClient } from "@/lib/apiClient";

const COURSE_PAYLOAD_FIELDS = [
  "course_code",
  "title",
  "slug",
  "short_description",
  "description",
  "category",
  "level",
  "duration_hours",
  "fee",
  "thumbnail_url",
];

function pickCoursePayload(payload = {}) {
  const body = {};
  if (!payload || typeof payload !== "object") {
    return body;
  }

  for (const field of COURSE_PAYLOAD_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(payload, field) &&
      payload[field] !== undefined
    ) {
      body[field] = payload[field];
    }
  }

  return body;
}

export function getCoursesApi({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  category = "",
  level = "",
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
  if (typeof category === "string" && category.trim()) {
    params.set("category", category.trim());
  }
  if (typeof level === "string" && level.trim()) {
    params.set("level", level.trim());
  }
  if (typeof sortBy === "string" && sortBy.trim()) {
    params.set("sortBy", sortBy.trim());
  }
  if (typeof sortOrder === "string" && sortOrder.trim()) {
    params.set("sortOrder", sortOrder.trim());
  }

  const query = params.toString();
  const path = query ? `/api/admin/courses?${query}` : "/api/admin/courses";

  return apiClient(path, {
    method: "GET",
  });
}

export function getCourseByIdApi(id) {
  return apiClient(`/api/admin/courses/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function createCourseApi(payload = {}) {
  return apiClient("/api/admin/courses", {
    method: "POST",
    body: pickCoursePayload(payload),
  });
}

export function updateCourseApi(id, payload = {}) {
  return apiClient(`/api/admin/courses/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: pickCoursePayload(payload),
  });
}

export function updateCourseStatusApi(id, payload = {}) {
  const body = {};
  if (
    payload &&
    Object.prototype.hasOwnProperty.call(payload, "status") &&
    payload.status !== undefined
  ) {
    body.status = payload.status;
  }

  return apiClient(`/api/admin/courses/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body,
  });
}

export function getCourseInstructorsApi(id) {
  return apiClient(
    `/api/admin/courses/${encodeURIComponent(id)}/instructors`,
    {
      method: "GET",
    }
  );
}

export function assignCourseInstructorApi(id, payload = {}) {
  const body = {};
  if (payload && typeof payload === "object") {
    if (
      Object.prototype.hasOwnProperty.call(payload, "instructor_id") &&
      payload.instructor_id !== undefined
    ) {
      body.instructor_id = payload.instructor_id;
    }
    if (
      Object.prototype.hasOwnProperty.call(payload, "is_primary") &&
      payload.is_primary !== undefined
    ) {
      body.is_primary = payload.is_primary;
    }
  }

  return apiClient(
    `/api/admin/courses/${encodeURIComponent(id)}/instructors`,
    {
      method: "POST",
      body,
    }
  );
}

export function removeCourseInstructorApi(id, instructorId) {
  return apiClient(
    `/api/admin/courses/${encodeURIComponent(id)}/instructors/${encodeURIComponent(instructorId)}`,
    {
      method: "DELETE",
    }
  );
}
