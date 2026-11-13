import axios from "axios";
import {
  deleteUserCookie,
  getRefreshToken,
  getUserCookie,
  isTokenExpiringSoon,
  setRefreshToken,
  setUserCookie,
} from "../utils";

// Refresh this long before the access token expires.
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
// How often the background check runs while the app is open.
const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

/** Thrown when the backend says the refresh token is no longer valid. */
export class SessionExpiredError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

// Shared in-flight refresh so concurrent callers (several 401s, the
// background timer, the route guard...) all wait on one /auth/refresh call.
let refreshPromise: Promise<string> | null = null;

const performRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new SessionExpiredError("No refresh token");
  }

  try {
    // Plain axios (not `api`) so this call never goes through the 401 interceptor.
    const response = await axios.post(
      import.meta.env.VITE_API_URL + "/api/frontdesk/auth/refresh",
      { refresh_token: refreshToken }
    );
    const accessToken: string | undefined = response.data?.access_token;
    if (!accessToken) {
      throw new SessionExpiredError("Refresh response had no access token");
    }

    setUserCookie(accessToken);
    if (response.data?.refresh_token) {
      setRefreshToken(response.data.refresh_token);
    }
    return accessToken;
  } catch (error: unknown) {
    if (error instanceof SessionExpiredError) throw error;
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400 || status === 401 || status === 404) {
        throw new SessionExpiredError(error.response?.data?.message);
      }
    }
    // Network / 5xx: let the caller decide; do not treat as a logout.
    throw error;
  }
};

/**
 * Exchanges the refresh token for a new access token. Concurrent calls share
 * a single request. Rejects with SessionExpiredError if the user must log in again.
 */
export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

/** Clears auth cookies and sends the user to the login page. */
export const forceLogout = (): void => {
  deleteUserCookie();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

/**
 * Refreshes the access token if it is missing or about to expire and a
 * refresh token is available. Returns the current (possibly new) token, or
 * null if there is no session at all.
 */
export const ensureFreshToken = async (): Promise<string | null> => {
  const current = getUserCookie();
  if (!isTokenExpiringSoon(current, REFRESH_BEFORE_EXPIRY_MS)) {
    return current;
  }
  if (!getRefreshToken()) {
    return current;
  }
  return refreshAccessToken();
};

/**
 * Starts the background refresh: checks every minute and whenever the tab
 * becomes visible / focused again. Returns a cleanup function.
 */
export const startTokenRefreshScheduler = (): (() => void) => {
  const check = () => {
    ensureFreshToken().catch((error) => {
      if (error instanceof SessionExpiredError) {
        forceLogout();
      }
      // Network errors are ignored here; the next check or a 401 will retry.
    });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") check();
  };

  const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("focus", check);
  check();

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", check);
  };
};

