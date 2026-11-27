import { apiClient } from "@/lib/apiClient";

export function getInstructorsApi({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  is_teaching_eligible,
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
  if (
    is_teaching_eligible === true ||
    is_teaching_eligible === false ||
    is_teaching_eligible === "true" ||
    is_teaching_eligible === "false"
  ) {
    params.set("is_teaching_eligible", String(is_teaching_eligible));
  }
  if (typeof sortBy === "string" && sortBy.trim()) {
    params.set("sortBy", sortBy.trim());
  }
  if (typeof sortOrder === "string" && sortOrder.trim()) {
    params.set("sortOrder", sortOrder.trim());
  }

  const query = params.toString();
  const path = query
    ? `/api/admin/instructors?${query}`
    : "/api/admin/instructors";

  return apiClient(path, {
    method: "GET",
  });
}
