import { apiClient } from "@/lib/apiClient";

export const SUPPORTED_SETTING_KEYS = [
  "platform_name",
  "organization_name",
  "support_email",
  "support_phone",
  "timezone",
  "locale",
  "logo_url",
  "default_page_size",
  "maintenance_notice",
];

function pickSettingsPayload(payload = {}) {
  const body = {};
  if (!payload || typeof payload !== "object") {
    return body;
  }

  for (const key of SUPPORTED_SETTING_KEYS) {
    if (
      Object.prototype.hasOwnProperty.call(payload, key) &&
      payload[key] !== undefined
    ) {
      body[key] = payload[key];
    }
  }

  return body;
}

export function getSettingsApi() {
  return apiClient("/api/admin/settings", {
    method: "GET",
  });
}

export function updateSettingsApi(payload = {}) {
  return apiClient("/api/admin/settings", {
    method: "PUT",
    body: pickSettingsPayload(payload),
  });
}
