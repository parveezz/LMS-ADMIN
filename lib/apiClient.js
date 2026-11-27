const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/verify-otp",
  "/api/auth/reset-password",
];

let unauthorizedHandler = null;

/**
 * Registers a global callback invoked when an authenticated request receives HTTP 401.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

/**
 * Centralized browser API client using relative /api/... paths
 * to preserve the Next.js rewrite proxy and cookie-based auth.
 */
export async function apiClient(
  path,
  {
    method = "GET",
    body,
    headers = {},
    skipAuthRedirect = false,
    ...fetchOptions
  } = {}
) {
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  let requestBody;
  if (isFormData) {
    // Let the browser set multipart/form-data with boundary automatically
    delete requestHeaders["Content-Type"];
    delete requestHeaders["content-type"];
    requestBody = body;
  } else if (body !== undefined) {
    if (!requestHeaders["Content-Type"] && !requestHeaders["content-type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }
    requestBody = typeof body === "string" ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers: requestHeaders,
      credentials: "include",
      ...(requestBody !== undefined ? { body: requestBody } : {}),
      ...fetchOptions,
    });
  } catch (networkError) {
    const error = new Error(
      networkError?.message || "Network error. Unable to reach the server."
    );
    error.status = 0;
    error.errors = [];
    error.data = null;
    throw error;
  }

  let data = {};
  if (response.status !== 204) {
    const rawText = await response.text().catch(() => "");
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: rawText };
      }
    }
  }

  if (!response.ok) {
    const validationErrors = Array.isArray(data?.errors) ? data.errors : [];
    const fieldMessage = validationErrors[0]?.message;
    const error = new Error(
      fieldMessage ||
      data?.message ||
      response.statusText ||
      "Request failed. Please try again."
    );
    error.status = response.status;
    error.errors = validationErrors;
    error.data = data;

    const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((prefix) =>
      path.startsWith(prefix)
    );

    if (
      response.status === 401 &&
      !skipAuthRedirect &&
      !isPublicAuthPath &&
      unauthorizedHandler
    ) {
      unauthorizedHandler(error);
    }

    throw error;
  }

  return data;
}
