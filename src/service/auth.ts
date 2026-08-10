import { api } from "./api";
import { getRefreshToken } from "../utils";

export const login = async (
  email: string,
  password: string,
  subdomain?: string
) => {
  const payload: any = { email, password };
  if (subdomain) payload.subdomain = subdomain;
  const response = await api.post("/frontdesk/auth/login", payload);
  return response;
};

export const logout = async () => {
  const refreshToken = getRefreshToken();
  const response = await api.post("/frontdesk/auth/logout", {
    refresh_token: refreshToken,
  });
  return response;
};

export const changePassword = async (email: string, password: string) => {
  const response = await api.post("/stretchnote/auth/change-password", {
    email,
    new_password: password,
  });
  return response;
};

export const addDetails = async (
  email: string,
  password: string,
  full_name: string
) => {
  const response = await api.post("/admin/process/add-frontdesk-details", {
    email,
    password,
    full_name,
  });
  return response;
};
