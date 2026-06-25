const API_BASE = process.env.REACT_APP_API_URL;

export const apiFetch = async (url, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  // If token expired
  if (response.status === 401 && refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE}/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });

      const refreshData = await refreshRes.json();

      if (refreshData.success) {
        const newAccessToken = refreshData.accessToken;

        // Save new token
        localStorage.setItem("accessToken", newAccessToken);

        // Retry original request
        headers["Authorization"] = `Bearer ${newAccessToken}`;

        response = await fetch(`${API_BASE}${url}`, {
          ...options,
          headers
        });

        return response;
      }
    } catch (err) {
      localStorage.clear();
        window.location.href = "/login";
        return;
    }

    // If refresh token invalid → logout
    localStorage.clear();
    window.location.href = "/login";
    return;
  }

  return response;
};