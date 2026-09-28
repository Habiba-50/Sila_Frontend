import axios from "axios";

// Base URL comes from the Postman collection.
// Override it with VITE_API_BASE_URL in your .env when you deploy the backend.
export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Attach Access Token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");

  if (token) {
    config.headers.Authorization = token;
  }

  return config;
});

// ==============================
// Refresh Token Logic
// ==============================

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(
    `${BASE_URL}/user/rotate-token`,
    {},
    {
      headers: {
        Authorization: refreshToken,
      },
    }
  );

  const newAccessToken = response.data?.data?.access_token;
  const newRefreshToken = response.data?.data?.refresh_token;

  if (!newAccessToken || !newRefreshToken) {
    throw new Error("Invalid rotate-token response");
  }

  // Save the new rotated tokens
  localStorage.setItem("userToken", newAccessToken);
  localStorage.setItem("refreshToken", newRefreshToken);

  return newAccessToken;
}

// ==============================
// Handle Expired Access Token
// ==============================

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 responses
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // If another request is already refreshing,
      // wait for the same refresh request.
      if (!isRefreshing) {
        isRefreshing = true;

        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      // Retry the original request with the new Access Token
      originalRequest.headers.Authorization = newAccessToken;

      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh Token itself is invalid/expired
      localStorage.removeItem("userToken");
      localStorage.removeItem("refreshToken");

      window.location.href = "/login";

      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;