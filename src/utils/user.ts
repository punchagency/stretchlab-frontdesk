import Cookies from "js-cookie";
import type { JwtPayload } from "jwt-decode";
import { jwtDecode } from "jwt-decode";

interface CustomJwtPayload extends JwtPayload {
  email: string;
  name: string;
  role_name: string;
  username: string;
  avatar?: string;
  role_id?: number;
  roles?: number[];
  clubready_accounts?: any[];
}

// Used only when a token has no readable `exp` claim.
const FALLBACK_TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour

/**
 * Returns the expiry date encoded in the JWT's `exp` claim, so the cookie
 * lives exactly as long as the token the backend issued (single source of truth).
 */
export const getTokenExpiry = (token: string): Date => {
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    if (typeof exp === "number") {
      return new Date(exp * 1000);
    }
  } catch {
    // Fall through to the fallback lifetime
  }
  return new Date(Date.now() + FALLBACK_TOKEN_LIFETIME_MS);
};

/**
 * True when the token is missing, unreadable, or expires within `withinMs`.
 */
export const isTokenExpiringSoon = (token: string | null, withinMs: number): boolean => {
  if (!token) return true;
  return getTokenExpiry(token).getTime() - Date.now() <= withinMs;
};

const cookieDomain = import.meta.env.VITE_COOKIE_DOMAIN;

export const setUserCookie = (token: string): void => {
  const expireAt = getTokenExpiry(token);
  Cookies.set("token", token, {
    expires: expireAt,
    domain: cookieDomain,
    secure: true,
    sameSite: "None",
  });
};

export const getUserCookie = (): string | null => {
  return Cookies.get("token") || null;
};

export const deleteUserCookie = (): void => {
  Cookies.remove("token", { domain: cookieDomain });
  Cookies.remove("refresh_token", { domain: cookieDomain });
};

export const getUserInfo = (): CustomJwtPayload | null => {
  const token = getUserCookie();
  if (token) {
    return jwtDecode<CustomJwtPayload>(token);
  }
  return null;
};

export const getUserRoles = (user: CustomJwtPayload | null): number[] => {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles.map(r => Number(r));
  if (user.role_id !== undefined && user.role_id !== null) return [Number(user.role_id)];
  return [];
};

export const hasRole = (user: CustomJwtPayload | null, role: number | number[]): boolean => {
  const userRoles = getUserRoles(user);
  if (Array.isArray(role)) {
    return role.some(r => userRoles.includes(Number(r)));
  }
  return userRoles.includes(Number(role));
};

export const canAccessInbox = (user: CustomJwtPayload | null): boolean => {
  return hasRole(user, [1, 2, 4, 6]);
};

const ABLECARE_ALLOWED_EMAIL = "brian.goldstein@stretchlab.com";

export const canAccessAbleCare = (user: CustomJwtPayload | null): boolean => {
  return user?.email?.toLowerCase().trim() === ABLECARE_ALLOWED_EMAIL;
};

export const setRefreshToken = (token: string): void => {
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 7);
  Cookies.set("refresh_token", token, {
    expires: expireAt,
    domain: cookieDomain,
    secure: true,
    sameSite: "None",
  });
};

export const getRefreshToken = (): string | null => {
  return Cookies.get("refresh_token") || null;
};
