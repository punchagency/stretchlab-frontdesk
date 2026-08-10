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
  clubready_accounts?: any[];
}

const cookieDomain = import.meta.env.VITE_COOKIE_DOMAIN;

export const setUserCookie = (token: string): void => {
  const expireAt = new Date();
  expireAt.setHours(expireAt.getHours() + 1);
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
