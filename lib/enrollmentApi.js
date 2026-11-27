import { apiClient } from "@/lib/apiClient";

export function listEnrollmentsApi({
  page = 1,
  limit = 10,
  search = "",
  registration_status = "",
  payment_status = "",
  enrollment_status = "",
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search.trim()) params.set("search", search.trim());
  if (registration_status)
    params.set("registration_status", registration_status);
  if (payment_status) params.set("payment_status", payment_status);
  if (enrollment_status) params.set("enrollment_status", enrollment_status);

  return apiClient(`/api/enrollments?${params.toString()}`);
}

export function createEnrollmentApi(payload) {
  return apiClient("/api/enrollments", {
    method: "POST",
    body: payload,
  });
}

export function getEnrollmentByIdApi(id) {
  return apiClient(`/api/enrollments/${encodeURIComponent(id)}`);
}

export function updateEnrollmentApi(id, payload) {
  return apiClient(`/api/enrollments/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: payload,
  });
}

export function updateRegistrationStatusApi(id, { registration_status }) {
  return apiClient(
    `/api/enrollments/${encodeURIComponent(id)}/registration-status`,
    {
      method: "PATCH",
      body: { registration_status },
    }
  );
}

export function updateEnrollmentStatusApi(
  id,
  { enrollment_status, drop_reason }
) {
  return apiClient(
    `/api/enrollments/${encodeURIComponent(id)}/enrollment-status`,
    {
      method: "PATCH",
      body: {
        enrollment_status,
        ...(drop_reason ? { drop_reason } : {}),
      },
    }
  );
}

export function updateEnrollmentBatchApi(id, { batch_id, reason }) {
  return apiClient(`/api/enrollments/${encodeURIComponent(id)}/batch`, {
    method: "PATCH",
    body: {
      batch_id,
      ...(reason ? { reason } : {}),
    },
  });
}

export function getEnrollmentBatchHistoryApi(id, { page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiClient(
    `/api/enrollments/${encodeURIComponent(id)}/batch-history?${params.toString()}`
  );
}
