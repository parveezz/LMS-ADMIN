import { apiClient } from "@/lib/apiClient";

export function loginApi({ email, password }) {
  return apiClient("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logoutApi() {
  return apiClient("/api/auth/logout", {
    method: "POST",
  });
}

export function getMeApi(options = {}) {
  return apiClient("/api/auth/me", {
    method: "GET",
    skipAuthRedirect: true,
    ...options,
  });
}

export function forgotPasswordApi({ email }) {
  return apiClient("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function verifyOtpApi({ email, otp }) {
  return apiClient("/api/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}

export function resetPasswordApi({ reset_token, new_password }) {
  return apiClient("/api/auth/reset-password", {
    method: "POST",
    body: { reset_token, new_password },
  });
}

export function changePasswordApi({ current_password, new_password }) {
  return apiClient("/api/auth/change-password", {
    method: "POST",
    body: { current_password, new_password },
    skipAuthRedirect: true,
  });
}
