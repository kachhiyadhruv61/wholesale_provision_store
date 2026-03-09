function resolveApiBaseUrl() {
  const envUrl = String(process.env.REACT_APP_API_BASE_URL || "").trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return "http://localhost:5000";
}

const API_BASE_URL = resolveApiBaseUrl();

function buildUrl(path) {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path), {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error(
      `Unable to connect to backend at ${API_BASE_URL}. Please start backend server and check CORS/port settings.`
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const validationErrorMessage = Array.isArray(payload?.errors)
      ? payload.errors.map((entry) => entry?.msg).filter(Boolean).join(", ")
      : "";

    const errorMessage =
      validationErrorMessage ||
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload;
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body || {}),
    }),
  put: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body || {}),
    }),
  delete: (path, options = {}) => request(path, { ...options, method: "DELETE" }),
};
