import { AxiosInstance } from "axios";
import router from "src/router";

let api: AxiosInstance;

export const authEndpoints = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout"
};
export const noAuthEndpoints = ["/auth/register", "/auth/login", "/auth/refresh", "/ping"];

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

async function init(_api: AxiosInstance) {
  api = _api;
}

function setTokens({ refresh, access }: { refresh?: string; access?: string }) {
  if (refresh) localStorage.setItem("refresh_token", refresh);
  if (access) sessionStorage.setItem("access_token", access);
}

function clearTokens() {
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("access_token");
}

function getAccessToken() {
  return sessionStorage.getItem("access_token");
}

function refreshToken() {
  return !!localStorage.getItem("refresh_token");
}

function clientLogout() {
  clearTokens();
  router.push({ path: "/login" });
  window.location.reload();
}

export { register, login, logout, refresh, init, setTokens, clearTokens, getAccessToken, refreshToken, clientLogout };
