import axios from "axios";
import {
  deleteUserCookie,
  getUserCookie,
  getRefreshToken,
  setUserCookie,
  setRefreshToken,
} from "../utils";

let isRefreshing = false;
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
});

api.interceptors.request.use((config) => {
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        deleteUserCookie();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          import.meta.env.VITE_API_URL + "/api/frontdesk/auth/refresh",
          { refresh_token: refreshToken }
        );
        const newToken = data.access_token;
        setUserCookie(newToken);
        if (data.refresh_token) setRefreshToken(data.refresh_token);
        api.defaults.headers.common["Authorization"] = "Bearer " + newToken;
        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        deleteUserCookie();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
