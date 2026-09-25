import axios from "axios";

// Base URL comes from the Postman collection (http://localhost:3000).
// Override it with VITE_API_BASE_URL in your .env when you deploy the backend.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Every protected endpoint in the collection expects an "Authorization" header
// holding the token returned from /auth/login. We attach it automatically here
// instead of repeating `{ headers: { Authorization: token } }` in every call.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export default apiClient;
