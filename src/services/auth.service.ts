import { API_ROUTES } from "../constants/routes";
import api from "./api.service";

export async function signup(payload: {
  username: string;
  fullName: string;
  email: string;
  password: string;
  street?: string;
  country?: string;
  pincode?: string;
  state?: string;
  city?: string;
}) {
  const url = API_ROUTES.SIGNUP;
  const res = await api.post(url, payload);
  return res.data;
}

export async function login(payload: { email: string; password: string }) {
  const url = API_ROUTES.LOGIN;
  const res = await api.post(url, payload);
  return res.data;
}

export async function requestPasswordReset(payload: { email: string }) {
  const url = API_ROUTES.FORGOT_PASSWORD;
  const res = await api.post(url, payload);
  return res.data;
}

export async function confirmPasswordReset(payload: { email: string; code: string; newPassword: string }) {
  const url = API_ROUTES.RESET_PASSWORD;
  const res = await api.post(url, payload);
  return res.data;
}

export async function refreshToken(payload: { refreshToken: string }) {
  const url = API_ROUTES.REFRESH_TOKEN;
  const res = await api.post(url, payload);
  return res.data;
}