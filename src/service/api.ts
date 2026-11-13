import axios from "axios";
import { getUserCookie } from "../utils";
import { ensureFreshToken, forceLogout, refreshAccessToken } from "./tokenRefresh";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
});

api.interceptors.request.use(async (config) => {
  // Refresh up front if the access token is missing or about to expire,
  // instead of sending an unauthenticated request and waiting for a 401.
  try {
    await ensureFreshToken();
  } catch {
    // Ignore here; the response interceptor handles the resulting 401.
  }

  const token = getUserCookie();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Client-Timezone"] =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Shared with every other caller, so concurrent 401s trigger one refresh.
        const newToken = await refreshAccessToken();
        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        return api(originalRequest);
      } catch (err) {
        forceLogout();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
