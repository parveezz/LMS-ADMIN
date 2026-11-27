import { apiClient } from "@/lib/apiClient";

const CREATE_BATCH_FIELDS = [
  "batch_code",
  "batch_name",
  "course_id",
  "description",
  "capacity",
  "start_date",
  "end_date",
  "schedule_summary",
];

const UPDATE_BATCH_FIELDS = [
  "batch_code",
  "batch_name",
  "description",
  "capacity",
  "start_date",
  "end_date",
  "schedule_summary",
];

function pickFields(payload = {}, allowedFields = []) {
  const body = {};
  if (!payload || typeof payload !== "object") {
    return body;
  }

  for (const field of allowedFields) {
    if (
      Object.prototype.hasOwnProperty.call(payload, field) &&
      payload[field] !== undefined
    ) {
      body[field] = payload[field];
    }
  }

  return body;
}

export function listBatchesApi({
  page = 1,
  limit = 10,
  search = "",
  course_id = "",
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
  if (typeof course_id === "string" && course_id.trim()) {
    params.set("course_id", course_id.trim());
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
  const path = query ? `/api/admin/batches?${query}` : "/api/admin/batches";

  return apiClient(path, {
    method: "GET",
  });
}

export function createBatchApi(payload = {}) {
  return apiClient("/api/admin/batches", {
    method: "POST",
    body: pickFields(payload, CREATE_BATCH_FIELDS),
  });
}

export function getBatchByIdApi(id) {
  return apiClient(`/api/admin/batches/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function updateBatchApi(id, payload = {}) {
  return apiClient(`/api/admin/batches/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: pickFields(payload, UPDATE_BATCH_FIELDS),
  });
}

export function updateBatchStatusApi(id, payload = {}) {
  return apiClient(`/api/admin/batches/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: pickFields(payload, ["status"]),
  });
}

export function listBatchInstructorsApi(id) {
  return apiClient(
    `/api/admin/batches/${encodeURIComponent(id)}/instructors`,
    {
      method: "GET",
    }
  );
}

export function assignBatchInstructorApi(id, payload = {}) {
  return apiClient(
    `/api/admin/batches/${encodeURIComponent(id)}/instructors`,
    {
      method: "POST",
      body: pickFields(payload, ["instructor_id", "is_primary"]),
    }
  );
}

export function removeBatchInstructorApi(id, instructorId) {
  return apiClient(
    `/api/admin/batches/${encodeURIComponent(id)}/instructors/${encodeURIComponent(instructorId)}`,
    {
      method: "DELETE",
    }
  );
}

export function listBatchStudentsApi(id, { page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();

  if (page !== undefined && page !== null && page !== "") {
    params.set("page", String(page));
  }
  if (limit !== undefined && limit !== null && limit !== "") {
    params.set("limit", String(limit));
  }

  const query = params.toString();
  const basePath = `/api/admin/batches/${encodeURIComponent(id)}/students`;
  const path = query ? `${basePath}?${query}` : basePath;

  return apiClient(path, {
    method: "GET",
  });
}

export function assignBatchStudentApi(id, payload = {}) {
  return apiClient(`/api/admin/batches/${encodeURIComponent(id)}/students`, {
    method: "POST",
    body: pickFields(payload, ["enrollment_id", "reason"]),
  });
}

export function removeBatchStudentApi(id, enrollmentId, payload) {
  const hasReason =
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "reason") &&
    payload.reason !== undefined;

  return apiClient(
    `/api/admin/batches/${encodeURIComponent(id)}/students/${encodeURIComponent(enrollmentId)}`,
    {
      method: "DELETE",
      ...(hasReason ? { body: { reason: payload.reason } } : {}),
    }
  );
}
