const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const buildUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const apiRequest = async (path, options = {}) => {
  const url = buildUrl(path);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
};

export const getApiBaseUrl = () => API_BASE_URL;

export const normalizeMongoId = (item) => {
  if (!item || typeof item !== "object") return item;
  if (item.id) return item;
  if (item._id) {
    return { ...item, id: item._id };
  }
  return item;
};

export const getResponseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};
