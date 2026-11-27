async function apiRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fieldMessage = data?.errors?.[0]?.message;
    const error = new Error(
      fieldMessage || data?.message || "Request failed. Please try again."
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export function loginApi({ email, password }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logoutApi() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}

export function getMeApi() {
  return apiRequest("/api/auth/me", {
    method: "GET",
  });
}

export function forgotPasswordApi({ email }) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function verifyOtpApi({ email, otp }) {
  return apiRequest("/api/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}

export function resetPasswordApi({ reset_token, new_password }) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: { reset_token, new_password },
  });
}

export function changePasswordApi({ current_password, new_password }) {
  return apiRequest("/api/auth/change-password", {
    method: "POST",
    body: { current_password, new_password },
  });
}
