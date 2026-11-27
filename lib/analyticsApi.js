import { apiClient } from "@/lib/apiClient";

export function getEnrollmentAnalyticsApi({
  from = "",
  to = "",
  course_id = "",
  batch_id = "",
} = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (course_id.trim()) params.set("course_id", course_id.trim());
  if (batch_id.trim()) params.set("batch_id", batch_id.trim());

  const query = params.toString();
  const url = query
    ? `/api/admin/analytics/enrollments?${query}`
    : "/api/admin/analytics/enrollments";

  return apiClient(url, { method: "GET" });
}
