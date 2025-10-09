import type { AxiosInstance, AxiosRequestConfig } from "axios";
import router from "src/router";
import websockets from "src/utils/websockets";
import { waitForRefresh, refreshNow } from "./interceptors";

let api: AxiosInstance;

export const authEndpoints = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
  send_email_verify: "/auth/email/verify/send",
  check_email_verify: "/auth/email/verify/check",
  change_password: "/auth/change_password",

  change_email_send: "/auth/change_email/send",
  change_email_check: "/auth/change_email/check",
  change_email_cancel: "/auth/change_email/cancel",

  check: "/auth/check"
};
export const noAuthEndpoints = ["/auth/register", "/auth/login", "/auth/refresh", "/ping", "/auth/check"];

async function check(type: "email" | "username", value: string, config: AxiosRequestConfig = {}) {
  return await api.get(authEndpoints.check, {
    params: {
      type,
      value
    },
    ...config
  });
}

async function register(username: string, email: string, password: string) {
  const r = await api.post<AuthResponse>(authEndpoints.register, {
    username: username,
    password: password,
    email: email
  });
  if (r.data.success)
    setTokens({
      refresh: r.data.data.refresh,
      access: r.data.data.access
    });

  return r;
}

async function login(email: string, password: string) {
  const r = await api.post<AuthResponse>(authEndpoints.login, {
    password: password,
    email: email
  });
  if (r.data.success)
    setTokens({
      refresh: r.data.data.refresh,
      access: r.data.data.access
    });
  return r;
}

async function logout() {
  const r = await api.post<AuthResponse>(authEndpoints.logout);
  clearTokens();
  return r;
}

async function refresh() {
  const refresh_token = localStorage.getItem("refresh_token");
  const r = await api.post<AuthResponse>(authEndpoints.refresh, { refresh_token });
  if (r.data.success)
    setTokens({
      refresh: r.data.data.refresh,
      access: r.data.data.access
    });

  return r;
}

async function verifyEmailSend(config: AxiosRequestConfig = {}) {
  return await api.post<ApiResponse<{ token: string }>>(authEndpoints.send_email_verify, undefined, config);
}

async function verifyEmailCheck(token: string, code: string, config: AxiosRequestConfig = {}) {
  return await api.post(
    authEndpoints.check_email_verify,
    {
      token: token,
      code: code
    },
    config
  );
}

async function changeEmailSend(password: string, newEmail: string, config: AxiosRequestConfig = {}) {
  return await api.post<ApiResponse<{ token: string }>>(
    authEndpoints.change_email_send,
    {
      password,
      new_email: newEmail
    },
    config
  );
}

async function changeEmailCheck(token: string, code: string, config: AxiosRequestConfig = {}) {
  return await api.post<ApiResponse<{ pending_until?: string | null }>>(
    authEndpoints.change_email_check,
    {
      token: token,
      code: code
    },
    config
  );
}

async function changeEmailCancel(config: AxiosRequestConfig = {}) {
  return await api.post(authEndpoints.change_email_cancel, undefined, config);
}

async function changePassword(
  oldPassword: string,
  newPassword: string,
  config: AxiosRequestConfig = {},
  closeAllSessions: boolean = false
) {
  return await api.post(
    authEndpoints.change_password,
    {
      old_password: oldPassword,
      new_password: newPassword,
      close_sessions: closeAllSessions
    },
    config
  );
}

async function getAuthMe(config: AxiosRequestConfig = {}) {
  return await api.get<ApiResponse<AuthUser>>(authEndpoints.me, config);
}

function init(_api: AxiosInstance) {
  api = _api;

  websockets.on("please_token", async () => {
    await waitForRefresh();
    websockets.send({
      type: "auth",
      token: getAccessToken()!
    });
  });
  websockets.on("refresh_recommended", () => void refreshNow());
}

function setTokens({ refresh, access }: { refresh?: string; access?: string }) {
  if (refresh) localStorage.setItem("refresh_token", refresh);
  if (access) localStorage.setItem("access_token", access);
}

function clearTokens() {
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("access_token");
}

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function refreshToken() {
  return !!localStorage.getItem("refresh_token");
}

function clientLogout() {
  clearTokens();
  void router.push({ path: "/login" });
  window.location.reload();
}

export {
  register,
  login,
  logout,
  refresh,
  init,
  setTokens,
  clearTokens,
  getAccessToken,
  refreshToken,
  clientLogout,
  verifyEmailSend,
  verifyEmailCheck,
  getAuthMe,
  changePassword,
  changeEmailSend,
  changeEmailCheck,
  changeEmailCancel,
  check
};
